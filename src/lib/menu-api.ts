import api from "./api"
import { format, addDays, subDays } from "date-fns"
import { Dish, Menu, SubscriptionPlan } from "@/components/types/menu.types"

export const menuApi = {
    // Get menus for a specific date
    getMenusByDate: async (date: string) => {
        const response = await api.get(`/menu?date=${date}`)
        return response.data
    },

    // Get menus for date range (today-2 to today+4)
    getMenusForRange: async () => {
        const today = new Date()
        const startDate = format(subDays(today, 2), "yyyy-MM-dd")
        const endDate = format(addDays(today, 4), "yyyy-MM-dd")

        const promises = []
        for (let i = -2; i <= 4; i++) {
            const date = format(addDays(today, i), "yyyy-MM-dd")
            promises.push(api.get(`/menu?date=${date}`))
        }

        const responses = await Promise.all(promises)
        return responses.map(res => res.data).flat()
    },

    // Get all dishes
    getAllDishes: async () => {
        const response = await api.get("/dishes")
        return response.data
    },

    // Get single dish
    getDishById: async (id: string) => {
        const response = await api.get(`/dishes/${id}`)
        return response.data
    }
}

export const subscriptionApi = {
    // Get all subscription plans
    getPlans: async () => {
        const response = await api.get("/subscriptions/plans")
        return response.data
    },

    // Get single plan
    getPlanById: async (id: string) => {
        const response = await api.get(`/subscriptions/plans/${id}`)
        return response.data
    },

    // Create subscription
    createSubscription: async (data: any) => {
        const response = await api.post("/subscriptions", data)
        return response.data
    }
}