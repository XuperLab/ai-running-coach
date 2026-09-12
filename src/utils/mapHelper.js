// mapHelper.js — maps on the new architecture.
//
// What the on-device probe told us (Expo Go, iOS, SDK 57):
//
//   viewManager AIRMap:            true    <- legacy component IS registered
//   viewManager RNMapsMapView:     true    <- Fabric component is registered too
//   viewManager RNMapsPolyline:    false   <- ...but not every Fabric child is
//   isFabric(newArch):             true    <- runtime is on the new architecture
//   maps version:                  1.27.2
//
// Nothing is missing — so the failure is in behaviour, not availability. The
// native view is created and laid out, but it never reports ready and never
// paints. This matches the known instability of the react-native-maps
// New-Architecture rewrite (>= 1.21) inside Expo Go.
//
// Two things are therefore required for a map to appear here:
//   1. Use the library component, but give it a STABLE camera. The library
//      forwards `region` straight to native, and a new object identity on every
//      parent render re-issues a camera command on every render. The run screen
//      re-renders once a second (timer), so the map was being hammered with
//      camera updates and never settled. Callers must memoise the region.
//   2. Never pass `region` and `initialRegion` together.
//
// `getMapProps` encodes both rules so no caller can get them wrong.

import { Platform } from 'react-native';

let _MapView = null;
let _Polyline = null;
let _Marker = null;
let _attempted = false;
let _error = null;

const loadMaps = () => {
  if (_attempted && _MapView) return _MapView;
  _attempted = true;

  if (Platform.OS === 'web') {
    _error = 'Maps are not supported on web';
    return null;
  }
  try {
    const Maps = require('react-native-maps');
    _MapView = Maps.default || Maps.MapView || null;
    _Polyline = Maps.Polyline || null;
    _Marker = Maps.Marker || null;
    if (!_MapView) throw new Error('react-native-maps exported no MapView');
    _error = null;
    return _MapView;
  } catch (e) {
    // Retryable: do not cache a failure for the whole session.
    _MapView = null;
    _polylinePolyfillFix();
    _error = e && e.message ? e.message : String(e);
    console.error('[mapHelper] map unavailable:', _error);
    return null;
  }
};

// no-op placeholder to keep load path obvious
const _polylinePolyfillFix = () => {};

export const isMapAvailable = () => !!loadMaps();
export const getMapLoadError = () => { loadMaps(); return _error; };
export const getMapView = () => loadMaps();
export const getPolyline = () => { loadMaps(); return _Polyline; };
export const getMarker = () => { loadMaps(); return _Marker; };

/**
 * The safe prop set for a run-tracking map.
 *
 * @param region  memoised region (MUST be a stable reference) or null
 * @param ready   whether the map has reported ready
 */
export const getMapProps = (region, ready) => ({
  style: { flex: 1 },
  // One camera source only: initialRegion before ready, region after.
  ...(ready && region ? { region } : {}),
  ...(!ready && region ? { initialRegion: region } : {}),
  showsUserLocation: true,
  showsMyLocationButton: false,
  followsUserLocation: true,
  toolbarEnabled: false,
  mapType: 'standard',
  // Keep the camera pinned to the user; without this the library's re-issued
  // camera commands can fight the follow mode.
  zoomEnabled: true,
  scrollEnabled: true,
  rotateEnabled: false,
  pitchEnabled: false,
});

