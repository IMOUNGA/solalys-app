// store/thunks/authThunks.ts
import { createAsyncThunk } from '@reduxjs/toolkit'
import { ApiService } from '@/services/apiService'
import { saveTokens, loadTokens, clearTokens } from '@/lib/secureToken'
import {URLS} from "@/constants/urls/apiUrls";

/**
 * Register: appelle /auth/signup, crée un nouveau compte utilisateur
 */
export const registerThunk = createAsyncThunk(
    'auth/register',
    async (credentials: { firstName: string; lastName: string; email: string; password: string }) => {
        try {
            const { data } = await ApiService.post(URLS.AUTH.REGISTER, credentials)
            // data: { accessToken, refreshToken, user }
            await saveTokens(data.accessToken, data.refreshToken)
            return { user: data.user }
        } catch (error: any) {
            throw new Error(error?.response?.data?.message || 'Registration failed')
        }
    }
)

/**
 * Login: appelle /auth/login, sauvegarde le token en SecureStore + mémoire,
 * retourne le user pour hydrater le slice.
 */
export const setCredentialsThunk = createAsyncThunk(
    'auth/login',
    async (credentials: { email: string; password: string }) => {
        try {
            const { data } = await ApiService.post(URLS.AUTH.LOGIN, credentials)
            // data: { accessToken, refreshToken, user }
            await saveTokens(data.accessToken, data.refreshToken)
            return { user: data.user }
        } catch (error: any) {
            throw new Error(error?.response?.data?.message || 'Login failed')
        }
    }
)

/**
 * Bootstrap de session au démarrage : charge les tokens et vérifie l'utilisateur
 * L'interceptor axios gère automatiquement le refresh si le token est expiré
 */
export const loadSessionThunk = createAsyncThunk('auth/loadSession', async () => {
    console.log('🔄 [loadSessionThunk] Starting...')
    const tokens = await loadTokens()
    console.log('🔑 [loadSessionThunk] Tokens loaded:', {
        hasAccess: !!tokens.access,
        hasRefresh: !!tokens.refresh
    })

    if (!tokens.access) {
        console.log('❌ [loadSessionThunk] No access token, returning null')
        return { hasToken: false, user: null }
    }

    try {
        console.log('📡 [loadSessionThunk] Calling /auth/me...')
        // Vérifie que le token est valide en appelant /auth/me
        // Si le token est expiré, l'interceptor le refresh automatiquement
        const { data } = await ApiService.get(URLS.AUTH.ME)
        console.log('✅ [loadSessionThunk] User loaded:', data?.email)
        return { hasToken: true, user: data }
    } catch (error: any) {
        console.log('❌ [loadSessionThunk] Error:', error?.response?.status, error?.message)
        // Si même après refresh on a une erreur, alors on déconnecte
        // (cela veut dire que le refresh token aussi est expiré)
        return { hasToken: false, user: null }
    }
})

/**
 * Refresh les données utilisateur depuis le backend (pour page profil)
 */
export const refreshUserThunk = createAsyncThunk('auth/refreshUser', async () => {
    const tokens = await loadTokens()
    if (!tokens.access) {
        throw new Error('No token')
    }
    try {
        const { data } = await ApiService.get(URLS.AUTH.ME)
        return { user: data }
    } catch (error: any) {
        await clearTokens()
        throw new Error(error?.response?.data?.message || 'Failed to refresh user data')
    }
})

/**
 * Logout: efface le token en SecureStore + mémoire.
 * (Le slice sera réinitialisé par l’action logoutState côté UI.)
 */
export const logoutThunk = createAsyncThunk('auth/logout', async () => {
    await clearTokens()
    return true
})
