import * as SecureStore from 'expo-secure-store'

let inMemoryAccess: string | null = null
let inMemoryRefresh: string | null = null

export async function saveTokens(access?: string, refresh?: string) {
    console.log('💾 [saveTokens] Saving tokens...', { hasAccess: !!access, hasRefresh: !!refresh });
    if (access) {
        inMemoryAccess = access;
        await SecureStore.setItemAsync('atk', access);
        console.log('✅ [saveTokens] Access token saved');
    }
    if (refresh) {
        inMemoryRefresh = refresh;
        await SecureStore.setItemAsync('rtk', refresh);
        console.log('✅ [saveTokens] Refresh token saved');
    }
}

export async function loadTokens() {
    console.log('📥 [loadTokens] Loading tokens from SecureStore...');
    inMemoryAccess = await SecureStore.getItemAsync('atk')
    inMemoryRefresh = await SecureStore.getItemAsync('rtk')
    console.log('📥 [loadTokens] Tokens loaded:', {
        hasAccess: !!inMemoryAccess,
        hasRefresh: !!inMemoryRefresh,
        accessPreview: inMemoryAccess ? `${inMemoryAccess.substring(0, 20)}...` : null
    });
    return { access: inMemoryAccess, refresh: inMemoryRefresh }
}

export function getAccessToken() {
    return inMemoryAccess;
}
export function getRefreshToken() {
    return inMemoryRefresh;
}

export async function clearTokens() {
    console.log('🗑️ [clearTokens] Clearing all tokens');
    inMemoryAccess = null
    inMemoryRefresh = null
    await SecureStore.deleteItemAsync('atk')
    await SecureStore.deleteItemAsync('rtk')
}
