import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { apiService } from './apiService';
import { openNotificationTarget } from '@/lib/notificationLink';

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
    }),
});

/**
 * Demande la permission de notifications, récupère le token push Expo de
 * l'appareil et l'enregistre côté API pour l'utilisateur connecté.
 * À appeler une fois l'utilisateur authentifié (ex: après signin/signup).
 */
export async function registerForPushNotifications(): Promise<void> {
    if (!Device.isDevice) {
        console.log('⚠️ Les notifications push nécessitent un appareil physique (pas de simulateur).');
        return;
    }

    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.DEFAULT,
        });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    if (finalStatus !== 'granted') {
        console.log('⚠️ Permission de notifications refusée.');
        return;
    }

    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    if (!projectId) {
        console.warn('⚠️ EAS projectId manquant, impossible de récupérer le token push.');
        return;
    }

    try {
        const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
        await apiService.users.registerPushToken(token);
        console.log('✅ Token push enregistré:', token);
    } catch (error) {
        console.error('❌ Échec de récupération/enregistrement du token push:', error);
    }
}

/**
 * Écoute le tap sur une notification push (app en arrière-plan ou fermée)
 * et ouvre l'écran correspondant — même résolution de destination que le
 * centre de notifications in-app, via le payload `data` envoyé par l'API.
 * À appeler une fois au démarrage de l'app.
 */
export function addNotificationTapListener(): () => void {
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data as
            | { entityType?: 'event' | 'guest_group'; entityId?: number | string; tab?: 'upcoming' | 'follow-up' }
            | undefined;
        if (data) openNotificationTarget(data);
    });

    return () => subscription.remove();
}
