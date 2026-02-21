// src/screens/ProfileScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { COLORS, RUNNING_LEVELS } from '../utils/constants';
import { saveProfile, getProfile } from '../utils/storage';

const ProfileScreen = ({ user }) => {
  const [name, setName] = useState('');
  const [gender, setGender] = useState('');
  const [dob, setDob] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [level, setLevel] = useState('Beginner');
  const [units, setUnits] = useState('Metric');
  const [coachVoice, setCoachVoice] = useState('Motivational');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const profile = await getProfile();
    if (profile) {
      setName(profile.name || '');
      setGender(profile.gender || '');
      setDob(profile.dob || '');
      setWeight(profile.weight || '');
      setHeight(profile.height || '');
      setLevel(profile.level || 'Beginner');
      setUnits(profile.units || 'Metric');
      setCoachVoice(profile.coachVoice || 'Motivational');
    }
  };

  const handleSave = async () => {
    const profile = {
      name,
      gender,
      dob,
      weight,
      height,
      level,
      units,
      coachVoice,
    };
    await saveProfile(profile);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <Text style={styles.title}>Profile</Text>

        <View style={styles.avatarContainer}>
          <Text style={styles.avatar}>🏃</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Your name"
              placeholderTextColor={COLORS.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Gender</Text>
            <TextInput
              style={styles.input}
              value={gender}
              onChangeText={setGender}
              placeholder="Male/Female/Other"
              placeholderTextColor={COLORS.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Date of Birth</Text>
            <TextInput
              style={styles.input}
              value={dob}
              onChangeText={setDob}
              placeholder="DD/MM/YYYY"
              placeholderTextColor={COLORS.textSecondary}
            />
          </View>

          <View style={styles.inputRow}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Weight (kg)</Text>
              <TextInput
                style={styles.input}
                value={weight}
                onChangeText={setWeight}
                placeholder="70"
                placeholderTextColor={COLORS.textSecondary}
                keyboardType="numeric"
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>Height (cm)</Text>
              <TextInput
                style={styles.input}
                value={height}
                onChangeText={setHeight}
                placeholder="175"
                placeholderTextColor={COLORS.textSecondary}
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Running Level</Text>
            <View style={styles.optionsRow}>
              {RUNNING_LEVELS.map((lvl) => (
                <TouchableOpacity
                  key={lvl}
                  style={[styles.option, level === lvl && styles.optionActive]}
                  onPress={() => setLevel(lvl)}
                >
                  <Text style={[styles.optionText, level === lvl && styles.optionTextActive]}>{lvl}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Units</Text>
            <View style={styles.optionsRow}>
              <TouchableOpacity
                style={[styles.option, units === 'Metric' && styles.optionActive]}
                onPress={() => setUnits('Metric')}
              >
                <Text style={[styles.optionText, units === 'Metric' && styles.optionTextActive]}>Metric (km, kg)</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.option, units === 'Imperial' && styles.optionActive]}
                onPress={() => setUnits('Imperial')}
              >
                <Text style={[styles.optionText, units === 'Imperial' && styles.optionTextActive]}>Imperial (mi, lb)</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Coach Voice</Text>
            <View style={styles.optionsRow}>
              {['Motivational', 'Technical', 'Supportive'].map((voice) => (
                <TouchableOpacity
                  key={voice}
                  style={[styles.option, coachVoice === voice && styles.optionActive]}
                  onPress={() => setCoachVoice(voice)}
                >
                  <Text style={[styles.optionText, coachVoice === voice && styles.optionTextActive]}>{voice}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>{saved ? 'SAVED! ✓' : 'SAVE'}</Text>
          </TouchableOpacity>
        </View>
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
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    fontSize: 80,
    backgroundColor: COLORS.surface,
    borderRadius: 60,
    width: 120,
    height: 120,
    textAlign: 'center',
    lineHeight: 120,
  },
  form: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputRow: {
    flexDirection: 'row',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  option: {
    paddingVertical: 10,
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
  saveButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  saveButtonText: {
    color: COLORS.surface,
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default ProfileScreen;
