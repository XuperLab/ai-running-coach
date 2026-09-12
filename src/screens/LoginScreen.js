// src/screens/LoginScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform, StatusBar } from 'react-native';
import { COLORS } from '../utils/constants';

const LoginScreen = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = () => {
    if (!username || !password) {
      setError('Please enter username and password');
      return;
    }
    // Hardcoded for MVP simplicity
    if (username === 'user' && password === 'password') {
      onLogin(username, password);
    } else {
      setError('Invalid username or password');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.logoBadge}>
              <Text style={styles.logoIcon}>🏃</Text>
            </View>
            <Text style={styles.title}>Run Coach AI</Text>
            <Text style={styles.subtitle}>Elevate your running journey with personalized AI coaching.</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Username</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your username"
                placeholderTextColor={COLORS.textMuted}
                value={username}
                onChangeText={(text) => {
                  setUsername(text);
                  setError('');
                }}
                autoCapitalize="none"
                selectionColor={COLORS.primary}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor={COLORS.textMuted}
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  setError('');
                }}
                secureTextEntry
                selectionColor={COLORS.primary}
              />
            </View>

            {error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={styles.buttonPrimary}
              onPress={handleLogin}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>Sign In</Text>
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.hintText}>Demo credentials: <Text style={styles.boldText}>user / password</Text></Text>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoBadge: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    // Shadow for iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    // Elevation for Android
    elevation: 4,
  },
  logoIcon: {
    fontSize: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 16,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
    // Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  errorText: {
    color: COLORS.error,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
  },
  buttonPrimary: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  footer: {
    marginTop: 24,
    alignItems: 'center',
  },
  hintText: {
    color: COLORS.textMuted,
    fontSize: 14,
  },
  boldText: {
    fontWeight: '600',
    color: COLORS.textSecondary,
  }
});

export default LoginScreen;
