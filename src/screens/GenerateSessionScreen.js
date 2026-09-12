// src/screens/GenerateSessionScreen.js
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, StatusBar } from 'react-native';
import { COLORS, WORKOUT_TYPES, RACE_GOALS, MUSIC_GENRES, COACH_STYLES } from '../utils/constants';

const OptionGroup = ({ label, options, selectedValue, onSelect, horizontal = true }) => (
  <View style={styles.section}>
    <Text style={styles.label}>{label}</Text>
    <View style={horizontal ? styles.optionsRow : styles.optionsColumn}>
      {options.map((option) => {
        const isActive = selectedValue === option;
        return (
          <TouchableOpacity
            key={option}
            activeOpacity={0.7}
            style={[
              styles.option,
              isActive && styles.optionActive,
              !horizontal && styles.optionFull
            ]}
            onPress={() => onSelect(option)}
          >
            <Text style={[styles.optionText, isActive && styles.optionTextActive]}>
              {option}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  </View>
);

const GenerateSessionScreen = ({ navigation }) => {
  const [duration, setDuration] = useState(30);
  const [workoutType, setWorkoutType] = useState('Easy Run');
  const [raceGoal, setRaceGoal] = useState('None');
  const [musicGenre, setMusicGenre] = useState('None');
  const [coachStyle, setCoachStyle] = useState('Motivational');

  const handleGenerate = () => {
    navigation.navigate('ActiveRun', {
      duration,
      workoutType,
      raceGoal,
      musicGenre,
      coachStyle,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Configure Session</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.introBox}>
          <Text style={styles.introTitle}>Customize Your Run</Text>
          <Text style={styles.introSubtitle}>Tell your AI coach what you're looking for today.</Text>
        </View>

        {/* Duration */}
        <View style={styles.section}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>Duration</Text>
            <Text style={styles.labelBadge}>{duration} min</Text>
          </View>
          <View style={styles.optionsRow}>
            {[15, 30, 45, 60, 90, 120].map((val) => {
              const isActive = duration === val;
              return (
                <TouchableOpacity
                  key={val}
                  activeOpacity={0.7}
                  style={[styles.durationOption, isActive && styles.durationOptionActive]}
                  onPress={() => setDuration(val)}
                >
                  <Text style={[styles.durationText, isActive && styles.durationTextActive]}>{val}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <OptionGroup
          label="Workout Type"
          options={WORKOUT_TYPES}
          selectedValue={workoutType}
          onSelect={setWorkoutType}
        />

        <OptionGroup
          label="Race Goal"
          options={RACE_GOALS}
          selectedValue={raceGoal}
          onSelect={setRaceGoal}
        />

        <OptionGroup
          label="Music Genre"
          options={MUSIC_GENRES}
          selectedValue={musicGenre}
          onSelect={setMusicGenre}
        />

        <OptionGroup
          label="Coach Voice Style"
          options={COACH_STYLES}
          selectedValue={coachStyle}
          onSelect={setCoachStyle}
          horizontal={false}
        />

        <View style={styles.footer}>
          <TouchableOpacity style={styles.generateButton} onPress={handleGenerate} activeOpacity={0.8}>
            <Text style={styles.generateButtonText}>Generate My Workout</Text>
          </TouchableOpacity>
          <Text style={styles.footerNote}>AI will tailor the pacing and cues based on your choices.</Text>
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 60,
  },
  introBox: {
    marginBottom: 32,
  },
  introTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  introSubtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  section: {
    marginBottom: 32,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  labelBadge: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    overflow: 'hidden',
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  optionsColumn: {
    gap: 12,
  },
  durationOption: {
    width: '30.33%',
    aspectRatio: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    margin: '1.5%',
  },
  durationOptionActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  durationText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  durationTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  option: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    margin: 6,
  },
  optionFull: {
    margin: 0,
    width: '100%',
  },
  optionActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  optionText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  optionTextActive: {
    color: '#FFFFFF',
  },
  footer: {
    marginTop: 16,
  },
  generateButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    paddingVertical: 20,
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    marginBottom: 16,
  },
  generateButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  footerNote: {
    textAlign: 'center',
    fontSize: 13,
    color: COLORS.textMuted,
    lineHeight: 18,
  },
});

export default GenerateSessionScreen;
