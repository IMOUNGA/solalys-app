import * as SecureStore from 'expo-secure-store'

// Jetons gardés en mémoire pour les requêtes, et dans le trousseau iOS
// (SecureStore) pour survivre à un redémarrage de l'app.
let inMemoryAccess: string | null = null
let inMemoryRefresh: string | null = null

export async function saveTokens(access?: string, refresh?: string) {
    if (access) {
        inMemoryAccess = access
        await SecureStore.setItemAsync('atk', access)
    }
    if (refresh) {
        inMemoryRefresh = refresh
        await SecureStore.setItemAsync('rtk', refresh)
    }
}

export async function loadTokens() {
    inMemoryAccess = await SecureStore.getItemAsync('atk')
    inMemoryRefresh = await SecureStore.getItemAsync('rtk')
    return { access: inMemoryAccess, refresh: inMemoryRefresh }
}

export function getAccessToken() {
    return inMemoryAccess
}

export function getRefreshToken() {
    return inMemoryRefresh
}

export async function clearTokens() {
    inMemoryAccess = null
    inMemoryRefresh = null
    await SecureStore.deleteItemAsync('atk')
    await SecureStore.deleteItemAsync('rtk')
}
