import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const HomeScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.appName}>🎯 Student Tracker</Text>

      <Text style={styles.motivation}>
        Stay focused, minimize distractions, and make the most of your class time!
      </Text>

      <View style={styles.featureBox}>
        <Text style={styles.featureTitle}>📅 Smart Timetable</Text>
        <Text style={styles.featureDescription}>
          Automatically detect class times and remind you to focus.
        </Text>
      </View>

      <View style={styles.featureBox}>
        <Text style={styles.featureTitle}>📊 App Usage Insights</Text>
        <Text style={styles.featureDescription}>
          Monitor app usage during study hours and track your focus time.
        </Text>
      </View>

      <View style={styles.featureBox}>
        <Text style={styles.featureTitle}>🔔 Focus Reminders</Text>
        <Text style={styles.featureDescription}>
          Get notifications when you're distracted during class time.
        </Text>
      </View>

      <Text style={styles.footer}>Boost your productivity today! 🚀</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#FAFAFA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  appName: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#2E7D32', 
    marginBottom: 15,
  },
  motivation: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    color: '#555',
    marginBottom: 25,
    paddingHorizontal: 10,
  },
  featureBox: {
    width: '90%',
    backgroundColor: '#FFFFFF',
    padding: 15,
    marginVertical: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1B5E20', 
    marginBottom: 5,
  },
  featureDescription: {
    fontSize: 14,
    color: '#666',
  },
  footer: {
    marginTop: 30,
    fontSize: 16,
    fontWeight: '600',
    color: '#2E7D32',
  },
});

export default HomeScreen;