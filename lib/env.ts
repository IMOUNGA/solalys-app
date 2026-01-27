import Constants from 'expo-constants'
import { Platform } from 'react-native'

const fromEnv   = process.env.EXPO_PUBLIC_API
const fromExtra = Constants.expoConfig?.extra?.expoPublicApiUrl as string | undefined

const devDefault =
    Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000'

export const API_URL = fromEnv ?? fromExtra ?? (__DEV__ ? devDefault : undefined)
export const APP_ENV = (Constants.expoConfig?.extra?.appEnv as string) ?? 'dev'

if (!API_URL) {
    console.warn('API_URL manquant. Fournis EXPO_PUBLIC_API(_DEV/_PROD) ou extra.expoPublicApiUrl.')
}
