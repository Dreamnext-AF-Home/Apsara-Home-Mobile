import { useEffect } from 'react';
import { Platform, PermissionsAndroid } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getMessaging,
  onMessage,
  getToken,
  getInitialNotification,
  onNotificationOpenedApp,
  onTokenRefresh,
} from '@react-native-firebase/messaging';
import axios from 'axios';
import { API_CONFIG } from '../config/api';
import { useNavigation } from '../context/NavigationContext';


// Register handlers at module level (only once)
let backgroundHandlerRegistered = false;
let foregroundHandlerRegistered = false;

const registerBackgroundMessageHandler = () => {
  if (backgroundHandlerRegistered) return;
  backgroundHandlerRegistered = true;

  getMessaging().setBackgroundMessageHandler(async (remoteMessage) => {
    console.log('[useFirebaseMessaging] Background message received:', remoteMessage);
    console.log('[useFirebaseMessaging] Background data payload:', remoteMessage.data);

    try {
      // Notification received - deeplink handling will be implemented manually
      console.log('[useFirebaseMessaging] Background notification received');
    } catch (error) {
      console.error('[useFirebaseMessaging] Background message error:', error);
    }
  });
};

export const useFirebaseMessaging = (token: string | null, userId: string | number | null) => {
  const navigation = useNavigation();

  useEffect(() => {
    if (!token || !userId) {
      return;
    }

    const setupMessaging = async () => {
      try {
        console.log('[useFirebaseMessaging] Setting up Firebase Cloud Messaging...');

        // Register background message handler
        registerBackgroundMessageHandler();

        const messaging_ = getMessaging();
        let permissionEnabled = true;
        if (Platform.OS === 'android' && Platform.Version >= 33) {
          const permissionResult = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
          );
          permissionEnabled = permissionResult === PermissionsAndroid.RESULTS.GRANTED;
        }

        if (!permissionEnabled) {
          console.warn('[useFirebaseMessaging] Notification permission not granted on Android');
          return;
        }

        const registerFcmToken = async (fcmToken: string) => {
          const platform = Platform.OS === 'android' ? 'android' : 'ios';
          const response = await axios.post(
            `${API_CONFIG.BASE_URL}/notifications/fcm/register-token`,
            {
              fcm_token: fcmToken,
              device_name: `${platform}-device`,
              platform,
            },
            {
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            }
          );

          if (response.status === 200 || response.status === 201) {
            console.log('[useFirebaseMessaging] FCM token registered successfully');
          }
        };

        const fcmToken = await getToken(messaging_);
        console.log('[useFirebaseMessaging] FCM Token:', fcmToken);

        if (!fcmToken) {
          console.warn('[useFirebaseMessaging] Failed to get FCM token');
          return;
        }

        await registerFcmToken(fcmToken);

        const unsubscribeTokenRefresh = onTokenRefresh(messaging_, async (newToken) => {
          try {
            console.log('[useFirebaseMessaging] FCM token refreshed:', newToken);
            await registerFcmToken(newToken);
          } catch (refreshError) {
            console.error('[useFirebaseMessaging] Failed to register refreshed token:', refreshError);
          }
        });

        // Register foreground handler only once
        let unsubscribe: any;
        if (!foregroundHandlerRegistered) {
          foregroundHandlerRegistered = true;
          console.log('[useFirebaseMessaging] Registering foreground handler (first time)');

          unsubscribe = onMessage(messaging_, async (remoteMessage) => {
          console.log('[useFirebaseMessaging] Foreground notification received (SILENT MODE):', remoteMessage);
          console.log('[useFirebaseMessaging] Foreground data payload:', remoteMessage.data);

          const title = remoteMessage.data?.title || remoteMessage.notification?.title || 'New notification';
          const body = remoteMessage.data?.body || remoteMessage.data?.message || remoteMessage.notification?.body || '';
          const deeplink = remoteMessage.data?.href || remoteMessage.data?.deeplink || null;

          console.log('[useFirebaseMessaging] Foreground parsed (silent):', { title, body, deeplink });

          try {
            // Store the deeplink globally for later retrieval
            const finalDeeplink = deeplink || '/orders';
            lastStoredDeeplink = finalDeeplink;

            // SILENT MODE: Do not display any notification when app is in foreground
            // The Pusher real-time notifications via useNotifications hook will handle display
            console.log('[useFirebaseMessaging] Foreground: Stored deeplink silently (no notification shown):', { deeplink: finalDeeplink });
          } catch (error) {
            console.error('[useFirebaseMessaging] Foreground silent handling error:', error);
          }
          });
        } else {
          console.log('[useFirebaseMessaging] Foreground handler already registered, skipping');
          unsubscribe = () => {}; // dummy
        }

        // Handle notification press (when user clicks the notification and app opens from background)
        const unsubscribeOnNotificationOpenedApp = onNotificationOpenedApp(messaging_, (remoteMessage) => {
          console.log('[useFirebaseMessaging] App opened from notification:', remoteMessage);
          // Notification deeplink handling removed - will be implemented manually
        });


        // Handle app opened from closed state via notification or button press
        let initialNotificationProcessed = false;

        try {
          const notificationOpenedApp = await getInitialNotification(messaging_);
          if (notificationOpenedApp) {
            console.log('[useFirebaseMessaging] App opened from closed state via Firebase notification', {
              hasData: !!notificationOpenedApp.data,
              data: notificationOpenedApp.data
            });
            // Notification deeplink handling removed - will be implemented manually
          }
        } catch (error) {
          console.error('[useFirebaseMessaging] Error getting initial notification from Firebase:', error);
        }


        // Note: onNotificationOpenedApp is already handled above, so we don't need duplicate handler
        const unsubscribeNotificationOpened = () => {};

        return () => {
          unsubscribe();
          unsubscribeNotificationOpened();
          unsubscribeTokenRefresh();
          if (unsubscribeOnNotificationOpenedApp) {
            unsubscribeOnNotificationOpenedApp();
          }
        };
      } catch (error) {
        console.error('[useFirebaseMessaging] Error:', error);
      }
    };

    setupMessaging();
  }, [token, userId]);

  return null;
};
