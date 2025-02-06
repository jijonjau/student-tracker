import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, FlatList, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';

const TimetableScreen = () => {
  const [timetable, setTimetable] = useState<{ id: string; subject: string; time: string }[]>([]);
  const [subject, setSubject] = useState('');
  const [time, setTime] = useState('');

  useEffect(() => {
    loadTimetable();
  }, []);

  const saveTimetable = async (updatedTimetable: { id: string; subject: string; time: string }[]) => {
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

  const addTimetableEntry = () => {
    if (subject && time) {
      const updatedTimetable = [...timetable, { id: Date.now().toString(), subject, time }];
      setTimetable(updatedTimetable);
      saveTimetable(updatedTimetable);
      setSubject('');
      setTime('');
    } else {
      Alert.alert('Error', 'Please enter both subject and time.');
    }
  };

  const deleteTimetableEntry = (id: string) => {
    const updatedTimetable = timetable.filter(item => item.id !== id);
    setTimetable(updatedTimetable);
    saveTimetable(updatedTimetable);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Manage Timetable</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Subject"
        placeholderTextColor="#ccc"
        value={subject}
        onChangeText={setSubject}
      />
      <TextInput
        style={styles.input}
        placeholder="Time"
        placeholderTextColor="#ccc"
        value={time}
        onChangeText={setTime}
      />
      
      <View style={styles.buttonContainer}>
        <Button title="Add Entry" onPress={addTimetableEntry} color="#4CAF50" />
      </View>
      
      <FlatList
        data={timetable}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.entry}>
            <Text style={styles.entryText}>{item.subject}</Text>
            <Text style={styles.entryText}>{item.time}</Text>
            <TouchableOpacity onPress={() => deleteTimetableEntry(item.id)}>
              <MaterialIcons name="delete" size={24} color="#FF0000" />
            </TouchableOpacity>
          </View>
        )}
        ListHeaderComponent={() => (
          <View style={styles.header}>
            <Text style={styles.headerText}>Subject</Text>
            <Text style={styles.headerText}>Time</Text>
            <Text style={styles.headerText}>Options</Text>
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
    color: '#333', 
  },
  input: {
    width: '80%', 
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginBottom: 15,
    color: '#333', 
    borderRadius: 10,
    backgroundColor: '#fff', 
  },
  buttonContainer: {
    marginTop: 20,
    borderRadius: 10,
    overflow: 'hidden',
    width: '80%',
    marginBottom: 20, 
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
    backgroundColor: '#4CAF50',
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#000', 
  },
  headerText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
    width: '30%',
    textAlign: 'center',
  },
  entry: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    marginVertical: 5,
    backgroundColor: '#FFFFFF', 
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#000', 
  },
  entryText: {
    fontSize: 18,
    color: '#333', 
    width: '30%',
    textAlign: 'center',
  },
});

export default TimetableScreen;
