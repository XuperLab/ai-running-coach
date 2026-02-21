// src/screens/LoginScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform } from 'react-native';
import { COLORS } from '../utils/constants';

const LoginScreen = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = () => {
    console.log('[Login] handleLogin called, username:', username, 'password:', password ? '***' : 'empty');
    if (!username || !password) {
      console.log('[Login] Missing username or password');
      setError('Please enter username and password');
      return;
    }
    if (username === 'user' && password === 'password') {
      console.log('[Login] Calling onLogin() with credentials');
      onLogin(username, password);
    } else {
      console.log('[Login] Invalid credentials');
      setError('Invalid username or password');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.content}>
        <View style={styles.logoContainer}>
          <Text style={styles.logo}>🏃</Text>
          <Text style={styles.title}>AI Running Coach</Text>
          <Text style={styles.subtitle}>Your personal running companion</Text>
        </View>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Username"
            placeholderTextColor={COLORS.textSecondary}
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={COLORS.textSecondary}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <TouchableOpacity 
            style={styles.button} 
            onPress={handleLogin}
            accessible={true}
            accessibilityRole="button"
          >
            <Text style={styles.buttonText}>LOGIN</Text>
          </TouchableOpacity>
          <Text style={styles.hint}>Use: user / password</Text>
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
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logo: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  form: {
    width: '100%',
  },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  error: {
    color: COLORS.error,
    textAlign: 'center',
    marginBottom: 16,
  },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: COLORS.surface,
    fontSize: 16,
    fontWeight: 'bold',
  },
  hint: {
    textAlign: 'center',
    color: COLORS.textSecondary,
    marginTop: 16,
    fontSize: 14,
  },
});

export default LoginScreen;
