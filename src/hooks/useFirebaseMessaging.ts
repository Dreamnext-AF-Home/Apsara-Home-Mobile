import { useEffect } from 'react';
import { Platform, PermissionsAndroid, Linking } from 'react-native';
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

// Store deeplinks globally
let lastStoredDeeplink: string | undefined = undefined;

// Store pending deeplink from background notification for when app opens
let pendingBackgroundDeeplink: string | undefined = undefined;

const registerBackgroundMessageHandler = () => {
  if (backgroundHandlerRegistered) return;
  backgroundHandlerRegistered = true;

  getMessaging().setBackgroundMessageHandler(async (remoteMessage) => {
    console.log('[useFirebaseMessaging] Background message received:', remoteMessage);
    console.log('[useFirebaseMessaging] Background data payload:', remoteMessage.data);

    try {
      const deeplink = remoteMessage.data?.href || remoteMessage.data?.deeplink || null;

      console.log('[useFirebaseMessaging] Background parsed:', { deeplink });

      // Store the deeplink globally for later retrieval if user taps notification
      const finalDeeplink = deeplink || '/orders';
      lastStoredDeeplink = finalDeeplink;

      // Also store to persistent storage in case app gets killed before notification tap
      try {
        await AsyncStorage.setItem('pending_notification_deeplink', finalDeeplink);
        console.log('[useFirebaseMessaging] Stored deeplink to persistent storage:', { deeplink: finalDeeplink });
      } catch (storageError) {
        console.error('[useFirebaseMessaging] Error storing deeplink to storage:', storageError);
      }

      console.log('[useFirebaseMessaging] Background: Stored deeplink for notification tap:', { deeplink: finalDeeplink });

      // System will automatically display the notification from the notification payload
      // No need to call notifee.displayNotification here
    } catch (error) {
      console.error('[useFirebaseMessaging] Background message error:', error);
    }
  });
};

// Helper to get and clear pending background deeplink
export const getPendingBackgroundDeeplink = async (): Promise<string | undefined> => {
  // First check memory
  if (pendingBackgroundDeeplink) {
    const deeplink = pendingBackgroundDeeplink;
    pendingBackgroundDeeplink = undefined;
    console.log('[useFirebaseMessaging] Retrieved pending deeplink from memory:', { deeplink });
    return deeplink;
  }

  // Then check persistent storage as fallback
  try {
    const storedDeeplink = await AsyncStorage.getItem('pending_notification_deeplink');
    if (storedDeeplink) {
      await AsyncStorage.removeItem('pending_notification_deeplink');
      console.log('[useFirebaseMessaging] Retrieved pending deeplink from storage:', { storedDeeplink });
      return storedDeeplink;
    }
  } catch (error) {
    console.error('[useFirebaseMessaging] Error checking stored deeplink:', error);
  }

  console.log('[useFirebaseMessaging] No pending deeplink found');
  return undefined;
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
          const deeplink = remoteMessage?.data?.href || remoteMessage?.data?.deeplink;
          if (deeplink) {
            console.log('[useFirebaseMessaging] Emitting deeplink event:', deeplink);
            Linking.openURL(deeplink).catch(err => {
              console.error('[useFirebaseMessaging] Failed to open deeplink:', err);
            });
          }
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
            const deeplink = notificationOpenedApp?.data?.href || notificationOpenedApp?.data?.deeplink;
            if (deeplink && typeof deeplink === 'string' && deeplink.trim()) {
              console.log('[useFirebaseMessaging] Storing initial deeplink:', deeplink);
              // Store in both memory and persistent storage for reliability
              pendingBackgroundDeeplink = deeplink;
              try {
                await AsyncStorage.setItem('pending_notification_deeplink', deeplink);
              } catch (e) {
                console.error('[useFirebaseMessaging] Error storing deeplink:', e);
              }

              if (deeplink.startsWith('purchases://')) {
                console.log('[useFirebaseMessaging] Stored initial purchases deeplink as pending');
              } else {
                // Only open external URLs through Linking
                setTimeout(() => {
                  Linking.openURL(deeplink).catch(err => console.error('[useFirebaseMessaging] Failed to open external URL:', err));
                }, 1000);
              }
              initialNotificationProcessed = true;
            }
          }
        } catch (error) {
          console.error('[useFirebaseMessaging] Error getting initial notification from Firebase:', error);
        }


        // Handle background notification opened (when app is in background)
        const unsubscribeNotificationOpened = onNotificationOpenedApp(messaging_, (remoteMessage) => {
          console.log('[useFirebaseMessaging] Notification opened from background:', remoteMessage);
          const deeplink = remoteMessage?.data?.href || remoteMessage?.data?.deeplink;
          if (deeplink) {
            console.log('[useFirebaseMessaging] Emitting deeplink from background state:', deeplink);
            Linking.openURL(deeplink).catch(err => {
              console.error('[useFirebaseMessaging] Failed to open deeplink:', err);
            });
          }
        });

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
