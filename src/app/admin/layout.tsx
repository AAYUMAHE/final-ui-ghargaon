"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { useAppSelector } from "@/store/hooks"
import Sidebar from "@/components/admin/Sidebar"
import { Toaster } from "sonner"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const user = useAppSelector((state) => state.user.user)
  const isAuthLoaded = useAppSelector((state) => state.user.isAuthLoaded)

  useEffect(() => {
    if (!isAuthLoaded) return

    if (!user) {
      router.push("/auth/login")
      return
    }

    if (user.role !== "admin") {
      router.push("/")
    }
  }, [user, isAuthLoaded])

  if (!isAuthLoaded || !user || user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-soft">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-soft">
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
      <Toaster position="top-right" richColors />
    </div>
  )
}