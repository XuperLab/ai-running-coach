// src/utils/storage.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from './constants';

export const saveData = async (key, data) => {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error('Error saving data:', error);
    return false;
  }
};

export const getData = async (key) => {
  try {
    const data = await AsyncStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error getting data:', error);
    return null;
  }
};

export const saveProfile = (profile) => saveData(STORAGE_KEYS.PROFILE, profile);
export const getProfile = () => getData(STORAGE_KEYS.PROFILE);

export const saveRuns = (runs) => saveData(STORAGE_KEYS.RUNS, runs);
export const getRuns = () => getData(STORAGE_KEYS.RUNS);

export const saveAchievements = (achievements) => saveData(STORAGE_KEYS.ACHIEVEMENTS, achievements);
export const getAchievements = () => getData(STORAGE_KEYS.ACHIEVEMENTS);
