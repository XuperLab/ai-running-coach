// src/screens/GenerateSessionScreen.js
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { COLORS, WORKOUT_TYPES, RACE_GOALS, MUSIC_GENRES, COACH_STYLES } from '../utils/constants';

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
      <ScrollView>
        <Text style={styles.title}>Generate Session</Text>

        {/* Duration */}
        <View style={styles.section}>
          <Text style={styles.label}>Duration: {duration} min</Text>
          <View style={styles.sliderContainer}>
            {[15, 30, 45, 60, 90, 120].map((val) => (
              <TouchableOpacity
                key={val}
                style={[styles.sliderOption, duration === val && styles.sliderOptionActive]}
                onPress={() => setDuration(val)}
              >
                <Text style={[styles.sliderText, duration === val && styles.sliderTextActive]}>{val}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Workout Type */}
        <View style={styles.section}>
          <Text style={styles.label}>Workout Type</Text>
          <View style={styles.optionsRow}>
            {WORKOUT_TYPES.map((type) => (
              <TouchableOpacity
                key={type}
                style={[styles.option, workoutType === type && styles.optionActive]}
                onPress={() => setWorkoutType(type)}
              >
                <Text style={[styles.optionText, workoutType === type && styles.optionTextActive]}>{type}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Race Goal */}
        <View style={styles.section}>
          <Text style={styles.label}>Race Goal</Text>
          <View style={styles.optionsRow}>
            {RACE_GOALS.map((goal) => (
              <TouchableOpacity
                key={goal}
                style={[styles.option, raceGoal === goal && styles.optionActive]}
                onPress={() => setRaceGoal(goal)}
              >
                <Text style={[styles.optionText, raceGoal === goal && styles.optionTextActive]}>{goal}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Music Genre */}
        <View style={styles.section}>
          <Text style={styles.label}>Music Genre</Text>
          <View style={styles.optionsRow}>
            {MUSIC_GENRES.map((genre) => (
              <TouchableOpacity
                key={genre}
                style={[styles.option, musicGenre === genre && styles.optionActive]}
                onPress={() => setMusicGenre(genre)}
              >
                <Text style={[styles.optionText, musicGenre === genre && styles.optionTextActive]}>{genre}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Coach Style */}
        <View style={styles.section}>
          <Text style={styles.label}>Coach Style</Text>
          <View style={styles.optionsColumn}>
            {COACH_STYLES.map((style) => (
              <TouchableOpacity
                key={style}
                style={[styles.optionFull, coachStyle === style && styles.optionActive]}
                onPress={() => setCoachStyle(style)}
              >
                <Text style={[styles.optionText, coachStyle === style && styles.optionTextActive]}>{style}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Generate Button */}
        <TouchableOpacity style={styles.generateButton} onPress={handleGenerate}>
          <Text style={styles.generateButtonText}>GENERATE SESSION</Text>
        </TouchableOpacity>
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
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  sliderContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sliderOption: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sliderOptionActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  sliderText: {
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  sliderTextActive: {
    color: COLORS.surface,
    fontWeight: 'bold',
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionsColumn: {
    gap: 8,
  },
  option: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  optionFull: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  optionActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  optionText: {
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  optionTextActive: {
    color: COLORS.surface,
    fontWeight: '500',
  },
  generateButton: {
    backgroundColor: COLORS.secondary,
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  generateButtonText: {
    color: COLORS.surface,
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default GenerateSessionScreen;
