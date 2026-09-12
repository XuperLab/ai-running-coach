// src/hooks/useVoiceCoach.js
// Phase 2 feature: real audio coaching via expo-speech (Text-to-Speech).
// Speaks motivational / technical / supportive cues during a run.
import { useCallback, useRef } from 'react';
import * as Speech from 'expo-speech';

const LINES = {
  Motivational: [
    'You have got this. Keep pushing!',
    'Strong effort! Stay with the rhythm.',
    'Believe in yourself, you are doing great.',
    'One step at a time, champion.',
  ],
  Technical: [
    'Maintain an even cadence around one hundred sixty steps per minute.',
    'Keep your posture tall and your shoulders relaxed.',
    'Control your breathing, inhale for three, exhale for three.',
    'Find a steady rhythm and hold your pace.',
  ],
  Supportive: [
    "You're doing wonderfully, enjoy the run.",
    "Listen to your body, you're exactly where you need to be.",
    'Proud of you for showing up today.',
    'Take it easy, there is no rush.',
  ],
};

const ZONE_LINES = {
  Motivational: 'Zone {z}! Feel the power.',
  Technical: 'You are in heart rate zone {z}. Adjust your effort as needed.',
  Supportive: "You're in zone {z}, just breathe and enjoy.",
};

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

export const useVoiceCoach = (coachStyle = 'Motivational') => {
  const style = LINES[coachStyle] ? coachStyle : 'Motivational';
  const lastSpokenRef = useRef('');

  const speak = useCallback((text) => {
    if (!text || typeof Speech?.speak !== 'function') return;
    // Avoid repeating the exact same line back to back
    if (text === lastSpokenRef.current) return;
    lastSpokenRef.current = text;
    try {
      Speech.speak(text, { rate: 1.0, pitch: 1.0, language: 'en' });
    } catch (e) {
      // TTS not available on this platform; fail silently
    }
  }, []);

  const start = useCallback(
    (workoutType) => {
      speak(`Let's go! Starting your ${workoutType || 'run'}.`);
    },
    [speak]
  );

  const zone = useCallback(
    (z) => {
      const tpl = ZONE_LINES[style];
      speak(tpl.replace('{z}', String(z)));
    },
    [style, speak]
  );

  const milestone = useCallback(
    (km) => {
      speak(`${km} kilometer${km > 1 ? 's' : ''} completed. Keep it up!`);
    },
    [speak]
  );

  const finish = useCallback(() => {
    speak(pick(LINES[style]) + ' Great work, session saved!');
  }, [style, speak]);

  return { speak, start, zone, milestone, finish };
};

export default useVoiceCoach;
