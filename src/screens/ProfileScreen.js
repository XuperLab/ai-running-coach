// src/screens/ProfileScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, StatusBar } from 'react-native';
import { COLORS, RUNNING_LEVELS } from '../utils/constants';
import { saveProfile, getProfile } from '../utils/storage';

const ProfileScreen = () => {
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
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
          <View style={styles.profileHeader}>
            <View style={styles.avatarBox}>
              <Text style={styles.avatarEmoji}>🏃</Text>
              <TouchableOpacity style={styles.editAvatar}>
                <Text style={styles.editAvatarIcon}>✎</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.profileMeta}>
              <Text style={styles.profileName}>{name || 'Runner'}</Text>
              <Text style={styles.profileLevel}>{level} Runner</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Details</Text>
          <View style={styles.card}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Enter your name"
                placeholderTextColor={COLORS.textMuted}
              />
            </View>

            <View style={styles.inputRow}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Gender</Text>
                <TextInput
                  style={styles.input}
                  value={gender}
                  onChangeText={setGender}
                  placeholder="Gender"
                  placeholderTextColor={COLORS.textMuted}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Weight (kg)</Text>
                <TextInput
                  style={styles.input}
                  value={weight}
                  onChangeText={setWeight}
                  placeholder="70"
                  placeholderTextColor={COLORS.textMuted}
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <View style={styles.card}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Running Level</Text>
              <View style={styles.pillsRow}>
                {RUNNING_LEVELS.map((lvl) => (
                  <TouchableOpacity
                    key={lvl}
                    style={[styles.pill, level === lvl && styles.pillActive]}
                    onPress={() => setLevel(lvl)}
                  >
                    <Text style={[styles.pillText, level === lvl && styles.pillTextActive]}>{lvl}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Unit System</Text>
              <View style={styles.pillsRow}>
                {['Metric', 'Imperial'].map((u) => (
                  <TouchableOpacity
                    key={u}
                    style={[styles.pill, units === u && styles.pillActive]}
                    onPress={() => setUnits(u)}
                  >
                    <Text style={[styles.pillText, units === u && styles.pillTextActive]}>{u}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={[styles.inputGroup, { marginBottom: 0 }]}>
              <Text style={styles.label}>AI Coach Voice</Text>
              <View style={styles.pillsRow}>
                {['Motivational', 'Technical', 'Supportive'].map((v) => (
                  <TouchableOpacity
                    key={v}
                    style={[styles.pill, coachVoice === v && styles.pillActive]}
                    onPress={() => setCoachVoice(v)}
                  >
                    <Text style={[styles.pillText, coachVoice === v && styles.pillTextActive]}>{v}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity 
            style={[styles.saveButton, saved && styles.saveButtonSuccess]} 
            onPress={handleSave}
            activeOpacity={0.8}
          >
            <Text style={styles.saveButtonText}>{saved ? 'Profile Saved' : 'Save Changes'}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.logoutButton}>
            <Text style={styles.logoutText}>Log Out</Text>
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
    marginBottom: 24,
    letterSpacing: -1,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarBox: {
    position: 'relative',
    marginRight: 20,
  },
  avatarEmoji: {
    fontSize: 48,
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 32,
    width: 84,
    height: 84,
    textAlign: 'center',
    lineHeight: 84,
    overflow: 'hidden',
  },
  editAvatar: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.primary,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.surface,
  },
  editAvatarIcon: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  profileMeta: {
    flex: 1,
  },
  profileName: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  profileLevel: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 12,
    marginLeft: 4,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: 8,
    marginLeft: 2,
  },
  input: {
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  pillActive: {
    backgroundColor: '#EFF6FF',
    borderColor: COLORS.primary,
  },
  pillText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  pillTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  footer: {
    padding: 24,
    marginTop: 12,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 16,
  },
  saveButtonSuccess: {
    backgroundColor: COLORS.success,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  logoutButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  logoutText: {
    color: COLORS.error,
    fontSize: 15,
    fontWeight: '600',
  },
});

export default ProfileScreen;
