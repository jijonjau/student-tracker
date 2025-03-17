import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, Text, AppState, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import { PieChart } from 'react-native-chart-kit';
import * as Device from 'expo-device';

const BACKGROUND_TRACKING_TASK = 'BACKGROUND_TRACKING_TASK';

const AppUsageScreen = () => {
  const [focusedTime, setFocusedTime] = useState(0);
  const [distractedTime, setDistractedTime] = useState(0);
  const [isFocused, setIsFocused] = useState(true);
  const [classSession, setClassSession] = useState(null);
  const [forceRender, setForceRender] = useState(0);
  const appState = useRef(AppState.currentState);
  const trackingInterval = useRef(null);
  const checkInterval = useRef(null);
  const lastUpdateTime = useRef(null);
  const focusedTimeRef = useRef(0);
  const distractedTimeRef = useRef(0);

  const updateUIState = useCallback(async () => {
    setFocusedTime(focusedTimeRef.current);
    setDistractedTime(distractedTimeRef.current);
    setForceRender(prev => prev + 1);
    
    try {
      await AsyncStorage.setItem('trackingData', JSON.stringify({ 
        focusedTime: focusedTimeRef.current, 
        distractedTime: distractedTimeRef.current 
      }));
      console.log(`UI updated - Focused: ${focusedTimeRef.current}, Distracted: ${distractedTimeRef.current}`);
    } catch (error) {
      console.error('Error saving tracking data:', error);
    }
  }, []);

  useEffect(() => {
    const initialize = async () => {
      await registerForPushNotificationsAsync();
      await loadTrackingData();
      await checkForActiveClass();
      startBackgroundTracking();
      await sendWelcomeNotification();

      checkInterval.current = setInterval(checkForActiveClass, 5000);
    };
    
    initialize();

    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
      if (trackingInterval.current) clearInterval(trackingInterval.current);
      if (checkInterval.current) clearInterval(checkInterval.current);
    };
  }, []);

  const startBackgroundTracking = async () => {
    try {
      await BackgroundFetch.registerTaskAsync(BACKGROUND_TRACKING_TASK, {
        minimumInterval: 15,
        stopOnTerminate: false,
        startOnBoot: true,
      });
      console.log('Background tracking registered.');
    } catch (error) {
      console.error('Error registering background tracking:', error);
    }
  };

  TaskManager.defineTask(BACKGROUND_TRACKING_TASK, async () => {
    console.log('Background task running.');
    if (classSession) {
      await trackTime();
      return BackgroundFetch.BackgroundFetchResult.NewData;
    }
    return BackgroundFetch.BackgroundFetchResult.NoData;
  });

  const trackTime = async () => {
    if (!classSession) return;

    const now = new Date();
    const [endHour, endMinute] = classSession.endTime.split(':').map(Number);
    const classEndTime = new Date(now);
    classEndTime.setHours(endHour, endMinute, 0, 0);

    console.log(`Tracking: Now=${now.toISOString()}, End=${classEndTime.toISOString()}, Focused=${isFocused}`);

    if (now >= classEndTime) {
      console.log('Class ended, stopping tracking.');
      setClassSession(null);
      clearInterval(trackingInterval.current);
      trackingInterval.current = null;
      await updateUIState();
      await sendClassEndNotification();
      return;
    }

    if (isFocused) {
      focusedTimeRef.current += 1;
      console.log(`Focused time updated: ${focusedTimeRef.current}`);
    } else {
      distractedTimeRef.current += 1;
      console.log(`Distracted time updated: ${distractedTimeRef.current}`);
    }

    lastUpdateTime.current = now.getTime(); 
    await updateUIState();
  };

  const sendWelcomeNotification = async () => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Welcome to Class Tracker!',
          body: 'Stay focused during your classes.',
          sound: true,
        },
        trigger: null,
      });
      console.log("Welcome notification sent");
    } catch (error) {
      console.error("Error sending welcome notification:", error);
    }
  };

  const sendDistractionNotification = async () => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '📚 Stay Focused!',
          body: 'You have been distracted and left the app during class. Return to stay on track!',
          sound: true,
        },
        trigger: null,
      });
      console.log("Distraction notification sent");
    } catch (error) {
      console.error("Error sending distraction notification:", error);
    }
  };

  const sendClassEndNotification = async () => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Class Ended',
          body: 'Your class "${classSession.subject}" has ended.',
          sound: true,
        },
        trigger: null,
      });
      console.log("Class end notification sent");
    } catch (error) {
      console.error("Error sending class end notification:", error);
    }
  };

  const loadTrackingData = async () => {
    try {
      const data = await AsyncStorage.getItem('trackingData');
      if (data) {
        const { focusedTime: savedFocused, distractedTime: savedDistracted } = JSON.parse(data);
        focusedTimeRef.current = savedFocused || 0;
        distractedTimeRef.current = savedDistracted || 0;
        setFocusedTime(focusedTimeRef.current);
        setDistractedTime(distractedTimeRef.current);
        console.log(`Loaded tracking data: Focused=${focusedTimeRef.current}, Distracted=${distractedTimeRef.current}`);
      }
    } catch (error) {
      console.error('Error loading tracking data:', error);
    }
  };

  const checkForActiveClass = async () => {
    try {
      const timetableData = await AsyncStorage.getItem('timetable');
      console.log('Timetable data:', timetableData);
      if (!timetableData) return;

      const timetable = JSON.parse(timetableData);
      const now = new Date();

      const activeClass = timetable.find((entry) => {
        const [startHour, startMinute] = entry.time.split(':').map(Number);
        const [endHour, endMinute] = entry.endTime.split(':').map(Number);

        const startTime = new Date(now);
        startTime.setHours(startHour, startMinute, 0, 0);
        const endTime = new Date(now);
        endTime.setHours(endHour, endMinute, 0, 0);

        if (endHour < startHour || (endHour === startHour && endMinute < startMinute)) {
          endTime.setDate(endTime.getDate() + 1);
        }

        const isActive = now >= startTime && now < endTime;
        console.log(`Checking: ${entry.subject}, Start=${startTime.toISOString()}, End=${endTime.toISOString()}, Now=${now.toISOString()}, Active=${isActive}`);
        return isActive;
      });

      if (activeClass && (!classSession || classSession.id !== activeClass.id)) {
        console.log('Active class found:', activeClass);
        setClassSession(activeClass);
        setIsFocused(appState.current === 'active');
        if (!trackingInterval.current) {
          console.log('Starting tracking interval.');
          trackingInterval.current = setInterval(trackTime, 1000);
          trackTime(); // Force immediate tracking
        }
      } else if (!activeClass && classSession) {
        console.log('No active class, clearing session.');
        setClassSession(null);
        if (trackingInterval.current) {
          clearInterval(trackingInterval.current);
          trackingInterval.current = null;
        }
      }
    } catch (error) {
      console.error('Error checking timetable:', error);
    }
  };

  const handleAppStateChange = async (nextAppState) => {
    console.log(`App state changed to: ${nextAppState}`);
    const previousAppState = appState.current;
    appState.current = nextAppState;

    if (!classSession) return;

    const now = new Date();
    const [endHour, endMinute] = classSession.endTime.split(':').map(Number);
    const classEndTime = new Date(now);
    classEndTime.setHours(endHour, endMinute, 0, 0);

    if (now >= classEndTime) {
      console.log('Class ended via app state change.');
      setClassSession(null);
      if (trackingInterval.current) {
        clearInterval(trackingInterval.current);
        trackingInterval.current = null;
      }
      await updateUIState();
      await sendClassEndNotification();
      return;
    }

    if (nextAppState === 'active' && previousAppState !== 'active') {
      setIsFocused(true);
      console.log('Resuming focused tracking.');
      if (lastUpdateTime.current) {
        const timeAway = Math.floor((now.getTime() - lastUpdateTime.current) / 1000);
        if (timeAway > 0) {
          distractedTimeRef.current += timeAway;
          console.log(`Added ${timeAway}s to distracted time from background gap.`);
          await updateUIState();
        }
      }
    } else if (nextAppState !== 'active' && previousAppState === 'active') {
      setIsFocused(false);
      console.log('Switching to distracted tracking.');
      await sendDistractionNotification();
    }
  };

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const mins = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${hrs}:${mins}:${secs}`;
  };

  const totalTime = focusedTime + distractedTime;
  const data = [
    { name: 'Focused', time: focusedTime, color: '#4CAF50' },
    { name: 'Distracted', time: distractedTime, color: '#FF0000' },
  ].filter((item) => item.time > 0);

  return (
    <View style={{ flex: 1, padding: 20 }} key={forceRender}>
      <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 15 }}>📊 Focus vs. Distraction</Text>
      
      {data.length > 0 ? (
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
          hasLegend={true}
          center={[95, 100]}
        />
      ) : (
        <View style={{ height: 220, justifyContent: 'center', alignItems: 'center' }}>
          <Text>No tracking data yet</Text>
        </View>
      )}
      
      <View style={{ marginTop: 20 }}>
        <Text style={{ fontSize: 16, marginBottom: 5 }}>🟢 Focused Time: {formatTime(focusedTime)}</Text>
        <Text style={{ fontSize: 16, marginBottom: 5 }}>🔴 Distracted Time: {formatTime(distractedTime)}</Text>
        <Text style={{ fontSize: 16, marginBottom: 15 }}>⏳ Total Time Tracked: {formatTime(totalTime)}</Text>
        
        {classSession ? (
          <View style={{ 
            padding: 10, 
            backgroundColor: '#e6f7ff', 
            borderRadius: 8,
            borderLeftWidth: 4,
            borderLeftColor: '#1890ff'
          }}>
            <Text style={{ fontWeight: 'bold' }}>
              📚 Current Class: {classSession.subject}
            </Text>
            <Text>
              ⏰ {classSession.time} - {classSession.endTime}
            </Text>
            <Text style={{ marginTop: 5 }}>
              Status: {isFocused ? '🟢 Focused' : '🔴 Distracted'}
            </Text>
          </View>
        ) : (
          <Text style={{ fontStyle: 'italic' }}>No active class</Text>
        )}
      </View>
    </View>
  );
};

async function registerForPushNotificationsAsync() {
  if (!Device.isDevice) {
    console.log('Notifications require a physical device, not an emulator.');
    return;
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    console.log('Existing notification permission status:', existingStatus);

    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowSound: true,
          allowBadge: true,
        },
      });
      finalStatus = status;
      console.log('Requested permission status:', finalStatus);
    }

    if (finalStatus !== 'granted') {
      console.log('Notification permissions not granted!');
      return;
    }

    console.log('Notification permissions granted successfully.');

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('class-reminders', {
        name: 'Class Reminders',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 500, 250, 500],
        lightColor: '#FF231F7C',
      });
      console.log('Android notification channel set.');
    }
  } catch (error) {
    console.error('Error setting up notifications:', error);
  }
}

export default AppUsageScreen;