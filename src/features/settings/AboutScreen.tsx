import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function AboutScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <View style={styles.logoBox}>
            <Text style={styles.logo}>🚌</Text>
          </View>
          <Text style={styles.appName}>AT Hop Bus</Text>
          <Text style={styles.version}>Version 1.0.0</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About this app</Text>
          <Text style={styles.description}>
            AT Hop Bus is a timetable viewer for Auckland public transport. Built with React Native and Expo for iOS, Android, and web.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Technology stack</Text>
          <StackItem name="React Native" description="Cross-platform mobile framework" />
          <StackItem name="Expo" description="React Native tooling and runtime" />
          <StackItem name="React Navigation" description="Screen navigation and routing" />
          <StackItem name="TypeScript" description="Type-safe development" />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Architecture</Text>
          <Text style={styles.description}>
            This app demonstrates production-ready React Native patterns:
          </Text>
          <BulletPoint text="Feature-based folder structure" />
          <BulletPoint text="Typed navigation with React Navigation" />
          <BulletPoint text="Stack and tab navigation patterns" />
          <BulletPoint text="Service layer for API calls" />
          <BulletPoint text="Hook-based state management" />
        </View>

        <View style={styles.footer}>
          <Text style={styles.copyright}>© 2025 AT Hop. All rights reserved.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

interface StackItemProps {
  name: string;
  description: string;
}

function StackItem({ name, description }: StackItemProps) {
  return (
    <View style={styles.stackItem}>
      <Text style={styles.stackName}>{name}</Text>
      <Text style={styles.stackDesc}>{description}</Text>
    </View>
  );
}

interface BulletPointProps {
  text: string;
}

function BulletPoint({ text }: BulletPointProps) {
  return (
    <View style={styles.bullet}>
      <Text style={styles.bulletText}>• {text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#eef4ff',
  },
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 32,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 8,
  },
  logoBox: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: '#dbeafe',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  logo: {
    fontSize: 40,
  },
  appName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 8,
  },
  version: {
    fontSize: 14,
    color: '#64748b',
  },
  section: {
    marginBottom: 28,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    lineHeight: 21,
    color: '#475569',
  },
  stackItem: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  stackName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 4,
  },
  stackDesc: {
    fontSize: 13,
    color: '#64748b',
  },
  bullet: {
    marginBottom: 8,
  },
  bulletText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#475569',
  },
  footer: {
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  copyright: {
    fontSize: 12,
    color: '#94a3b8',
  },
});
