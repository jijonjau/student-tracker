import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import TrackingManager from './../../components/TrackingManager'
import TimeDisplay from '././../../components/TimeDisplay'
import FocusBarChart from './../../components/FocusBarChart'
import ActiveClassCard from './../../components/ActiveClassCard'
import { useTracking } from './../../hooks/useTracking'
import { useNotifications } from './../../hooks/useNotifications'
import { useClassSession } from './../../hooks/useClassSession'

const AppUsageScreen = () => {
  const { focusedTime, distractedTime, isFocused, forceRender } = useTracking()

  const { classSession } = useClassSession()

  useNotifications()

  return (
    <View style={styles.container} key={forceRender}>
      <Text style={styles.headerText}>📊 Focus vs. Distraction</Text>

      <FocusBarChart
        focusedTime={focusedTime}
        distractedTime={distractedTime}
      />

      <View style={styles.statsContainer}>
        <TimeDisplay
          focusedTime={focusedTime}
          distractedTime={distractedTime}
        />

        <ActiveClassCard classSession={classSession} isFocused={isFocused} />
      </View>

      <TrackingManager />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f9f9f9',
  },
  headerText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  statsContainer: {
    marginTop: 20,
  },
})

export default AppUsageScreen
