// src/screens/ActiveRunScreen.js
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Alert, StatusBar } from 'react-native';
import { COLORS } from '../utils/constants';
import { saveRuns, getRuns } from '../utils/storage';

const ActiveRunScreen = ({ navigation, route }) => {
  const { duration: targetDuration, workoutType, raceGoal, musicGenre, coachStyle } = route.params || {};
  const [isRunning, setIsRunning] = useState(true);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [distance, setDistance] = useState(0);
  const [pace, setPace] = useState(0);
  const [heartRate, setHeartRate] = useState(145);
  const [heartRateZone, setHeartRateZone] = useState(3);
  const intervalRef = useRef(null);

  useEffect(() => {
    startTimer();
    return () => stopTimer();
  }, []);

  const startTimer = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
      setDistance((prev) => prev + (Math.random() * 0.003 + 0.001)); // Realistic increment per sec
      // Simplified pace calculation for display
      setPace(6.5 + Math.random() * 0.5); 
      
      const hrVariation = Math.floor(Math.random() * 5) - 2;
      setHeartRate((prev) => {
        const next = Math.max(100, Math.min(185, prev + hrVariation));
        const zone = next >= 175 ? 5 : next >= 160 ? 4 : next >= 145 ? 3 : next >= 130 ? 2 : 1;
        setHeartRateZone(zone);
        return next;
      });
    }, 1000);
  };

  const stopTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleTogglePlay = () => {
    if (isRunning) {
      stopTimer();
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
    stopTimer();
    const runs = await getRuns() || [];
    const newRun = {
      id: Date.now(),
      date: new Date().toISOString(),
      duration: elapsedTime,
      distance: distance,
      pace: pace,
      heartRate: heartRate,
      workoutType,
      raceGoal,
    };
    await saveRuns([newRun, ...runs]);
    // Navigate back to the Dashboard inside the Main tab navigator
    navigation.navigate('Main', { screen: 'Dashboard' });
  };

  const handleBack = () => {
    if (elapsedTime > 10) { // If significant progress, ask before leaving
      Alert.alert(
        'Exit Workout?',
        'Your progress for this session will not be saved. Are you sure you want to leave?',
        [
          { text: 'Stay', style: 'cancel' },
          { 
            text: 'Exit', 
            style: 'destructive', 
            onPress: () => {
              stopTimer();
              navigation.navigate('Main', { screen: 'Dashboard' });
            } 
          },
        ]
      );
    } else {
      stopTimer();
      navigation.navigate('Main', { screen: 'Dashboard' });
    }
  };

  const getZoneColor = (zone) => {
    const colors = ['#94A3B8', '#10B981', '#F59E0B', '#F97316', '#EF4444'];
    return colors[zone - 1] || colors[0];
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <View style={styles.topBar}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.sessionBadge}>
          <Text style={styles.sessionBadgeText}>{workoutType || 'Free Run'}</Text>
        </View>
        <Text style={styles.gpsStatus}>● GPS Locked</Text>
      </View>

      <View style={styles.mainDisplay}>
        <Text style={styles.timerLabel}>DURATION</Text>
        <Text style={styles.timerValue}>{formatTime(elapsedTime)}</Text>
        
        <View style={styles.primaryStatsRow}>
          <View style={styles.primaryStatBox}>
            <Text style={styles.primaryStatValue}>{distance.toFixed(2)}</Text>
            <Text style={styles.primaryStatLabel}>KILOMETERS</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.primaryStatBox}>
            <Text style={styles.primaryStatValue}>{pace.toFixed(1)}</Text>
            <Text style={styles.primaryStatLabel}>PACE (MIN/KM)</Text>
          </View>
        </View>
      </View>

      <View style={styles.secondaryStatsGrid}>
        <View style={styles.secondaryCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardEmoji}>❤️</Text>
            <Text style={styles.cardTitle}>HEART RATE</Text>
          </View>
          <Text style={styles.hrValue}>{heartRate} <Text style={styles.hrUnit}>BPM</Text></Text>
          <View style={styles.zoneIndicator}>
            {[1, 2, 3, 4, 5].map((z) => (
              <View 
                key={z} 
                style={[
                  styles.zoneSegment, 
                  { backgroundColor: z <= heartRateZone ? getZoneColor(z) : COLORS.border }
                ]} 
              />
            ))}
          </View>
          <Text style={[styles.zoneText, { color: getZoneColor(heartRateZone) }]}>ZONE {heartRateZone}</Text>
        </View>

        <View style={styles.secondaryCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardEmoji}>🗣️</Text>
            <Text style={styles.cardTitle}>COACH STATUS</Text>
          </View>
          <Text style={styles.coachQuote}>"Keep this rhythm, you're looking strong!"</Text>
          <Text style={styles.coachMode}>{coachStyle} mode active</Text>
        </View>
      </View>

      <View style={styles.controlsContainer}>
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A', // Dark navy for high contrast
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
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
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  sessionBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  gpsStatus: {
    color: COLORS.success,
    fontSize: 12,
    fontWeight: '600',
  },
  mainDisplay: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  timerLabel: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 2,
  },
  timerValue: {
    color: '#FFFFFF',
    fontSize: 84,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    marginVertical: 10,
  },
  primaryStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    width: '100%',
    justifyContent: 'center',
  },
  primaryStatBox: {
    alignItems: 'center',
    width: '40%',
  },
  primaryStatValue: {
    color: '#FFFFFF',
    fontSize: 42,
    fontWeight: '700',
  },
  primaryStatLabel: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 11,
    fontWeight: '800',
    marginTop: 4,
  },
  divider: {
    width: 1,
    height: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  secondaryStatsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginTop: 10,
  },
  secondaryCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardEmoji: {
    fontSize: 14,
    marginRight: 6,
  },
  cardTitle: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 11,
    fontWeight: '800',
  },
  hrValue: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
  },
  hrUnit: {
    fontSize: 14,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  zoneIndicator: {
    flexDirection: 'row',
    height: 4,
    gap: 4,
    marginVertical: 12,
  },
  zoneSegment: {
    flex: 1,
    borderRadius: 2,
  },
  zoneText: {
    fontSize: 12,
    fontWeight: '800',
  },
  coachQuote: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
    marginBottom: 8,
  },
  coachMode: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 11,
    fontStyle: 'italic',
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 40,
    marginTop: 'auto',
    gap: 32,
  },
  controlButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
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
    fontSize: 32,
    color: '#0F172A',
  },
  stopButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 40,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  stopIcon: {
    color: '#EF4444',
    fontSize: 18,
    marginRight: 8,
  },
  stopLabel: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1,
  },
});

export default ActiveRunScreen;
