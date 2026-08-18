/**
 * Navigation constants and configuration
 * Centralized place for route names and navigation defaults
 */

export const ROUTE_NAMES = {
  // Tab navigator
  HOME_TAB: 'HomeTab',
  SETTINGS_TAB: 'SettingsTab',

  // Stack navigator (inside HomeTab)
  TIMETABLE: 'Home',
  ROUTE_DETAILS: 'RouteDetails',

  // Stack navigator (inside SettingsTab)
  SETTINGS: 'Settings',
  ABOUT: 'About',
} as const;

export const INITIAL_ROUTE = ROUTE_NAMES.HOME_TAB;
