// src/screens/ActiveRunScreen.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, Alert, StatusBar, Platform, Dimensions,
} from 'react-native';
import * as Location from 'expo-location';
import { COLORS, GPS_CONFIG } from '../utils/constants';
import { saveRuns, getRuns } from '../utils/storage';
import { MapView as MapComponent, Polyline as PolylineComponent } from '../utils/mapHelper';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

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

const ActiveRunScreen = ({ navigation, route }) => {
  const { duration: targetDuration, workoutType, raceGoal, musicGenre, coachStyle } = route.params || {};

  // Timer state
  const [isRunning, setIsRunning] = useState(true);
  const [elapsedTime, setElapsedTime] = useState(0);
  const intervalRef = useRef(null);

  // GPS state
  const [gpsStatus, setGpsStatus] = useState('Searching');
  const [region, setRegion] = useState(null);
  const [routeCoords, setRouteCoords] = useState([]);
  const [totalDistance, setTotalDistance] = useState(0);
  const [currentPace, setCurrentPace] = useState(0);
  const lastCoordsRef = useRef(null);
  const subscriptionRef = useRef(null);
  const paceUpdateRef = useRef({ distance: 0, time: 0 });
  const lastLocationRef = useRef(null);
  const locationCountRef = useRef(0);

  // Heart rate (still simulated since we don't have a real HR sensor)
  const [heartRate, setHeartRate] = useState(145);
  const [heartRateZone, setHeartRateZone] = useState(3);

  // Request GPS permission and start tracking
  const startGpsTracking = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is needed to track your run.');
        setGpsStatus('Error');
        return;
      }

      // Get initial position
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      const initial = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      };
      setRegion({
        latitude: initial.latitude,
        longitude: initial.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
      setRouteCoords([initial]);
      setGpsStatus('Locked');
      lastCoordsRef.current = initial;
      paceUpdateRef.current = { distance: 0, time: elapsedTime };
      locationCountRef.current = 1;

      // Start watching position
      subscriptionRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: GPS_CONFIG.TRACK_INTERVAL_MS,
          distanceInterval: 1,
        },
        (newLoc) => {
          const { latitude, longitude, accuracy } = newLoc.coords;

          // Skip inaccurate readings
          if (accuracy > GPS_CONFIG.ACCURACY_THRESHOLD_M) return;

          const point = { latitude, longitude };
          locationCountRef.current += 1;

          // Calculate distance from last recorded point
          if (lastCoordsRef.current) {
            const dist = haversineDistance(lastCoordsRef.current, point);
            if (dist >= GPS_CONFIG.DISTANCE_FILTER_M / 1000) {
              setRouteCoords((prev) => [...prev, point]);
              setTotalDistance((prev) => {
                const newDist = prev + dist;
                // Update pace tracking window
                paceUpdateRef.current.distance += dist;
                return newDist;
              });
              lastCoordsRef.current = point;
            }
          } else {
            setRouteCoords((prev) => [...prev, point]);
            lastCoordsRef.current = point;
          }

          // Calculate current pace (min/km) over a rolling window
          paceUpdateRef.current.time += GPS_CONFIG.TRACK_INTERVAL_MS / 1000;
          if (paceUpdateRef.current.distance > 0.01) {
            const paceMinPerKm =
              (paceUpdateRef.current.time / 60) / paceUpdateRef.current.distance;
            setCurrentPace(paceMinPerKm);
          }
        }
      );
    } catch (error) {
      console.error('GPS error:', error);
      setGpsStatus('Error');
    }
  }, [elapsedTime]);

  // Timer
  const startTimer = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
      // Simulate heart rate variation
      setHeartRate((prev) => {
        const hrVariation = Math.floor(Math.random() * 5) - 2;
        const next = Math.max(100, Math.min(185, prev + hrVariation));
        const zone = next >= 175 ? 5 : next >= 160 ? 4 : next >= 145 ? 3 : next >= 130 ? 2 : 1;
        setHeartRateZone(zone);
        return next;
      });
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
    return () => {
      stopTimer();
      if (subscriptionRef.current) {
        subscriptionRef.current.remove();
      }
    };
  }, []);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleTogglePlay = () => {
    if (isRunning) {
      stopTimer();
      // Don't stop GPS tracking, keep location but pause stats
    } else {
      startTimer();
    }
    setIsRunning(!isRunning);
  };

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
    const runs = await getRuns() || [];
    const avgPace = totalDistance > 0 ? (elapsedTime / 60) / totalDistance : 0;
    const newRun = {
      id: Date.now(),
      date: new Date().toISOString(),
      duration: elapsedTime,
      distance: totalDistance,
      pace: avgPace,
      heartRate,
      workoutType,
      raceGoal,
      route: routeCoords, // Full GPS route
      gpsTracked: true,
    };
    await saveRuns([newRun, ...runs]);
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

  const getZoneColor = (zone) => {
    const colors = ['#94A3B8', '#10B981', '#F59E0B', '#F97316', '#EF4444'];
    return colors[zone - 1] || colors[0];
  };

  // Average pace for display
  const displayPace = totalDistance > 0
    ? (elapsedTime / 60) / totalDistance
    : currentPace || 0;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Map Background */}
      {region ? (
        MapComponent ? (
          <MapComponent
            style={StyleSheet.absoluteFillObject}
            initialRegion={region}
            showsUserLocation={true}
            followsUserLocation={true}
            showsMyLocationButton={false}
            toolbarEnabled={false}
            mapType="standard"
            customMapStyle={darkMapStyle}
          >
            {routeCoords.length > 1 && (
              <PolylineComponent
                coordinates={routeCoords}
                strokeColor="#2563EB"
                strokeWidth={5}
                lineJoin="round"
                lineCap="round"
              />
            )}
          </MapComponent>
        ) : (
          <View style={styles.loadingMap}>
            <Text style={styles.loadingText}>📍 GPS Locked</Text>
            <Text style={styles.loadingSub}>Map view requires mobile device</Text>
          </View>
        )
      ) : (
        <View style={styles.loadingMap}>
          <Text style={styles.loadingText}>Acquiring GPS signal...</Text>
          <Text style={styles.loadingSub}>Please ensure you're outdoors</Text>
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
            <View style={[
              styles.gpsDot,
              { backgroundColor: gpsStatus === 'Locked' ? COLORS.success : gpsStatus === 'Error' ? '#EF4444' : '#F59E0B' }
            ]} />
            <Text style={[
              styles.gpsText,
              { color: gpsStatus === 'Locked' ? COLORS.success : gpsStatus === 'Error' ? '#EF4444' : '#F59E0B' }
            ]}>
              {gpsStatus === 'Locked' ? 'GPS' : gpsStatus === 'Searching' ? 'Searching' : 'No Signal'}
            </Text>
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
              {displayPace > 0 ? displayPace.toFixed(1) : '--'}
            </Text>
            <Text style={styles.primaryStatUnit}>min/km</Text>
          </View>
        </View>

        {/* Heart Rate */}
        <View style={styles.hrRow}>
          <Text style={styles.hrEmoji}>❤️</Text>
          <Text style={styles.hrValue}>{heartRate}</Text>
          <Text style={styles.hrUnit}>BPM</Text>
          <View style={styles.zoneIndicator}>
            {[1, 2, 3, 4, 5].map((z) => (
              <View
                key={z}
                style={[
                  styles.zoneSegment,
                  { backgroundColor: z <= heartRateZone ? getZoneColor(z) : 'rgba(255,255,255,0.15)' }
                ]}
              />
            ))}
          </View>
          <Text style={[styles.zoneText, { color: getZoneColor(heartRateZone) }]}>
            Z{heartRateZone}
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
