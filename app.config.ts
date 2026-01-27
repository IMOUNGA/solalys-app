import {ExpoConfig} from "@expo/config-types";
import 'dotenv/config'

export default (): ExpoConfig => {
    const APP_ENV = process.env.APP_ENV || 'dev';
    const API_DEV = process.env.EXPO_PUBLIC_API ?? 'http://127.0.0.1:3000';
    const API_PROD = process.env.EXPO_PUBLIC_API ?? 'http://127.0.0.1:3000';

    const CURRENT_API = APP_ENV === 'prod' ? API_PROD : API_DEV;

    return {
        name: 'pillowa',
        slug: 'pillowa',
        version: "1.3.0",
        orientation: "portrait",
        icon: "./assets/images/icon.png",
        scheme: "pillowaapp",
        userInterfaceStyle: "automatic",
        newArchEnabled: true,
        web: {
            bundler: "metro"
        },
        ios: {
            supportsTablet: true,
            bundleIdentifier: "com.lilvinssou.pillowaapp",
            infoPlist: {
                ITSAppUsesNonExemptEncryption: false,
                // Only DEV
                NSAppTransportSecurity: {
                    NSAllowsArbitraryLoads: true
                }
            }
        },
        android: {
            adaptiveIcon: {
                backgroundColor: "#E6F4FE",
                foregroundImage: "./assets/images/android-icon-foreground.png",
                backgroundImage: "./assets/images/android-icon-background.png",
                monochromeImage: "./assets/images/android-icon-monochrome.png"
            },
            edgeToEdgeEnabled: true,
            predictiveBackGestureEnabled: false,
            package: "com.lilvinssou.pillowaapp"
        },
        web: {
            output: "static",
            favicon: "./assets/images/favicon.png"
        },
        plugins: [
            "expo-router",
            [
                "expo-splash-screen",
                {
                    image: "./assets/images/splash-icon.png",
                    imageWidth: 200,
                    resizeMode: "contain",
                    backgroundColor: "#ffffff",
                    dark: {
                        "backgroundColor": "#000000"
                    }
                }
            ]
        ],
        experiments: {
            typedRoutes: true,
            reactCompiler: true
        },
        extra: {
            expoPublicApiUrl: process.env.EXPO_PUBLIC_API_URL_DEV ?? CURRENT_API,
            appEnv: APP_ENV,
            api: {
                dev: API_DEV,
                prod: API_PROD,
            },
            eas: {
                projectId: "228f64ee-f020-4650-a8a8-3f0daa4a7368"
            }
        },
    }
}
