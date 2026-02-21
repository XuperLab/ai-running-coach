// src/screens/HistoryScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { COLORS } from '../utils/constants';
import { getRuns } from '../utils/storage';

const HistoryScreen = () => {
  const [runs, setRuns] = useState([]);
  const [viewMode, setViewMode] = useState('Week');
  const [summary, setSummary] = useState({ totalDistance: 0, totalTime: 0, avgPace: 0, runCount: 0 });

  useEffect(() => {
    loadRuns();
  }, [viewMode]);

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
    
    const totalDistance = filteredRuns.reduce((sum, r) => sum + (r.distance || 0), 0) / 1000; // km
    const totalTime = filteredRuns.reduce((sum, r) => sum + (r.duration || 0), 0); // seconds
    const avgPace = totalDistance > 0 ? (totalTime / 60) / totalDistance : 0;

    setSummary({
      totalDistance: totalDistance.toFixed(1),
      totalTime: Math.floor(totalTime / 60),
      avgPace: avgPace.toFixed(1),
      runCount: filteredRuns.length,
    });
  };

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
      <ScrollView>
        <Text style={styles.title}>Training History</Text>

        {/* View Toggle */}
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

        {/* Summary Chart (Simplified) */}
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>{viewMode} Summary</Text>
          <View style={styles.chart}>
            <View style={styles.chartBar}>
              <View style={[styles.bar, { height: `${Math.min(summary.totalDistance * 10, 100)}%` }]} />
            </View>
            <Text style={styles.chartLabel}>Distance</Text>
          </View>
          <View style={styles.chart}>
            <View style={styles.chartBar}>
              <View style={[styles.bar, { height: `${Math.min(summary.totalTime / 10, 100)}%` }]} />
            </View>
            <Text style={styles.chartLabel}>Time</Text>
          </View>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{summary.totalDistance}</Text>
            <Text style={styles.statLabel}>km</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{summary.totalTime}</Text>
            <Text style={styles.statLabel}>min</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{summary.avgPace}</Text>
            <Text style={styles.statLabel}>min/km</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{summary.runCount}</Text>
            <Text style={styles.statLabel}>runs</Text>
          </View>
        </View>

        {/* Run List */}
        <Text style={styles.sectionTitle}>Recent Runs</Text>
        {runs.length > 0 ? (
          runs.slice(0, 10).map((run) => (
            <View key={run.id} style={styles.runCard}>
              <View style={styles.runHeader}>
                <Text style={styles.runDate}>{formatDate(run.date)}</Text>
                <Text style={styles.runType}>{run.workoutType || 'Easy Run'}</Text>
              </View>
              <View style={styles.runStats}>
                <Text style={styles.runStat}>🏃 {(run.distance || 0).toFixed(2)} km</Text>
                <Text style={styles.runStat}>⏱️ {formatDuration(run.duration || 0)}</Text>
                <Text style={styles.runStat}>❤️ {run.heartRate || '--'} bpm</Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No runs yet. Start your first run!</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 20,
  },
  toggle: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
  },
  toggleButtonActive: {
    backgroundColor: COLORS.primary,
  },
  toggleText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  toggleTextActive: {
    color: COLORS.surface,
  },
  chartContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  chartTitle: {
    position: 'absolute',
    top: 16,
    left: 20,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  chart: {
    alignItems: 'center',
    marginTop: 20,
  },
  chartBar: {
    width: 40,
    height: 80,
    backgroundColor: COLORS.border,
    borderRadius: 8,
    justifyContent: 'flex-end',
  },
  bar: {
    width: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 8,
  },
  chartLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 8,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  runCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  runHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  runDate: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  runType: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  runStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  runStat: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  emptyText: {
    textAlign: 'center',
    color: COLORS.textSecondary,
    padding: 40,
  },
});

export default HistoryScreen;
