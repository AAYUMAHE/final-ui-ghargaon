import { useEffect } from "react"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import {
    setSubscriptions,
    setSubscriptionsLoading,
    selectSubscriptions,
    selectIsSubscriptionsLoading
} from "@/store/slices/userSlice"
import api from "@/lib/api"
import { toast } from "sonner"

export const useSubscriptions = () => {
    const dispatch = useAppDispatch()
    const subscriptions = useAppSelector(selectSubscriptions)
    const loading = useAppSelector(selectIsSubscriptionsLoading)

    const fetchSubscriptions = async () => {
        try {
            dispatch(setSubscriptionsLoading(true))
            const response = await api.get("/subscriptions")
            dispatch(setSubscriptions(response.data))
        } catch (error) {
            toast.error("Failed to fetch subscriptions")
        } finally {
            dispatch(setSubscriptionsLoading(false))
        }
    }

    useEffect(() => {
        fetchSubscriptions()
    }, [])

    return { subscriptions, loading, refetch: fetchSubscriptions }
}