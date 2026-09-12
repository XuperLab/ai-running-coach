// src/hooks/useHeartRate.js
//
// Real heart-rate source for the active run.
//
// A phone running through Expo Go has NO built-in live heart-rate sensor that
// the app can read. Live HR during a run normally comes from one of:
//   1. A Bluetooth HR strap / armband paired to the phone (needs a dev build + BLE).
//   2. The device Health store (HealthKit on iOS / Health Connect on Android),
//      which surfaces the latest HR captured by a watch or prior workout.
//
// This hook tries to read a REAL, recent heart-rate value from the device health
// store when `expo-health` is available (e.g. in a custom dev build). If nothing
// is available or permission is denied, it returns `heartRate: null` so the UI
// can honestly show "—" instead of a fabricated number.
//
// We never simulate HR. The app only ever shows a number it actually measured.

import { useState, useEffect, useRef, useCallback } from 'react';

// Only consider a health HR sample "recent" if it was recorded within this window.
const RECENCY_WINDOW_MS = 30 * 60 * 1000; // 30 minutes

export const useHeartRate = () => {
  const [heartRate, setHeartRate] = useState(null); // number (bpm) or null when unknown
  const [source, setSource] = useState(null); // 'Health' | 'Sensor' | null
  const [available, setAvailable] = useState(false);
  const [status, setStatus] = useState('checking'); // 'checking' | 'available' | 'unavailable'
  const [error, setError] = useState(null);

  const healthRef = useRef(null); // cached expo-health module (or false if unavailable)
  const permittedRef = useRef(null); // null = unknown, true/false

  const loadHealth = useCallback(() => {
    if (healthRef.current !== null) return healthRef.current;
    try {
      // Optional dependency: only present in builds that include it (e.g. a dev
      // build with HealthKit / Health Connect). The concatenated name keeps the
      // bundler from failing when the module is absent; the require is resolved
      // at runtime and caught if missing.
      const mod = require('expo' + '-health');
      healthRef.current = mod && (typeof mod.readRecordsAsync === 'function' || typeof mod.readRecords === 'function')
        ? mod
        : false;
    } catch (e) {
      healthRef.current = false;
    }
    return healthRef.current;
  }, []);

  const readLatest = useCallback(async () => {
    const Health = loadHealth();
    if (!Health) {
      setStatus('unavailable');
      setAvailable(false);
      setHeartRate(null);
      return;
    }
    try {
      if (permittedRef.current !== true) {
        const PermType = Health.PermissionType || Health.SampleType || {};
        const hrPerm = PermType.HeartRate || 'HeartRate';
        let granted = true;
        if (typeof Health.requestPermissionsAsync === 'function') {
          const res = await Health.requestPermissionsAsync([hrPerm]);
          granted = !!(res && (res.granted ?? res.status === 'granted' ?? true));
        }
        permittedRef.current = granted;
        if (!granted) {
          setStatus('unavailable');
          setAvailable(false);
          setHeartRate(null);
          return;
        }
      }

      const RecordType = Health.RecordType || Health.SampleType || {};
      const hrType = RecordType.HeartRate || 'HeartRate';
      const now = new Date();
      const from = new Date(now.getTime() - RECENCY_WINDOW_MS);
      const readFn = Health.readRecordsAsync || Health.readRecords;
      const records = await readFn(hrType, { from, to: now });
      const list = Array.isArray(records) ? records : (records && records.records) || [];
      const latest = list[list.length - 1];

      if (latest && typeof latest.value === 'number' && latest.value > 0) {
        setHeartRate(Math.round(latest.value));
        setSource('Health');
        setAvailable(true);
        setStatus('available');
      } else {
        // No recent HR synced to this device — be honest about it.
        setHeartRate(null);
        setAvailable(false);
        setStatus('unavailable');
      }
    } catch (e) {
      setError(e && e.message ? e.message : String(e));
      setHeartRate(null);
      setAvailable(false);
      setStatus('unavailable');
    }
  }, [loadHealth]);

  useEffect(() => {
    readLatest();
    // Refresh periodically in case a fresh sample arrives (watch sync, etc.)
    const id = setInterval(readLatest, 15000);
    return () => clearInterval(id);
  }, [readLatest]);

  return { heartRate, source, available, status, error };
};

// Map a real BPM to a 1–5 training zone using the standard %HRR approximation.
// Returns 0 when HR is unknown.
export const heartRateZone = (bpm) => {
  if (!bpm || bpm < 90) return 0;
  if (bpm >= 175) return 5;
  if (bpm >= 160) return 4;
  if (bpm >= 145) return 3;
  if (bpm >= 130) return 2;
  return 1;
};
