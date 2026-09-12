export const COLORS = {
  // Brand Colors
  primary: '#2563EB', // Modern blue
  secondary: '#F59E0B', // Amber
  accent: '#7C3AED', // Indigo/Violet accent

  // Background & Surfaces
  background: '#F8FAFC', // Very light slate
  surface: '#FFFFFF',
  surfaceAlt: '#F1F5F9', // Light slate

  // Text
  textPrimary: '#0F172A', // Darkest slate
  textSecondary: '#475569', // Medium slate
  textMuted: '#94A3B8', // Light slate

  // Semantic
  success: '#10B981', // Emerald
  warning: '#F59E0B', // Amber
  error: '#EF4444', // Rose

  // Borders
  border: '#E2E8F0',
  borderDark: '#CBD5E1',
};

export const STORAGE_KEYS = {
  USER: '@running_coach_user',
  PROFILE: '@running_coach_profile',
  RUNS: '@running_coach_runs',
  ACHIEVEMENTS: '@running_coach_achievements',
};

export const WORKOUT_TYPES = [
  'Easy Run',
  'Tempo Run',
  'Interval Training',
  'Long Run',
  'Recovery Run',
];

export const RACE_GOALS = [
  'None',
  '5K',
  '10K',
  'Half Marathon',
  'Marathon',
  'Ultra Marathon',
];

export const MUSIC_GENRES = [
  'None',
  'Electronic',
  'Rock',
  'Classical',
  'Hip Hop',
  'Pop',
];

export const COACH_STYLES = [
  'Motivational',
  'Technical',
  'Supportive',
];

export const RUNNING_LEVELS = ['Beginner', 'Intermediate', 'Advanced'];

// GPS Tracking Settings
//
// Tuning notes (these matter — a sloppy filter is what makes a stationary phone
// "run" 2 km in 13 seconds):
//   ACCURACY_THRESHOLD_M  reject fixes whose reported accuracy radius is worse than this.
//   MAX_JUMP_SPEED_MS     reject a fix that implies an impossible speed (teleport/jitter).
//   MAX_JUMP_M            reject any single step longer than this, regardless of time.
//   DISTANCE_FILTER_M     minimum step distance worth recording (noise floor while standing).
//   DISTANCE_FILTER_ACCURACY_FACTOR  scale that floor with how noisy the fix is:
//                         effectiveFloor = max(DISTANCE_FILTER_M, accuracy * factor).
export const GPS_CONFIG = {
  TRACK_INTERVAL_MS: 2000,      // Request a GPS fix every 2 seconds
  DISTANCE_FILTER_M: 6,         // Minimum distance change to record a point (meters)
  ACCURACY_THRESHOLD_M: 25,     // Ignore GPS readings with accuracy worse than 25m
  MAX_JUMP_SPEED_MS: 7,         // > 25.2 km/h sustained -> not a human runner, reject
  MAX_JUMP_M: 60,               // Reject any single step longer than 60m
  DISTANCE_FILTER_ACCURACY_FACTOR: 1.2,
  AUTO_PAUSE_ENABLED: true,     // Stop accumulating distance when you're not moving
  AUTO_PAUSE_SPEED_MS: 0.75,    // < 2.7 km/h counts as standing still
  AUTO_PAUSE_AFTER_S: 6,        // ...for this long before distance accumulation pauses
};

export const ACHIEVEMENTS = [
  { id: 'first_run', name: 'First Run', description: 'Complete your first run', icon: '🏃' },
  { id: '5k', name: '5K Runner', description: 'Run a total of 5km', icon: '🥉' },
  { id: '10k', name: '10K Runner', description: 'Run a total of 10km', icon: '🥈' },
  { id: 'marathon', name: 'Marathon', description: 'Run a total of 42km', icon: '🥇' },
  { id: 'streak_3', name: '3 Day Streak', description: 'Run 3 days in a row', icon: '🔥' },
  { id: 'streak_7', name: '7 Day Streak', description: 'Run 7 days in a row', icon: '⚡' },
  { id: 'early_bird', name: 'Early Bird', description: 'Complete a run before 6am', icon: '🌅' },
  { id: 'hill_master', name: 'Hill Master', description: 'Complete a hill training', icon: '⛰️' },
];
