import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux"
import type { RootState, AppDispatch } from "@/store/store"

// typed dispatch
export const useAppDispatch: () => AppDispatch = useDispatch

// typed selector
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector