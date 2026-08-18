/**
 * Home tab stack navigation
 * Contains timetable and route details screens
 */
export type HomeStackParamList = {
  Home: undefined;
  RouteDetails: {
    routeId: string;
    routeName: string;
    stopName: string;
  };
};

/**
 * Settings tab stack navigation
 * Contains settings and about screens
 */
export type SettingsStackParamList = {
  Settings: undefined;
  About: undefined;
};

/**
 * Root tab navigator
 * Top-level navigation between Home and Settings tabs
 */
export type RootTabParamList = {
  HomeTab: undefined;
  SettingsTab: undefined;
};

/**
 * Combined root navigation type
 * Used for type-checking navigation across all stacks
 */
export type RootStackParamList = HomeStackParamList & SettingsStackParamList & RootTabParamList;
