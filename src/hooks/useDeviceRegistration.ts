import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import axios from 'axios';
import { API_CONFIG } from '../config/api';
import * as SecureStore from 'expo-secure-store';

const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export const useDeviceRegistration = (token: string | null, userId: string | number | null) => {
  const [registrationAttempted, setRegistrationAttempted] = useState(false);

  useEffect(() => {
    if (!token || !userId) {
      return;
    }

    const registerDevice = async () => {
      try {
        console.log('[useDeviceRegistration] Starting device registration...');

        // Get or create a device ID
        let deviceId = await SecureStore.getItemAsync('device_id');
        if (!deviceId) {
          // Generate a valid UUID v4 for OneSignal
          deviceId = generateUUID();
          await SecureStore.setItemAsync('device_id', deviceId);
          console.log('[useDeviceRegistration] Created new device ID:', deviceId);
        }

        // Register with OneSignal backend
        console.log('[useDeviceRegistration] Registering with OneSignal backend...');
        const platform = Platform.OS === 'android' ? 'android' : 'ios';

        const response = await axios.post(
          `${API_CONFIG.BASE_URL}/notifications/onesignal/register-token`,
          {
            player_id: deviceId,
            device_name: `${platform}-device`,
            platform: platform,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (response.status === 201 || response.status === 200) {
          console.log('[useDeviceRegistration] ✅ Device registered successfully');
          setRegistrationAttempted(true);
        }
      } catch (error) {
        console.error('[useDeviceRegistration] Failed to register device:', error);
      }
    };

    registerDevice();
  }, [token, userId]);

  return { registrationAttempted };
};
