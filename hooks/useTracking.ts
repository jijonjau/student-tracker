import React, { useState, useRef, useEffect, useCallback } from 'react'
import { AppState, AppStateStatus } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useNotifications } from './../hooks/useNotifications'
import { useClassSession } from './../hooks/useClassSession'

export const useTracking = () => {
  const [focusedTime, setFocusedTime] = useState(0)
  const [distractedTime, setDistractedTime] = useState(0)
  const [isFocused, setIsFocused] = useState(true)
  const [forceRender, setForceRender] = useState(0)

  const { sendDistractionNotification, sendClassEndNotification } =
    useNotifications()
  const { classSession, setClassSession } = useClassSession()

  const appState = useRef(AppState.currentState)
  const trackingInterval = useRef<NodeJS.Timeout | undefined>(undefined)
  const lastUpdateTime = useRef<number | null>(null)
  const focusedTimeRef = useRef(0)
  const distractedTimeRef = useRef(0)

  const updateUIState = useCallback(async () => {
    setFocusedTime(focusedTimeRef.current)
    setDistractedTime(distractedTimeRef.current)
    setForceRender((prev) => prev + 1)

    try {
      await AsyncStorage.setItem(
        'trackingData',
        JSON.stringify({
          focusedTime: focusedTimeRef.current,
          distractedTime: distractedTimeRef.current,
        }),
      )
      console.log(
        `UI updated - Focused: ${focusedTimeRef.current}, Distracted: ${distractedTimeRef.current}`,
      )
    } catch (error) {
      console.error('Error saving tracking data:', error)
    }
  }, [])

  const trackTime = useCallback(async () => {
    if (!classSession) return

    const now = new Date()
    const [endHour, endMinute] = classSession?.endTime
      .split(':')
      .map(Number) || [0, 0]
    const classEndTime = new Date(now)
    classEndTime.setHours(endHour, endMinute, 0, 0)

    console.log(
      `Tracking: Now=${now.toISOString()}, End=${classEndTime.toISOString()}, Focused=${isFocused}`,
    )

    if (now >= classEndTime) {
      console.log('Class ended, stopping tracking.')
      setClassSession(null)
      clearInterval(trackingInterval.current)
      trackingInterval.current = undefined
      await updateUIState()
      await sendClassEndNotification(classSession)
      return
    }

    if (isFocused) {
      focusedTimeRef.current += 1
      console.log(`Focused time updated: ${focusedTimeRef.current}`)
    } else {
      distractedTimeRef.current += 1
      console.log(`Distracted time updated: ${distractedTimeRef.current}`)
    }

    lastUpdateTime.current = now.getTime()
    await updateUIState()
  }, [
    classSession,
    isFocused,
    setClassSession,
    sendClassEndNotification,
    updateUIState,
  ])

  const loadTrackingData = useCallback(async () => {
    try {
      const data = await AsyncStorage.getItem('trackingData')
      if (data) {
        const { focusedTime: savedFocused, distractedTime: savedDistracted } =
          JSON.parse(data)
        focusedTimeRef.current = savedFocused || 0
        distractedTimeRef.current = savedDistracted || 0
        setFocusedTime(focusedTimeRef.current)
        setDistractedTime(distractedTimeRef.current)
        console.log(
          `Loaded tracking data: Focused=${focusedTimeRef.current}, Distracted=${distractedTimeRef.current}`,
        )
      }
    } catch (error) {
      console.error('Error loading tracking data:', error)
    }
  }, [])

  const handleAppStateChange = useCallback(
    async (nextAppState: AppStateStatus) => {
      console.log(`App state changed to: ${nextAppState}`)
      const previousAppState = appState.current
      appState.current = nextAppState

      if (!classSession) return

      const now = new Date()
      const [endHour, endMinute] = classSession.endTime.split(':').map(Number)
      const classEndTime = new Date(now)
      classEndTime.setHours(endHour, endMinute, 0, 0)

      if (now >= classEndTime) {
        console.log('Class ended via app state change.')
        setClassSession(null)
        if (trackingInterval.current) {
          clearInterval(trackingInterval.current)
          trackingInterval.current = undefined
        }
        await updateUIState()
        await sendClassEndNotification(classSession)
        return
      }

      if (nextAppState === 'active' && previousAppState !== 'active') {
        setIsFocused(true)
        console.log('Resuming focused tracking.')
        if (lastUpdateTime.current) {
          const timeAway = Math.floor(
            (now.getTime() - lastUpdateTime.current) / 1000,
          )
          if (timeAway > 0) {
            distractedTimeRef.current += timeAway
            console.log(
              `Added ${timeAway}s to distracted time from background gap.`,
            )
            await updateUIState()
          }
        }
      } else if (nextAppState !== 'active' && previousAppState === 'active') {
        setIsFocused(false)
        console.log('Switching to distracted tracking.')
        await sendDistractionNotification()
      }
    },
    [
      classSession,
      setClassSession,
      updateUIState,
      sendClassEndNotification,
      sendDistractionNotification,
    ],
  )

  const startTracking = useCallback(() => {
    if (!trackingInterval.current) {
      console.log('Starting tracking interval.')
      trackingInterval.current = setInterval(trackTime, 1000)
      trackTime()
    }
  }, [trackTime])

  const stopTracking = useCallback(() => {
    if (trackingInterval.current) {
      console.log('Stopping tracking interval.')
      clearInterval(trackingInterval.current)
      trackingInterval.current = undefined
    }
  }, [])

  useEffect(() => {
    loadTrackingData()

    const subscription = AppState.addEventListener(
      'change',
      handleAppStateChange,
    )

    return () => {
      subscription.remove()
      if (trackingInterval.current) clearInterval(trackingInterval.current)
    }
  }, [loadTrackingData, handleAppStateChange])

  return {
    focusedTime,
    distractedTime,
    isFocused,
    forceRender,
    startTracking,
    stopTracking,
    trackTime,
    updateUIState,
    handleAppStateChange,
  }
}
