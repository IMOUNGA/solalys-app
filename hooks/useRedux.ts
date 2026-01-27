// hooks/useRedux.ts
import { useDispatch, useSelector } from 'react-redux'
import type { RootState, AppDispatch } from '@/store'

// Hooks typés pour Redux
export const useAppDispatch = useDispatch.withTypes<AppDispatch>()
export const useAppSelector = useSelector.withTypes<RootState>()
