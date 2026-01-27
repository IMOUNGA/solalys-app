import {DarkTheme, DefaultTheme, ThemeProvider} from '@react-navigation/native';
import {Stack, useRouter} from 'expo-router';
import {StatusBar} from 'expo-status-bar';
import 'react-native-reanimated';

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
import {useAppDispatch} from "@/hooks/useRedux";

export const unstable_settings = {
    anchor: '(tabs)',
};

// Composant pour initialiser la session au démarrage
function SessionInitializer() {
    const dispatch = useAppDispatch();

    useEffect(() => {
        // Charger la session au démarrage de l'app
        dispatch(loadSessionThunk());
    }, [dispatch]);

    return null;
}

export default function RootLayout() {
    const colorScheme = useColorScheme();

    return (
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
                            <Stack.Screen name="modal" options={{presentation: 'modal', title: 'Modal'}}/>
                        </Stack>
                        <StatusBar style="dark"/>
                        <Alert />
                    </ThemeProvider>
                </AlertProvider>
            </PersistGate>
        </Provider>

    );
}
