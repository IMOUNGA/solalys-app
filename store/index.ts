// store/index.ts
import { configureStore } from '@reduxjs/toolkit'
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist'
import AsyncStorage from '@react-native-async-storage/async-storage'
import authReducer from './slices/authSlice'

// Configuration de la persistance pour le slice auth
const persistConfig = {
    key: 'auth',
    storage: AsyncStorage,
    whitelist: ['user', 'status'], // On persiste seulement user et status
}

const persistedAuthReducer = persistReducer(persistConfig, authReducer)

export const store = configureStore({
    reducer: {
        auth: persistedAuthReducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                // Ignore ces actions de redux-persist
                ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
            },
        }),
})

export const persistor = persistStore(store)

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
