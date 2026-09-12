# AI Running Coach

Expo / React Native app with real GPS tracking, a live run map, and no
simulated data anywhere.

**Expo SDK 57** · React Native 0.86.3 · React 19.2.3 · New Architecture (Fabric)

---

## Rebuilding this project

```bash
npm install
npx expo start
```

Then scan the QR code with Expo Go, or press `i` / `a` for a simulator.

Use `npm ci` rather than `npm install` if you want the exact dependency tree
that this was built against — `package-lock.json` is committed and complete.

> **Node requirement:** Expo SDK 57 targets Node 18+. If `npm install` throws
> engine warnings, check your version with `node -v` first.

The GPS and map features need a **physical device**. A simulator reports an
accuracy it does not actually have, and the run screen will honestly tell you
so rather than inventing a number.

---

## What's in here

### Real data only

Every number on screen is measured or it is an em dash. There is no mock data
left in the codebase.

| Value | Source | When unavailable |
| --- | --- | --- |
| Distance, pace, route | `expo-location` GPS | `0.00` until the first good fix |
| Heart rate | Device health store, when present | `—` (app genuinely does not know) |
| Weekly / history charts | Recorded runs with distance > 0 | Empty state, no filler bars |
| Profile fields | What you entered | `Tap Get Started to set up` |

### GPS distance (`src/screens/ActiveRunScreen.js`)

A naive implementation makes a stationary phone "run" 2.30 km in 13 seconds,
because GPS jitter walks the total forward. Fixes go through six gates:

1. **Accuracy trust** — drop fixes worse than `ACCURACY_THRESHOLD_M` (25 m)
2. **First-fix seed** — the first good fix sets the origin, adds no distance
3. **Teleport rejection** — drop steps implying > `MAX_JUMP_SPEED_MS` (7 m/s),
   or any single step longer than `MAX_JUMP_M` (60 m)
4. **Noise floor** — ignore steps below `max(6 m, accuracy × 1.2)`, scaled by
   how noisy the fix actually is
5. **Flush** — commit to the route once the step clears the floor
6. **Rolling pace** — derived from accepted steps only

Coarse fixes contribute **no** distance at all. They seed the map camera and
put the UI into a `Weak` GPS state, which is the honest thing to show.

Thresholds live in `src/utils/constants.js` with the reasoning for each.

### The run map (`src/utils/mapHelper.js`)

`getMapProps()` exists because the map has two easy ways to break:

- Passing `region` **and** `initialRegion` together creates competing camera
  sources. Exactly one is forwarded, and only after the map reports ready.
- The run screen re-renders at 1 Hz (the timer). A fresh `region` object on
  every render re-issues a native camera command every second and the map
  never settles. `RunMap` is therefore `React.memo`'d and the region is
  memoised, so the camera only moves when coordinates actually change.

Supporting details: map load failures are not cached for the session (so a
transient failure can recover), a `MapErrorBoundary` isolates a failing
subtree, and an `onLayout` watchdog treats a laid-out-but-never-ready map as
usable.

**Platform caveat:** the route polyline is Android-only. `RNMapsPolyline` is
excluded on iOS by the current library, and forcing the legacy name crashes
the screen. On iOS you get the live position and camera; no breadcrumb trail.

### Voice coach (`src/hooks/useVoiceCoach.js`)

Split announcements through `expo-speech` — pace, distance, encouragement.

---

## Project layout

```
App.js                      navigation root
app.json                    Expo config (new arch, permissions, plugins)
index.js                    entry point
src/
  context/AuthContext.js    persisted auth/profile state
  hooks/
    useHeartRate.js         real device HR, `—` when unavailable
    useVoiceCoach.js        expo-speech announcements
  screens/
    ActiveRunScreen.js      GPS pipeline + live map  <- the interesting one
    DashboardScreen.js      weekly volume chart
    HistoryScreen.js        per-run charts
    RunDetailScreen.js      single run breakdown
    GenerateSessionScreen.js
    AchievementsScreen.js
    ProfileScreen.js
    LoginScreen.js
  utils/
    constants.js            colors, GPS_CONFIG thresholds
    mapHelper.js            safe map props, module loading
    storage.js              AsyncStorage helpers
verify-gps.js               GPS regression tests
capture.js                  Playwright screenshot tool (dev only)
```

---

## Tests

```bash
node verify-gps.js
```

Nine assertions across four scenarios, including a regression test that
reproduces the exact 2.30 km teleport symptom and asserts it is rejected.

```
Test 1  stationary, normal jitter      -> 0.0 m   (was 2300 m before the fix)
Test 2  stationary, one 2 km outlier   -> 0.0 m
Test 3  real run, 1000 m in 6:00       -> 922.6 m, pace 3.25 min/km
Test 4  teleport 2.30 km in 13 s       -> 0.0 m
=== 9 passed, 0 failed ===
```

`capture.js` drives Playwright against `localhost:8081` to screenshot the app;
it is a dev tool, not part of the test suite.

---

## Notes

- `node_modules/` is not committed — run `npm install` (or `npm ci`).
- `GPS_FIX.md` and `MAP_FIX.md` document the evidence and root cause behind
  each fix, including the on-device probe output that located the map bug.
- `CHANGES.md` has the running changelog.
- Location permissions are declared in `app.json` for both platforms; the app
  asks at runtime and degrades honestly if you decline.
- `react-native-maps` is pinned to `1.27.2` — the version bundled with Expo
  SDK 57. Newer versions are still stabilising their Fabric rewrite and were
  not tested here.
