import React from 'react'
import { View, Text, StyleSheet } from 'react-native'

interface ClassSession {
  subject: string
  time: string
  endTime: string
}

interface ActiveClassCardProps {
  classSession: ClassSession | null
  isFocused: boolean
}

const ActiveClassCard: React.FC<ActiveClassCardProps> = ({
  classSession,
  isFocused,
}) => {
  if (!classSession) {
    return <Text style={styles.noClassText}>No active class</Text>
  }

  return (
    <View style={styles.container}>
      <Text style={styles.titleText}>
        📚 Current Class: {classSession.subject}
      </Text>
      <Text style={styles.timeText}>
        ⏰ {classSession.time} - {classSession.endTime}
      </Text>
      <View style={styles.statusContainer}>
        <View
          style={[
            styles.statusIndicator,
            { backgroundColor: isFocused ? '#4CAF50' : '#FF5252' },
          ]}
        />
        <Text style={styles.statusText}>
          Status: {isFocused ? 'Focused' : 'Distracted'}
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 15,
    backgroundColor: '#e6f7ff',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#1890ff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  titleText: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 5,
  },
  timeText: {
    fontSize: 14,
    color: '#555',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  noClassText: {
    fontStyle: 'italic',
    color: '#757575',
    marginTop: 5,
  },
})

export default ActiveClassCard
