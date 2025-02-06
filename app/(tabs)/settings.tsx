import React, { useState, useEffect } from 'react';
import { View, Text, Switch, Button, Alert, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SettingsScreen = () => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [trackingEnabled, setTrackingEnabled] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const notifications = await AsyncStorage.getItem('notificationsEnabled');
      const tracking = await AsyncStorage.getItem('trackingEnabled');
      if (notifications !== null) setNotificationsEnabled(JSON.parse(notifications));
      if (tracking !== null) setTrackingEnabled(JSON.parse(tracking));
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveSettings = async () => {
    try {
      await AsyncStorage.setItem('notificationsEnabled', JSON.stringify(notificationsEnabled));
      await AsyncStorage.setItem('trackingEnabled', JSON.stringify(trackingEnabled));
      Alert.alert('Success', 'Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>
      
      <View style={styles.setting}>
        <Text style={styles.settingText}>Enable Notifications</Text>
        <Switch
          value={notificationsEnabled}
          onValueChange={setNotificationsEnabled}
          trackColor={{ false: '#767577', true: '#4CAF50' }}
          thumbColor={notificationsEnabled ? '#81C784' : '#f4f3f4'}
        />
      </View>
      
      <View style={styles.setting}>
        <Text style={styles.settingText}>Enable Tracking</Text>
        <Switch
          value={trackingEnabled}
          onValueChange={setTrackingEnabled}
          trackColor={{ false: '#767577', true: '#4CAF50' }}
          thumbColor={trackingEnabled ? '#81C784' : '#f4f3f4'}
        />
      </View>
      
      <View style={styles.buttonContainer}>
        <Button title='Save Settings' onPress={saveSettings} color="#4CAF50" />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F5F5F5', 
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
    color: '#333', 
  },
  setting: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#FFFFFF', 
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  settingText: {
    fontSize: 18,
    color: '#333', 
  },
  buttonContainer: {
    marginTop: 20,
    borderRadius: 10,
    overflow: 'hidden',
  },
});

export default SettingsScreen;