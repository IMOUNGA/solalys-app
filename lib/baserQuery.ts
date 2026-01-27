import { fetchBaseQuery, BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query/react'
import { API_URL } from '@lib/env'
import { getAccess, getRefresh, saveTokens, clearTokens } from '@lib/token'

const raw = fetchBaseQuery({
    baseUrl: API_URL,
    prepareHeaders: (h) => {
        const t = getAccess()
        if (t) h.set('authorization', `Bearer ${t}`)
        h.set('content-type', 'application/json')
        return h
    },
})

let refreshing: Promise<void> | null = null

export const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> =
    async (args, api, extra) => {
        let res = await raw(args, api, extra)
        if (res.error?.status !== 401) return res

        if (!refreshing) {
            const rt = getRefresh()
            refreshing = (async () => {
                if (!rt) return void (await clearTokens())
                const r = await raw({ url: '/auth/refresh', method: 'POST', body: { refreshToken: rt } }, api, extra)
                if (r.error || !r.data) return void (await clearTokens())
                const { accessToken, refreshToken } = r.data as any
                await saveTokens(accessToken, refreshToken)
            })().finally(() => { refreshing = null })
        }

        await refreshing
        if (!getAccess()) return res
        return await raw(args, api, extra) // retry unique
    }
