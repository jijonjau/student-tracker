import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, AppState, StyleSheet, Platform, AppStateStatus } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { PieChart } from 'react-native-chart-kit';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

async function registerForPushNotificationsAsync() {
  if (!Device.isDevice) {
    console.log('Must use a physical device for push notifications');
    return;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Failed to get push token for notifications!');
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

const AppUsageScreen = () => {
  const [focusedTime, setFocusedTime] = useState(0);
  const [distractedTime, setDistractedTime] = useState(0);
  const [isFocused, setIsFocused] = useState(true);
  const [classSession, setClassSession] = useState<null | { endTime: string }>(null);
  const focusTimer = useRef<NodeJS.Timeout | undefined>(undefined);
  const distractionTimer = useRef<NodeJS.Timeout | undefined>(undefined);

  useEffect(() => {
    registerForPushNotificationsAsync();
    checkForActiveClass();
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription.remove();
      clearTimers();
    };
  }, []);

  const startFocusTracking = () => {
    console.log('🟢 Focus tracking started');
    clearTimers(); 
    focusTimer.current = setInterval(() => {
      setFocusedTime((prev) => prev + 1);
    }, 1000);
  };

  const sendNotification = async () => {
    console.log('🔔 Sending focus reminder notification');
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '📚 Stay Focused!',
        body: 'You were distracted during class. Try to stay on track!',
        sound: 'default',
      },
      trigger: null,
    });
  };

  const startDistractionTracking = async () => {
    console.log('🔴 Distraction tracking started');
    clearTimers(); 
    distractionTimer.current = setInterval(() => {
      setDistractedTime((prev) => prev + 1);
    }, 1000);
    await sendNotification();
  };  

  const stopTracking = () => {
    clearTimers();
    setIsFocused(false);
  };

  const clearTimers = () => {
    if (focusTimer.current) {
      clearInterval(focusTimer.current);
      focusTimer.current = undefined;
    }
    if (distractionTimer.current) {
      clearInterval(distractionTimer.current);
      distractionTimer.current = undefined;
    }
  };

  const checkForActiveClass = async () => {
    const timetableData = await AsyncStorage.getItem('timetable');
    if (timetableData) {
      const timetable = JSON.parse(timetableData);
      const now = new Date();
      const formattedTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      const activeClass = timetable.find(
        (entry: { time: string }) => entry.time.trim() === formattedTime.trim()
      );

      if (activeClass) {
        console.log('✅ Class session detected:', activeClass);
        setClassSession(activeClass);
        startFocusTracking();
      }
    }
  };

  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (!classSession) return; 
  
    const now = new Date();
    const classEndTime = new Date();
    const [endHour, endMinute] = classSession.endTime.split(':').map(Number);
    classEndTime.setHours(endHour, endMinute, 0, 0);
  
    if (now >= classEndTime) {
      console.log('⏳ Class ended. Stopping tracking.');
      stopTracking();
      return;
    }
  
    if (nextAppState === 'active') {
      console.log('🟢 App is active');
      setIsFocused(true);
      clearTimers(); 
      startFocusTracking();
    } else if (nextAppState === 'background' || nextAppState === 'inactive') {
      console.log('🔴 App moved to background');
      setIsFocused(false);
      clearTimers();
      startDistractionTracking();
    }
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const mins = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${hrs}:${mins}:${secs}`;
  };

  const totalTime = focusedTime + distractedTime;
  const data = totalTime > 0
    ? [
        { name: 'Focused', time: focusedTime, color: '#4CAF50' },
        { name: 'Distracted', time: distractedTime, color: '#FF0000' },
      ]
    : [{ name: 'No Data', time: 1, color: '#D3D3D3' }];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📊 Focus vs. Distraction</Text>
      <PieChart
        data={data}
        width={300}
        height={220}
        chartConfig={{
          backgroundColor: '#fff',
          decimalPlaces: 1,
          color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
        }}
        accessor="time"
        backgroundColor="transparent"
        paddingLeft="15"
      />
      <View style={styles.summaryContainer}>
        <Text style={styles.summaryText}>🟢 Focused Time: {formatTime(focusedTime)}</Text>
        <Text style={styles.summaryText}>🔴 Distracted Time: {formatTime(distractedTime)}</Text>
        <Text style={styles.totalTime}>⏳ Total Time Tracked: {formatTime(totalTime)}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { alignItems: 'center', backgroundColor: '#fff', padding: 20, borderRadius: 10 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#333', marginBottom: 15 },
  summaryContainer: { marginTop: 15, alignItems: 'center' },
  summaryText: { fontSize: 16, color: '#444', marginBottom: 5 },
  totalTime: { fontSize: 18, fontWeight: 'bold', color: '#222', marginTop: 5 },
});

export default AppUsageScreen;
