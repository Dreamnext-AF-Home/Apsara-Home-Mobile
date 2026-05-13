import { useEffect } from 'react';
import { Platform } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import axios from 'axios';
import { API_CONFIG } from '../config/api';

export const useFirebaseMessaging = (token: string | null, userId: string | number | null) => {
  useEffect(() => {
    if (!token || !userId) {
      return;
    }

    const setupMessaging = async () => {
      try {
        console.log('[useFirebaseMessaging] Setting up Firebase Cloud Messaging...');

        // Get FCM token
        const fcmToken = await messaging().getToken();
        console.log('[useFirebaseMessaging] FCM Token:', fcmToken);

        if (!fcmToken) {
          console.warn('[useFirebaseMessaging] Failed to get FCM token');
          return;
        }

        // Register FCM token with backend
        const platform = Platform.OS === 'android' ? 'android' : 'ios';
        const response = await axios.post(
          `${API_CONFIG.BASE_URL}/notifications/fcm/register-token`,
          {
            fcm_token: fcmToken,
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

        if (response.status === 200 || response.status === 201) {
          console.log('[useFirebaseMessaging] ✅ FCM token registered successfully');
        }

        // Handle foreground notifications
        const unsubscribe = messaging().onMessage(async (remoteMessage) => {
          console.log('[useFirebaseMessaging] 📬 Foreground notification received:', remoteMessage);
        });

        return unsubscribe;
      } catch (error) {
        console.error('[useFirebaseMessaging] Error:', error);
      }
    };

    setupMessaging();
  }, [token, userId]);

  return null;
};
