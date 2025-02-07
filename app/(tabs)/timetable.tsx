import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';

const TimetableScreen = () => {
  const [timetable, setTimetable] = useState<{ id: string; subject: string; time: string; endTime: string }[]>([]);
  const [subject, setSubject] = useState('');
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    loadTimetable();
  }, []);

  const saveTimetable = async (updatedTimetable: { id: string; subject: string; time: string; endTime: string }[]) => {
    try {
      await AsyncStorage.setItem('timetable', JSON.stringify(updatedTimetable));
    } catch (error) {
      console.error('Error saving timetable:', error);
    }
  };

  const loadTimetable = async () => {
    try {
      const data = await AsyncStorage.getItem('timetable');
      if (data) setTimetable(JSON.parse(data));
    } catch (error) {
      console.error('Error loading timetable:', error);
    }
  };

  const validateTimeFormat = (timeStr: string) => {
    const regex = /^([01]?\d|2[0-3]):[0-5]\d$/; 
    return regex.test(timeStr);
  };

  const calculateEndTime = (startTime: string, duration: string) => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const endMinutes = minutes + Number(duration);
    const endHours = hours + Math.floor(endMinutes / 60);
    return `${String(endHours % 24).padStart(2, '0')}:${String(endMinutes % 60).padStart(2, '0')}`;
  };

  const addOrUpdateEntry = () => {
    if (!subject || !time || !duration) {
      Alert.alert('Error', 'Please enter subject, start time, and duration.');
      return;
    }
    if (!validateTimeFormat(time)) {
      Alert.alert('Error', 'Invalid time format. Use HH:MM (24-hour format).');
      return;
    }
    const endTime = calculateEndTime(time, duration);
    
    if (editingId) {
      const updatedTimetable = timetable.map(item => 
        item.id === editingId ? { id: editingId, subject, time, endTime } : item
      );
      setTimetable(updatedTimetable);
      saveTimetable(updatedTimetable);
      setEditingId(null);
    } else {
      const newEntry = { id: Date.now().toString(), subject, time, endTime };
      const updatedTimetable = [...timetable, newEntry];
      setTimetable(updatedTimetable);
      saveTimetable(updatedTimetable);
    }

    setSubject('');
    setTime('');
    setDuration('');
  };

  const deleteEntry = (id: string) => {
    Alert.alert('Confirm Delete', 'Are you sure you want to delete this entry?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        onPress: () => {
          const updatedTimetable = timetable.filter(item => item.id !== id);
          setTimetable(updatedTimetable);
          saveTimetable(updatedTimetable);
        },
        style: 'destructive',
      },
    ]);
  };

  const startEditing = (item: { id: string; subject: string; time: string; endTime: string }) => {
    setSubject(item.subject);
    setTime(item.time);
    setDuration(''); 
    setEditingId(item.id);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📅 Manage Timetable</Text>

      <TextInput style={styles.input} placeholder="Subject" value={subject} onChangeText={setSubject} />
      <TextInput style={styles.input} placeholder="Start Time (HH:MM)" value={time} onChangeText={setTime} />
      <TextInput style={styles.input} placeholder="Duration (mins)" keyboardType="numeric" value={duration} onChangeText={setDuration} />

      <TouchableOpacity style={styles.addButton} onPress={addOrUpdateEntry}>
        <Text style={styles.addButtonText}>{editingId ? 'Update Entry' : 'Add Entry'}</Text>
      </TouchableOpacity>

      <FlatList
        data={timetable}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.entry}>
            <View>
              <Text style={styles.entryText}>{item.subject}</Text>
              <Text style={styles.entryTime}>{item.time} - {item.endTime}</Text>
            </View>
            <View style={styles.iconContainer}>
              <TouchableOpacity onPress={() => startEditing(item)}>
                <MaterialIcons name="edit" size={24} color="#2196F3" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => deleteEntry(item.id)}>
                <MaterialIcons name="delete" size={24} color="#FF0000" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F5F5F5',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#CCC',
    padding: 10,
    marginBottom: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  addButton: {
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  entry: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#FFF',
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  entryText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  entryTime: {
    fontSize: 14,
    color: '#666',
  },
  iconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
});

export default TimetableScreen;