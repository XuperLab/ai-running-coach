// src/utils/mapHelper.js
// Cross-platform MapView wrapper
// On native (iOS/Android), uses react-native-maps
// On web, renders a placeholder

import { Platform } from 'react-native';

let MapView, Polyline, Marker;

if (Platform.OS !== 'web') {
  try {
    const Maps = require('react-native-maps');
    MapView = Maps.default;
    Polyline = Maps.Polyline;
    Marker = Maps.Marker;
  } catch (e) {
    // Fallback if react-native-maps isn't installed
  }
}

export { MapView, Polyline, Marker };
