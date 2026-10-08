import React from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { SettingsStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<SettingsStackParamList, 'Settings'>;

export default function SettingsScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App</Text>
          <SettingsItem label="Language" value="English" onPress={() => {}} />
          <SettingsItem label="Theme" value="Light" onPress={() => {}} />
          <SettingsItem label="Notifications" value="On" onPress={() => {}} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <SettingsItem label="Account type" value="Demo" onPress={() => {}} />
          <SettingsItem label="Change password" value="" onPress={() => {}} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>More</Text>
          <SettingsItem
            label="About"
            value=""
            onPress={() => navigation.navigate('About')}
          />
          <SettingsItem label="Terms of service" value="" onPress={() => {}} />
          <SettingsItem label="Privacy policy" value="" onPress={() => {}} />
        </View>

        <View style={styles.footer}>
          <Text style={styles.version}>Version 1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

interface SettingsItemProps {
  label: string;
  value: string;
  onPress: () => void;
}

function SettingsItem({ label, value, onPress }: SettingsItemProps) {
  return (
    <Pressable style={styles.item} onPress={onPress}>
      <View style={styles.itemContent}>
        <Text style={styles.itemLabel}>{label}</Text>
        {value ? <Text style={styles.itemValue}>{value}</Text> : null}
      </View>
      {!value ? <Text style={styles.arrow}>›</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  header: {
    marginBottom: 20,
    paddingTop: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.7,
  },
  section: {
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#8E8E93',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
  },
  itemContent: {
    flex: 1,
  },
  itemLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 2,
  },
  itemValue: {
    fontSize: 13,
    color: '#6B7280',
  },
  arrow: {
    fontSize: 22,
    color: '#C7C7CC',
    marginLeft: 12,
  },
  footer: {
    alignItems: 'center',
    marginTop: 28,
    paddingBottom: 20,
  },
  version: {
    fontSize: 13,
    color: '#8E8E93',
  },
});
