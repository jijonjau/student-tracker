import React, { useEffect } from 'react'
import { View } from 'react-native'
import * as BackgroundFetch from 'expo-background-fetch'
import * as TaskManager from 'expo-task-manager'
import { useTracking } from '../hooks/useTracking'
import { useClassSession } from './../hooks/useClassSession'
import { useNotifications } from './../hooks/useNotifications'

const BACKGROUND_TRACKING_TASK = 'BACKGROUND_TRACKING_TASK'

const TrackingManager = () => {
  const { startTracking, stopTracking, trackTime, handleAppStateChange } =
    useTracking()

  const { classSession } = useClassSession()
  const { sendClassEndNotification } = useNotifications()

  useEffect(() => {
    const registerBackgroundTask = async () => {
      try {
        await BackgroundFetch.registerTaskAsync(BACKGROUND_TRACKING_TASK, {
          minimumInterval: 15,
          stopOnTerminate: false,
          startOnBoot: true,
        })
        console.log('Background tracking registered')
      } catch (error) {
        console.error('Error registering background tracking:', error)
      }
    }

    registerBackgroundTask()

    return () => {
      BackgroundFetch.unregisterTaskAsync(BACKGROUND_TRACKING_TASK).catch(
        console.error,
      )
    }
  }, [])

  if (!TaskManager.isTaskDefined(BACKGROUND_TRACKING_TASK)) {
    TaskManager.defineTask(BACKGROUND_TRACKING_TASK, async () => {
      console.log('Background task running')
      if (classSession) {
        await trackTime()
        return BackgroundFetch.BackgroundFetchResult.NewData
      }
      return BackgroundFetch.BackgroundFetchResult.NoData
    })
  }

  useEffect(() => {
    if (classSession) {
      startTracking()
    } else {
      stopTracking()
    }
  }, [classSession])

  return null
}

export default TrackingManager
