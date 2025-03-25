import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native'
import { useClassSession } from '../hooks/useClassSession'

interface ClassListCardProps {
  classSessions: any[] // Replace with your actual class session type
  activeClassId: string | null
}

const ClassListCard: React.FC<ClassListCardProps> = ({ classSessions, activeClassId }) => {
  const { startClassSession, endClassSession } = useClassSession()

  if (!classSessions || classSessions.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.headerText}>Your Classes</Text>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No classes added yet</Text>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Text style={styles.headerText}>Your Classes</Text>
      <ScrollView style={styles.classesList} horizontal={false}>
        {classSessions.map((session) => (
          <TouchableOpacity
            key={session.id}
            style={[
              styles.classItem,
              activeClassId === session.id && styles.activeClassItem
            ]}
            onPress={() => {
              if (activeClassId === session.id) {
                endClassSession()
              } else {
                startClassSession(session)
              }
            }}
          >
            <Text style={styles.className}>{session.name}</Text>
            <View style={styles.classStatus}>
              {activeClassId === session.id ? (
                <View style={styles.activeIndicator}>
                  <Text style={styles.activeText}>Active</Text>
                </View>
              ) : (
                <View style={styles.startButton}>
                  <Text style={styles.startButtonText}>Start</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
    container: {
      backgroundColor: '#fff',
      borderRadius: 12,
      padding: 16,
      marginVertical: 16,
      elevation: 3,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.22,
      shadowRadius: 2.22,
    },
    headerText: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 12,
      color: '#333',
    },
    classesList: {
      maxHeight: 200,
    },
    classItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 8,
      borderBottomWidth: 1,
      borderBottomColor: '#f0f0f0',
    },
    activeClassItem: {
      backgroundColor: '#f5f9ff',
      borderRadius: 8,
    },
    className: {
      fontSize: 16,
      fontWeight: '500',
      color: '#444',
      flex: 1,
    },
    classStatus: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    activeIndicator: {
      backgroundColor: '#4CAF50',
      paddingVertical: 4,
      paddingHorizontal: 12,
      borderRadius: 16,
    },
    activeText: {
      color: '#fff',
      fontSize: 12,
      fontWeight: 'bold',
    },
    startButton: {
      backgroundColor: '#f0f0f0',
      paddingVertical: 4,
      paddingHorizontal: 12,
      borderRadius: 16,
    },
    startButtonText: {
      color: '#555',
      fontSize: 12,
      fontWeight: '500',
    },
    emptyContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
    },
    emptyText: {
      color: '#888',
      fontSize: 14,
    }
  })
  
  export default ClassListCard