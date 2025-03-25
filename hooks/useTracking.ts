import React, { useState, useRef, useEffect, useCallback } from 'react'
import { AppState, AppStateStatus } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useNotifications } from './../hooks/useNotifications'
import { useClassSession } from './../hooks/useClassSession'

export interface ClassSession {
  id: string
  name: string
  isActive?: boolean
  startTime: string
  endTime: string
}

export interface ClassTimeData {
  id: string
  name: string
  focusedTime: number
  distractedTime: number
  color?: string
}

interface TrackingState {
  isTracking: boolean
  isFocused: boolean
  lastCheckedTime: number
  focusedTime: number
  distractedTime: number
  classBreakdown: Record<string, ClassTimeData>
  activeClassId: string | null
  forceRender: number
}

export const useTracking = () => {
  const [state, setState] = useState<TrackingState>({
    isTracking: false,
    isFocused: true,
    lastCheckedTime: Date.now(),
    focusedTime: 0,
    distractedTime: 0,
    classBreakdown: {},
    activeClassId: null,
    forceRender: 0,
  })

  const { sendDistractionNotification, sendClassEndNotification } = useNotifications()
  const { classSession, setClassSession } = useClassSession()
  
  const appState = useRef(AppState.currentState)
  const trackingInterval = useRef<NodeJS.Timeout | undefined>(undefined)
  const stateRef = useRef(state)

  // Keep the ref updated with the latest state
  useEffect(() => {
    stateRef.current = state
  }, [state])

  // Load saved tracking data when component mounts
  useEffect(() => {
    const loadTrackingData = async () => {
      try {
        const savedData = await AsyncStorage.getItem('trackingData')
        if (savedData) {
          const parsedData: TrackingState = JSON.parse(savedData)
          setState(prev => ({
            ...parsedData,
            isTracking: false, // Always reset tracking state on load
            forceRender: prev.forceRender, // Keep current forceRender value
          }))
          console.log('Loaded tracking data:', parsedData)
        }
      } catch (error) {
        console.error('Error loading tracking data:', error)
      }
    }

    loadTrackingData()
  }, [])

  // Save tracking data whenever it changes
  const saveTrackingData = useCallback(async () => {
    try {
      await AsyncStorage.setItem('trackingData', JSON.stringify(stateRef.current))
      console.log('Saved tracking data:', stateRef.current)
    } catch (error) {
      console.error('Error saving tracking data:', error)
    }
  }, [])

  // Update UI state and save data
  const updateUIState = useCallback(async () => {
    setState(prev => ({
      ...prev,
      forceRender: prev.forceRender + 1
    }))
    await saveTrackingData()
  }, [saveTrackingData])

  // App state change handler
  const handleAppStateChange = useCallback(async (nextAppState: AppStateStatus) => {
    console.log(`App state changed to: ${nextAppState}`)
    const previousAppState = appState.current
    appState.current = nextAppState

    if (!stateRef.current.isTracking || !stateRef.current.activeClassId) return

    const now = Date.now()
    const currentState = stateRef.current

    // Check if class has ended (assuming we have a classSession object)
    if (classSession && stateRef.current.activeClassId === classSession.id) {
      const [endHour, endMinute] = classSession.endTime.split(':').map(Number)
      const classEndTime = new Date()
      classEndTime.setHours(endHour, endMinute, 0, 0)

      if (now >= classEndTime.getTime()) {
        console.log('Class ended via app state change.')
        stopTracking()
        await sendClassEndNotification(classSession)
        return
      }
    }

    if (nextAppState === 'active' && previousAppState !== 'active') {
      // App has come to the foreground
      const timeAway = Math.floor((now - currentState.lastCheckedTime) / 1000)
      
      if (timeAway > 0) {
        // Add time away to distracted time
        // Add time away to distracted time
if (currentState.activeClassId) {
  updateClassTime(currentState.activeClassId, false, timeAway * 1000)
}
setState(prev => ({
  ...prev,
  isFocused: true,
  lastCheckedTime: now,
  distractedTime: prev.distractedTime + (timeAway * 1000)
}))
        console.log(`Added ${timeAway}s to distracted time from background gap.`)
      } else {
        setState(prev => ({
          ...prev,
          isFocused: true,
          lastCheckedTime: now
        }))
      }
      
      console.log('Resuming focused tracking.')
    } else if (nextAppState !== 'active' && previousAppState === 'active') {
      // App has gone to the background or is inactive
      const elapsedTime = now - currentState.lastCheckedTime
      
      // Update tracked time
      if (currentState.activeClassId) {
        updateClassTime(currentState.activeClassId, currentState.isFocused, elapsedTime)
      }
      
      setState(prev => ({
        ...prev,
        isFocused: false,
        lastCheckedTime: now,
        focusedTime: prev.isFocused ? prev.focusedTime + elapsedTime : prev.focusedTime,
        distractedTime: !prev.isFocused ? prev.distractedTime + elapsedTime : prev.distractedTime,
      }))
      
      console.log('Switching to distracted tracking.')
      await sendDistractionNotification()
    }
    
    await updateUIState()
  }, [updateUIState, classSession, sendClassEndNotification, sendDistractionNotification])

  // Setup app state listener
  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange)
    return () => {
      subscription.remove()
      if (trackingInterval.current) clearInterval(trackingInterval.current)
    }
  }, [handleAppStateChange])

  // Track time periodically
  const trackTime = useCallback(async () => {
    if (!stateRef.current.isTracking || !stateRef.current.activeClassId) return
    
    const now = Date.now()
    const currentState = stateRef.current
    const elapsedTime = 1000 // 1 second interval
    
    // Check if class has ended (assuming we have a classSession object)
    if (classSession && stateRef.current.activeClassId === classSession.id) {
      const [endHour, endMinute] = classSession.endTime.split(':').map(Number)
      const classEndTime = new Date()
      classEndTime.setHours(endHour, endMinute, 0, 0)

      if (now >= classEndTime.getTime()) {
        console.log('Class ended, stopping tracking.')
        stopTracking()
        await sendClassEndNotification(classSession)
        return
      }
    }
    
    // Update tracked time for the active class
    if (currentState.activeClassId) {
      updateClassTime(currentState.activeClassId, currentState.isFocused, elapsedTime)
    }
    
    setState(prev => ({
      ...prev,
      lastCheckedTime: now,
      focusedTime: prev.isFocused ? prev.focusedTime + elapsedTime : prev.focusedTime,
      distractedTime: !prev.isFocused ? prev.distractedTime + elapsedTime : prev.distractedTime,
    }))
    
    console.log(
      `Tracking: Focused=${currentState.isFocused}, ElapsedTime=${elapsedTime}ms`
    )
    
    await updateUIState()
  }, [updateUIState, classSession, sendClassEndNotification])

  // Start tracking a specific class
  const startTracking = useCallback((classSession?: ClassSession) => {
    if (!classSession) return
    
    const now = Date.now()
    
    // Initialize class data if it doesn't exist
    setState(prev => {
      const updatedClassBreakdown = { ...prev.classBreakdown }
      
      if (!updatedClassBreakdown[classSession.id]) {
        updatedClassBreakdown[classSession.id] = {
          id: classSession.id,
          name: classSession.name,
          focusedTime: 0,
          distractedTime: 0,
        }
      }
      
      return {
        ...prev,
        isTracking: true,
        isFocused: true,
        lastCheckedTime: now,
        activeClassId: classSession.id,
        classBreakdown: updatedClassBreakdown,
      }
    })
    
    console.log('Starting tracking for class:', classSession.name)
    // setClassSession(classSession)
    setClassSession({
      id: classSession.id,
      subject: classSession.name, // Assuming name can be used as subject
      time: `${classSession.startTime} - ${classSession.endTime}`, // Creating a time string
      startTime: classSession.startTime,
      endTime: classSession.endTime
    })
    
    // Start tracking interval
    if (!trackingInterval.current) {
      console.log('Starting tracking interval.')
      trackingInterval.current = setInterval(trackTime, 1000)
      trackTime()
    }
  }, [trackTime, setClassSession])

  // Stop tracking the current class
  const stopTracking = useCallback(() => {
    if (!stateRef.current.isTracking) return
    
    const now = Date.now()
    const currentState = stateRef.current
    const elapsedTime = now - currentState.lastCheckedTime
    
    // Update tracked time for the active class before stopping
    if (currentState.activeClassId) {
      updateClassTime(currentState.activeClassId, currentState.isFocused, elapsedTime)
    }
    
    setState(prev => ({
      ...prev,
      isTracking: false,
      lastCheckedTime: now,
      focusedTime: prev.isFocused ? prev.focusedTime + elapsedTime : prev.focusedTime,
      distractedTime: !prev.isFocused ? prev.distractedTime + elapsedTime : prev.distractedTime,
      activeClassId: null,
      forceRender: prev.forceRender + 1,
    }))
    
    console.log('Stopping tracking interval.')
    if (trackingInterval.current) {
      clearInterval(trackingInterval.current)
      trackingInterval.current = undefined
    }
    
    setClassSession(null)
    saveTrackingData()
  }, [saveTrackingData, setClassSession])

  // Toggle focus state
  const toggleFocus = useCallback(() => {
    const now = Date.now()
    const currentState = stateRef.current
    const elapsedTime = now - currentState.lastCheckedTime
    
    // Update tracked time for the active class
    if (currentState.activeClassId) {
      updateClassTime(currentState.activeClassId, currentState.isFocused, elapsedTime)
    }
    
    setState(prev => ({
      ...prev,
      isFocused: !prev.isFocused,
      lastCheckedTime: now,
      focusedTime: prev.isFocused ? prev.focusedTime + elapsedTime : prev.focusedTime,
      distractedTime: !prev.isFocused ? prev.distractedTime + elapsedTime : prev.distractedTime,
    }))
    
    console.log(`Toggled focus state to: ${!currentState.isFocused}`)
    saveTrackingData()
  }, [saveTrackingData])

  // Helper function to update time for a specific class
  const updateClassTime = useCallback((classId: string, isFocused: boolean, elapsedTime: number) => {
    setState(prev => {
      const updatedClassBreakdown = { ...prev.classBreakdown }
      
      if (updatedClassBreakdown[classId]) {
        if (isFocused) {
          updatedClassBreakdown[classId].focusedTime += elapsedTime
        } else {
          updatedClassBreakdown[classId].distractedTime += elapsedTime
        }
      }
      
      return {
        ...prev,
        classBreakdown: updatedClassBreakdown,
      }
    })
  }, [])

  // Reset all tracking data
  const resetTracking = useCallback(async () => {
    try {
      await AsyncStorage.removeItem('trackingData')
      setState({
        isTracking: false,
        isFocused: true,
        lastCheckedTime: Date.now(),
        focusedTime: 0,
        distractedTime: 0,
        classBreakdown: {},
        activeClassId: null,
        forceRender: state.forceRender + 1,
      })
      console.log('Reset all tracking data')
    } catch (error) {
      console.error('Error resetting tracking data:', error)
    }
  }, [state.forceRender])

  // Get class breakdown as an array
  const getClassBreakdownArray = useCallback((): ClassTimeData[] => {
    return Object.values(state.classBreakdown)
  }, [state.classBreakdown])

  return {
    focusedTime: state.focusedTime,
    distractedTime: state.distractedTime,
    isTracking: state.isTracking,
    isFocused: state.isFocused,
    activeClassId: state.activeClassId,
    forceRender: state.forceRender,
    classBreakdown: state.classBreakdown,
    classBreakdownArray: getClassBreakdownArray(),
    startTracking,
    stopTracking,
    trackTime,
    toggleFocus,
    resetTracking,
    updateUIState,
    handleAppStateChange,
  }
}

