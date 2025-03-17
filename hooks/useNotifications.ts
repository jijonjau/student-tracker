import React, { useEffect, useCallback } from 'react'
import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import { Platform } from 'react-native'

export interface ClassSession {
  subject: string
  id: string | number
  startTime: String
  endTime: String
}

export const useNotifications = () => {
  const registerForPushNotificationsAsync = async () => {
    if (!Device.isDevice) {
      console.log('Notifications require a physical device, not an emulator.')
      return
    }

    try {
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync()
      console.log('Existing notification permission status:', existingStatus)

      let finalStatus = existingStatus

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync({
          ios: {
            allowAlert: true,
            allowSound: true,
            allowBadge: true,
          },
        })
        finalStatus = status
        console.log('Requested permission status:', finalStatus)
      }

      if (finalStatus !== 'granted') {
        console.log('Notification permissions not granted!')
        return
      }

      console.log('Notification permissions granted successfully.')

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('class-reminders', {
          name: 'Class Reminders',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 500, 250, 500],
          lightColor: '#FF231F7C',
          sound: 'default',
          enableLights: true,
          enableVibrate: true,
          bypassDnd: false,
          showBadge: true,
          lockscreenVisibility:
            Notifications.AndroidNotificationVisibility.PUBLIC,
        })
        console.log('Android notification channel set.')
      }
    } catch (error) {
      console.error('Error setting up notifications:', error)
    }
  }

  const sendWelcomeNotification = async () => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Welcome to Class Tracker!',
          body: 'Stay focused during your classes.',
          sound: true,
          priority: 'high',
        },
        trigger: null,
      })
      console.log('Welcome notification sent')
    } catch (error) {
      console.error('Error sending welcome notification:', error)
    }
  }

  const sendDistractionNotification = async () => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '📚 Stay Focused!',
          body: 'You have been distracted and left the app during class. Return to stay on track!',
          sound: true,
          priority: 'high',
          vibrate: [0, 250, 250, 250],
        },
        trigger: null,
      })
      console.log('Distraction notification sent successfully')
    } catch (error) {
      console.error('Error sending distraction notification:', error)
    }
  }

  const sendClassEndNotification = async (
    classSession: ClassSession | null,
  ) => {
    if (!classSession) return

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Class Ended',
          body: `Your class "${classSession.subject}" has ended.`,
          sound: true,
          priority: 'high',
          vibrate: [0, 250, 250, 250],
        },
        trigger: null,
      })
      console.log('Class end notification sent')
    } catch (error) {
      console.error('Error sending class end notification:', error)
    }
  }

  useEffect(() => {
    registerForPushNotificationsAsync()
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    })

    sendWelcomeNotification()

    const receivedSubscription = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log('Notification received:', notification)
      },
    )

    const responseSubscription =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log('Notification response received:', response)
      })

    return () => {
      receivedSubscription.remove()
      responseSubscription.remove()
    }
  }, [])

  return {
    sendWelcomeNotification,
    sendDistractionNotification,
    sendClassEndNotification,
  }
}
