"use client";

import { User, LogOut, Settings, Package, CreditCard, Home } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { clearUser } from "@/store/slices/userSlice";
import { toast } from "sonner";
import axios from "axios";

interface UserMenuProps {
  user: {
    _id: string;
    email: string;
    fullName?: string;
    username?: string;
    role?: string;
  };
  mobile?: boolean;
  onClose?: () => void;
}

export default function UserMenu({ user, mobile, onClose }: UserMenuProps) {
  const router = useRouter();
  const dispatch = useDispatch();

  const getInitials = () => {
    if (user.fullName) {
      return user.fullName
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return user.email.slice(0, 2).toUpperCase();
  };

  const handleLogout = async () => {
    try {

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
      if (onClose) onClose();
    } catch (error) {
      toast.error("Failed to logout");
    }
  };

  const handleClick = (path: string) => {
    router.push(path);
    if (onClose) onClose();
  };

  if (mobile) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-3 p-2">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary/10 text-primary">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{user.fullName || user.username || 'User'}</p>
            <p className="text-sm text-black">{user.email}</p>
          </div>
        </div>

        <button
          onClick={() => handleClick("/profile")}
          className="w-full text-left px-4 py-2 hover:bg-gray-100 rounded-lg flex items-center gap-2"
        >
          <User size={18} /> Profile
        </button>

        <button
          onClick={() => handleClick("/orders")}
          className="w-full text-left px-4 py-2 hover:bg-gray-100 rounded-lg flex items-center gap-2"
        >
          <Package size={18} /> Orders
        </button>

        <button
          onClick={() => handleClick("/subscription")}
          className="w-full text-left px-4 py-2 hover:bg-gray-100 rounded-lg flex items-center gap-2"
        >
          <CreditCard size={18} /> Subscription
        </button>

        {user.role === "admin" && (
          <button
            onClick={() => handleClick("/admin")}
            className="w-full text-left px-4 py-2 hover:bg-gray-100 rounded-lg flex items-center gap-2"
          >
            <Settings size={18} /> Admin Panel
          </button>
        )}

        <button
          onClick={handleLogout}
          className="w-full text-left px-4 py-2 hover:bg-red-50 rounded-lg flex items-center gap-2 text-error"
        >
          <LogOut size={18} /> Logout
        </button>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 hover:bg-gray-100 rounded-full p-1 transition-colors">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary/10 text-primary">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col">
            <span>{user.fullName || user.username || 'User'}</span>
            <span className="text-xs text-black font-normal">{user.email}</span>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <Link href="/profile" className="cursor-pointer">
            <User className="mr-2 h-4 w-4" />
            Profile
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link href="/orders" className="cursor-pointer">
            <Package className="mr-2 h-4 w-4" />
            My Orders
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link href="/subscription" className="cursor-pointer">
            <CreditCard className="mr-2 h-4 w-4" />
            Subscription
          </Link>
        </DropdownMenuItem>

        {user.role === "admin" && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/admin" className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                Admin Panel
              </Link>
            </DropdownMenuItem>
          </>
        )}

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={handleLogout} className="text-error cursor-pointer">
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}