// store/thunks/authThunks.ts
import { createAsyncThunk } from '@reduxjs/toolkit'
import { ApiService } from '@/services/apiService'
import { saveTokens, loadTokens, clearTokens } from '@/lib/secureToken'
import { URLS } from "@/constants/urls/apiUrls";
import { logoutPurchasesUser } from '@/services/purchasesService';
import type { RootState } from '@/store';

/** Message d'erreur de l'API (une phrase en français), ou message par défaut. */
export function apiErrorMessage(error: any, fallback: string): string {
    if (!error?.response) return "Impossible de joindre le serveur. Vérifiez votre connexion internet.";
    const message = error.response.data?.message;
    if (typeof message === 'string' && message) return message;
    if (Array.isArray(message) && typeof message[0] === 'string') return message[0];
    return fallback;
}

/**
 * Register: appelle /auth/signup, crée un nouveau compte utilisateur
 */
export const registerThunk = createAsyncThunk(
    'auth/register',
    async (credentials: { firstname: string; lastname: string; email: string; password: string }) => {
        try {
            const { data } = await ApiService.post(URLS.AUTH.REGISTER, {
                firstname: credentials.firstname.trim(),
                lastname: credentials.lastname.trim(),
                email: credentials.email.trim().toLowerCase(),
                password: credentials.password,
            })
            await saveTokens(data.accessToken, data.refreshToken)
            return { user: data.user }
        } catch (error: any) {
            throw new Error(apiErrorMessage(error, "La création du compte a échoué, réessayez."))
        }
    }
)

/**
 * Login: appelle /auth/signin, sauvegarde les tokens en SecureStore + mémoire,
 * retourne le user pour hydrater le slice.
 */
export const setCredentialsThunk = createAsyncThunk(
    'auth/login',
    async (credentials: { email: string; password: string }) => {
        try {
            const { data } = await ApiService.post(URLS.AUTH.LOGIN, {
                email: credentials.email.trim().toLowerCase(),
                password: credentials.password,
            })
            await saveTokens(data.accessToken, data.refreshToken)
            return { user: data.user }
        } catch (error: any) {
            throw new Error(apiErrorMessage(error, 'La connexion a échoué, réessayez.'))
        }
    }
)

/**
 * Bootstrap de session au démarrage : charge les tokens et vérifie l'utilisateur.
 * L'interceptor axios gère automatiquement le refresh si le token est expiré.
 * Hors réseau, l'utilisateur reste connecté avec ses dernières données connues.
 */
export const loadSessionThunk = createAsyncThunk('auth/loadSession', async (_, { getState }) => {
    const tokens = await loadTokens()
    if (!tokens.access && !tokens.refresh) {
        return { hasToken: false, user: null }
    }

    try {
        const { data } = await ApiService.get(URLS.AUTH.ME)
        return { hasToken: true, user: data }
    } catch (error: any) {
        const persistedUser = (getState() as RootState).auth.user
        if (!error?.response && persistedUser) {
            // Pas de réseau : on garde la session locale, elle sera revérifiée plus tard.
            return { hasToken: true, user: persistedUser }
        }
        return { hasToken: false, user: null }
    }
})

/**
 * Refresh les données utilisateur depuis le backend (pour page profil)
 */
export const refreshUserThunk = createAsyncThunk('auth/refreshUser', async () => {
    const tokens = await loadTokens()
    if (!tokens.access && !tokens.refresh) {
        throw new Error('No token')
    }
    try {
        const { data } = await ApiService.get(URLS.AUTH.ME)
        return { user: data }
    } catch (error: any) {
        throw new Error(apiErrorMessage(error, 'Impossible de mettre à jour le profil'))
    }
})

/**
 * Logout : ferme la session de cet appareil côté serveur (ce qui coupe aussi
 * ses notifications), déconnecte RevenueCat, puis efface les tokens locaux.
 * (Le slice est réinitialisé par l'action logoutState côté UI.)
 */
export const logoutThunk = createAsyncThunk('auth/logout', async () => {
    try {
        await ApiService.post(URLS.AUTH.LOGOUT)
    } catch {
        // Hors réseau ou session déjà expirée : la déconnexion locale suffit.
    }
    await logoutPurchasesUser()
    await clearTokens()
    return true
})
