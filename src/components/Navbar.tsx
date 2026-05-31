"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu as MenuIcon,
  X,
  ShoppingCart,
  ChevronRight,
  Trash2,
  Plus,
  Minus
} from "lucide-react";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { useCart } from "@/hooks/useCart";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import UserMenu from "@/components/UserMenu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import Image from "next/image";
import { format } from "date-fns";
import { toast } from "sonner";

const Navbar = () => {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useAppDispatch();

  // Hide navbar on admin pages
  if (pathname.startsWith("/admin")) return null;

  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);

  const user = useAppSelector((state) => state.user.user);
  const subscription = useAppSelector((state) => state.user.activeSubscription);
  const { items, total, itemCount, removeItem, updateQuantity, clearAll } = useCart();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navItems = [
    { name: "Menu", link: "/menu" },
    { name: "Today's Menu", link: "/menu" },
    { name: "Subscription", link: "/subscription/plans" },
    { name: "My Subscriptions", link: "/subscription" },
    { name: "Orders", link: "/orders" }
  ];

  const handleCheckout = () => {
    setCartOpen(false);
    setMobileOpen(false);
    if (!user) {
      toast.error("Please login to checkout");
      router.push("/auth/login");
      return;
    }
    router.push("/checkout");
  };

  const getDateLabel = (date: string) => {
    const today = format(new Date(), "yyyy-MM-dd");
    const tomorrow = format(new Date(Date.now() + 86400000), "yyyy-MM-dd");

    if (date === today) return "Today";
    if (date === tomorrow) return "Tomorrow";
    return format(new Date(date), "dd MMM");
  };

  return (
    <nav
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${isScrolled
        ? "bg-white/80 backdrop-blur-lg shadow-sm py-2"
        : "bg-gradient-to-b from-black/40 to-transparent py-4"
        }`}
    >
      <div className={`max-w-7xl mx-auto px-4 flex items-center justify-between transition-colors duration-300 ${isScrolled ? "text-textdark" : "text-white"}`}>

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <Image
            width={1000}
            height={1000}
            loading="lazy"
            src="https://res.cloudinary.com/dd36u8rxp/image/upload/v1773159321/ghar_gaon_logo1_lfkhw2.png"
            alt="Ghar Gaon"
            className="h-12 scale-200 w-auto"
          />
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-6">

          {/* Navigation Links */}
          <div className="flex items-center gap-6 font-medium text-sm">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.link}
                className="hover:text-primary transition-colors"
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Subscription Badge */}
          {subscription && subscription.planId && (
            <Link href="/subscription">
              <Badge className="bg-green-600 hover:bg-green-700 cursor-pointer">
                Active Plan: {typeof subscription.planId === "object" && "name" in subscription.planId ? (subscription.planId as any).name : "Active"}
              </Badge>
            </Link>
          )}

          {/* Cart Icon */}
          <Sheet open={cartOpen} onOpenChange={setCartOpen}>
            <SheetTrigger asChild>
              <button className={`relative p-2 rounded-full transition-colors ${isScrolled ? "hover:bg-gray-100" : "hover:bg-white/20"}`}>
                <ShoppingCart size={20} />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-white text-xs w-5 h-5 rounded-full flex items-center justify-center animate-bounce">
                    {itemCount}
                  </span>
                )}
              </button>
            </SheetTrigger>

            <SheetContent className="w-full sm:max-w-lg">
              <SheetHeader>
                <SheetTitle className="flex items-center text-black justify-between">
                  <span>Your Cart ({itemCount} items)</span>
                  {itemCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        clearAll();
                        toast.success("Cart cleared");
                      }}
                      className="text-error hover:text-error"
                    >
                      <Trash2 size={16} className="mr-1" />
                      Clear
                    </Button>
                  )}
                </SheetTitle>
              </SheetHeader>

              <div className="mt-6 flex-1 overflow-y-auto max-h-[calc(100vh-200px)]">
                {items.length > 0 ? (
                  <div className="space-y-4">
                    {items.map((item, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                        {/* Item Image */}
                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                          {item.image ? (
                            <Image
                              src={item.image}
                              alt={item.name}
                              width={64}
                              height={64}
                              className="object-cover w-full h-full"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <span className="text-2xl">🍽️</span>
                            </div>
                          )}
                        </div>

                        {/* Item Details */}
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-medium text-sm">{item.name}</h4>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge className={item.type === "veg" ? "" : ""} >
                                  {item.type}
                                </Badge>
                                <span className="text-xs text-black capitalize">{item.mealType}</span>
                              </div>
                              <p className="text-xs text-black mt-1">
                                {getDateLabel(item.date)}
                              </p>
                            </div>
                            <p className="font-semibold text-primary">₹{item.price * item.quantity}</p>
                          </div>

                          {/* Quantity Controls */}
                          <div className="flex items-center justify-between mt-3">
                            <div className="flex items-center gap-2">
                              <Button
                                size="icon"
                                variant="outline"
                                className="h-7 w-7 rounded-full"
                                onClick={() => updateQuantity(item.dishId, item.mealType, item.date, item.quantity - 1)}
                              >
                                <Minus size={12} />
                              </Button>
                              <span className="w-8 text-center text-sm">{item.quantity}</span>
                              <Button
                                size="icon"
                                variant="outline"
                                className="h-7 w-7 rounded-full"
                                onClick={() => updateQuantity(item.dishId, item.mealType, item.date, item.quantity + 1)}
                              >
                                <Plus size={12} />
                              </Button>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                removeItem(item.dishId, item.mealType, item.date);
                                toast.success("Item removed");
                              }}
                              className="text-error hover:text-error h-7 px-2"
                            >
                              <Trash2 size={14} />
                            </Button>
                          </div>

                          {item.specialInstructions && (
                            <p className="text-xs text-black mt-2 italic">
                              Note: {item.specialInstructions}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12">
                    <ShoppingCart size={48} className="text-black mb-4" />
                    <p className="text-black text-lg">Your cart is empty</p>
                    <p className="text-sm text-black mb-4">Add items from the menu to get started</p>
                    <SheetClose asChild>
                      <Link href="/menu">
                        <Button className="bg-primary hover:bg-accent rounded-full">
                          Browse Menu
                        </Button>
                      </Link>
                    </SheetClose>
                  </div>
                )}
              </div>

              {items.length > 0 && (
                <SheetFooter className="border-t pt-4 mt-4">
                  <div className="w-full space-y-3">
                    {/* Price Breakdown */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-black">Subtotal</span>
                        <span>₹{total}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-black">Delivery Fee</span>
                        <span className="text-success">Free</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-black">Taxes</span>
                        <span>Included</span>
                      </div>
                      <div className="flex justify-between font-semibold text-lg pt-2 border-t">
                        <span>Total</span>
                        <span className="text-primary">₹{total}</span>
                      </div>
                    </div>

                    {/* Checkout Button */}
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        variant="outline"
                        onClick={() => setCartOpen(false)}
                        className="rounded-full"
                      >
                        Continue Shopping
                      </Button>
                      <Button
                        onClick={handleCheckout}
                        className="bg-primary hover:bg-accent rounded-full"
                      >
                        Checkout
                        <ChevronRight size={16} className="ml-1" />
                      </Button>
                    </div>

                
                  </div>
                </SheetFooter>
              )}
            </SheetContent>
          </Sheet>

          {/* User Menu or Login */}
          {user ? (
            <UserMenu user={user} />
          ) : (
            <Link
              href="/auth/login"
              className="bg-primary text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-accent transition-colors"
            >
              Login
            </Link>
          )}
        </div>

        {/* Mobile Right Section */}
        <div className="flex items-center gap-3 md:hidden">
          {/* Mobile Cart Icon */}
          <button
            onClick={() => setCartOpen(true)}
            className={`relative p-2 rounded-full transition-colors ${isScrolled ? "hover:bg-gray-100" : "hover:bg-white/20"}`}
          >
            <ShoppingCart size={20} />
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-primary text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                {itemCount}
              </span>
            )}
          </button>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className={`transition-colors ${isScrolled ? "text-textdark" : "text-white"}`}
          >
            {mobileOpen ? <X size={24} /> : <MenuIcon size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden bg-white border-t overflow-hidden"
          >
            <div className="flex flex-col px-4 py-4 gap-3">

              {/* Navigation Links */}
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.link}
                  onClick={() => setMobileOpen(false)}
                  className="py-2 font-medium hover:text-primary transition-colors"
                >
                  {item.name}
                </Link>
              ))}

              {/* Subscription Badge */}
              {subscription && subscription.planId && (
                <Link href="/subscription" onClick={() => setMobileOpen(false)}>
                  <Badge className="bg-green-600 w-full justify-center py-2">
                    Active Plan: {typeof subscription.planId === "object" && "name" in subscription.planId ? (subscription.planId as any).name : "Active"}
                  </Badge>
                </Link>
              )}

              {/* Cart Summary */}
              {itemCount > 0 && (
                <div
                  className="border-t pt-3 mt-2 cursor-pointer"
                  onClick={() => {
                    setMobileOpen(false);
                    setCartOpen(true);
                  }}
                >
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <ShoppingCart size={18} className="text-primary" />
                      <span className="font-medium">{itemCount} items</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-primary">₹{total}</span>
                      <ChevronRight size={16} className="text-black" />
                    </div>
                  </div>
                </div>
              )}

              {/* User Menu or Login */}
              {user ? (
                <div className="border-t pt-3 mt-2">
                  <UserMenu user={user} mobile onClose={() => setMobileOpen(false)} />
                </div>
              ) : (
                <Link
                  href="/auth/login"
                  onClick={() => setMobileOpen(false)}
                  className="bg-primary text-white px-5 py-3 rounded-full text-center font-medium mt-2"
                >
                  Login / Sign Up
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;