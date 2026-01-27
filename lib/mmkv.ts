import { MMKV } from 'react-native-mmkv'
import type { Storage } from 'redux-persist'

export const mmkv = new MMKV()
export const mmkvStorage: Storage = {
    setItem: (key, value) => { mmkv.set(key, value); return Promise.resolve(true) },
    getItem: (key) => Promise.resolve(mmkv.getString(key) ?? null),
    removeItem: (key) => { mmkv.delete(key); return Promise.resolve() },
}
