import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, Dimensions } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import { TimeDisplayProps } from './TimeDisplay'

const FocusBarChart: React.FC<TimeDisplayProps> = ({
  focusedTime,
  distractedTime,
}) => {
  const totalTime = focusedTime + distractedTime
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const focusedWidth = useSharedValue(0)
  const distractedWidth = useSharedValue(0)

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

  return (
    <View style={styles.container}>
      {totalTime > 0 ? (
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
              <View
                style={[styles.legendColor, { backgroundColor: '#4CAF50' }]}
              />
              <Text>Focused</Text>
            </View>
            <View style={styles.legendItem}>
              <View
                style={[styles.legendColor, { backgroundColor: '#FF5252' }]}
              />
              <Text>Distracted</Text>
            </View>
          </View>
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
    height: 220,
    justifyContent: 'center',
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
})

export default FocusBarChart
