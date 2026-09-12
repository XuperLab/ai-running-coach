// src/screens/ActiveRunScreen.js
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, Alert, StatusBar, Platform, Dimensions,
} from 'react-native';
import * as Location from 'expo-location';
import { COLORS, GPS_CONFIG } from '../utils/constants';
import { saveRuns, getRuns } from '../utils/storage';
import { getMapView, getPolyline, getMapProps, isMapAvailable, getMapLoadError } from '../utils/mapHelper';
import { useVoiceCoach } from '../hooks/useVoiceCoach';
import { useHeartRate, heartRateZone } from '../hooks/useHeartRate';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Fallback camera so the map always has somewhere to look before the first fix.
const DEFAULT_REGION = {
  latitude: 22.5431,
  longitude: 114.0579,
  latitudeDelta: 0.02,
  longitudeDelta: 0.02,
};

// Haversine formula: calculate distance (km) between two lat/lng points
const haversineDistance = (coords1, coords2) => {
  const R = 6371; // Earth radius in km
  const dLat = (coords2.latitude - coords1.latitude) * Math.PI / 180;
  const dLon = (coords2.longitude - coords1.longitude) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(coords1.latitude * Math.PI / 180) *
      Math.cos(coords2.latitude * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // in km
};

// Isolates a failing map/overlay subtree. Without this, one bad child (e.g. a
// native view that isn't registered in the current runtime) throws during render
// and takes the whole map — and therefore onMapReady — down with it, which shows
// up to the user as a permanent "Loading map…".
class MapErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error) {
    if (this.props.onError) {
      this.props.onError(error && error.message ? error.message : String(error));
    }
  }

  render() {
    if (this.state.failed) return null;
    return this.props.children;
  }
}

// The map lives in its own memoised component.
//
// This is deliberate and load-bearing: the run screen re-renders once a second
// (the elapsed-time timer). If the map were rendered inline, every tick would
// create a new props object and — because react-native-maps forwards `region`
// straight to the native camera — the native view would receive a camera command
// every second. On the new architecture that keeps the map from ever settling,
// so it lays out but never becomes ready and never paints.
//
// React.memo with a stable `region` reference means the map subtree is NOT
// re-rendered by the timer at all. It only re-renders when the region genuinely
// changes (a new GPS fix) or readiness flips.
const RunMap = React.memo(function RunMap({
  MapView,
  Polyline,
  region,
  ready,
  routeCoords,
  onReady,
  onLoaded,
  onLayout,
  onError,
}) {
  const props = getMapProps(region, ready);
  return (
    <MapErrorBoundary onError={onError}>
      <MapView
        {...props}
        onMapReady={onReady}
        onMapLoaded={onLoaded}
        onLayout={onLayout}
      >
        {Platform.OS === 'android' && Polyline && routeCoords.length > 1 && (
          <MapErrorBoundary onError={(msg) => console.warn('[ActiveRun] polyline error:', msg)}>
            <Polyline
              coordinates={routeCoords}
              strokeColor="#2563EB"
              strokeWidth={5}
              lineJoin="round"
              lineCap="round"
            />
          </MapErrorBoundary>
        )}
      </MapView>
    </MapErrorBoundary>
  );
});

