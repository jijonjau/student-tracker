import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { formatTime } from '../utils/timeUtils'

export interface TimeDisplayProps {
  focusedTime: number
  distractedTime: number
}

const TimeDisplay: React.FC<TimeDisplayProps> = ({
  focusedTime,
  distractedTime,
}) => {
  const totalTime = focusedTime + distractedTime

  return (
    <View style={styles.container}>
      <Text style={styles.timeText}>
        🟢 Focused Time: {formatTime(focusedTime)}
      </Text>
      <Text style={styles.timeText}>
        🔴 Distracted Time: {formatTime(distractedTime)}
      </Text>
      <Text style={[styles.timeText, styles.totalText]}>
        ⏳ Total Time Tracked: {formatTime(totalTime)}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 15,
  },
  timeText: {
    fontSize: 16,
    marginBottom: 5,
  },
  totalText: {
    fontWeight: '500',
    marginTop: 5,
  },
})

export default TimeDisplay
