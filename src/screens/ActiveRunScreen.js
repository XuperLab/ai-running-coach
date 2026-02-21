// src/screens/ActiveRunScreen.js
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Alert } from 'react-native';
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
    intervalRef.current = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
      setDistance((prev) => prev + (Math.random() * 0.015 + 0.008));
      setPace((prev) => prev + (Math.random() * 0.4 - 0.2));
      const hrVariation = Math.floor(Math.random() * 10) - 5;
      setHeartRate((prev) => Math.max(100, Math.min(180, prev + hrVariation)));
      const zone = heartRate >= 160 ? 5 : heartRate >= 140 ? 4 : heartRate >= 120 ? 3 : heartRate >= 100 ? 2 : 1;
      setHeartRateZone(zone);
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePause = () => {
    if (isRunning) {
      clearInterval(intervalRef.current);
    } else {
      intervalRef.current = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
        setDistance((prev) => prev + (Math.random() * 0.015 + 0.008));
        setPace((prev) => prev + (Math.random() * 0.4 - 0.2));
        const hrVariation = Math.floor(Math.random() * 10) - 5;
        setHeartRate((prev) => Math.max(100, Math.min(180, prev + hrVariation)));
        const zone = heartRate >= 160 ? 5 : heartRate >= 140 ? 4 : heartRate >= 120 ? 3 : heartRate >= 100 ? 2 : 1;
        setHeartRateZone(zone);
      }, 1000);
    }
    setIsRunning(!isRunning);
  };

  const handleStop = () => {
    Alert.alert(
      'End Run',
      'Are you sure you want to end this run?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'End Run', onPress: handleSaveRun },
      ]
    );
  };

  const handleSaveRun = async () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    const runs = await getRuns() || [];
    const newRun = {
      id: Date.now(),
      date: new Date().toISOString(),
      duration: elapsedTime,
      distance: distance,
      pace: pace > 0 ? pace : 5,
      heartRate: heartRate,
      workoutType,
      raceGoal,
    };
    
    await saveRuns([newRun, ...runs]);
    navigation.navigate('Dashboard');
  };

  const getZoneColor = (zone) => {
    const colors = ['#94A3B8', '#10B981', '#F59E0B', '#F97316', '#EF4444'];
    return colors[zone - 1] || colors[0];
  };

  const renderZoneSegments = () => {
    const segments = [];
    for (let i = 1; i <= 5; i++) {
      segments.push(
        <View
          key={i}
          style={[
            styles.zoneSegment,
            { backgroundColor: getZoneColor(i) },
            i <= heartRateZone ? styles.zoneActive : null,
          ]}
        />
      );
    }
    return segments;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.status}>🏃 {isRunning ? 'Running' : 'Paused'}</Text>
        <TouchableOpacity onPress={handlePause}>
          <Text style={styles.pauseButton}>{isRunning ? '⏸️' : '▶️'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.timerContainer}>
        <Text style={styles.timer}>{formatTime(elapsedTime)}</Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{distance.toFixed(2)}</Text>
          <Text style={styles.statLabel}>km</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{pace > 0 ? pace.toFixed(1) : '--'}</Text>
          <Text style={styles.statLabel}>min/km</Text>
        </View>
      </View>

      <View style={styles.hrContainer}>
        <Text style={styles.hrLabel}>❤️ {heartRate} bpm</Text>
        <View style={styles.zoneBar}>
          {renderZoneSegments()}
        </View>
        <Text style={styles.zoneLabel}>Zone {heartRateZone}</Text>
      </View>

      <View style={styles.sessionInfo}>
        <Text style={styles.infoText}>🎯 {workoutType || 'Easy Run'}</Text>
        <Text style={styles.infoText}>🎵 {musicGenre || 'None'}</Text>
        <Text style={styles.infoText}>🗣️ {coachStyle || 'Motivational'}</Text>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity style={styles.stopButton} onPress={handleStop}>
          <Text style={styles.stopButtonText}>STOP</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  status: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  pauseButton: {
    fontSize: 32,
  },
  timerContainer: {
    alignItems: 'center',
    marginVertical: 30,
  },
  timer: {
    fontSize: 64,
    fontWeight: 'bold',
    color: COLORS.primary,
    fontVariant: ['tabular-nums'],
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 30,
  },
  statBox: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    minWidth: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  hrContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  hrLabel: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  zoneBar: {
    flexDirection: 'row',
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: COLORS.border,
  },
  zoneSegment: {
    flex: 1,
    marginHorizontal: 1,
    borderRadius: 4,
    opacity: 0.3,
  },
  zoneActive: {
    opacity: 1,
  },
  zoneLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  sessionInfo: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  infoText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginVertical: 4,
  },
  controls: {
    marginTop: 'auto',
  },
  stopButton: {
    backgroundColor: COLORS.error,
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
  },
  stopButtonText: {
    color: COLORS.surface,
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default ActiveRunScreen;