const ActiveRunScreen = ({ navigation, route }) => {
  const { duration: targetDuration, workoutType, raceGoal, musicGenre, coachStyle } = route.params || {};

  // Voice coach (real TTS cues)
  const voice = useVoiceCoach(coachStyle || 'Motivational');
  const lastKmRef = useRef(0);
  const lastZoneRef = useRef(0);

  // Real heart rate from the device (null when unknown -> UI shows "—")
  const { heartRate, source, available, status } = useHeartRate();
  const zone = heartRate != null ? heartRateZone(heartRate) : 0;

  // Timer state
  const [isRunning, setIsRunning] = useState(true);
  const [elapsedTime, setElapsedTime] = useState(0);
  const intervalRef = useRef(null);

  // GPS state
  const [gpsStatus, setGpsStatus] = useState('Searching'); // Searching | Locked | No Signal
  const [gpsAccuracy, setGpsAccuracy] = useState(null);   // metres; shown so you can judge the fix
  const [region, setRegion] = useState(null);
  const [routeCoords, setRouteCoords] = useState([]);
  const [totalDistance, setTotalDistance] = useState(0);
  const [currentPace, setCurrentPace] = useState(0); // rolling pace from real GPS fixes (min/km)
  const [isStill, setIsStill] = useState(false);     // standing still right now

  // Map state. The map module is resolved once at mount; if it genuinely cannot
  // load we say so plainly instead of leaving the user staring at a blank half
  // of the screen. `mapReady` flips when the native map reports it has drawn.
  const [mapReady, setMapReady] = useState(false);
  const [mapLaidOut, setMapLaidOut] = useState(false);
  const [mapTimedOut, setMapTimedOut] = useState(false);
  const [mapError, setMapError] = useState(null);
  const mapModule = useRef({ available: false, MapView: null, Polyline: null, error: null });

  // All tracking state lives in refs: the GPS callback must always see fresh
  // values, and re-creating the watcher would drop fixes.
  const stateRef = useRef({
    lastPoint: null,       // last ACCEPTED point (what we measure from)
    lastFixTime: null,     // acquisition time (ms) of the last raw fix
    lastAcceptedTime: null,// acquisition time (ms) of the last accepted point
    lastSpeed: null,       // m/s, from the device when available
    lastPointTime: null,   // when we last crossed the distance floor
    segmentDist: 0,        // accumulation buffer -> prevents per-tick re-render jitter
    distance: 0,           // authoritative cumulative distance (km)
    window: [],            // [{ dist, dt }] rolling window for pace
    accepted: 0,
    rejected: 0,
    rejectedReasons: [],
    stillSince: null,      // timestamp (ms) when we first saw sustained stillness
    stillTicks: 0,
    coarsePoint: null,     // last coarse-but-real fix, used to place the map
  });

  const subscriptionRef = useRef(null);
  const desiredAccuracyRef = useRef(Location.Accuracy.BestForNavigation);

  // ---- GPS fix processing (pure function of the fix + accumulated state) ----
  const processFix = useCallback((loc) => {
    const s = stateRef.current;
    const { latitude, longitude, accuracy, speed } = loc.coords;
    const fixTime = loc.timestamp || Date.now();

    if (accuracy != null) setGpsAccuracy(Math.round(accuracy));

    // 1) Is this fix trustworthy enough to bank distance from?
    //
    //    Important distinction: a fix with a loose accuracy radius is still a real
    //    position — it just isn't precise enough to accumulate metres from. We
    //    report it as "Weak" and use it to place the map, rather than claiming
    //    "No Signal" (which would be a lie, and would also leave the map blank on
    //    devices/browsers whose first fixes are coarse, e.g. Wi-Fi positioning).
    const isCoarse = accuracy != null && accuracy > GPS_CONFIG.ACCURACY_THRESHOLD_M;
    if (isCoarse) {
      s.rejected += 1;
      s.rejectedReasons.push(`coarse accuracy ${Math.round(accuracy)}m`);
      setGpsStatus('Weak');
      // Still useful for showing where the runner is, just not for distance.
      if (!s.lastPoint) {
        const coarse = { latitude, longitude };
        setRegion({
          latitude,
          longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        });
        s.coarsePoint = coarse;
      }
      return;
    }

    const point = { latitude, longitude };

    if (!s.lastPoint) {
      // Very first usable fix — establish the origin, accumulate nothing.
      s.lastPoint = point;
      s.lastFixTime = fixTime;
      s.lastAcceptedTime = fixTime;
      s.lastPointTime = fixTime;
      s.lastSpeed = typeof speed === 'number' && speed >= 0 ? speed : null;
      s.accepted += 1;
      setRouteCoords([point]);
      setRegion({ latitude, longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 });
      return;
    }

    // 2) How far and how fast? GPS has a much better notion of speed than we do,
    //    so trust the device value when it provides one.
    const rawDist = haversineDistance(s.lastPoint, point); // km
    const dtMs = Math.max(0, fixTime - (s.lastFixTime || fixTime));
    const dtS = dtMs / 1000;
    const derivedSpeed = dtS > 0 ? rawDist / dtS : Infinity;
    const hopSpeed = rawDist / Math.max(dtS, 0.001);
    const stepSpeed = typeof speed === 'number' && speed >= 0 ? speed : hopSpeed;

    // 3) Reject teleports / jitter that no human could have run.
    const isJump = rawDist > GPS_CONFIG.MAX_JUMP_M / 1000 ||
      (dtS > 0.5 && stepSpeed > GPS_CONFIG.MAX_JUMP_SPEED_MS);
    if (isJump) {
      s.rejected += 1;
      s.rejectedReasons.push(
        `jump ${(rawDist * 1000).toFixed(0)}m in ${dtS.toFixed(1)}s (${(derivedSpeed * 1000).toFixed(0)}m/s)`
      );
      // Don't move the origin to the bad point — just resample from the good one.
      s.lastFixTime = fixTime;
      setGpsStatus('Locked');
      return;
    }

    s.accepted += 1;
    s.lastFixTime = fixTime;
    setGpsStatus('Locked');
    if (typeof speed === 'number' && speed >= 0) s.lastSpeed = speed;

    // 4) Noise floor: while standing still the fix wanders a few metres at a time.
    //    The floor scales with the reported accuracy so we never bank pure noise.
    const noiseFloorKm = Math.max(
      GPS_CONFIG.DISTANCE_FILTER_M,
      (accuracy != null ? accuracy : 0) * GPS_CONFIG.DISTANCE_FILTER_ACCURACY_FACTOR
    ) / 1000;

    if (rawDist < noiseFloorKm) {
      // Not enough movement to bank. Only call it "standing still" once we've been
      // under the noise floor for a sustained stretch — a single quiet fix between
      // strides must not trip auto-pause.
      const stationarySpeed =
        typeof speed === 'number' && speed >= 0
          ? speed
          : rawDist / Math.max(dtS, GPS_CONFIG.TRACK_INTERVAL_MS / 1000);

      if (stationarySpeed < GPS_CONFIG.AUTO_PAUSE_SPEED_MS) {
        s.stillSince = s.stillSince || fixTime;
        s.stillTicks += 1;
        if (GPS_CONFIG.AUTO_PAUSE_ENABLED &&
            (fixTime - s.stillSince) / 1000 >= GPS_CONFIG.AUTO_PAUSE_AFTER_S) {
          setIsStill(true);
        }
      } else {
        s.stillSince = null;
        s.stillTicks = 0;
        setIsStill(false);
      }
      return;
    }

    // 5) Real movement — bank it.
    setIsStill(false);
    s.stillSince = null;
    s.stillTicks = 0;
    const dt = dtS > 0 ? dtS : GPS_CONFIG.TRACK_INTERVAL_MS / 1000;
    s.segmentDist += rawDist;
    s.distance += rawDist;
    s.lastAcceptedTime = fixTime;
    s.lastPointTime = fixTime;

    // Flush the accumulator a few times a second at most, instead of re-rendering
    // on every single fix — keeps the number readable and the UI smooth.
    if (stateRef.current.segmentDist >= 0.005) {
      const flush = s.segmentDist;
      s.segmentDist = 0;
      setTotalDistance((prev) => prev + flush);
    }

    // 6) Rolling pace window, measured from real distance over real elapsed time.
    const win = s.window;
    win.push({ dist: rawDist, dt });
    if (win.length > 8) win.shift();
    const sumDist = win.reduce((acc, w) => acc + w.dist, 0);
    const sumDt = win.reduce((acc, w) => acc + w.dt, 0);
    if (sumDist > 0.01 && sumDt > 0) {
      setCurrentPace((sumDt / 60) / sumDist);
    }

    setRouteCoords((prev) => [...prev, point]);
    s.lastPoint = point;
  }, []);

  // Request GPS permission and start tracking
  const startGpsTracking = useCallback(async () => {
    try {
      const { status: perm } = await Location.requestForegroundPermissionsAsync();
      if (perm !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is needed to track your run.');
        setGpsStatus('Error');
        return;
      }

      // Establish a first fix so the run starts from a known origin.
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation,
      });
      processFix(loc);

      // Start watching position — these are REAL GPS fixes from the device.
      subscriptionRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: GPS_CONFIG.TRACK_INTERVAL_MS,
          distanceInterval: 2,
        },
        processFix
      );

      // If the OS reports our captured flat, distance will never grow. Detect that
      // and re-subscribe at a lower accuracy rather than silently showing 0.00.
      setTimeout(() => {
        const s = stateRef.current;
        if (s.accepted <= 2 && subscriptionRef.current) {
          console.warn('[GPS] no usable fixes at BestForNavigation, falling back to High');
          subscriptionRef.current.remove();
          desiredAccuracyRef.current = Location.Accuracy.High;
          Location.watchPositionAsync(
            {
              accuracy: Location.Accuracy.High,
              timeInterval: GPS_CONFIG.TRACK_INTERVAL_MS,
              distanceInterval: 2,
            },
            processFix
          ).then((sub) => { subscriptionRef.current = sub; });
        }
      }, 8000);
    } catch (error) {
      console.error('GPS error:', error);
      setGpsStatus('Error');
    }
  }, [processFix]);

  // Timer (only counts elapsed time — no fabricated metrics)
  const startTimer = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const stopAllTracking = useCallback(() => {
    stopTimer();
    if (subscriptionRef.current) {
      subscriptionRef.current.remove();
      subscriptionRef.current = null;
    }
  }, [stopTimer]);

  useEffect(() => {
    startTimer();
    startGpsTracking();
    voice.start(workoutType);
    return () => {
      stopTimer();
      if (subscriptionRef.current) {
        subscriptionRef.current.remove();
      }
    };
  }, []);

  // Resolve the native map module once, on mount. Keeping the components in a
  // ref (instead of calling getMapView() inline during render) means the same
  // component identity is reused across re-renders, which matters: remounting a
  // native map on every GPS tick would reset it and could leave it blank.
  useEffect(() => {
    const available = isMapAvailable();
    mapModule.current = {
      available,
      MapView: available ? getMapView() : null,
      Polyline: available ? getPolyline() : null,
      error: available ? null : getMapLoadError(),
    };
    if (!available) {
      console.warn('[ActiveRun] map unavailable:', mapModule.current.error);
    }
  }, []);

  // Watchdog. `onMapReady` is not guaranteed to reach us — the library forwards
  // several different native events depending on platform and architecture, and
  // on the new architecture its own ready-gate can swallow them. So we do not
  // treat a missing callback as "broken map": once the native view has actually
  // laid out, we consider the map usable and simply stop covering it. Only if it
  // never even lays out do we admit defeat.
  useEffect(() => {
    const t = setTimeout(() => {
      if (!mapReady) {
        if (mapLaidOut) {
          console.log('[ActiveRun] map laid out but never signalled ready; treating as usable');
          setMapReady(true);
        } else {
          console.warn('[ActiveRun] map never laid out within 12s');
          setMapTimedOut(true);
        }
      }
    }, 12000);
    return () => clearTimeout(t);
  }, [mapReady, mapLaidOut]);

  // Speak a coaching cue when entering a new heart-rate zone (only with real HR)
  useEffect(() => {
    if (heartRate != null && zone >= 2 && zone !== lastZoneRef.current) {
      lastZoneRef.current = zone;
      voice.zone(zone);
    }
  }, [zone, heartRate, voice]);

  // Speak a milestone cue for every completed kilometer
  useEffect(() => {
    const km = Math.floor(totalDistance);
    if (km > lastKmRef.current && km > 0) {
      lastKmRef.current = km;
      voice.milestone(km);
    }
  }, [totalDistance, voice]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleTogglePlay = () => {
    if (isRunning) {
      stopTimer();
      // Keep GPS tracking; just pause the clock/stats
    } else {
      startTimer();
    }
    setIsRunning(!isRunning);
  };

  // Auto-pause: while standing still, don't keep burning the clock — a paused
  // run shows a pace of "--" and a duration that reflects actual running time.
  useEffect(() => {
    if (isStill && isRunning) {
      stopTimer();
      setIsRunning(false);
    }
  }, [isStill, isRunning, stopTimer]);

  const handleStop = () => {
    Alert.alert(
      'Finish Session',
      'Great work! Ready to save your progress?',
      [
        { text: 'Resume', style: 'cancel' },
        { text: 'Finish & Save', onPress: handleSaveRun, style: 'default' },
      ]
    );
  };

  const handleSaveRun = async () => {
    stopAllTracking();
    const s = stateRef.current;
    // Flush whatever is left in the accumulator so the saved distance is exact.
    const finalDistance = s.distance + s.segmentDist;
    const runs = await getRuns() || [];
    const avgPace = finalDistance > 0 ? (elapsedTime / 60) / finalDistance : 0;
    const newRun = {
      id: Date.now(),
      date: new Date().toISOString(),
      duration: elapsedTime,
      distance: finalDistance, // real GPS distance (km), accumulator flushed
      pace: avgPace,
      heartRate: heartRate != null ? heartRate : null, // real BPM or null (unknown)
      heartRateKnown: heartRate != null,
      heartRateSource: heartRate != null ? source : null,
      workoutType,
      raceGoal,
      route: routeCoords, // Full real GPS route
      gpsTracked: s.accepted > 2,
      gpsAcceptedFixes: s.accepted,
      gpsRejectedFixes: s.rejected,
    };
    await saveRuns([newRun, ...runs]);
    voice.finish();
    navigation.navigate('Main', { screen: 'Dashboard' });
  };

  const handleBack = () => {
    if (elapsedTime > 10) {
      Alert.alert(
        'Exit Workout?',
        'Your progress for this session will not be saved. Are you sure you want to leave?',
        [
          { text: 'Stay', style: 'cancel' },
          {
            text: 'Exit',
            style: 'destructive',
            onPress: () => {
              stopAllTracking();
              navigation.navigate('Main', { screen: 'Dashboard' });
            },
          },
        ]
      );
    } else {
      stopAllTracking();
      navigation.navigate('Main', { screen: 'Dashboard' });
    }
  };

  const getZoneColor = (z) => {
    const colors = ['#94A3B8', '#10B981', '#F59E0B', '#F97316', '#EF4444'];
    return colors[z - 1] || colors[0];
  };

  // Average pace for display (real, over whole run). Zero distance means we don't
  // know the pace yet — show "--", never a made-up number.
  const displayPace = totalDistance > 0
    ? (elapsedTime / 60) / totalDistance
    : 0;

  const hrLabel = heartRate != null ? String(heartRate) : '—';
  const zoneLabel = heartRate != null ? `Z${zone}` : '—';

  // A stable region reference for the map. Without this the per-second timer
  // re-render would hand the native camera a brand new object every tick, which
  // the new-architecture map cannot settle on.
  const stableRegion = useMemo(() => {
    if (region) {
      return {
        latitude: region.latitude,
        longitude: region.longitude,
        latitudeDelta: region.latitudeDelta || 0.01,
        longitudeDelta: region.longitudeDelta || 0.01,
      };
    }
    return DEFAULT_REGION;
  }, [region?.latitude, region?.longitude]);

  const gpsColor = gpsStatus === 'Locked' ? COLORS.success
    : gpsStatus === 'Error' ? '#EF4444'
    : gpsStatus === 'Weak' ? '#F97316'
    : '#F59E0B';
  const gpsLabel = gpsStatus === 'Locked'
    ? (gpsAccuracy != null ? `GPS ±${gpsAccuracy}m` : 'GPS')
    : gpsStatus === 'Weak'
      ? (gpsAccuracy != null ? `Weak ±${gpsAccuracy}m` : 'Weak signal')
    : gpsStatus === 'Error' ? 'No Signal'
    : 'Searching';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Map background. Mounted as soon as the module resolves — NOT gated on a
          GPS fix, because the native view only fires onMapReady once it exists,
          and waiting for `region` is what left the centre of the screen empty. */}
      {mapModule.current.available && mapModule.current.MapView && !mapReady && (
        <View style={styles.loadingMap} pointerEvents="none">
          <Text style={styles.loadingText}>
            {mapTimedOut ? 'Map could not load' : 'Loading map…'}
          </Text>
          <Text style={styles.loadingSub}>
            {mapTimedOut
              ? 'Your run is still being tracked accurately'
              : gpsStatus === 'Locked' ? 'Location found — drawing map'
              : gpsStatus === 'Weak' ? 'Weak signal — map may be imprecise'
              : 'Acquiring GPS signal…'}
          </Text>
          {!!mapError && <Text style={styles.mapCoords}>{mapError}</Text>}
        </View>
      )}

      {mapModule.current.available && mapModule.current.MapView ? (
        <RunMap
          MapView={mapModule.current.MapView}
          Polyline={mapModule.current.Polyline}
          region={stableRegion}
          ready={mapReady}
          routeCoords={routeCoords}
          onError={(msg) => {
            console.error('[ActiveRun] map render error:', msg);
            setMapError(msg);
          }}
          onReady={() => {
            console.log('[ActiveRun] map ready');
            setMapReady(true);
          }}
          onLoaded={() => {
            console.log('[ActiveRun] map loaded');
            setMapReady(true);
          }}
          onLayout={() => {
            console.log('[ActiveRun] map laid out');
            setMapLaidOut(true);
          }}
        />
      ) : (
        /* Truthful fallback: say why there is no map rather than showing nothing. */
        <View style={styles.loadingMap}>
          <Text style={styles.loadingText}>
            {mapModule.current.available ? '📍 GPS Locked' : 'Map unavailable'}
          </Text>
          <Text style={styles.loadingSub}>
            {mapModule.current.available
              ? 'Waiting for the map to load'
              : (mapModule.current.error || 'Map module not available on this platform')}
          </Text>
          {region && (
            <Text style={styles.mapCoords}>
              {region.latitude.toFixed(5)}, {region.longitude.toFixed(5)}
            </Text>
          )}
        </View>
      )}

      {/* Gradient overlay at top */}
      <View style={styles.topGradient} />

      {/* Top Bar */}
      <SafeAreaView style={styles.topBarSafe}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <View style={styles.sessionBadge}>
            <Text style={styles.sessionBadgeText}>{workoutType || 'Free Run'}</Text>
          </View>
          <View style={styles.gpsStatusContainer}>
            <View style={[styles.gpsDot, { backgroundColor: gpsColor }]} />
            <Text style={[styles.gpsText, { color: gpsColor }]}>{gpsLabel}</Text>
          </View>
        </View>
      </SafeAreaView>

      {/* Bottom Stats Panel */}
      <View style={styles.bottomPanel}>
        {/* Primary Stats */}
        <View style={styles.primaryStatsRow}>
          <View style={styles.primaryStatBox}>
            <Text style={styles.primaryStatLabel}>DURATION</Text>
            <Text style={styles.primaryStatValue}>{formatTime(elapsedTime)}</Text>
          </View>
          <View style={styles.primaryStatBox}>
            <Text style={styles.primaryStatLabel}>DISTANCE</Text>
            <Text style={styles.primaryStatValue}>{totalDistance.toFixed(2)}</Text>
            <Text style={styles.primaryStatUnit}>km</Text>
          </View>
          <View style={styles.primaryStatBox}>
            <Text style={styles.primaryStatLabel}>PACE</Text>
            <Text style={styles.primaryStatValue}>
              {(isStill || displayPace <= 0) ? '--' : displayPace.toFixed(1)}
            </Text>
            <Text style={styles.primaryStatUnit}>
              {isStill ? 'standing still' : 'min/km'}
            </Text>
          </View>
        </View>

        {/* Heart Rate — real value, or "—" when the device can't provide one */}
        <View style={styles.hrRow}>
          <Text style={styles.hrEmoji}>❤️</Text>
          <Text style={[styles.hrValue, heartRate == null && styles.hrUnknown]}>{hrLabel}</Text>
          {heartRate == null ? (
            <Text style={styles.hrUnit}>no HR source</Text>
          ) : (
            <Text style={styles.hrUnit}>BPM</Text>
          )}
          <View style={styles.zoneIndicator}>
            {[1, 2, 3, 4, 5].map((z) => (
              <View
                key={z}
                style={[
                  styles.zoneSegment,
                  { backgroundColor: z <= zone ? getZoneColor(z) : 'rgba(255,255,255,0.15)' }
                ]}
              />
            ))}
          </View>
          <Text style={[styles.zoneText, { color: heartRate != null ? getZoneColor(zone) : '#94A3B8' }]}>
            {zoneLabel}
          </Text>
        </View>

        {/* Controls */}
        <View style={styles.controlsRow}>
          <TouchableOpacity
            style={[styles.controlButton, isRunning ? styles.pauseButton : styles.playButton]}
            onPress={handleTogglePlay}
            activeOpacity={0.8}
          >
            <Text style={styles.controlIcon}>{isRunning ? '⏸' : '▶'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.stopButton}
            onPress={handleStop}
            activeOpacity={0.8}
          >
            <Text style={styles.stopIcon}>■</Text>
            <Text style={styles.stopLabel}>FINISH</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