// import React, { useState, useRef, useEffect, useCallback } from 'react'
// import { AppState, AppStateStatus } from 'react-native'
// import AsyncStorage from '@react-native-async-storage/async-storage'
// import { useNotifications } from './../hooks/useNotifications'
// import { useClassSession } from './../hooks/useClassSession'

// export const useTracking = () => {
//   const [focusedTime, setFocusedTime] = useState(0)
//   const [distractedTime, setDistractedTime] = useState(0)
//   const [isFocused, setIsFocused] = useState(true)
//   const [forceRender, setForceRender] = useState(0)

//   const { sendDistractionNotification, sendClassEndNotification } =
//     useNotifications()
//   const { classSession, setClassSession } = useClassSession()

//   const appState = useRef(AppState.currentState)
//   const trackingInterval = useRef<NodeJS.Timeout | undefined>(undefined)
//   const lastUpdateTime = useRef<number | null>(null)
//   const focusedTimeRef = useRef(0)
//   const distractedTimeRef = useRef(0)

//   const updateUIState = useCallback(async () => {
//     setFocusedTime(focusedTimeRef.current)
//     setDistractedTime(distractedTimeRef.current)
//     setForceRender((prev) => prev + 1)

//     try {
//       await AsyncStorage.setItem(
//         'trackingData',
//         JSON.stringify({
//           focusedTime: focusedTimeRef.current,
//           distractedTime: distractedTimeRef.current,
//         }),
//       )
//       console.log(
//         `UI updated - Focused: ${focusedTimeRef.current}, Distracted: ${distractedTimeRef.current}`,
//       )
//     } catch (error) {
//       console.error('Error saving tracking data:', error)
//     }
//   }, [])

