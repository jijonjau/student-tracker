import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useState, useEffect } from 'react';
import { View, Text, AppState, AppStateStatus, StyleSheet, Platform } from 'react-native';
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
  const [classSession, setClassSession] = useState<ClassSession | null>(null);

  interface ClassSession {
    time: string;
    endTime: string;
  }

  useEffect(() => {
    registerForPushNotificationsAsync();
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, []);

  const handleAppStateChange = async (nextAppState: AppStateStatus) => {
    if (nextAppState === 'background') {
      const timetableData = await AsyncStorage.getItem('timetable');
      if (timetableData) {
        const timetable = JSON.parse(timetableData);
        const currentTime = new Date();
        const formattedTime = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
        const activeClass = timetable.find(
          (entry: { time: string; endTime: string }) => entry.time.trim() === formattedTime.trim()
        );
  
        if (activeClass) {
          console.log('✅ Class session detected:', activeClass);
  
          const sessionEndTime = new Date();
          sessionEndTime.setHours(parseInt(activeClass.endTime.split(':')[0]));
          sessionEndTime.setMinutes(parseInt(activeClass.endTime.split(':')[1]));
  
          if (currentTime > sessionEndTime) {
            console.log('⏳ Class session ended. Stopping tracking.');
            return;
          }
  
          setClassSession(activeClass);
          setDistractedTime((prev) => prev + 1); 
          await sendNotification(); 
        }
      }
    }
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

  const totalTime = focusedTime + distractedTime;
  const data =
    totalTime > 0
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
      {totalTime > 0 ? (
        <View style={styles.summaryContainer}>
          <Text style={styles.summaryText}>🟢 Focused Time: {focusedTime.toFixed(1)} mins</Text>
          <Text style={styles.summaryText}>🔴 Distracted Time: {distractedTime.toFixed(1)} mins</Text>
          <Text style={styles.totalTime}>⏳ Total Time Tracked: {totalTime.toFixed(1)} mins</Text>
        </View>
      ) : (
        <Text style={styles.noDataText}>No activity recorded yet. Stay focused! 🎯</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  summaryContainer: {
    marginTop: 15,
    alignItems: 'center',
  },
  summaryText: {
    fontSize: 16,
    color: '#444',
    marginBottom: 5,
  },
  totalTime: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
    marginTop: 5,
  },
  noDataText: {
    fontSize: 16,
    fontStyle: 'italic',
    color: '#888',
    marginTop: 10,
  },
});

export default AppUsageScreen;