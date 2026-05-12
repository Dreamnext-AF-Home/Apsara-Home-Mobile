import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { storageService } from '../services/storageService';
import { API_CONFIG } from '../config/api';
import axios from 'axios';

export const useExpoTokenRegistration = (token: string | null, userId: string | null) => {
  const registrationAttempted = useRef(false);

  useEffect(() => {
    if (!token || !userId || registrationAttempted.current) {
      return;
    }

    const registerExpoToken = async () => {
      try {
        registrationAttempted.current = true;

        // Get the Expo push token
        const expoPushToken = await Notifications.getExpoPushTokenAsync({
          projectId: 'ed682d76-4287-4417-a52d-35601ed2fe7e', // from app.json
        });

        const pushToken = expoPushToken.data;
        console.log('[useExpoTokenRegistration] Got Expo push token:', pushToken);

        // Get device information
        const deviceName = `${Device.brand || 'Device'} ${Device.modelName || ''}`.trim();
        const platform = Device.osName === 'Android' ? 'android' : 'ios';

        // Check if we've already registered this token
        const lastRegisteredToken = await storageService.getItem('last_registered_push_token');
        if (lastRegisteredToken === pushToken) {
          console.log('[useExpoTokenRegistration] Token already registered, skipping');
          return;
        }

        // Call the registration endpoint
        const response = await axios.post(
          `${API_CONFIG.BASE_URL}/notifications/expo/register-token`,
          {
            token: pushToken,
            device_name: deviceName,
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
          console.log('[useExpoTokenRegistration] ✅ Token registered successfully');
          // Store the token to avoid re-registering
          await storageService.setItem('last_registered_push_token', pushToken);
        }
      } catch (error) {
        console.error('[useExpoTokenRegistration] Failed to register Expo token:', error);
        // Don't set the flag so we can retry on next app load
        registrationAttempted.current = false;
      }
    };

    registerExpoToken();
  }, [token, userId]);
};
