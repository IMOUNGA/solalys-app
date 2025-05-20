import {DarkTheme, DefaultTheme, ThemeProvider} from '@react-navigation/native';
import {useFonts} from 'expo-font';
import {Stack, Tabs} from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import {StatusBar} from 'expo-status-bar';
import {useEffect} from 'react';
import 'react-native-reanimated';

import {useColorScheme} from '@/hooks/useColorScheme';
import {SafeAreaView, StyleSheet, Text, View} from "react-native";
import Header from "@/components/header/Header";
import {ThemedView} from "@/components/ThemedView";
import HomeScreen from "@/app/(tabs)";
import {Provider} from "react-redux";
import {store} from "@/store";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
    const colorScheme = useColorScheme();
    const [loaded] = useFonts({
        SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    });

    useEffect(() => {
        if (loaded) {
            SplashScreen.hideAsync();
        }
    }, [loaded]);

    if (!loaded) {
        return null;
    }

    return (
        <Provider store={store}>
            <SafeAreaView style={styles.safeArea}>
                <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
                    <ThemedView style={styles.header}>
                        <Header/>
                    </ThemedView>
                    <ThemedView style={styles.content}>
                        <Stack>
                            <Stack.Screen name="(tabs)" options={{headerShown: false}}/>
                            <Stack.Screen name="(stack)" options={{headerShown: false,}}/>
                            <Stack.Screen name="+not-found"/>
                        </Stack>
                    </ThemedView>
                </ThemeProvider>
            </SafeAreaView>
        </Provider>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        display: 'flex',
        flex: 1,
    },
    header: {
        height: '10%',
        backgroundColor: 'blue',
    },
    content: {
        flex: 1,
    }
});

/*

<Stack>
                        <Stack.Screen name="(tabs)" options={{headerShown: false}}/>
                        <Stack.Screen name="+not-found"/>
                    </Stack>
                    <StatusBar style="auto"/>

 */
