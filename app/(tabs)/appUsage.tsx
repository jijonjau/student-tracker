import React, { useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import TrackingManager from './../../components/TrackingManager'
import TimeDisplay from './../../components/TimeDisplay'
import FocusBarChart from './../../components/FocusBarChart'
import ActiveClassCard from './../../components/ActiveClassCard'
import ClassListCard from './../../components/ClassListCard' // New component we'll create
import { useTracking } from './../../hooks/useTracking'
import { useNotifications } from './../../hooks/useNotifications'
import { useClassSession } from './../../hooks/useClassSession'

const AppUsageScreen = () => {
  const { 
    focusedTime, 
    distractedTime, 
    isFocused, 
    forceRender, 
    classBreakdownArray 
  } = useTracking()
  
  const { classSession, allClassSessions } = useClassSession()
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null)
  
  useNotifications()

  const handleClassSelect = (classId: string) => {
    setSelectedClassId(classId === selectedClassId ? null : classId)
  }

  return (
    <View style={styles.container} key={forceRender}>
      <Text style={styles.headerText}>📊 Focus Overview</Text>

      <FocusBarChart
        focusedTime={focusedTime}
        distractedTime={distractedTime}
        classBreakdown={classBreakdownArray}
        onClassSelect={handleClassSelect}
      />

      <View style={styles.statsContainer}>
        <TimeDisplay
          focusedTime={focusedTime}
          distractedTime={distractedTime}
        />

        {selectedClassId ? (
          <ClassDetailView classId={selectedClassId} />
        ) : (
          <ActiveClassCard classSession={classSession} isFocused={isFocused} />
        )}
      </View>

      <ClassListCard 
        classSessions={allClassSessions} 
        activeClassId={classSession?.id}
      />

      <TrackingManager />
    </View>
  )
}

// Component to show detailed view of a selected class
const ClassDetailView = ({ classId }: { classId: string }) => {
  const { classBreakdown } = useTracking()
  const classData = classBreakdown[classId]
  
  if (!classData) {
    return null
  }
  
  const totalTime = classData.focusedTime + classData.distractedTime
  const focusedPercentage = totalTime > 0 
    ? Math.round((classData.focusedTime / totalTime) * 100) 
    : 0
  
  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`
    } else {
      return `${seconds}s`
    }
  }
  
  return (
    <View style={styles.classDetailCard}>
      <Text style={styles.classDetailTitle}>{classData.name}</Text>
      
      <View style={styles.classMetricsContainer}>
        <View style={styles.classMetric}>
          <Text style={styles.metricValue}>{focusedPercentage}%</Text>
          <Text style={styles.metricLabel}>Focus Rate</Text>
        </View>
        
        <View style={styles.classMetric}>
          <Text style={styles.metricValue}>{formatTime(totalTime)}</Text>
          <Text style={styles.metricLabel}>Total Time</Text>
        </View>
      </View>
      
      <View style={styles.timeBreakdown}>
        <Text style={styles.timeBreakdownItem}>
          🟢 Focused: {formatTime(classData.focusedTime)}
        </Text>
        <Text style={styles.timeBreakdownItem}>
          🔴 Distracted: {formatTime(classData.distractedTime)}
        </Text>
      </View>
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
  classDetailCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  classDetailTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  classMetricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  classMetric: {
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  metricLabel: {
    fontSize: 14,
    color: '#757575',
    marginTop: 4,
  },
  timeBreakdown: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
  },
  timeBreakdownItem: {
    fontSize: 15,
    marginBottom: 8,
  },
})

export default AppUsageScreen

// import React, { useEffect, useState } from 'react'
// import { View, Text, StyleSheet } from 'react-native'
// import TrackingManager from './../../components/TrackingManager'
// import TimeDisplay from '././../../components/TimeDisplay'
// import FocusBarChart from './../../components/FocusBarChart'
// import ActiveClassCard from './../../components/ActiveClassCard'
// import { useTracking } from './../../hooks/useTracking'
// import { useNotifications } from './../../hooks/useNotifications'
// import { useClassSession } from './../../hooks/useClassSession'

// const AppUsageScreen = () => {
//   const { focusedTime, distractedTime, isFocused, forceRender } = useTracking()

//   const { classSession } = useClassSession()

//   useNotifications()

//   return (
//     <View style={styles.container} key={forceRender}>
//       <Text style={styles.headerText}>📊 Focus vs. Distraction</Text>

//       <FocusBarChart
//         focusedTime={focusedTime}
//         distractedTime={distractedTime}
//       />

//       <View style={styles.statsContainer}>
//         <TimeDisplay
//           focusedTime={focusedTime}
//           distractedTime={distractedTime}
//         />

//         <ActiveClassCard classSession={classSession} isFocused={isFocused} />
//       </View>

//       <TrackingManager />
//     </View>
//   )
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     padding: 20,
//     backgroundColor: '#f9f9f9',
//   },
//   headerText: {
//     fontSize: 20,
//     fontWeight: 'bold',
//     marginBottom: 15,
//   },
//   statsContainer: {
//     marginTop: 20,
//   },
// })

// export default AppUsageScreen
