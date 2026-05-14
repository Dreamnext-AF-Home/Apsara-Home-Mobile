import { useEffect } from 'react';
import { Platform, PermissionsAndroid } from 'react-native';
import {
  getMessaging,
  onMessage,
  getToken,
  getInitialNotification,
  onNotificationOpenedApp,
  onTokenRefresh,
} from '@react-native-firebase/messaging';
import notifee, { AndroidImportance } from '@notifee/react-native';
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

        let androidChannelId: string | undefined;
        if (Platform.OS === 'android') {
          androidChannelId = await notifee.createChannel({
            id: 'default',
            name: 'Default Notifications',
            importance: AndroidImportance.HIGH,
          });
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

        const unsubscribe = onMessage(messaging_, async (remoteMessage) => {
          console.log('[useFirebaseMessaging] Foreground notification received:', remoteMessage);

          const title = remoteMessage.notification?.title || 'New notification';
          const body = remoteMessage.notification?.body || '';
          const imageUrl = remoteMessage.notification?.imageUrl || remoteMessage.data?.image;

          try {
            // Try displaying with image first
            if (imageUrl) {
              try {
                await notifee.displayNotification({
                  title,
                  body,
                  android: {
                    channelId: androidChannelId || 'default',
                    smallIcon: 'ic_stat_notify',
                    pressAction: {
                      id: 'default',
                    },
                    largeIcon: imageUrl,
                  },
                });
                return;
              } catch (imageError) {
                console.warn('[useFirebaseMessaging] Failed to display with image, falling back to text:', imageError);
              }
            }

            // Fallback: Display without image (pure text)
            await notifee.displayNotification({
              title,
              body,
              android: {
                channelId: androidChannelId || 'default',
                smallIcon: 'ic_stat_notify',
                pressAction: {
                  id: 'default',
                },
              },
            });
          } catch (displayError) {
            console.error('[useFirebaseMessaging] Foreground local notification failed:', displayError);
          }
        });

        const notificationOpenedApp = await getInitialNotification(messaging_);
        if (notificationOpenedApp) {
          console.log('[useFirebaseMessaging] App opened from closed state via notification');
        }

        const unsubscribeNotificationOpened = onNotificationOpenedApp(messaging_, (remoteMessage) => {
          console.log('[useFirebaseMessaging] Notification opened:', remoteMessage);
        });

        return () => {
          unsubscribe();
          unsubscribeNotificationOpened();
          unsubscribeTokenRefresh();
        };
      } catch (error) {
        console.error('[useFirebaseMessaging] Error:', error);
      }
    };

    setupMessaging();
  }, [token, userId]);

  return null;
};
