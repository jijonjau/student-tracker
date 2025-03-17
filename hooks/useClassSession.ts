import React, { useState, useEffect, useRef, useCallback } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'

export const useClassSession = () => {
  const [classSession, setClassSession] = useState<{
    id: string
    subject: string
    time: string
    startTime: string
    endTime: string
  } | null>(null)
  const checkInterval = useRef(null)

  const checkForActiveClass = useCallback(async () => {
    try {
      const timetableData = await AsyncStorage.getItem('timetable')
      console.log('Timetable data:', timetableData)
      if (!timetableData) return

      const timetable = JSON.parse(timetableData)
      const now = new Date()

      const activeClass = timetable.find(
        (entry: {
          time: string
          endTime: string
          subject: string
          id: string
        }) => {
          const [startHour, startMinute] = entry.time.split(':').map(Number)
          const [endHour, endMinute] = entry.endTime.split(':').map(Number)

          const startTime = new Date(now)
          startTime.setHours(startHour, startMinute, 0, 0)
          const endTime = new Date(now)
          endTime.setHours(endHour, endMinute, 0, 0)

          if (
            endHour < startHour ||
            (endHour === startHour && endMinute < startMinute)
          ) {
            endTime.setDate(endTime.getDate() + 1)
          }

          const isActive = now >= startTime && now < endTime
          console.log(
            `Checking: ${
              entry.subject
            }, Start=${startTime.toISOString()}, End=${endTime.toISOString()}, Now=${now.toISOString()}, Active=${isActive}`,
          )
          return isActive
        },
      )

      if (
        activeClass &&
        (!classSession || classSession.id !== activeClass.id)
      ) {
        console.log('Active class found:', activeClass)
        setClassSession(activeClass)
      } else if (!activeClass && classSession) {
        console.log('No active class, clearing session.')
        setClassSession(null)
      }
    } catch (error) {
      console.error('Error checking timetable:', error)
    }
  }, [classSession])

  useEffect(() => {
    checkForActiveClass()
    checkInterval.current = setInterval(
      checkForActiveClass,
      5000,
    ) as unknown as null

    return () => {
      if (checkInterval.current) {
        clearInterval(checkInterval.current as NodeJS.Timeout)
      }
    }
  }, [checkForActiveClass])

  return { classSession, setClassSession, checkForActiveClass }
}
