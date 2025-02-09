import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Papa from 'papaparse';
import * as Sharing from 'expo-sharing';
import * as Permissions from 'expo-permissions';

interface TimetableEntry {
  id: string;
  subject: string;
  time: string;
  endTime: string;
}

const TimetableScreen = () => {
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [subject, setSubject] = useState('');
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState('');

  useEffect(() => {
    loadTimetable();
  }, []);

  const saveTimetable = async (updatedTimetable: TimetableEntry[]) => {
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

  const deleteEntry = async (id: string) => {
    const updatedTimetable = timetable.filter((item) => item.id !== id);
    setTimetable(updatedTimetable);
    await saveTimetable(updatedTimetable);
  };

  const calculateEndTime = (startTime: string, duration: string) => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const endMinutes = minutes + Number(duration);
    const endHours = hours + Math.floor(endMinutes / 60);
    return `${String(endHours % 24).padStart(2, '0')}:${String(endMinutes % 60).padStart(2, '0')}`;
  };

  const addEntry = () => {
    if (!subject || !time || !duration) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const newEntry = {
      id: Date.now().toString(),
      subject,
      time,
      endTime: calculateEndTime(time, duration),
    };

    const updatedTimetable = [...timetable, newEntry].sort((a, b) => a.time.localeCompare(b.time));
    setTimetable(updatedTimetable);
    saveTimetable(updatedTimetable);
    setSubject('');
    setTime('');
    setDuration('');
  };

  const parseCSVData = (csvText: string) => {
    const parsed = Papa.parse(csvText, { header: true });
    if (parsed.errors.length > 0) {
      Alert.alert('Error', 'Invalid CSV file format');
      return [];
    }
    return parsed.data.map((entry: any) => ({
      id: Date.now().toString(),
      subject: entry.subject,
      time: entry.time,
      endTime: calculateEndTime(entry.time, entry.duration),
    })).sort((a, b) => a.time.localeCompare(b.time));
  };

  // const handleFileUpload = async () => {
  //   try {
  //     const result = await DocumentPicker.getDocumentAsync({
  //       type: 'text/csv',
  //       copyToCacheDirectory: false, // Ensures the file isn't moved
  //     });
  
  //     console.log('Document Picker Result:', result);
  
  //     if (result.canceled) {
  //       console.log('User canceled file selection.');
  //       return;
  //     }
  
  //     if (!result.assets || result.assets.length === 0) {
  //       Alert.alert('Error', 'No file selected');
  //       return;
  //     }
  
  //     const fileUri = result.assets[0].uri;
  //     console.log('Selected file URI:', fileUri);
  
  //     const fileContent = await FileSystem.readAsStringAsync(fileUri);
  //     console.log('File Content:', fileContent);
  
  //     const extractedData = parseCSVData(fileContent);
  
  //     if (extractedData.length > 0) {
  //       setTimetable(extractedData);
  //       saveTimetable(extractedData);
  //       Alert.alert('Success', 'Timetable uploaded successfully!');
  //     } else {
  //       Alert.alert('Error', 'Invalid CSV data');
  //     }
  //   } catch (error) {
  //     console.error('Error uploading file:', error);
  //     Alert.alert('Error', 'An error occurred while uploading the file');
  //   }
  // };
  
  // const handleFileUpload = async () => {
  //   try {
  //     const result = await DocumentPicker.getDocumentAsync({
  //       type: 'text/csv',
  //       copyToCacheDirectory: false, // Ensures the file isn't moved
  //     });
  
  //     console.log('Document Picker Result:', result);
  
  //     if (result.canceled) {
  //       console.log('User canceled file selection.');
  //       return;
  //     }
  
  //     const fileUri = result.assets[0].uri;
  //       console.log('Selected file URI:', fileUri);
  
  //     const fileContent = await FileSystem.readAsStringAsync(fileUri);
  //     console.log('File Content:', fileContent);
  
  //     const extractedData = parseCSVData(fileContent);
  
  //     if (extractedData.length > 0) {
  //       setTimetable(extractedData);
  //       saveTimetable(extractedData);
  //       Alert.alert('Success', 'Timetable uploaded successfully!');
  //     } else {
  //       Alert.alert('Error', 'Invalid CSV data');
  //     }
  //   } catch (error) {
  //     console.error('Error uploading file:', error);
  //     Alert.alert('Error', 'An error occurred while uploading the file');
  //   }
  // };

  
const handleFileUpload = async () => {
  try {
    const { status } = await Permissions.askAsync(Permissions.MEDIA_LIBRARY);
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Permission to access media library is required!');
      return;
    }

    const result = await DocumentPicker.getDocumentAsync({
      type: 'text/csv',
      copyToCacheDirectory: false, // Ensures the file isn't moved
    });

    console.log('Document Picker Result:', result);

    if (result.canceled) {
      console.log('User canceled file selection.');
      return;
    }

    const fileUri = result.assets[0].uri;
    console.log('Selected file URI:', fileUri);

    const fileContent = await FileSystem.readAsStringAsync(fileUri);
    console.log('File Content:', fileContent);

    const extractedData = parseCSVData(fileContent);

    if (extractedData.length > 0) {
      setTimetable(extractedData);
      saveTimetable(extractedData);
      Alert.alert('Success', 'Timetable uploaded successfully!');
    } else {
      Alert.alert('Error', 'Invalid CSV data');
    }
  } catch (error) {
    console.error('Error uploading file:', error);
    Alert.alert('Error', 'An error occurred while uploading the file');
  }
};

  const downloadSampleCSV = async () => {
    const sampleData = 'subject,time,duration\nMath,08:00,60\nScience,09:30,45';
    const uri = FileSystem.documentDirectory + 'sample_timetable.csv';
    
    try {
      await FileSystem.writeAsStringAsync(uri, sampleData);
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri);
      } else {
        Alert.alert('Error', 'Sharing is not available on this device');
      }
    } catch (error) {
      console.error('Error writing file:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📅 Manage Timetable</Text>
      <TextInput style={styles.input} placeholder="Subject" value={subject} onChangeText={setSubject} />
      <TextInput style={styles.input} placeholder="Start Time (HH:MM)" value={time} onChangeText={setTime} />
      <TextInput style={styles.input} placeholder="Duration (mins)" keyboardType="numeric" value={duration} onChangeText={setDuration} />

      <TouchableOpacity style={styles.button} onPress={addEntry}>
        <Text style={styles.buttonText}>Add Class</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={handleFileUpload}>
        <Text style={styles.buttonText}>Upload Timetable (CSV)</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={downloadSampleCSV}>
        <Text style={styles.buttonText}>Download Sample CSV</Text>
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
            <MaterialIcons name="delete" size={24} color="#FF0000" onPress={() => deleteEntry(item.id)} />
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#F5F5F5' },
  title: { fontSize: 26, fontWeight: 'bold', textAlign: 'center', marginBottom: 20, color: '#333' },
  input: { borderWidth: 1, borderColor: '#CCC', padding: 10, marginBottom: 10, backgroundColor: '#fff', borderRadius: 8 },
  button: { backgroundColor: '#4CAF50', padding: 12, borderRadius: 8, alignItems: 'center', marginBottom: 20 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  entry: { flexDirection: 'row', justifyContent: 'space-between', padding: 12, backgroundColor: '#FFF', borderRadius: 8, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 },
  entryText: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  entryTime: { fontSize: 14, color: '#666' }
});

export default TimetableScreen;