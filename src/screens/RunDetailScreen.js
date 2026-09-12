// src/screens/RunDetailScreen.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar, Platform, Dimensions } from 'react-native';
import { COLORS } from '../utils/constants';
import { getMapView, getPolyline, getMarker } from '../utils/mapHelper';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const RunDetailScreen = ({ navigation, route }) => {
  const { run } = route.params;

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const hasRoute = run.route && run.route.length > 1;

  // Calculate region to fit all route points
  const getRegion = () => {
    if (!hasRoute) {
      return {
        latitude: 22.3193,
        longitude: 114.1694,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };
    }
    const lats = run.route.map((p) => p.latitude);
    const lngs = run.route.map((p) => p.longitude);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const latDelta = (maxLat - minLat) * 1.3 || 0.01;
    const lngDelta = (maxLng - minLng) * 1.3 || 0.01;
    return {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: Math.max(latDelta, 0.005),
      longitudeDelta: Math.max(lngDelta, 0.005),
    };
  };

  const renderMap = () => {
    if (!hasRoute) {
      return (
        <View style={styles.noRouteContainer}>
          <Text style={styles.noRouteEmoji}>🗺️</Text>
          <Text style={styles.noRouteText}>No GPS route recorded for this session</Text>
          <Text style={styles.noRouteSub}>This run was created before GPS tracking was added</Text>
        </View>
      );
    }
    const MapView = getMapView();
    const Polyline = getPolyline();
    const Marker = getMarker();
    if (!MapView) {
      return (
        <View style={styles.noRouteContainer}>
          <Text style={styles.noRouteEmoji}>📍</Text>
          <Text style={styles.noRouteText}>Route recorded ({run.route.length} points)</Text>
          <Text style={styles.noRouteSub}>Open on mobile to view the map</Text>
        </View>
      );
    }
    return (
      <MapView
        style={styles.map}
        initialRegion={getRegion()}
        scrollEnabled={true}
        zoomEnabled={true}
        mapType="standard"
      >
        {Polyline && (
          <Polyline
            coordinates={run.route}
            strokeColor={COLORS.primary}
            strokeWidth={4}
            lineJoin="round"
            lineCap="round"
          />
        )}
        {Marker && (
          <>
            <Marker
              coordinate={run.route[0]}
              title="Start"
              pinColor={COLORS.success}
            />
            <Marker
              coordinate={run.route[run.route.length - 1]}
              title="Finish"
              pinColor="#EF4444"
            />
          </>
        )}
      </MapView>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{run.workoutType || 'Run'}</Text>
          <Text style={styles.headerDate}>{formatDate(run.date)}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Map */}
      <View style={styles.mapContainer}>
        {renderMap()}
      </View>

      {/* Stats */}
      <View style={styles.statsPanel}>
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Duration</Text>
            <Text style={styles.statValue}>{formatTime(run.duration || 0)}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Distance</Text>
            <Text style={styles.statValue}>{(run.distance || 0).toFixed(2)}</Text>
            <Text style={styles.statUnit}>km</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Pace</Text>
            <Text style={styles.statValue}>
              {run.pace > 0 ? run.pace.toFixed(1) : '--'}
            </Text>
            <Text style={styles.statUnit}>min/km</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>HR</Text>
            <Text style={[styles.statValue, run.heartRate == null && styles.statUnknown]}>
              {run.heartRate != null ? String(run.heartRate) : '—'}
            </Text>
            <Text style={styles.statUnit}>{run.heartRate != null ? 'bpm' : 'no source'}</Text>
          </View>
        </View>

        {run.gpsTracked && hasRoute && getMapView() && (
          <View style={styles.gpsBadge}>
            <View style={styles.gpsDot} />
            <Text style={styles.gpsBadgeText}>GPS Tracked · {run.route.length} points</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 24,
    color: COLORS.textPrimary,
    fontWeight: '300',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  headerDate: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  mapContainer: {
    height: 300,
    width: '100%',
  },
  map: {
    flex: 1,
  },
  noRouteContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceAlt,
  },
  noRouteEmoji: {
    fontSize: 48,
    marginBottom: 16,
    opacity: 0.4,
  },
  noRouteText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  noRouteSub: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  statsPanel: {
    backgroundColor: COLORS.surface,
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  statUnknown: {
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  statUnit: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  gpsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    paddingVertical: 10,
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
  },
  gpsDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.success,
    marginRight: 8,
  },
  gpsBadgeText: {
    fontSize: 13,
    color: COLORS.success,
    fontWeight: '600',
  },
});

export default RunDetailScreen;
