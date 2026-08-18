import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TimetableScreen from '../features/timetable/TimetableScreen';
import RouteDetailsScreen from '../features/route-details/RouteDetailsScreen';
import type { HomeStackParamList } from './types';

const Stack = createNativeStackNavigator<HomeStackParamList>();

/**
 * Home tab navigator
 * Displays the timetable screen with the ability to drill down into route details
 */
export function HomeStack() {
  return (
    <Stack.Navigator initialRouteName="Home">
      <Stack.Screen
        name="Home"
        component={TimetableScreen}
        options={{
          title: 'Timetable',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="RouteDetails"
        component={RouteDetailsScreen}
        options={{
          title: 'Route details',
        }}
      />
    </Stack.Navigator>
  );
}
