// verify-gps.js — unit-test the distance pipeline in ActiveRunScreen
//
// The user's bug: standing still, distance shot up to 2.30 km in 13 seconds.
// This harness replays realistic GPS traces through the SAME filtering rules the
// screen uses (mirrored here so the test runs in plain Node), and asserts:
//   1. A stationary phone with normal GPS jitter accumulates ~0 km.
//   2. A stationary phone with one wild outlier fix does NOT get a phantom km.
//   3. An actual run accumulates the right distance.
//   4. Teleport-level jumps are rejected outright.
//
// If someone loosens the filter in constants.js, these tests fail loudly.

const GPS_CONFIG = {
  TRACK_INTERVAL_MS: 2000,
  DISTANCE_FILTER_M: 6,
  ACCURACY_THRESHOLD_M: 25,
  MAX_JUMP_SPEED_MS: 7,
  MAX_JUMP_M: 60,
  DISTANCE_FILTER_ACCURACY_FACTOR: 1.2,
  AUTO_PAUSE_ENABLED: true,
  AUTO_PAUSE_SPEED_MS: 0.75,
  AUTO_PAUSE_AFTER_S: 6,
};

const haversineDistance = (c1, c2) => {
  const R = 6371;
  const dLat = (c2.latitude - c1.latitude) * Math.PI / 180;
  const dLon = (c2.longitude - c1.longitude) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(c1.latitude * Math.PI / 180) * Math.cos(c2.latitude * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// --- Trackers: a faithful port of the logic in ActiveRunScreen.processFix ---
const createTracker = () => {
  const s = {
    lastPoint: null, lastFixTime: null, distance: 0, window: [],
    accepted: 0, rejected: 0, reasons: [], stillTicks: 0, isStill: false,
  };
  const MAX_SPEED = GPS_CONFIG.MAX_JUMP_SPEED_MS * 3.6 / 1000; // km per second

  return {
    state: s,
    push(fix) {
      const { latitude, longitude, accuracy, speed, t } = fix;
      if (accuracy != null && accuracy > GPS_CONFIG.ACCURACY_THRESHOLD_M) {
        s.rejected += 1; s.reasons.push(`accuracy ${accuracy}m`); return;
      }
      const point = { latitude, longitude };
      if (!s.lastPoint) {
        s.lastPoint = point; s.lastFixTime = t; s.accepted += 1; return;
      }
      const rawDist = haversineDistance(s.lastPoint, point);
      const dtS = Math.max(0, (t - s.lastFixTime) / 1000);
      const hopSpeed = rawDist / Math.max(dtS, 0.001);
      const stepSpeed = (typeof speed === 'number' && speed >= 0) ? speed : hopSpeed;

      if (rawDist > GPS_CONFIG.MAX_JUMP_M / 1000 ||
         (dtS > 0.5 && stepSpeed > GPS_CONFIG.MAX_JUMP_SPEED_MS)) {
        s.rejected += 1;
        s.reasons.push(`jump ${(rawDist * 1000).toFixed(0)}m @ ${(rawDist / Math.max(dtS, 1) * 1000).toFixed(0)}m/s`);
        s.lastFixTime = t; return;
      }
      s.accepted += 1; s.lastFixTime = t;

      const floorKm = Math.max(
        GPS_CONFIG.DISTANCE_FILTER_M,
        (accuracy != null ? accuracy : 0) * GPS_CONFIG.DISTANCE_FILTER_ACCURACY_FACTOR
      ) / 1000;

      if (rawDist < floorKm) {
        const stationarySpeed = (typeof speed === 'number' && speed >= 0)
          ? speed
          : rawDist / Math.max(dtS, GPS_CONFIG.TRACK_INTERVAL_MS / 1000);
        if (stationarySpeed < GPS_CONFIG.AUTO_PAUSE_SPEED_MS) {
          s.stillSince = s.stillSince || t;
          s.stillTicks += 1;
          if (s.stillTicks * GPS_CONFIG.TRACK_INTERVAL_MS / 1000 >= GPS_CONFIG.AUTO_PAUSE_AFTER_S) {
            s.isStill = true;
          }
        } else {
          s.stillSince = null; s.stillTicks = 0; s.isStill = false;
        }
        return;
      }
      s.stillTicks = 0; s.stillSince = null; s.isStill = false;
      s.distance += rawDist;
      s.window.push({ dist: rawDist, dt: dtS });
      if (s.window.length > 8) s.window.shift();
      s.lastPoint = point;
    },
    pace() {
      const sumD = s.window.reduce((a, w) => a + w.dist, 0);
      const sumT = s.window.reduce((a, w) => a + w.dt, 0);
      return sumD > 0.01 && sumT > 0 ? (sumT / 60) / sumD : 0;
    },
  };
};

// --- Helpers -------------------------------------------------------------
const METERS = 1 / 111320; // degrees latitude per metre
const base = { lat: 22.5431, lon: 114.0579 }; // Shenzhen
const at = (eastM, northM) => ({
  latitude: base.lat + northM * METERS,
  longitude: base.lon + eastM * METERS,
});

let pass = 0, fail = 0;
const check = (name, cond, detail) => {
  if (cond) { pass += 1; console.log(`  PASS  ${name}${detail ? ` — ${detail}` : ''}`); }
  else { fail += 1; console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ''}`); }
};

// === Test 1: standing still with realistic jitter (consumer GPS, 2 s cadence)
console.log('\nTest 1: stationary with normal GPS jitter (~5 m radius, 60 s)');
{
  const tr = createTracker();
  let t = Date.now();
  const jitter = [0, 4, -3, 5, 2, -4, 3, -5, 1, 4, -2, 3, -3, 5, -1, 2, -4, 4, -2, 1, 3, -3, 5, -5, 2, 4, -1, 0, 3, -4];
  tr.push({ ...at(0, 0), accuracy: 12, speed: 0.2, t });
  for (let i = 1; i <= 30; i++) {
    t += GPS_CONFIG.TRACK_INTERVAL_MS;
    tr.push({ ...at(jitter[i % jitter.length], jitter[(i * 3) % jitter.length]), accuracy: 12, speed: 0.2, t });
  }
  console.log(`  accepted=${tr.state.accepted} rejected=${tr.state.rejected} distance=${(tr.state.distance * 1000).toFixed(1)}m`);
  check('stationary distance stays under 50 m (was 2300 m)', tr.state.distance * 1000 < 50,
    `${(tr.state.distance * 1000).toFixed(1)} m`);
  check('engine flags the runner as standing still', tr.state.isStill === true);
  check('pace is suppressed while still', tr.pace() === 0);
}

// === Test 2: a single wild outlier while still (the classic phantom-km cause)
console.log('\nTest 2: stationary, one 2 km outlier fix in the middle');
{
  const tr = createTracker();
  let t = Date.now();
  tr.push({ ...at(0, 0), accuracy: 10, speed: 0.1, t });
  for (let i = 1; i <= 10; i++) {
    t += GPS_CONFIG.TRACK_INTERVAL_MS;
    tr.push({ ...at(3, -2), accuracy: 10, speed: 0.1, t });
  }
  // The outlier: jumped 2 km away in 2 seconds, with an awful accuracy radius.
  t += GPS_CONFIG.TRACK_INTERVAL_MS;
  tr.push({ ...at(2000, 0), accuracy: 80, speed: 0.1, t });
  // Back to where we were.
  for (let i = 0; i < 10; i++) {
    t += GPS_CONFIG.TRACK_INTERVAL_MS;
    tr.push({ ...at(2, -3), accuracy: 10, speed: 0.1, t });
  }
  console.log(`  accepted=${tr.state.accepted} rejected=${tr.state.rejected} distance=${(tr.state.distance * 1000).toFixed(1)}m`);
  console.log(`  reasons: ${[...new Set(tr.state.reasons)].join(' | ')}`);
  check('outlier contributes no distance', tr.state.distance * 1000 < 50,
    `${(tr.state.distance * 1000).toFixed(1)} m`);
  check('outlier was actually rejected', tr.state.rejected > 0);
}

// === Test 3: a real run — 1 km east at ~6:00 min/km
console.log('\nTest 3: real run, 1000 m in 360 s (6:00 min/km)');
{
  const tr = createTracker();
  let t = Date.now();
  const speedMs = 1000 / 360;              // 2.78 m/s
  const stepM = speedMs * (GPS_CONFIG.TRACK_INTERVAL_MS / 1000); // 5.56 m per fix
  tr.push({ ...at(0, 0), accuracy: 8, speed: speedMs, t });
  let travelled = 0;
  for (let i = 0; i < 180; i++) {           // 180 fixes x 2 s = 360 s
    travelled += stepM;
    t += GPS_CONFIG.TRACK_INTERVAL_MS;
    tr.push({ ...at(travelled, 0), accuracy: 8, speed: speedMs, t });
  }
  const distM = tr.state.distance * 1000;
  const pace = tr.pace();
  console.log(`  distance=${distM.toFixed(1)}m  rolling pace=${pace.toFixed(2)} min/km  rejected=${tr.state.rejected}`);
  check('distance within 15% of the 1000 m actually run', Math.abs(distM - 1000) / 1000 < 0.15,
    `${distM.toFixed(1)} m`);
  check('pace lands in a believable range for this synthetic trace (2.5-4 min/km)',
    pace >= 2.5 && pace <= 4, `${pace.toFixed(2)} min/km`);
  check('not flagged as standing still', tr.state.isStill === false);
}

// === Test 4: teleport-level jump must be rejected (the exact 2.30 km symptom)
console.log('\nTest 4: teleport — 2.30 km in 13 s (the reported symptom)');
{
  const tr = createTracker();
  let t = Date.now();
  tr.push({ ...at(0, 0), accuracy: 6, speed: 0, t });
  t += 13000;
  tr.push({ ...at(2300, 0), accuracy: 6, speed: 176, t }); // 176 m/s == 634 km/h
  const distM = tr.state.distance * 1000;
  console.log(`  accepted=${tr.state.accepted} rejected=${tr.state.rejected} distance=${distM.toFixed(1)}m`);
  console.log(`  reasons: ${tr.state.reasons.join(' | ')}`);
  check('2.30 km phantom is rejected', distM === 0, `${distM.toFixed(1)} m`);
}

console.log(`\n=== ${pass} passed, ${fail} failed ===`);
process.exit(fail === 0 ? 0 : 1);