//   const trackTime = useCallback(async () => {
//     if (!classSession) return

//     const now = new Date()
//     const [endHour, endMinute] = classSession?.endTime
//       .split(':')
//       .map(Number) || [0, 0]
//     const classEndTime = new Date(now)
//     classEndTime.setHours(endHour, endMinute, 0, 0)

//     console.log(
//       `Tracking: Now=${now.toISOString()}, End=${classEndTime.toISOString()}, Focused=${isFocused}`,
//     )

//     if (now >= classEndTime) {
//       console.log('Class ended, stopping tracking.')
//       setClassSession(null)
//       clearInterval(trackingInterval.current)
//       trackingInterval.current = undefined
//       await updateUIState()
//       await sendClassEndNotification(classSession)
//       return
//     }

//     if (isFocused) {
//       focusedTimeRef.current += 1
//       console.log(`Focused time updated: ${focusedTimeRef.current}`)
//     } else {
//       distractedTimeRef.current += 1
//       console.log(`Distracted time updated: ${distractedTimeRef.current}`)
//     }

//     lastUpdateTime.current = now.getTime()
//     await updateUIState()
//   }, [
//     classSession,
//     isFocused,
//     setClassSession,
//     sendClassEndNotification,
//     updateUIState,
//   ])

//   const loadTrackingData = useCallback(async () => {
//     try {
//       const data = await AsyncStorage.getItem('trackingData')
//       if (data) {
//         const { focusedTime: savedFocused, distractedTime: savedDistracted } =
//           JSON.parse(data)
//         focusedTimeRef.current = savedFocused || 0
//         distractedTimeRef.current = savedDistracted || 0
//         setFocusedTime(focusedTimeRef.current)
//         setDistractedTime(distractedTimeRef.current)
//         console.log(
//           `Loaded tracking data: Focused=${focusedTimeRef.current}, Distracted=${distractedTimeRef.current}`,
//         )
//       }
//     } catch (error) {
//       console.error('Error loading tracking data:', error)
//     }
//   }, [])

