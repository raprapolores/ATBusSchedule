import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'RouteDetails'>;

export default function RouteDetailsScreen({ route, navigation }: Props) {
  const { routeId, routeName, stopName } = route.params;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{routeName}</Text>
      <Text style={styles.subtitle}>Route ID: {routeId}</Text>
      <Text style={styles.subtitle}>Stop: {stopName}</Text>

      <Pressable style={styles.button} onPress={() => navigation.goBack()}>
        <Text style={styles.buttonText}>Back to timetable</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    padding: 24,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    marginBottom: 12,
    color: '#111827',
    letterSpacing: -0.6,
  },
  subtitle: {
    fontSize: 16,
    color: '#4B5563',
    marginBottom: 8,
  },
  button: {
    marginTop: 24,
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
