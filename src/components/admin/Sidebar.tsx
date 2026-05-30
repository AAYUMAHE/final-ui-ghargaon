"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
    LayoutDashboard,
    Users,
    Utensils,
    ClipboardList,
    CalendarDays,
    CreditCard,
    LogOut,
    Home,
    Package,
    Settings,
    icons
} from "lucide-react"
import { useDispatch } from "react-redux"
import { useRouter } from "next/navigation"
import axios from "axios"
import { toast } from "sonner"
import { clearUser } from "@/store/slices/userSlice"

const navItems = [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { name: "Orders", href: "/admin/orders", icon: ClipboardList },
    { name: "Menu", href: "/admin/menu", icon: CalendarDays },
    { name: "Dishes", href: "/admin/dishes", icon: Utensils },
    {
        name: "Subscriptions",
        href: "/admin/subscriptions",
        icon: CreditCard,
        subItems: [
            { name: "Active Subscriptions", href: "/admin/subscriptions", icon : CreditCard },
            { name: "Plans", href: "/admin/subscriptions/plans" , icon : Package},
        ]
    },
    { name: "Users", href: "/admin/users", icon: Users },
]

export default function Sidebar() {
    const pathname = usePathname()
    const dispatch = useDispatch()
    const router = useRouter()



    const handleLogout = async () => {

        const promise = axios.post(
            `${process.env.NEXT_PUBLIC_API_URL}/auth/logout`,
            {},
            { withCredentials: true }
        )

        await toast.promise(promise, {
            loading: "Logging out...",
            success: "Logged out",
            error: "Logout failed"
        })

        dispatch(clearUser())

        router.push("/")
    }

    const isActive = (href: string) => {
        return pathname === href || pathname.startsWith(`${href}/`)
    }

    return (
        <aside className="w-64 bg-white border-r min-h-screen sticky top-0">
            <div className="p-6 border-b">
                <Link href="/admin" className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-primary">Ghar Gaon</span>
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">Admin</span>
                </Link>
            </div>

            <nav className="p-4 space-y-1">
                {navItems.map((item) => {
                    const Icon = item.icon
                    const active = isActive(item.href)

                    return (
                        <div key={item.name}>
                            <Link
                                href={item.href}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all
                  ${active
                                        ? "bg-primary text-white shadow-md"
                                        : "text-black hover:bg-primary/10 hover:text-primary"
                                    }`}
                            >
                                <Icon size={20} />
                                {item.name}
                            </Link>

                            {item.subItems && active && (
                                <div className="ml-2 mt-1 space-y-1">
                                    {item.subItems.map((subItem) => (
                                        <Link
                                            key={subItem.href}
                                            href={subItem.href}
                                            className={`flex items-center gap-3 px-4 py-2 rounded-lg text-sm transition-all
                        ${pathname === subItem.href
                                                    ? "text-primary font-medium"
                                                    : "text-black hover:text-primary"
                                                }`}
                                        >
                                             <subItem.icon size={20} />
                                            {subItem.name}
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    )
                })}

                <div className="pt-4 mt-4 border-t">
                    <Link
                        href="/"
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-black hover:bg-primary/10 hover:text-primary transition-all"
                    >
                        <Home size={20} />
                        View Site
                    </Link>

                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-black hover:bg-error/10 hover:text-error transition-all"
                    >
                        <LogOut size={20} />
                        Logout
                    </button>
                </div>
            </nav>
        </aside>
    )
}

