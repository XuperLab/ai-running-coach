// src/screens/DashboardScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, RefreshControl, StatusBar, Dimensions } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import { COLORS } from '../utils/constants';
import { getRuns, getAchievements } from '../utils/storage';
import { useFocusEffect } from '@react-navigation/native';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const chartConfig = {
  backgroundGradientFrom: '#FFFFFF',
  backgroundGradientTo: '#FFFFFF',
  color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`,
  strokeWidth: 2,
  barPercentage: 0.6,
  decimalPlaces: 1,
  labelColor: () => COLORS.textMuted,
};

const DashboardScreen = ({ navigation, user }) => {
  const [weeklyStats, setWeeklyStats] = useState({ distance: '0.0', time: 0, runs: 0 });
  const [recentAchievements, setRecentAchievements] = useState([]);
  const [weekData, setWeekData] = useState({ labels: [], values: [] });
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const runs = await getRuns() || [];
      const achievements = await getAchievements() || [];

      // Calculate weekly stats
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const thisWeekRuns = runs.filter((r) => new Date(r.date) >= weekAgo);

      const distance = thisWeekRuns.reduce((sum, r) => sum + (r.distance || 0), 0); // km
      const time = thisWeekRuns.reduce((sum, r) => sum + (r.duration || 0), 0);

      setWeeklyStats({
        distance: distance.toFixed(1), // km (distance is stored in km)
        time: Math.floor(time / 60), // minutes
        runs: thisWeekRuns.length,
      });

      // Per-day distance for the last 7 days (for the weekly chart)
      const labels = [];
      const values = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        const dayStart = new Date(d);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(dayStart);
        dayEnd.setDate(dayStart.getDate() + 1);
        const dayDist = runs
          .filter((r) => {
            const rd = new Date(r.date);
            return rd >= dayStart && rd < dayEnd;
          })
          .reduce((s, r) => s + (r.distance || 0), 0);
        labels.push(DAY_LABELS[d.getDay()]);
        values.push(Number(dayDist.toFixed(2)));
      }
      setWeekData({ labels, values });

      // Get recent achievements (last 3)
      setRecentAchievements(achievements.slice(-3).reverse());
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const chartWidth = Dimensions.get('window').width - 48;
  // Only show the distance chart once there is real recorded distance to plot.
  const hasWeekData = weekData.values.some((v) => v > 0.05);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.greetingLabel}>Welcome back,</Text>
            <Text style={styles.greetingName}>{user?.name || 'Runner'} 👋</Text>
          </View>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => navigation.navigate('Profile')}
          >
            <Text style={styles.profileEmoji}>👤</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.heroCard}
          onPress={() => navigation.navigate('Generate')}
          activeOpacity={0.9}
        >
          <View style={styles.heroContent}>
            <Text style={styles.heroTag}>NEXT SESSION</Text>
            <Text style={styles.heroTitle}>Ready for your run?</Text>
            <Text style={styles.heroSubtitle}>Your AI coach has a personalized plan waiting for you.</Text>
            <View style={styles.heroButton}>
              <Text style={styles.heroButtonText}>Start Training</Text>
              <Text style={styles.heroButtonIcon}>→</Text>
            </View>
          </View>
          <View style={styles.heroIconContainer}>
            <Text style={styles.heroLargeIcon}>⚡</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Weekly Activity</Text>
            <TouchableOpacity onPress={() => navigation.navigate('History')}>
              <Text style={styles.sectionAction}>View All</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.statsGrid}>
            <View style={[styles.statBox, { backgroundColor: '#EFF6FF' }]}>
              <Text style={[styles.statValue, { color: COLORS.primary }]}>{weeklyStats.distance}</Text>
              <Text style={styles.statLabel}>Total KM</Text>
            </View>
            <View style={[styles.statBox, { backgroundColor: '#F0FDF4' }]}>
              <Text style={[styles.statValue, { color: COLORS.success }]}>{weeklyStats.time}</Text>
              <Text style={styles.statLabel}>Minutes</Text>
            </View>
            <View style={[styles.statBox, { backgroundColor: '#FFF7ED' }]}>
              <Text style={[styles.statValue, { color: COLORS.secondary }]}>{weeklyStats.runs}</Text>
              <Text style={styles.statLabel}>Sessions</Text>
            </View>
          </View>

          {hasWeekData ? (
            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>Distance this week (km)</Text>
              <BarChart
                data={{ labels: weekData.labels, datasets: [{ data: weekData.values }] }}
                width={chartWidth}
                height={180}
                chartConfig={chartConfig}
                style={styles.chart}
                fromZero
                showValuesOnTopOfBars
              />
            </View>
          ) : null}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Achievements</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Achievements')}>
              <Text style={styles.sectionAction}>See All</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.achievementsContainer}>
            {recentAchievements.length > 0 ? (
              recentAchievements.map((ach, index) => (
                <View key={index} style={styles.achievementItem}>
                  <View style={styles.achievementIconBox}>
                    <Text style={styles.achievementIcon}>{ach.icon}</Text>
                  </View>
                  <View style={styles.achievementInfo}>
                    <Text style={styles.achievementName}>{ach.name}</Text>
                    <Text style={styles.achievementDate}>Recently unlocked</Text>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyEmoji}>🏅</Text>
                <Text style={styles.emptyText}>Your first trophy is waiting. Start your journey today!</Text>
              </View>
            )}
          </View>
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
    paddingBottom: 32,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greetingLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
    marginBottom: 4,
  },
  greetingName: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  profileButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  profileEmoji: {
    fontSize: 20,
  },
  heroCard: {
    marginHorizontal: 24,
    backgroundColor: COLORS.primary,
    borderRadius: 24,
    padding: 24,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 8,
  },
  heroContent: {
    flex: 1,
    zIndex: 1,
  },
  heroTag: {
    fontSize: 12,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.7)',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  heroTitle: {
    fontSize: 22,
    color: '#FFFFFF',
    fontWeight: '700',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 20,
    marginBottom: 20,
  },
  heroButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  heroButtonText: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: 14,
    marginRight: 6,
  },
  heroButtonIcon: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  heroIconContainer: {
    position: 'absolute',
    right: -20,
    bottom: -20,
    opacity: 0.15,
  },
  heroLargeIcon: {
    fontSize: 120,
  },
  section: {
    paddingHorizontal: 24,
    marginTop: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  sectionAction: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statBox: {
    width: '31%',
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  chartCard: {
    marginTop: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  chart: {
    borderRadius: 12,
  },
  achievementsContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceAlt,
  },
  achievementIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: COLORS.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  achievementIcon: {
    fontSize: 24,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementName: {
    fontSize: 15,
    color: COLORS.textPrimary,
    fontWeight: '600',
    marginBottom: 2,
  },
  achievementDate: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  emptyCard: {
    padding: 24,
    alignItems: 'center',
  },
  emptyEmoji: {
    fontSize: 40,
    marginBottom: 12,
    opacity: 0.5,
  },
  emptyText: {
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
  },
});

export default DashboardScreen;
