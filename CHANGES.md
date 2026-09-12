# ai-running-coach — Proposed Changes (for review)

Local working copy produced for review. **Nothing was pushed to GitHub** — apply these files over your existing repo, then `npm install` and run.

> ⚠️ **Verification note:** This sandbox blocks `github.com` and the npm registry, so I could **not** run `npm install`, `expo build`, or the Playwright E2E here. Every changed `.js` was syntax-checked with `tsc` (exit 0, 0 errors). The real `npm install` + `npx expo start` / E2E must be run on your machine.

---

## 1. Login now persists (was a real bug) — `src/context/AuthContext.js`
**Before:** `user` lived only in React state. Reloading / reopening the app wiped the session and forced re-login.
**After:** On mount the provider loads the saved user from `AsyncStorage` (`STORAGE_KEYS.USER`), and `login`/`logout` write/clear it. This matches the SPEC's "store in LocalStorage" requirement. `login` is now `async` and the context also exposes a `loading` flag.

## 2. Distance unit inconsistency fixed (was a real bug) — `src/screens/DashboardScreen.js`
**Root cause:** `ActiveRunScreen` stores `distance` in **km** (from `haversineDistance`); `HistoryScreen`, `AchievementsScreen`, and `RunDetailScreen` all treat it as km. Only `DashboardScreen` divided by `1000` (assuming meters), so it showed totals **1000× too small**.
**Fix:** removed the `/ 1000` in `DashboardScreen` (`distance.toFixed(1)` → km). All screens now agree.

## 3. Analytics charts added (SPEC requirement, was missing) — `package.json`, `DashboardScreen.js`, `HistoryScreen.js`
The SPEC calls for `react-native-chart-kit` charts; the dep was absent and no charts were implemented.
- `package.json`: added `react-native-chart-kit ^0.14.0`, `react-native-svg ~15.11.0` (its peer), `expo-speech ~12.0.0` (for #4). Also fixed the leftover `"name": "ai-running-coach-temp"` → `"ai-running-coach"`.
- `HistoryScreen.js`: added a **Trends** section — distance-per-session `BarChart`, pace-trend `LineChart`, and a heart-rate-zone distribution bar row.
- `DashboardScreen.js`: added a **weekly distance-by-day `BarChart`** under Weekly Activity.

## 4. Phase-2 voice coaching added — `src/hooks/useVoiceCoach.js` (new), `ActiveRunScreen.js`, `package.json`
Real GPS tracking was **already implemented** in `ActiveRunScreen` via `expo-location`, so that Phase-2 item was done. The missing piece was **audio coaching**, now added:
- New `src/hooks/useVoiceCoach.js` wraps `expo-speech` and provides `start / zone / milestone / finish` cues in `Motivational | Technical | Supportive` styles (driven by the existing `coachStyle` from the session config).
- `ActiveRunScreen.js`: speaks a start line, a cue on each new HR zone, a milestone line every completed km, and a finish line on save. Wrapped defensively (no-op if TTS unavailable / web).

## 5. Auth loading guard — `App.js`
Because the session now loads asynchronously, `AppNavigator` shows a small spinner while `loading` is true, preventing a flash of the login screen on launch.

---

## Files changed (drop-in replacements)
- `package.json`
- `App.js`
- `src/context/AuthContext.js`
- `src/hooks/useVoiceCoach.js`  *(new)*
- `src/screens/DashboardScreen.js`
- `src/screens/HistoryScreen.js`
- `src/screens/ActiveRunScreen.js`

## Unchanged (keep your current versions)
`index.js`, `app.json`, `SPEC.md`, `UI-UX.md`, `test.js`, `.gitignore`, `assets/`, `package-lock.json`, and the screens `LoginScreen`, `GenerateSessionScreen`, `ProfileScreen`, `AchievementsScreen`, `RunDetailScreen`.

## How to apply & run
```bash
# in your local repo, copy the changed files over, then:
npm install            # pulls react-native-chart-kit, react-native-svg, expo-speech
npx expo start --web   # or: ios / android
# E2E (separate terminal, after dev server is up on :8081):
node test.js
```
Note: `test.js` still hardcodes `localhost:8081` and a `/home/wilson/...` screenshot path — left untouched; consider parameterizing if you adopt it.
