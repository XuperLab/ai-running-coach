// src/screens/HistoryScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { COLORS } from '../utils/constants';
import { getRuns } from '../utils/storage';
import { useFocusEffect } from '@react-navigation/native';

const HistoryScreen = () => {
  const [runs, setRuns] = useState([]);
  const [viewMode, setViewMode] = useState('Week');
  const [summary, setSummary] = useState({ totalDistance: '0.0', totalTime: 0, avgPace: '0.0', runCount: 0 });

  const loadRuns = async () => {
    const allRuns = await getRuns() || [];
    setRuns(allRuns);

    // Filter by view mode
    const now = new Date();
    let startDate;
    switch (viewMode) {
      case 'Week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'Month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'Year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    const filteredRuns = allRuns.filter(r => new Date(r.date) >= startDate);
    
    const totalDistance = filteredRuns.reduce((sum, r) => sum + (r.distance || 0), 0); // km
    const totalTime = filteredRuns.reduce((sum, r) => sum + (r.duration || 0), 0); // seconds
    const avgPace = totalDistance > 0 ? (totalTime / 60) / totalDistance : 0;

    setSummary({
      totalDistance: totalDistance.toFixed(1),
      totalTime: Math.floor(totalTime / 60),
      avgPace: avgPace.toFixed(1),
      runCount: filteredRuns.length,
    });
  };

  useFocusEffect(
    useCallback(() => {
      loadRuns();
    }, [viewMode])
  );

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>History</Text>
          <View style={styles.toggle}>
            {['Week', 'Month', 'Year'].map((mode) => (
              <TouchableOpacity
                key={mode}
                style={[styles.toggleButton, viewMode === mode && styles.toggleButtonActive]}
                onPress={() => setViewMode(mode)}
              >
                <Text style={[styles.toggleText, viewMode === mode && styles.toggleTextActive]}>{mode}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCardLarge}>
            <Text style={styles.statLabelMuted}>TOTAL DISTANCE</Text>
            <View style={styles.statValueRow}>
              <Text style={styles.statValueLarge}>{summary.totalDistance}</Text>
              <Text style={styles.statUnitLarge}>km</Text>
            </View>
          </View>
          <View style={styles.statsRowSmall}>
            <View style={styles.statCardSmall}>
              <Text style={styles.statLabelSmall}>Time</Text>
              <Text style={styles.statValueSmall}>{summary.totalTime}m</Text>
            </View>
            <View style={styles.statCardSmall}>
              <Text style={styles.statLabelSmall}>Avg Pace</Text>
              <Text style={styles.statValueSmall}>{summary.avgPace}</Text>
            </View>
            <View style={styles.statCardSmall}>
              <Text style={styles.statLabelSmall}>Runs</Text>
              <Text style={styles.statValueSmall}>{summary.runCount}</Text>
            </View>
          </View>
        </View>

        {/* Run List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Sessions</Text>
          {runs.length > 0 ? (
            runs.slice().reverse().map((run) => (
              <TouchableOpacity key={run.id} style={styles.runCard} activeOpacity={0.7}>
                <View style={styles.runIconBox}>
                  <Text style={styles.runEmoji}>🏃</Text>
                </View>
                <View style={styles.runMainInfo}>
                  <View style={styles.runHeader}>
                    <Text style={styles.runDate}>{formatDate(run.date)}</Text>
                    <Text style={styles.runDuration}>{formatDuration(run.duration || 0)}</Text>
                  </View>
                  <Text style={styles.runType}>{run.workoutType || 'Easy Run'}</Text>
                  <View style={styles.runDetails}>
                    <Text style={styles.runDetailItem}>{(run.distance || 0).toFixed(2)} km</Text>
                    <Text style={styles.dot}> • </Text>
                    <Text style={styles.runDetailItem}>{run.heartRate || '--'} bpm</Text>
                  </View>
                </View>
                <Text style={styles.chevron}>›</Text>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyEmoji}>📔</Text>
              <Text style={styles.emptyText}>No training logs yet.</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    padding: 24,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 20,
    letterSpacing: -1,
  },
  toggle: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 14,
    padding: 4,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  toggleButtonActive: {
    backgroundColor: COLORS.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  toggleText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  toggleTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  statsGrid: {
    padding: 20,
  },
  statCardLarge: {
    backgroundColor: COLORS.primary,
    borderRadius: 24,
    padding: 24,
    marginBottom: 12,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  statLabelMuted: {
    fontSize: 12,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.6)',
    letterSpacing: 1,
    marginBottom: 4,
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  statValueLarge: {
    fontSize: 48,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  statUnitLarge: {
    fontSize: 20,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
    marginLeft: 6,
  },
  statsRowSmall: {
    flexDirection: 'row',
    gap: 12,
  },
  statCardSmall: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statLabelSmall: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  statValueSmall: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 16,
    marginLeft: 4,
  },
  runCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  runIconBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: COLORS.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  runEmoji: {
    fontSize: 24,
  },
  runMainInfo: {
    flex: 1,
  },
  runHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  runDate: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  runDuration: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  runType: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '600',
    marginBottom: 4,
  },
  runDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  runDetailItem: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  dot: {
    color: COLORS.textMuted,
  },
  chevron: {
    fontSize: 24,
    color: COLORS.textMuted,
    marginLeft: 8,
  },
  emptyBox: {
    alignItems: 'center',
    padding: 60,
  },
  emptyEmoji: {
    fontSize: 48,
    opacity: 0.2,
    marginBottom: 16,
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 15,
    fontWeight: '500',
  }
});

export default HistoryScreen;
