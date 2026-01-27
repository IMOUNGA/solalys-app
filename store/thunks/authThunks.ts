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
 * Bootstrap de session au démarrage : vérifie juste si un token existe.
 * Le user est chargé depuis redux-persist, pas besoin d'appel API.
 */
export const loadSessionThunk = createAsyncThunk('auth/loadSession', async () => {
    const tokens = await loadTokens()
    // On retourne juste si le token existe
    // Le state user est déjà chargé par redux-persist
    return { hasToken: !!tokens.access }
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
