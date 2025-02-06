import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useState, useEffect } from 'react';
import { View, Text, AppState, AppStateStatus, StyleSheet, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

async function setupNotifications() {
  if (Device.isDevice) {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      alert('Enable notifications for better tracking.');
      return;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('class-reminders', {
        name: 'Class Reminders',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 500, 250, 500],
        lightColor: '#FF231F7C',
      });
    }
  }
}

const AppUsageScreen = () => {
  const [appState, setAppState] = useState(AppState.currentState);
  const [usageTime, setUsageTime] = useState(0);
  const [lastActiveTime, setLastActiveTime] = useState<number | null>(null);

  useEffect(() => {
    setupNotifications();
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, []);

  const handleAppStateChange = async (nextAppState: string) => {
    if (appState.match(/inactive|background/) && nextAppState === 'active') {
      if (lastActiveTime) {
        const timeSpent = (Date.now() - lastActiveTime) / 1000;
        setUsageTime(prevTime => prevTime + timeSpent);
      }
    }

    if (nextAppState.match(/inactive|background/)) {
      setLastActiveTime(Date.now());

      const timetableData = await AsyncStorage.getItem('timetable');
      if (timetableData) {
        const timetable = JSON.parse(timetableData);
        const currentTime = new Date();
        const formattedTime = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        const isClassTime = timetable.some(
          (entry: { time: string }) => entry.time.trim() === formattedTime.trim()
        );

        if (isClassTime) {
          console.log("✅ Class time detected! Sending notification...");
          await sendFocusNotification();
        } else {
          console.log("❌ Not class time. No notification sent.");
        }
      }
    }

    setAppState(nextAppState as AppStateStatus);
  };

  const sendFocusNotification = async () => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "📚 Stay Focused!",
        body: "You're in class. Avoid distractions and focus on your studies!",
        sound: "default", 
      },
      trigger: null, 
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>App Usage</Text>
      <View style={styles.usageContainer}>
        <Text style={styles.usageText}>Total Usage Time:</Text>
        <Text style={styles.usageTime}>{usageTime.toFixed(2)} seconds</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
    color: '#333',
  },
  usageContainer: {
    width: '80%',
    padding: 15,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#000',
    alignItems: 'center',
  },
  usageText: {
    fontSize: 18,
    color: '#333',
    marginBottom: 10,
  },
  usageTime: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
});

export default AppUsageScreen;