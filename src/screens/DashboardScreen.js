// src/screens/DashboardScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { COLORS, ACHIEVEMENTS } from '../utils/constants';
import { getRuns, getAchievements } from '../utils/storage';

const DashboardScreen = ({ navigation, user }) => {
  const [weeklyStats, setWeeklyStats] = useState({ distance: 0, time: 0, runs: 0 });
  const [recentAchievements, setRecentAchievements] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const runs = await getRuns() || [];
    const achievements = await getAchievements() || [];
    
    // Calculate weekly stats
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thisWeekRuns = runs.filter(r => new Date(r.date) >= weekAgo);
    
    const distance = thisWeekRuns.reduce((sum, r) => sum + (r.distance || 0), 0);
    const time = thisWeekRuns.reduce((sum, r) => sum + (r.duration || 0), 0);
    
    setWeeklyStats({
      distance: (distance / 1000).toFixed(1), // km
      time: Math.floor(time / 60), // minutes
      runs: thisWeekRuns.length,
    });

    // Get recent achievements
    const recent = achievements.slice(0, 2);
    setRecentAchievements(recent);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.greeting}>Hi, {user?.name || 'Runner'}! 👋</Text>
        </View>

        <TouchableOpacity style={styles.startCard} onPress={() => navigation.navigate('Generate')}>
          <Text style={styles.startTitle}>Next Run</Text>
          <Text style={styles.startSubtitle}>Ready to go?</Text>
          <View style={styles.startButton}>
            <Text style={styles.startButtonText}>START RUN</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>This Week</Text>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{weeklyStats.distance}</Text>
              <Text style={styles.statLabel}>km</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{weeklyStats.time}</Text>
              <Text style={styles.statLabel}>min</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{weeklyStats.runs}</Text>
              <Text style={styles.statLabel}>runs</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Achievements</Text>
          {recentAchievements.length > 0 ? (
            recentAchievements.map((ach, index) => (
              <View key={index} style={styles.achievementCard}>
                <Text style={styles.achievementIcon}>{ach.icon}</Text>
                <Text style={styles.achievementName}>{ach.name}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No achievements yet. Start running!</Text>
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
  header: {
    padding: 20,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  startCard: {
    margin: 20,
    marginTop: 0,
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: 24,
  },
  startTitle: {
    fontSize: 20,
    color: COLORS.surface,
    fontWeight: 'bold',
  },
  startSubtitle: {
    fontSize: 14,
    color: COLORS.surface,
    opacity: 0.8,
    marginTop: 4,
  },
  startButton: {
    backgroundColor: COLORS.secondary,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  startButtonText: {
    color: COLORS.surface,
    fontWeight: 'bold',
    fontSize: 16,
  },
  section: {
    padding: 20,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  achievementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  achievementIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  achievementName: {
    fontSize: 16,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  emptyText: {
    color: COLORS.textSecondary,
    textAlign: 'center',
    padding: 20,
  },
});

export default DashboardScreen;
