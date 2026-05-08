import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView, Alert, TextInput, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Colors } from '../constants/colors';

interface SettingsScreenProps {
  onBack: () => void;
  isDarkMode: boolean;
  setIsDarkMode: (value: boolean) => void;
}

export default function SettingsScreen({ onBack, isDarkMode, setIsDarkMode }: SettingsScreenProps) {
  const [pushToken, setPushToken] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [testMessage, setTestMessage] = useState('Hello from Apsara!');
  const [tokenCopied, setTokenCopied] = useState(false);

  useEffect(() => {
    registerForPushNotifications();
  }, []);

  const registerForPushNotifications = async () => {
    if (!Device.isDevice) {
      Alert.alert('Info', 'Push notifications work on physical devices only.');
      return;
    }

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        Alert.alert('Error', 'Failed to get push notification permissions');
        return;
      }

      const token = await Notifications.getExpoPushTokenAsync();
      setPushToken(token.data);
    } catch (error) {
      Alert.alert('Error', `Failed to get push token: ${error}`);
    }
  };

  const copyToClipboard = () => {
    if (pushToken) {
      // In a real app, you'd use a clipboard library
      Alert.alert('Token Copied', pushToken);
      setTokenCopied(true);
      setTimeout(() => setTokenCopied(false), 2000);
    }
  };

  const sendTestNotification = async () => {
    if (!pushToken || !testMessage.trim()) {
      Alert.alert('Error', 'Please get token first and enter a message');
      return;
    }

    setLoading(true);
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Test Notification',
          body: testMessage,
          data: { timestamp: new Date().toISOString() },
          sound: 'default',
          badge: 1,
        },
        trigger: null,
      });
      Alert.alert('Success', 'Test notification sent!');
    } catch (error) {
      Alert.alert('Error', `Failed to send notification: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const getNewToken = async () => {
    setLoading(true);
    try {
      await registerForPushNotifications();
      Alert.alert('Success', 'Token refreshed');
    } catch (error) {
      Alert.alert('Error', `Failed to refresh token: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Appearance</Text>
          <View style={styles.settingItem}>
            <View style={styles.settingLabelContainer}>
              <View style={[styles.iconContainer, { backgroundColor: '#f1f5f9' }]}>
                <Ionicons name="moon-outline" size={20} color={Colors.text} />
              </View>
              <Text style={styles.settingLabel}>Dark Mode</Text>
            </View>
            <Switch
              value={isDarkMode}
              onValueChange={setIsDarkMode}
              trackColor={{ false: '#e2e8f0', true: Colors.sky }}
              thumbColor="#fff"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Push Notifications Testing</Text>

          <TouchableOpacity
            style={styles.button}
            onPress={getNewToken}
            disabled={loading}
          >
            {loading && <ActivityIndicator color="#fff" style={{ marginRight: 8 }} />}
            <Ionicons name="paper-plane" size={18} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.buttonText}>Get Push Token</Text>
          </TouchableOpacity>

          {pushToken ? (
            <View style={styles.tokenContainer}>
              <View style={styles.tokenHeader}>
                <Text style={styles.tokenLabel}>Your Push Token:</Text>
                <TouchableOpacity
                  onPress={copyToClipboard}
                  style={styles.copyButton}
                >
                  <Ionicons name={tokenCopied ? 'checkmark' : 'copy'} size={16} color={Colors.sky} />
                </TouchableOpacity>
              </View>
              <Text style={styles.tokenText} selectable>{pushToken}</Text>
            </View>
          ) : null}

          <View style={styles.messageContainer}>
            <Text style={styles.messageLabel}>Test Message:</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter notification message"
              value={testMessage}
              onChangeText={setTestMessage}
              placeholderTextColor={Colors.textSecondary}
              multiline
              maxLength={150}
            />
            <Text style={styles.charCount}>{testMessage.length}/150</Text>
          </View>

          <TouchableOpacity
            style={[styles.button, styles.sendButton]}
            onPress={sendTestNotification}
            disabled={loading || !pushToken}
          >
            {loading && <ActivityIndicator color="#fff" style={{ marginRight: 8 }} />}
            <Ionicons name="send" size={18} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.buttonText}>Send Test Notification</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={20} color={Colors.textSecondary} />
          <Text style={styles.infoText}>
            This is a standalone Expo push notification testing tool. No Firebase connection required.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fbff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
  },
  content: {
    padding: 20,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  button: {
    flexDirection: 'row',
    backgroundColor: Colors.sky,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  sendButton: {
    backgroundColor: '#10b981',
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  tokenContainer: {
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: Colors.sky,
  },
  tokenHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  tokenLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
  },
  copyButton: {
    padding: 8,
  },
  tokenText: {
    fontSize: 11,
    color: Colors.text,
    fontFamily: 'monospace',
    lineHeight: 16,
  },
  messageContainer: {
    marginBottom: 12,
  },
  messageLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.text,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    maxHeight: 100,
  },
  charCount: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 4,
    textAlign: 'right',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    alignItems: 'center',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
});
