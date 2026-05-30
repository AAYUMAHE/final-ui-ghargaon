"use client"

import { Provider } from "react-redux"
import { store } from "./store"
import Navbar from "@/components/Navbar"
import { usePathname } from "next/navigation"

export default function ReduxProvider({
    children
}: {
    children: React.ReactNode
}) {

    const pathname = usePathname();


    return (
        <Provider store={store}>
            {!pathname.startsWith("/auth") && !pathname.startsWith("/admin") && <Navbar />}
            {children}
        </Provider>
    )
}