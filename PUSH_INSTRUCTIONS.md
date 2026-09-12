# How to push this commit

The work is **committed locally** as `92c41e7` on branch `main`, ready to go.
It is **not on GitHub yet**, because every write path from this sandbox is blocked:

| Path | Result |
| --- | --- |
| GitHub MCP `push_files` (Git Data API) | `403 Resource not accessible by integration` |
| GitHub MCP `create_or_update_file` (Contents API) | `403 Resource not accessible by integration` |
| GitHub MCP `create_branch` (refs API) | `403 Resource not accessible by integration` |
| `git push` over https | TLS handshake terminated (egress blocked) |

Reads work fine — which is why the repo, its branch and file SHAs were all
resolved successfully. The integration the sandbox holds is simply **read-only**.

---

## Option A — push from your own machine (one command)

```bash
cd /path/to/ai-running-coach
git push origin main
```

## Option B — push this exact commit from a normal terminal

Copy the repo somewhere outside the sandbox by any means you like, then:

```bash
git push origin main
```

---

## What the commit contains

`92c41e7 fix(gps,map,hr): real device data only, working run map on Expo Go`

30 files, 11,957 insertions. On top of `956c75a` on `origin/main`:

**Changed**

- `app.json`, `package.json` — Expo SDK 54 → 57, react-native 0.86.3, new architecture, react-native-maps 1.27.2
- `src/screens/ActiveRunScreen.js` — the 6-gate GPS filter, the `React.memo`'d `RunMap`, the map error boundary, the `onLayout` watchdog
- `src/screens/DashboardScreen.js`, `HistoryScreen.js`, `ProfileScreen.js` — honest empty states, no fabricated values
- `src/utils/constants.js` — real `GPS_CONFIG` thresholds, each one documented
- `src/utils/mapHelper.js` — `getMapProps()` encodes the region/initialRegion rule
- `App.js`, `index.js`

**New**

- `src/hooks/useHeartRate.js` — real device HR, `—` when unavailable
- `src/hooks/useVoiceCoach.js`
- `verify-gps.js` — 9 assertions, 4 scenarios, all passing
- `GPS_FIX.md`, `MAP_FIX.md`, `CHANGES.md`

`RUN_REPORT.md`, `expo-qr.png`, `node_modules/`, `dist*/`, `.expo/` and the
`core.*` crash dumps are gitignored and not part of the commit.

---

## If you would rather I keep the commit small

Right now it bundles the SDK 57 upgrade, the GPS fix, the map fix and the
honesty pass into one commit, because none of it had ever been pushed. Say the
word and I can split it into separate commits before you push.
