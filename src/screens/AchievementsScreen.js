// src/screens/AchievementsScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, StatusBar } from 'react-native';
import { COLORS, ACHIEVEMENTS } from '../utils/constants';
import { getRuns, saveAchievements } from '../utils/storage';
import { useFocusEffect } from '@react-navigation/native';

const AchievementsScreen = () => {
  const [achievements, setAchievements] = useState([]);
  const [earnedCount, setEarnedCount] = useState(0);

  const calculateAchievements = async () => {
    const runs = await getRuns() || [];
    const earnedIds = [];
    
    const totalDistance = runs.reduce((sum, r) => sum + (r.distance || 0), 0); // km
    const totalRuns = runs.length;
    
    // Check milestones
    if (totalRuns >= 1) earnedIds.push('first_run');
    if (totalDistance >= 5) earnedIds.push('5k');
    if (totalDistance >= 10) earnedIds.push('10k');
    if (totalDistance >= 42) earnedIds.push('marathon');
    
    // Check streaks (simplified)
    if (totalRuns >= 3) earnedIds.push('streak_3');
    if (totalRuns >= 7) earnedIds.push('streak_7');

    const allAchievements = ACHIEVEMENTS.map(ach => {
      const isEarned = earnedIds.includes(ach.id);
      
      let progress = 0;
      let progressText = '';
      
      switch (ach.id) {
        case 'first_run':
          progress = Math.min(100, (totalRuns / 1) * 100);
          progressText = `${totalRuns}/1 runs`;
          break;
        case '5k':
          progress = Math.min(100, (totalDistance / 5) * 100);
          progressText = `${totalDistance.toFixed(1)}/5 km`;
          break;
        case '10k':
          progress = Math.min(100, (totalDistance / 10) * 100);
          progressText = `${totalDistance.toFixed(1)}/10 km`;
          break;
        case 'marathon':
          progress = Math.min(100, (totalDistance / 42) * 100);
          progressText = `${totalDistance.toFixed(1)}/42 km`;
          break;
        default:
          progress = 0;
          progressText = isEarned ? 'Completed' : 'Locked';
      }
      
      return { ...ach, earned: isEarned, progress, progressText };
    });

    setAchievements(allAchievements);
    setEarnedCount(earnedIds.length);
    await saveAchievements(allAchievements);
  };

  useFocusEffect(
    useCallback(() => {
      calculateAchievements();
    }, [])
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Achievements</Text>
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{earnedCount}</Text>
              <Text style={styles.statLabel}>UNLOCKED</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{ACHIEVEMENTS.length - earnedCount}</Text>
              <Text style={styles.statLabel}>REMAINING</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.grid}>
            {achievements.map((ach) => (
              <View key={ach.id} style={[styles.badgeCard, !ach.earned && styles.badgeLocked]}>
                <View style={[styles.iconBox, ach.earned && styles.iconBoxEarned]}>
                  <Text style={[styles.icon, !ach.earned && styles.iconLocked]}>
                    {ach.earned ? ach.icon : '🔒'}
                  </Text>
                </View>
                <Text style={styles.badgeName}>{ach.name}</Text>
                <Text style={styles.badgeDesc} numberOfLines={2}>{ach.description}</Text>
                
                {!ach.earned && (
                  <View style={styles.progressContainer}>
                    <View style={styles.progressHeader}>
                      <Text style={styles.progressText}>{ach.progressText}</Text>
                      <Text style={styles.progressPercent}>{Math.floor(ach.progress)}%</Text>
                    </View>
                    <View style={styles.progressBar}>
                      <View style={[styles.progressFill, { width: `${ach.progress}%` }]} />
                    </View>
                  </View>
                )}
                
                {ach.earned && (
                  <View style={styles.earnedBadge}>
                    <Text style={styles.earnedText}>UNLOCKED</Text>
                  </View>
                )}
              </View>
            ))}
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
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textMuted,
    marginTop: 2,
    letterSpacing: 0.5,
  },
  section: {
    padding: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  badgeCard: {
    width: '48%',
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  badgeLocked: {
    backgroundColor: COLORS.background,
    borderColor: 'transparent',
  },
  iconBox: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconBoxEarned: {
    backgroundColor: '#EFF6FF',
  },
  icon: {
    fontSize: 32,
  },
  iconLocked: {
    fontSize: 24,
    opacity: 0.3,
  },
  badgeName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 4,
  },
  badgeDesc: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 12,
    height: 32,
  },
  progressContainer: {
    width: '100%',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  progressPercent: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  progressBar: {
    height: 6,
    backgroundColor: COLORS.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
  },
  earnedBadge: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  earnedText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.success,
    letterSpacing: 0.5,
  },
});

export default AchievementsScreen;
