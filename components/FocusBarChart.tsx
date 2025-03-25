import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'

// Expanded interface to support multiple classes
export interface TimeDisplayProps {
  focusedTime: number
  distractedTime: number
  classBreakdown?: ClassTimeData[]
  onClassSelect?: (classId: string) => void
}

export interface ClassTimeData {
  id: string
  name: string
  focusedTime: number
  distractedTime: number
  color?: string // Optional custom color for each class
}

const FocusBarChart: React.FC<TimeDisplayProps> = ({
  focusedTime,
  distractedTime,
  classBreakdown = [],
  onClassSelect,
}) => {
  const totalTime = focusedTime + distractedTime
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const focusedWidth = useSharedValue(0)
  const distractedWidth = useSharedValue(0)
  const [selectedView, setSelectedView] = useState<'summary' | 'classes'>('summary')
  const [expandedClass, setExpandedClass] = useState<string | null>(null)

  // Class color palette
  const classColors = [
    '#4CAF50', '#2196F3', '#9C27B0', '#FF9800', '#3F51B5',
    '#009688', '#E91E63', '#673AB7', '#FFC107', '#00BCD4'
  ]

  useEffect(() => {
    if (totalTime > 0 && dimensions.width > 0) {
      focusedWidth.value = withTiming(
        (focusedTime / totalTime) * dimensions.width,
      )
      distractedWidth.value = withTiming(
        (distractedTime / totalTime) * dimensions.width,
      )
    } else {
      focusedWidth.value = withTiming(0)
      distractedWidth.value = withTiming(0)
    }
  }, [focusedTime, distractedTime, totalTime, dimensions.width])

  const focusedBarStyle = useAnimatedStyle(() => {
    return {
      width: focusedWidth.value,
    }
  })

  const distractedBarStyle = useAnimatedStyle(() => {
    return {
      width: distractedWidth.value,
    }
  })

  const onLayout = (event: {
    nativeEvent: { layout: { width: any; height: any } }
  }) => {
    const { width, height } = event.nativeEvent.layout
    setDimensions({ width, height })
  }

  const focusedPercentage =
    totalTime > 0 ? Math.round((focusedTime / totalTime) * 100) : 0
  const distractedPercentage =
    totalTime > 0 ? Math.round((distractedTime / totalTime) * 100) : 0

  const handleClassClick = (classId: string) => {
    setExpandedClass(expandedClass === classId ? null : classId)
    if (onClassSelect) {
      onClassSelect(classId)
    }
  }

  const renderSummaryView = () => (
    <>
      <View style={styles.barsContainer} onLayout={onLayout}>
        <View style={styles.barLabelsContainer}>
          <Text style={styles.barLabel}>Focused</Text>
          <Text style={styles.barPercentage}>{focusedPercentage}%</Text>
        </View>
        <View style={styles.barOuterContainer}>
          <Animated.View style={[styles.focusedBar, focusedBarStyle]}>
            <LinearGradient
              colors={['#4CAF50', '#8BC34A']}
              style={styles.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
          </Animated.View>
        </View>

        <View style={styles.barLabelsContainer}>
          <Text style={styles.barLabel}>Distracted</Text>
          <Text style={styles.barPercentage}>{distractedPercentage}%</Text>
        </View>
        <View style={styles.barOuterContainer}>
          <Animated.View style={[styles.distractedBar, distractedBarStyle]}>
            <LinearGradient
              colors={['#FF5252', '#FF1744']}
              style={styles.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
          </Animated.View>
        </View>
      </View>

      <View style={styles.legendContainer}>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#4CAF50' }]} />
          <Text>Focused</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#FF5252' }]} />
          <Text>Distracted</Text>
        </View>
      </View>
    </>
  )

  const renderClassesView = () => (
    <ScrollView style={styles.classesScrollView}>
      {classBreakdown.map((classData, index) => {
        const classTotal = classData.focusedTime + classData.distractedTime
        const classFocusedPercentage = 
          classTotal > 0 ? Math.round((classData.focusedTime / classTotal) * 100) : 0
        const classColor = classData.color || classColors[index % classColors.length]
        
        return (
          <TouchableOpacity 
            key={classData.id} 
            style={[
              styles.classContainer,
              expandedClass === classData.id && styles.expandedClassContainer
            ]}
            onPress={() => handleClassClick(classData.id)}
          >
            <View style={styles.classHeader}>
              <Text style={styles.className}>
                {classData.name}
              </Text>
              <Text style={styles.classPercentage}>
                {classFocusedPercentage}% focused
              </Text>
            </View>
            
            <View style={styles.barOuterContainer}>
              <View 
                style={[
                  styles.classBar, 
                  { 
                    width: `${classFocusedPercentage}%`,
                    backgroundColor: classColor
                  }
                ]} 
              />
            </View>
            
            {expandedClass === classData.id && (
              <View style={styles.classDetails}>
                <Text style={styles.classDetailText}>
                  Focused: {formatTime(classData.focusedTime)}
                </Text>
                <Text style={styles.classDetailText}>
                  Distracted: {formatTime(classData.distractedTime)}
                </Text>
                <Text style={[styles.classDetailText, styles.totalText]}>
                  Total: {formatTime(classTotal)}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        )
      })}
    </ScrollView>
  )

  // Simple time formatting helper
  const formatTime = (milliseconds: number): string => {
    const seconds = Math.floor(milliseconds / 1000)
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
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedView === 'summary' && styles.selectedTab]}
          onPress={() => setSelectedView('summary')}
        >
          <Text style={[
            styles.tabText, 
            selectedView === 'summary' && styles.selectedTabText
          ]}>
            Daily Summary
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedView === 'classes' && styles.selectedTab]}
          onPress={() => setSelectedView('classes')}
        >
          <Text style={[
            styles.tabText, 
            selectedView === 'classes' && styles.selectedTabText
          ]}>
            Classes
          </Text>
        </TouchableOpacity>
      </View>

      {totalTime > 0 ? (
        <>
          {selectedView === 'summary' ? renderSummaryView() : renderClassesView()}
        </>
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No tracking data yet</Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    height: 320, // Increased height for class details
    justifyContent: 'flex-start',
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 15,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  tab: {
    flex: 1,
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  selectedTab: {
    backgroundColor: '#E8F5E9',
  },
  tabText: {
    fontWeight: '500',
    color: '#757575',
  },
  selectedTabText: {
    color: '#388E3C',
    fontWeight: 'bold',
  },
  barsContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  barLabelsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
    marginTop: 10,
  },
  barLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  barPercentage: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  barOuterContainer: {
    height: 20,
    backgroundColor: '#E0E0E0',
    borderRadius: 10,
    overflow: 'hidden',
  },
  focusedBar: {
    height: '100%',
    borderRadius: 10,
    overflow: 'hidden',
  },
  distractedBar: {
    height: '100%',
    borderRadius: 10,
    overflow: 'hidden',
  },
  gradient: {
    flex: 1,
    borderRadius: 10,
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 5,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#757575',
    fontStyle: 'italic',
  },
  classesScrollView: {
    flex: 1,
  },
  classContainer: {
    marginBottom: 15,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  expandedClassContainer: {
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  classHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  className: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
  },
  classPercentage: {
    fontSize: 14,
    fontWeight: '500',
  },
  classBar: {
    height: '100%',
    borderRadius: 10,
  },
  classDetails: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  classDetailText: {
    fontSize: 14,
    marginBottom: 4,
  },
  totalText: {
    fontWeight: '500',
    marginTop: 4,
  },
})

export default FocusBarChart

// import React, { useEffect, useState } from 'react'
// import { View, Text, StyleSheet, Dimensions } from 'react-native'
// import { LinearGradient } from 'expo-linear-gradient'
// import Animated, {
//   useAnimatedStyle,
//   useSharedValue,
//   withTiming,
// } from 'react-native-reanimated'
// import { TimeDisplayProps } from './TimeDisplay'

// const FocusBarChart: React.FC<TimeDisplayProps> = ({
//   focusedTime,
//   distractedTime,
// }) => {
//   const totalTime = focusedTime + distractedTime
//   const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
//   const focusedWidth = useSharedValue(0)
//   const distractedWidth = useSharedValue(0)

//   useEffect(() => {
//     if (totalTime > 0 && dimensions.width > 0) {
//       focusedWidth.value = withTiming(
//         (focusedTime / totalTime) * dimensions.width,
//       )
//       distractedWidth.value = withTiming(
//         (distractedTime / totalTime) * dimensions.width,
//       )
//     } else {
//       focusedWidth.value = withTiming(0)
//       distractedWidth.value = withTiming(0)
//     }
//   }, [focusedTime, distractedTime, totalTime, dimensions.width])

//   const focusedBarStyle = useAnimatedStyle(() => {
//     return {
//       width: focusedWidth.value,
//     }
//   })

//   const distractedBarStyle = useAnimatedStyle(() => {
//     return {
//       width: distractedWidth.value,
//     }
//   })

//   const onLayout = (event: {
//     nativeEvent: { layout: { width: any; height: any } }
//   }) => {
//     const { width, height } = event.nativeEvent.layout
//     setDimensions({ width, height })
//   }

//   const focusedPercentage =
//     totalTime > 0 ? Math.round((focusedTime / totalTime) * 100) : 0
//   const distractedPercentage =
//     totalTime > 0 ? Math.round((distractedTime / totalTime) * 100) : 0

//   return (
//     <View style={styles.container}>
//       {totalTime > 0 ? (
//         <>
//           <View style={styles.barsContainer} onLayout={onLayout}>
//             <View style={styles.barLabelsContainer}>
//               <Text style={styles.barLabel}>Focused</Text>
//               <Text style={styles.barPercentage}>{focusedPercentage}%</Text>
//             </View>
//             <View style={styles.barOuterContainer}>
//               <Animated.View style={[styles.focusedBar, focusedBarStyle]}>
//                 <LinearGradient
//                   colors={['#4CAF50', '#8BC34A']}
//                   style={styles.gradient}
//                   start={{ x: 0, y: 0 }}
//                   end={{ x: 1, y: 0 }}
//                 />
//               </Animated.View>
//             </View>

//             <View style={styles.barLabelsContainer}>
//               <Text style={styles.barLabel}>Distracted</Text>
//               <Text style={styles.barPercentage}>{distractedPercentage}%</Text>
//             </View>
//             <View style={styles.barOuterContainer}>
//               <Animated.View style={[styles.distractedBar, distractedBarStyle]}>
//                 <LinearGradient
//                   colors={['#FF5252', '#FF1744']}
//                   style={styles.gradient}
//                   start={{ x: 0, y: 0 }}
//                   end={{ x: 1, y: 0 }}
//                 />
//               </Animated.View>
//             </View>
//           </View>

//           <View style={styles.legendContainer}>
//             <View style={styles.legendItem}>
//               <View
//                 style={[styles.legendColor, { backgroundColor: '#4CAF50' }]}
//               />
//               <Text>Focused</Text>
//             </View>
//             <View style={styles.legendItem}>
//               <View
//                 style={[styles.legendColor, { backgroundColor: '#FF5252' }]}
//               />
//               <Text>Distracted</Text>
//             </View>
//           </View>
//         </>
//       ) : (
//         <View style={styles.emptyContainer}>
//           <Text style={styles.emptyText}>No tracking data yet</Text>
//         </View>
//       )}
//     </View>
//   )
// }

// const styles = StyleSheet.create({
//   container: {
//     height: 220,
//     justifyContent: 'center',
//   },
//   barsContainer: {
//     flex: 1,
//     justifyContent: 'center',
//   },
//   barLabelsContainer: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     marginBottom: 2,
//     marginTop: 10,
//   },
//   barLabel: {
//     fontSize: 14,
//     fontWeight: '500',
//     color: '#333',
//   },
//   barPercentage: {
//     fontSize: 14,
//     fontWeight: 'bold',
//   },
//   barOuterContainer: {
//     height: 20,
//     backgroundColor: '#E0E0E0',
//     borderRadius: 10,
//     overflow: 'hidden',
//   },
//   focusedBar: {
//     height: '100%',
//     borderRadius: 10,
//     overflow: 'hidden',
//   },
//   distractedBar: {
//     height: '100%',
//     borderRadius: 10,
//     overflow: 'hidden',
//   },
//   gradient: {
//     flex: 1,
//     borderRadius: 10,
//   },
//   legendContainer: {
//     flexDirection: 'row',
//     justifyContent: 'center',
//     marginTop: 20,
//   },
//   legendItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginHorizontal: 10,
//   },
//   legendColor: {
//     width: 12,
//     height: 12,
//     borderRadius: 6,
//     marginRight: 5,
//   },
//   emptyContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   emptyText: {
//     fontSize: 16,
//     color: '#757575',
//     fontStyle: 'italic',
//   },
// })

// export default FocusBarChart
