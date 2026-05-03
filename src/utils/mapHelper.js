// src/utils/mapHelper.js
// Cross-platform MapView wrapper
// Lazy-loads react-native-maps only on native platforms to avoid web errors

import { Platform } from 'react-native';

let _MapView, _Polyline, _Marker;
let _loaded = false;

const loadMaps = () => {
  if (_loaded) return;
  _loaded = true;
  if (Platform.OS !== 'web') {
    try {
      const Maps = require('react-native-maps');
      _MapView = Maps.default;
      _Polyline = Maps.Polyline;
      _Marker = Maps.Marker;
    } catch (e) {
      console.warn('react-native-maps not available:', e.message);
    }
  }
};

export const getMapView = () => { loadMaps(); return _MapView; };
export const getPolyline = () => { loadMaps(); return _Polyline; };
export const getMarker = () => { loadMaps(); return _Marker; };
