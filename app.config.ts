import {ExpoConfig} from "@expo/config-types";
import 'dotenv/config'

export default (): ExpoConfig => {
    const APP_ENV = process.env.APP_ENV || 'dev';

    const DEFAULT_API_BY_ENV: Record<string, string> = {
        dev: 'http://127.0.0.1:3000',
        preprod: 'https://api-preprod.solalys.com',
        prod: 'https://api.solalys.com',
    };

    const API_DEV = DEFAULT_API_BY_ENV.dev;
    const API_PREPROD = DEFAULT_API_BY_ENV.preprod;
    const API_PROD = DEFAULT_API_BY_ENV.prod;

    // EXPO_PUBLIC_API (défini par le profil EAS ou un .env local) prend le pas
    // sur la valeur par défaut de l'environnement courant.
    const CURRENT_API = process.env.EXPO_PUBLIC_API ?? DEFAULT_API_BY_ENV[APP_ENV] ?? API_DEV;

    return {
        name: 'solalys',
        slug: 'solalys',
        version: "1.3.0",
        orientation: "portrait",
        icon: "./assets/images/icon.png",
        scheme: "solalysapp",
        userInterfaceStyle: "automatic",
        newArchEnabled: true,
        ios: {
            supportsTablet: true,
            bundleIdentifier: "com.lilvinssou.solalysapp",
            infoPlist: {
                ITSAppUsesNonExemptEncryption: false,
                NSLocationWhenInUseUsageDescription: "Solalys utilise votre position pour vous montrer les événements proches de vous.",
                // En dev l'API tourne en HTTP local (127.0.0.1/10.0.2.2) ; preprod et prod
                // sont en HTTPS valide, donc pas besoin (et pas souhaitable pour la review App Store)
                // d'autoriser les chargements arbitraires en dehors du dev.
                ...(APP_ENV === 'dev' ? {
                    NSAppTransportSecurity: {
                        NSAllowsArbitraryLoads: true
                    }
                } : {})
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
            package: "com.lilvinssou.solalysapp"
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
            ],
            [
                "expo-notifications",
                {
                    icon: "./assets/images/icon.png",
                    color: "#3B82F6"
                }
            ]
        ],
        experiments: {
            typedRoutes: true,
            reactCompiler: true
        },
        extra: {
            expoPublicApiUrl: CURRENT_API,
            appEnv: APP_ENV,
            api: {
                dev: API_DEV,
                preprod: API_PREPROD,
                prod: API_PROD,
            },
            eas: {
                projectId: "89c65a33-33cb-4154-87d0-f8182879d1b3"
            }
        },
    }
}
