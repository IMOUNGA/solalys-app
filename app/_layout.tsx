import {DarkTheme, DefaultTheme, ThemeProvider} from '@react-navigation/native';
import {Stack, useRouter} from 'expo-router';
import {StatusBar} from 'expo-status-bar';
import 'react-native-reanimated';
import '@/lib/calendarLocale';

import {useColorScheme} from '@/hooks/use-color-scheme';
import {Provider} from "react-redux";
import {store, persistor} from "@/store";
import { PersistGate } from 'redux-persist/integration/react';
import "../global.css";

import {ReactNode, useEffect} from "react";
import {loadSessionThunk} from "@/store/thunks/authThunks";
import {AlertProvider} from "@/contexts/AlertContext";
import {Alert} from "@/components/ui/alert";
import { ActivityIndicator, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {useAppDispatch, useAppSelector} from "@/hooks/useRedux";
import {registerForPushNotifications, addNotificationTapListener} from "@/services/pushNotifications";
import {initPurchases, loginPurchasesUser} from "@/services/purchasesService";

export const unstable_settings = {
    anchor: '(tabs)',
};

// Composant pour initialiser la session au démarrage
function SessionInitializer() {
    const dispatch = useAppDispatch();
    const { user, status } = useAppSelector((state) => state.auth);

    useEffect(() => {
        // Charger la session au démarrage de l'app
        initPurchases();
        dispatch(loadSessionThunk());

        const removeTapListener = addNotificationTapListener();
        return removeTapListener;
    }, [dispatch]);

    useEffect(() => {
        // Enregistrer le token push + associer le compte à RevenueCat dès
        // qu'on a une session active (login, signup, ou session persistée
        // retrouvée au démarrage) — app_user_id RevenueCat = notre User.id,
        // pour que les webhooks retombent directement sur le bon compte.
        if (user && status === 'authenticated') {
            registerForPushNotifications();
            // user.id est typé string dans lib/interfaces/user.ts (type
            // pré-existant désynchronisé de l'API, cf. les mêmes erreurs
            // firstName/firstname ailleurs) mais vaut un number en pratique.
            loginPurchasesUser(Number(user.id));
        }
    }, [user, status]);

    return null;
}

export default function RootLayout() {
    const colorScheme = useColorScheme();

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <Provider store={store}>
                <PersistGate
                    loading={
                        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
                            <ActivityIndicator size="large" />
                        </View>
                    }
                    persistor={persistor}
                >
                    <SessionInitializer />
                    <AlertProvider>
                        <ThemeProvider value={DefaultTheme}>
                            <Stack>
                                <Stack.Screen name="(tabs)" options={{headerShown: false}}/>
                                <Stack.Screen name="(auth)" options={{headerShown: false}}/>
                                <Stack.Screen name="onboarding" options={{headerShown: false, gestureEnabled: false}}/>
                                <Stack.Screen name="modal" options={{presentation: 'modal', title: 'Modal'}}/>
                                <Stack.Screen name="notifications" options={{headerShown: false}}/>
                            </Stack>
                            <StatusBar style="dark"/>
                            <Alert />
                        </ThemeProvider>
                    </AlertProvider>
                </PersistGate>
            </Provider>
        </GestureHandlerRootView>
    );
}
