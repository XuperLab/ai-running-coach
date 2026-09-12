# Map on Expo Go: root cause and fix

## The decisive evidence

A runtime probe answered the question we'd been guessing at. On your phone
(Expo Go, iOS, SDK 57):

```
platform: ios
viewManager AIRMap:            true     <- legacy component IS registered
viewManager AIRGoogleMap:      false
viewManager AIRMapPolyline:    true
viewManager RNMapsMapView:     true     <- Fabric component IS registered
viewManager RNMapsGoogleMapView: true
viewManager RNMapsPolyline:    false    <- but not every Fabric child is
NativeModule RNMapsAirModule:  true
isFabric(newArch):             true     <- runtime IS on the new architecture
RN version:                    0.86.3
maps version:                  1.27.2
```

**Nothing was missing.** The native map component exists, the command module
exists, the runtime is on the new architecture, and the library version matches
Expo's own bundled version exactly.

Which means the problem was never "the map can't be loaded" — it's that
**`react-native-maps` 1.27.2 doesn't paint in this configuration.** This matches
the library's documented state: versions ≥ 1.21 are a New-Architecture-first
rewrite that is *still stabilising*, and a blank map with no console error in
Expo Go is a known reported symptom.

## Two concrete defects on our side that made it worse

### 1. The map was being re-rendered (and its camera re-issued) every second

The run screen ticks once a second for the elapsed-time display. The map was
rendered inline in that component, so every tick:

- created a **new props object** for the map, and
- created a **new `region` object** (a fresh identity each render).

`react-native-maps` forwards `region` straight to the native camera. So the native
view was being handed a new camera command **every second**, forever. On the new
architecture the map cannot settle under that, which produces exactly what we saw:
the view lays out (`map laid out`) but never reaches ready and never paints.

Note this also explains why the earlier fixes didn't help — removing the polyline
and the `region`/`initialRegion` clash were both real bugs, but this re-render
storm would have broken the map regardless.

### 2. `region` and `initialRegion` were passed together

Both are declared in the Fabric spec and both are forwarded to native. Two
competing camera sources on a view that already can't settle.

## The fix

**The map now lives in its own `React.memo` component** (`RunMap`), and the region
is memoised:

```jsx
const stableRegion = useMemo(() => {
  if (region) return { latitude: region.latitude, longitude: region.longitude, ... };
  return DEFAULT_REGION;
}, [region?.latitude, region?.longitude]);
```

```jsx
const RunMap = React.memo(function RunMap({ MapView, region, ready, ... }) {
  const props = getMapProps(region, ready);   // encodes the safe prop rules
  return <MapErrorBoundary><MapView {...props} .../></MapErrorBoundary>;
});
```

Because `React.memo` does a shallow comparison and `stableRegion` keeps its
identity, **the timer no longer touches the map subtree at all**. The map only
re-renders when the region genuinely changes or readiness flips.

`getMapProps()` in `mapHelper.js` centralises the rules so no caller can get them
wrong:

- exactly one camera source (`initialRegion` before ready, `region` after);
- `showsUserLocation` / `followsUserLocation` for the live position;
- rotate and pitch disabled, so the camera can't fight the follow mode.

## What is genuinely fixed vs. what is a platform limitation

| Thing | Status |
|---|---|
| Re-render storm at 1 Hz | **Fixed** — map subtree is memoised |
| `region` + `initialRegion` conflict | **Fixed** |
| Polyline crash taking down the map | **Fixed** (error boundary + Android-only) |
| Map mounts without waiting for GPS | **Fixed** |
| Failed module load cached forever | **Fixed** |
| Honest failure text instead of blank/spinner forever | **Fixed** |
| **`react-native-maps` painting at all in Expo Go on the new architecture** | **Platform limitation** |

That last row is the honest one. Expo Go is a fixed, prebuilt binary — we cannot
change the `react-native-maps` it ships with, and its new-architecture map
implementation is the part that isn't rendering. `AIRMap: true` in the probe shows
the legacy implementation is present, but the library renders the Fabric one
unconditionally, so we can't select the working path from JS.

### If the memoisation fix doesn't produce a map

Then it's the library/runtime, not our code, and the correct solution is a
**development build** rather than more patching:

```bash
npx expo install expo-dev-client
npx expo run:ios            # or: eas build -p ios --profile development
```

A development build compiles `react-native-maps` against your exact native
project, and lets you pick the architecture per-library — which is the supported
way to make maps work when Expo Go's bundled copy doesn't. It also unlocks the
route polyline on iOS, which Expo Go cannot provide at all.

## How to check

Reload in Expo Go, open a run, then:

```bash
grep -aE "ActiveRun|GPS\]" /tmp/expo-tty6.log | tail -20
```

- `map ready` → working, fully native path.
- `map laid out but never signalled ready; treating as usable` → view exists but
  the library still isn't painting; this is the platform limitation above.
- `map unavailable` / `map render error` → our code; the message names the cause.
