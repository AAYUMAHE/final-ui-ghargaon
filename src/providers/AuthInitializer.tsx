"use client"

import { useEffect } from "react"
import axios from "axios"
import { useAppDispatch } from "@/store/hooks"
import { setUser, setAuthLoaded } from "@/store/slices/userSlice"
import { useRouter } from "next/navigation"
import { loadCartFromStorage } from "@/store/slices/userSlice";
import { store } from "@/store/store"

export default function AuthInitializer() {

  const dispatch = useAppDispatch()
  const router = useRouter()

  useEffect(() => {
    // Load cart from localStorage when app initializes
    store.dispatch(loadCartFromStorage())
  }, [])

  useEffect(() => {

    const loadUser = async () => {

      try {

        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/auth/me`,
          { withCredentials: true }
        )

        dispatch(setUser(res.data))
        if (res.data.role === "admin") {
          router.push("/admin")
        }

      } catch (err: any) {

        if (err.response?.status === 401) {

          try {

            await axios.post(
              `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`,
              {},
              { withCredentials: true }
            )

            const res = await axios.get(
              `${process.env.NEXT_PUBLIC_API_URL}/auth/me`,
              { withCredentials: true }
            )

            dispatch(setUser(res.data))
            if (res.data.role === "admin") {
              router.push("/admin")
            }

          } catch {
            console.log("User not logged in")
          }

        }

      } finally {
        dispatch(setAuthLoaded(true))
      }

    }

    loadUser()

  }, [dispatch])

  return null
}