//   const handleAppStateChange = useCallback(
//     async (nextAppState: AppStateStatus) => {
//       console.log(`App state changed to: ${nextAppState}`)
//       const previousAppState = appState.current
//       appState.current = nextAppState

//       if (!classSession) return

//       const now = new Date()
//       const [endHour, endMinute] = classSession.endTime.split(':').map(Number)
//       const classEndTime = new Date(now)
//       classEndTime.setHours(endHour, endMinute, 0, 0)

//       if (now >= classEndTime) {
//         console.log('Class ended via app state change.')
//         setClassSession(null)
//         if (trackingInterval.current) {
//           clearInterval(trackingInterval.current)
//           trackingInterval.current = undefined
//         }
//         await updateUIState()
//         await sendClassEndNotification(classSession)
//         return
//       }

//       if (nextAppState === 'active' && previousAppState !== 'active') {
//         setIsFocused(true)
//         console.log('Resuming focused tracking.')
//         if (lastUpdateTime.current) {
//           const timeAway = Math.floor(
//             (now.getTime() - lastUpdateTime.current) / 1000,
//           )
//           if (timeAway > 0) {
//             distractedTimeRef.current += timeAway
//             console.log(
//               `Added ${timeAway}s to distracted time from background gap.`,
//             )
//             await updateUIState()
//           }
//         }
//       } else if (nextAppState !== 'active' && previousAppState === 'active') {
//         setIsFocused(false)
//         console.log('Switching to distracted tracking.')
//         await sendDistractionNotification()
//       }
//     },
//     [
//       classSession,
//       setClassSession,
//       updateUIState,
//       sendClassEndNotification,
//       sendDistractionNotification,
//     ],
//   )

//   const startTracking = useCallback(() => {
//     if (!trackingInterval.current) {
//       console.log('Starting tracking interval.')
//       trackingInterval.current = setInterval(trackTime, 1000)
//       trackTime()
//     }
//   }, [trackTime])

//   const stopTracking = useCallback(() => {
//     if (trackingInterval.current) {
//       console.log('Stopping tracking interval.')
//       clearInterval(trackingInterval.current)
//       trackingInterval.current = undefined
//     }
//   }, [])

//   useEffect(() => {
//     loadTrackingData()

//     const subscription = AppState.addEventListener(
//       'change',
//       handleAppStateChange,
//     )

//     return () => {
//       subscription.remove()
//       if (trackingInterval.current) clearInterval(trackingInterval.current)
//     }
//   }, [loadTrackingData, handleAppStateChange])

//   return {
//     focusedTime,
//     distractedTime,
//     isFocused,
//     forceRender,
//     startTracking,
//     stopTracking,
//     trackTime,
//     updateUIState,
//     handleAppStateChange,
//   }
// }
