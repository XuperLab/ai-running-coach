// src/screens/AchievementsScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { COLORS, ACHIEVEMENTS } from '../utils/constants';
import { getRuns, getAchievements, saveAchievements } from '../utils/storage';

const AchievementsScreen = () => {
  const [achievements, setAchievements] = useState([]);
  const [earnedCount, setEarnedCount] = useState(0);

  useEffect(() => {
    calculateAchievements();
  }, []);

  const calculateAchievements = async () => {
    const runs = await getRuns() || [];
    const earned = [];
    
    const totalDistance = runs.reduce((sum, r) => sum + (r.distance || 0), 0) / 1000; // km
    const totalRuns = runs.length;
    
    // Check each achievement
    if (totalRuns >= 1) {
      earned.push({ ...ACHIEVEMENTS[0], earned: true }); // First Run
    }
    if (totalDistance >= 5) {
      earned.push({ ...ACHIEVEMENTS[1], earned: true }); // 5K
    }
    if (totalDistance >= 10) {
      earned.push({ ...ACHIEVEMENTS[2], earned: true }); // 10K
    }
    if (totalDistance >= 42) {
      earned.push({ ...ACHIEVEMENTS[3], earned: true }); // Marathon
    }
    
    // Check streaks
    if (runs.length >= 3) {
      earned.push({ ...ACHIEVEMENTS[4], earned: true }); // 3 Day Streak
    }
    if (runs.length >= 7) {
      earned.push({ ...ACHIEVEMENTS[5], earned: true }); // 7 Day Streak
    }

    // Set achievement progress for unearned
    const allAchievements = ACHIEVEMENTS.map(ach => {
      const existing = earned.find(e => e.id === ach.id);
      if (existing) return existing;
      
      // Add progress info
      let progress = 0;
      let progressText = '';
      
      switch (ach.id) {
        case 'first_run':
          progress = (totalRuns / 1) * 100;
          progressText = `${totalRuns}/1 runs`;
          break;
        case '5k':
          progress = (totalDistance / 5) * 100;
          progressText = `${totalDistance.toFixed(1)}/5 km`;
          break;
        case '10k':
          progress = (totalDistance / 10) * 100;
          progressText = `${totalDistance.toFixed(1)}/10 km`;
          break;
        case 'marathon':
          progress = (totalDistance / 42) * 100;
          progressText = `${totalDistance.toFixed(1)}/42 km`;
          break;
        default:
          progress = 0;
          progressText = 'Coming soon';
      }
      
      return { ...ach, earned: false, progress, progressText };
    });

    setAchievements(allAchievements);
    setEarnedCount(earned.length);
    await saveAchievements(allAchievements);
  };

  const categories = [
    { title: '🏃 Milestones', ids: ['first_run', '5k', '10k', 'marathon'] },
    { title: '🔥 Streaks', ids: ['streak_3', 'streak_7'] },
    { title: '⛰️ Challenges', ids: ['early_bird', 'hill_master'] },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <Text style={styles.title}>Achievements</Text>
        
        <View style={styles.progressCard}>
          <Text style={styles.progressText}>🔵 {earnedCount} / {ACHIEVEMENTS.length} Earned</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${(earnedCount / ACHIEVEMENTS.length) * 100}%` }]} />
          </View>
        </View>

        {categories.map((category) => (
          <View key={category.title} style={styles.category}>
            <Text style={styles.categoryTitle}>{category.title}</Text>
            <View style={styles.badgeGrid}>
              {category.ids.map((id) => {
                const achievement = achievements.find(a => a.id === id) || ACHIEVEMENTS.find(a => a.id === id);
                return (
                  <View
                    key={id}
                    style={[styles.badge, !achievement?.earned && styles.badgeLocked]}
                  >
                    <Text style={styles.badgeIcon}>
                      {achievement?.earned ? achievement.icon : '🔒'}
                    </Text>
                    <Text style={[styles.badgeName, !achievement?.earned && styles.badgeNameLocked]}>
                      {achievement?.name || 'Unknown'}
                    </Text>
                    {!achievement?.earned && achievement?.progress > 0 && (
                      <Text style={styles.badgeProgress}>{achievement.progressText}</Text>
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        ))}
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
  progressCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  progressText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 12,
    textAlign: 'center',
  },
  progressBar: {
    height: 8,
    backgroundColor: COLORS.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
  category: {
    marginBottom: 24,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  badge: {
    width: '47%',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  badgeLocked: {
    opacity: 0.6,
  },
  badgeIcon: {
    fontSize: 36,
    marginBottom: 8,
  },
  badgeName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  badgeNameLocked: {
    color: COLORS.textSecondary,
  },
  badgeProgress: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
});

export default AchievementsScreen;