// Dark map style for the running app
const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#1A1A2E' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#7B7B8B' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#1A1A2E' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2D2D44' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#9A9AAB' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0D0D1A' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#51515E' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#25253B' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#6B6B7B' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#35354A' }] },
  { featureType: 'landscape', elementType: 'geometry', stylers: [{ color: '#1A1A2E' }] },
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  loadingMap: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  loadingSub: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 32,
    marginTop: 4,
  },
  mapCoords: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 12,
    marginTop: 12,
    fontVariant: ['tabular-nums'],
  },
  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 120,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
  },
  topBarSafe: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    paddingTop: Platform.OS === 'android' ? 40 : 12,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  backIcon: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '600',
  },
  sessionBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
  },
  sessionBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  gpsStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  gpsDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  gpsText: {
    fontSize: 12,
    fontWeight: '700',
  },
  bottomPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  primaryStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  primaryStatBox: {
    alignItems: 'center',
    flex: 1,
  },
  primaryStatLabel: {
    color: 'rgba(255, 255, 255, 0.45)',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  primaryStatValue: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  primaryStatUnit: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  hrRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    gap: 8,
  },
  hrEmoji: {
    fontSize: 16,
  },
  hrValue: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
  },
  hrUnknown: {
    color: 'rgba(255,255,255,0.55)',
    fontWeight: '600',
  },
  hrUnit: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 12,
    fontWeight: '600',
  },
  zoneIndicator: {
    flexDirection: 'row',
    width: 60,
    height: 4,
    gap: 3,
  },
  zoneSegment: {
    flex: 1,
    borderRadius: 2,
  },
  zoneText: {
    fontSize: 11,
    fontWeight: '800',
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
  },
  controlButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  pauseButton: {
    backgroundColor: '#FFFFFF',
  },
  playButton: {
    backgroundColor: COLORS.success,
  },
  controlIcon: {
    fontSize: 28,
    color: '#0F172A',
  },
  stopButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  stopIcon: {
    color: '#EF4444',
    fontSize: 16,
    marginRight: 6,
  },
  stopLabel: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
  },
});

export default ActiveRunScreen;
