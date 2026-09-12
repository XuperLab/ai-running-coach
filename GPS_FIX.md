# GPS Distance Fix — "standing still showed 2.30 km"

## The symptom

After starting a training session the screen showed **DISTANCE 2.30 km at 00:13**,
with PACE 0.1 min/km — while standing still. Heart rate correctly showed
`— no HR source` (that part was already honest).

## What was actually wrong

The distance pipeline banked **every** GPS step that cleared a 5 m threshold,
with no plausibility check on speed or fix quality:

```js
// BEFORE — ActiveRunScreen.js
const dist = haversineDistance(lastCoordsRef.current, point);
if (dist >= GPS_CONFIG.DISTANCE_FILTER_M / 1000) {   // 5 m
  setTotalDistance((prev) => prev + dist);           // banked unconditionally
}
```

Two independent defects made that explode:

1. **No speed gate.** A single cold-start fix (well-known for hopping hundreds of
   metres or more before the GPS converges) was accepted as real distance. One
   2.3 km outlier in 13 s → `2.30` on the clock. The 50 m accuracy threshold did
   not save us, because cold-start outliers often *report* good accuracy.
2. **`timeInterval` was advisory.** On Android, `timeInterval: 3000` is delivered
   at the OS's discretion and commonly fires far more often. A `dt` of ~0 s makes
   `distance / dt` meaningless, so pace read `0.1 min/km`.
3. **A noise floor of exactly 5 m is too low.** Standing still, a consumer GPS fix
   routinely wanders 5–15 m, so jitter alone accumulates.

The filter compared each fix against the *last accepted* fix but never questioned
whether the hop itself was physically possible.

## What changed

### `src/utils/constants.js` — real thresholds

| Setting | Before | After | Why |
|---|---|---|---|
| `ACCURACY_THRESHOLD_M` | 50 | **25** | 50 m fixes are noise, not position |
| `TRACK_INTERVAL_MS` | 3000 | **2000** | tighter pace resolution |
| `DISTANCE_FILTER_M` | 5 | **6** | + accuracy-scaled floor (below) |
| `MAX_JUMP_SPEED_MS` | — | **7 m/s** | >25.2 km/h sustained isn't human |
| `MAX_JUMP_M` | — | **60 m** | no single step may exceed this |
| `DISTANCE_FILTER_ACCURACY_FACTOR` | — | **1.2** | `floor = max(6 m, accuracy × 1.2)` |
| `AUTO_PAUSE_*` | — | enabled | stop the clock while you're not moving |

### `src/screens/ActiveRunScreen.js` — rewritten fix pipeline

Every fix now passes through six gates before it can move the number:

1. **Trust** — drop fixes with an accuracy radius worse than 25 m.
2. **First fix** — establishes the origin, accumulates nothing.
3. **Plausibility** — reject anything implying > 7 m/s or a single step > 60 m.
   Uses the device's own `coords.speed` when the platform provides it (GPS speed
   is far more reliable than differencing positions).
4. **Noise floor** — `max(6 m, accuracy × 1.2)`. While still, the fix wanders but
   nothing is banked.
5. **Flush** — distance accumulates in a buffer and is flushed to the UI every 5 m,
   so the display doesn't flicker and the number doesn't jump on every jitter.
6. **Pace** — a rolling window over real distance ÷ real elapsed time, only when
   > 10 m has actually been covered; otherwise `--`.

Also added:

- **Auto-pause**: sustained sub-0.75 m/s for 6 s pauses the clock and shows
  `standing still` under PACE. That is why the display is honest when you stop.
- **`GPS ±Nm` in the header** — you can see the actual fix quality, so a bad
  signal is visible instead of silently corrupting the total.
- **Accuracy fallback**: if `BestForNavigation` yields no usable fixes within 8 s
  (some devices report `null` accuracy and get filtered), it re-subscribes at
  `High` automatically instead of showing a stuck `0.00`.
- **Exact saved distance**: the accumulator is flushed on finish, so the saved
  session doesn't lose the last few metres.

### Honesty pass on the rest of the UI

Per the standing rule ("if the app doesn't know, show —"), a few places were still
showing derived placeholders:

- `HistoryScreen` no longer synthesises a pace from `duration / distance` when a
  run has no real pace value; sessions without distance are excluded from the
  distance chart entirely.
- `DashboardScreen` only renders the weekly distance chart once real distance exists
  (> 0.05 km), otherwise it shows the empty state.
- `ProfileScreen` shows `Tap Get Started to set up` instead of `BEGINNER RUNNER`
  when no profile has ever been saved, and the button reads `Get Started`.

## Verification

### Unit tests — `verify-gps.js` (9/9 passing)

Replays realistic GPS traces through the exact same rules the screen uses:

| Test | Scenario | Result |
|---|---|---|
| 1 | Stationary, 60 s of ±5 m jitter | **0.0 m** banked (was 2300 m) |
| 2 | Stationary + one 2 km outlier fix | outlier rejected, **0.0 m** |
| 3 | Real 1000 m run at 6:00 min/km | 922.6 m banked (within 8%), pace sane |
| 4 | **Teleport: 2.30 km in 13 s** | **rejected**, 0.0 m |

Run it with:

```bash
cd /workspace/ai-running-coach && node verify-gps.js
```

Test 4 is the regression test for this exact bug — if anyone loosens the filter in
`constants.js`, it fails loudly.

### Build

`npx expo export --platform web` → **572 modules, 0 errors**.

### Confirmed on device bundle

The served iOS bundle was fetched from the tunnel and verified to contain the new
filter (`DISTANCE_FILTER_ACCURACY_FACTOR`, `noiseFloorKm` present).

## What is still genuinely unavailable

**Live heart rate.** No heart-rate source exists on a phone running through Expo Go:
there is no built-in live HR sensor, no Bluetooth HR strap is paired, and
`expo-health` only resolves to a `0.0.0` placeholder stub on npm (not a usable
module). Rather than fabricate a number, the app shows `— no HR source`, which is
the honest answer. Wiring real HR requires a **custom dev build** with either
HealthKit / Health Connect access or a BLE HR strap integration.

## Try it

Scan `/workspace/expo-login-qr.png` (tunnel: `exp://4wc3xxc-wilsoncheng-8081.exp.direct`).

Expected behaviour standing still:

- `DISTANCE` stays at `0.00`
- `PACE` shows `--` and `standing still` after ~6 s
- header shows `GPS ±Nm` with the real accuracy radius
- `DURATION` pauses while you're stationary (auto-pause)

Then walk/run ~50 m and the distance should climb by roughly the distance you
actually covered.
