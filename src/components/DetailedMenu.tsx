"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight,
  ChevronLeft,
  ShoppingBag,
  Clock,
  Star,
  Flame,
  Leaf,
  Utensils,
  Filter,
  Calendar,
  Search,
  Plus,
  Minus,
  Trash2,
  X
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { format, addDays, subDays, parseISO, isToday, isTomorrow } from "date-fns";
import api from "@/lib/api";
import { useCart } from "@/hooks/useCart";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { 
  addToCart,
  removeFromCart,
  updateCartItemQuantity,
  clearCart,
} from "@/store/slices/userSlice";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface Dish {
  _id: string;
  name: string;
  image: string;
  price: number;
  type: "veg" | "nonveg";
  description?: string;
  spicyLevel?: "mild" | "medium" | "hot";
  preparationTime?: number;
  rating?: number;
  totalOrders?: number;
}

interface MenuItem {
  _id: string;
  mealType: "breakfast" | "lunch" | "dinner";
  dishes: Dish[];
}

const MEAL_TYPES = [
  { id: "breakfast", label: "Breakfast", icon: "🍳" },
  { id: "lunch", label: "Lunch", icon: "🍛" },
  { id: "dinner", label: "Dinner", icon: "🍽️" }
];

export default function DetailedMenu() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.user.user);
  
  // Cart state with safe defaults
  const cartState = useAppSelector((state) => state.user.cart);
  const cartItems = cartState?.items || [];
  const cartTotal = cartState?.totalAmount || 0;
  const cartItemCount = cartState?.totalItems || 0;

  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [allDishes, setAllDishes] = useState<Dish[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedMealType, setSelectedMealType] = useState<string>("lunch");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedDish, setSelectedDish] = useState<Dish | null>(null);
  const [isDishDialogOpen, setIsDishDialogOpen] = useState(false);
  const [dateOptions, setDateOptions] = useState<{label: string, value: string, isAvailable: boolean}[]>([]);

  useEffect(() => {
    generateDateOptions();
    fetchData();
  }, []);

  useEffect(() => {
    fetchData();
  }, [selectedDate]);

  const generateDateOptions = () => {
    const options = [];
    const today = new Date();
    
    // Generate dates from today to today+6
    for (let i = 0; i <= 6; i++) {
      const date = addDays(today, i);
      
      options.push({
        label: isToday(date) ? "Today" : 
               isTomorrow(date) ? "Tomorrow" : 
               format(date, "EEE, MMM d"),
        value: format(date, "yyyy-MM-dd"),
        isAvailable: true
      });
    }
    
    setDateOptions(options);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [menusRes, dishesRes] = await Promise.all([
        api.get(`/menu?date=${format(selectedDate, "yyyy-MM-dd")}`),
        api.get("/dishes")
      ]);
      
      setMenus(menusRes.data);
      setAllDishes(dishesRes.data);
    } catch (error) {
      console.error("Failed to fetch data:", error);
      toast.error("Failed to load menu");
    } finally {
      setLoading(false);
    }
  };

  const isOrderingAllowed = (mealType: string): boolean => {
    const today = format(new Date(), "yyyy-MM-dd");
    const selected = format(selectedDate, "yyyy-MM-dd");
    if (selected !== today) return selected > today; // Future dates allowed, past disabled

    const now = new Date();
    const totalMins = now.getHours() * 60 + now.getMinutes();
    if (mealType === "breakfast") return totalMins < 4 * 60 + 30;  // before 4:30 AM
    if (mealType === "lunch")     return totalMins < 11 * 60;       // before 11:00 AM
    if (mealType === "dinner")    return totalMins < 18 * 60;       // before 6:00 PM
    return true;
  };

  const getCutoffLabel = (mealType: string): string => {
    if (mealType === "breakfast") return "4:30 AM";
    if (mealType === "lunch")     return "11:00 AM";
    if (mealType === "dinner")    return "6:00 PM";
    return "";
  };

  const isDishOrderingAllowed = (dish: Dish, mealType: string): boolean => {
    if (mealType !== "all") {
      return isOrderingAllowed(mealType);
    }
    const availableMealTypes = menus
      .filter(menu => menu.dishes.some(d => d._id === dish._id))
      .map(menu => menu.mealType);
      
    if (availableMealTypes.length === 0) return isOrderingAllowed("lunch");
    return availableMealTypes.some(mt => isOrderingAllowed(mt));
  };

  const getDishCutoffLabel = (dish: Dish, mealType: string): string => {
    if (mealType !== "all") return getCutoffLabel(mealType);
    const availableMealTypes = menus
      .filter(menu => menu.dishes.some(d => d._id === dish._id))
      .map(menu => menu.mealType);
    if (availableMealTypes.length === 0) return getCutoffLabel("lunch");
    if (availableMealTypes.includes("dinner")) return getCutoffLabel("dinner");
    if (availableMealTypes.includes("lunch")) return getCutoffLabel("lunch");
    return getCutoffLabel("breakfast");
  };

  const getTargetMealType = (dish: Dish, preferredMealType: string): string => {
    if (preferredMealType !== "all") return preferredMealType;
    const availableMealTypes = menus
      .filter(menu => menu.dishes.some(d => d._id === dish._id))
      .map(menu => menu.mealType);
    if (availableMealTypes.length === 0) return "lunch";
    const allowedMealType = availableMealTypes.find(mt => isOrderingAllowed(mt));
    return allowedMealType || availableMealTypes[0];
  };

  const handleAddToCart = (dish: Dish, mealType: string) => {
    if (!user) {
      toast.error("Please login to add items to cart", {
        action: {
          label: "Login",
          onClick: () => router.push("/")
        }
      });
      return;
    }

    const targetMeal = getTargetMealType(dish, mealType);

    // Time-based cutoff check
    if (!isOrderingAllowed(targetMeal)) {
      toast.error(
        `${targetMeal.charAt(0).toUpperCase() + targetMeal.slice(1)} ordering is closed after ${getCutoffLabel(targetMeal)}`,
        { description: "Please order before the cutoff time for same-day delivery." }
      );
      return;
    }

    const dateStr = format(selectedDate, "yyyy-MM-dd");

    // Check if item already exists in cart
    const existingItem = cartItems.find(
      item => item?.dishId === dish._id && 
      item?.mealType === targetMeal && 
      item?.date === dateStr
    );

    if (existingItem) {
      // Update quantity if exists
      dispatch(updateCartItemQuantity({
        dishId: dish._id,
        mealType: targetMeal,
        date: dateStr,
        quantity: (existingItem.quantity || 1) + 1
      }));
      toast.success(`Added another ${dish.name} to cart`);
    } else {
      // Add new item
      dispatch(addToCart({
        dishId: dish._id,
        name: dish.name,
        image: dish.image,
        price: dish.price,
        quantity: 1,
        mealType: targetMeal as "breakfast" | "lunch" | "dinner",
        type: dish.type,
        date: dateStr
      }));
      toast.success(`${dish.name} added to cart`);
    }
  };

  const handleRemoveFromCart = (dishId: string, mealType: string, date: string) => {
    dispatch(removeFromCart({ dishId, mealType, date }));
    toast.success("Item removed from cart");
  };

  const handleUpdateQuantity = (dishId: string, mealType: string, date: string, newQuantity: number) => {
    if (newQuantity < 1) {
      handleRemoveFromCart(dishId, mealType, date);
      return;
    }

    dispatch(updateCartItemQuantity({ dishId, mealType, date, quantity: newQuantity }));
  };

  const handleClearCart = () => {
    dispatch(clearCart());
    toast.success("Cart cleared");
  };

  const getCurrentMenu = () => {
    return menus.find(menu => menu.mealType === selectedMealType);
  };

  const getFilteredDishes = () => {
    if (selectedMealType === "all") {
      // Get all dishes from all menus
      let allMenuDishes: Dish[] = [];
      menus.forEach(menu => {
        allMenuDishes = [...allMenuDishes, ...menu.dishes];
      });
      // Remove duplicates
      allMenuDishes = Array.from(new Map(allMenuDishes.map(dish => [dish._id, dish])).values());
      
      // Apply filters
      return allMenuDishes.filter(dish => {
        const matchesSearch = dish.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = selectedType === "all" || dish.type === selectedType;
        return matchesSearch && matchesType;
      });
    } else {
      const menu = getCurrentMenu();
      if (!menu) return [];
      
      return menu.dishes.filter(dish => {
        const matchesSearch = dish.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = selectedType === "all" || dish.type === selectedType;
        return matchesSearch && matchesType;
      });
    }
  };

  const getDishById = (dishId: string) => {
    return allDishes.find(d => d._id === dishId) || null;
  };

  const getSpicyIcon = (level?: string) => {
    switch(level) {
      case "mild": return <Leaf size={16} className="text-green-600" />;
      case "medium": return <Flame size={16} className="text-orange-500" />;
      case "hot": return <Flame size={16} className="text-red-600" />;
      default: return null;
    }
  };

  if (loading) {
    return (
      <section className="py-16 px-6 max-w-7xl mx-auto">
        <Skeleton className="h-20 w-full rounded-3xl mb-8" />
        <Skeleton className="h-96 rounded-3xl" />
      </section>
    );
  }

  const filteredDishes = getFilteredDishes();

  return (
    <section className="py-16 px-6 max-w-7xl mx-auto font-sans">
      {/* Header with Cart */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <span className="text-primary font-bold text-xs uppercase tracking-widest mb-2 block">
            Weekly Menu
          </span>
          <h2 className="text-4xl font-bold text-textdark mb-2">See what's cooking</h2>
          <p className="text-gray-500 max-w-lg">
            A new menu every week. Fresh, exciting, and always delicious.
          </p>
        </div>
        
        {/* Cart Button */}
        <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
          <SheetTrigger asChild>
            <Button className="bg-primary hover:bg-accent rounded-full relative">
              <ShoppingBag size={18} className="mr-2" />
              Cart
              {cartItemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center animate-pulse">
                  {cartItemCount}
                </span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent className="w-full sm:max-w-lg">
            <SheetHeader>
              <SheetTitle className="flex items-center justify-between">
                <span>Your Cart ({cartItemCount} items)</span>
                {cartItemCount > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleClearCart}
                    className="text-red-600 hover:text-red-600"
                  >
                    <Trash2 size={16} className="mr-1" />
                    Clear
                  </Button>
                )}
              </SheetTitle>
            </SheetHeader>

            <div className="mt-6 flex-1 overflow-y-auto max-h-[calc(100vh-200px)]">
              {cartItems.length > 0 ? (
                <div className="space-y-4">
                  {cartItems.map((item, index) => {
                    const dish = getDishById(item.dishId);
                    if (!dish) return null;
                    
                    return (
                      <div key={`${item.dishId}-${item.mealType}-${item.date}-${index}`} className="flex items-start gap-3 p-3 border rounded-lg">
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
                              <Utensils size={20} className="text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{item.name}</p>
                            <Badge className={item.type === "veg" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                              {item.type === "veg" ? "Veg" : "Non-veg"}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">₹{item.price} × {item.quantity}</p>
                          <p className="text-xs text-gray-500 capitalize">{item.mealType} • {item.date}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-8 w-8 rounded-full"
                            onClick={() => handleUpdateQuantity(item.dishId, item.mealType, item.date, item.quantity - 1)}
                          >
                            <Minus size={12} />
                          </Button>
                          <span className="w-8 text-center">{item.quantity}</span>
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-8 w-8 rounded-full"
                            onClick={() => handleUpdateQuantity(item.dishId, item.mealType, item.date, item.quantity + 1)}
                          >
                            <Plus size={12} />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <ShoppingBag size={48} className="mx-auto text-gray-300 mb-2" />
                  <p className="text-gray-500">Your cart is empty</p>
                  <p className="text-sm text-gray-400 mt-2">Add items from the menu to get started</p>
                </div>
              )}
            </div>
            
            {cartItems.length > 0 && (
              <SheetFooter className="border-t pt-4 mt-4">
                <div className="w-full space-y-3">
                  <div className="flex justify-between items-center mb-4">
                    <span className="font-semibold">Total:</span>
                    <span className="text-2xl font-bold text-primary">₹{cartTotal}</span>
                  </div>
                  <Button 
                    className="w-full bg-primary hover:bg-accent rounded-full h-12"
                    onClick={() => {
                      setIsCartOpen(false);
                      router.push("/checkout");
                    }}
                  >
                    Proceed to Checkout
                  </Button>
                  <SheetClose asChild>
                    <Button variant="outline" className="w-full rounded-full">
                      Continue Shopping
                    </Button>
                  </SheetClose>
                </div>
              </SheetFooter>
            )}
          </SheetContent>
        </Sheet>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <Input
              placeholder="Search dishes..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Food Type Filter */}
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger>
              <SelectValue placeholder="Food Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="veg">Veg Only</SelectItem>
              <SelectItem value="nonveg">Non-veg Only</SelectItem>
            </SelectContent>
          </Select>

          {/* Meal Type Filter */}
          <Select value={selectedMealType} onValueChange={setSelectedMealType}>
            <SelectTrigger>
              <SelectValue placeholder="Meal Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Meals</SelectItem>
              <SelectItem value="breakfast">Breakfast</SelectItem>
              <SelectItem value="lunch">Lunch</SelectItem>
              <SelectItem value="dinner">Dinner</SelectItem>
            </SelectContent>
          </Select>

          {/* Reset Filters */}
          <Button 
            variant="outline" 
            onClick={() => {
              setSearchQuery("");
              setSelectedType("all");
              setSelectedMealType("lunch");
            }}
            className="rounded-full"
          >
            Reset Filters
          </Button>
        </div>
      </div>

      {/* Date Selector */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden mb-6">
        <div className="flex items-center gap-2 p-4 overflow-x-auto no-scrollbar">
          {dateOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setSelectedDate(parseISO(option.value))}
              disabled={!option.isAvailable}
              className={`px-5 py-2.5 rounded-xl text-[13px] font-bold whitespace-nowrap transition-all ${
                format(selectedDate, "yyyy-MM-dd") === option.value
                  ? "bg-primary text-white shadow-lg shadow-primary/20"
                  : !option.isAvailable
                  ? "bg-gray-100 text-gray-300 cursor-not-allowed"
                  : "bg-gray-50 text-gray-600 hover:bg-gray-100"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Dishes Grid */}
      {filteredDishes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDishes.map((dish) => (
            <Card 
              key={dish._id} 
              className="rounded-2xl overflow-hidden hover:shadow-xl transition-all group cursor-pointer"
              onClick={() => {
                setSelectedDish(dish);
                setIsDishDialogOpen(true);
              }}
            >
              <div className="relative h-48 bg-gray-100">
                {dish.image ? (
                  <Image
                    src={dish.image}
                    alt={dish.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Utensils size={48} className="text-gray-400" />
                  </div>
                )}
                <Badge 
                  className={`absolute top-3 left-3 ${dish.type === "veg" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                >
                  {dish.type === "veg" ? "Veg" : "Non-veg"}
                </Badge>
                {dish.spicyLevel === "hot" && (
                  <Badge className="absolute top-3 right-3 bg-red-100 text-red-800">
                    <Flame size={12} className="mr-1" /> Hot
                  </Badge>
                )}
                {/* Ordering closed overlay */}
                {!isDishOrderingAllowed(dish, selectedMealType) && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
                    <div className="bg-white/95 rounded-xl px-4 py-2 text-center shadow-lg">
                      <p className="text-red-600 font-bold text-sm">Ordering Closed</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Closed after {getDishCutoffLabel(dish, selectedMealType)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold text-lg">{dish.name}</h3>
                  </div>
                  <p className="text-xl font-bold text-primary">₹{dish.price}</p>
                </div>
                
                <div className="flex items-center gap-2 mb-3">
                  {dish.rating && (
                    <div className="flex items-center gap-1 text-sm">
                      <Star size={14} className="text-yellow-400 fill-yellow-400" />
                      <span>{dish.rating}</span>
                    </div>
                  )}
                  {dish.preparationTime && (
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock size={12} />
                      <span>{dish.preparationTime} min</span>
                    </div>
                  )}
                </div>

                {isDishOrderingAllowed(dish, selectedMealType) ? (
                  <Button 
                    className="w-full bg-primary hover:bg-accent rounded-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddToCart(dish, selectedMealType === "all" ? "lunch" : selectedMealType);
                    }}
                  >
                    <ShoppingBag size={16} className="mr-2" />
                    Add to Cart
                  </Button>
                ) : (
                  <Button 
                    disabled
                    className="w-full rounded-full bg-gray-100 text-gray-400 cursor-not-allowed"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Closed after {getDishCutoffLabel(dish, selectedMealType)}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-3xl">
          <Search size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium mb-2">No dishes found</h3>
          <p className="text-gray-500">Try adjusting your filters</p>
        </div>
      )}

      {/* Dish Details Dialog */}
      <Dialog open={isDishDialogOpen} onOpenChange={setIsDishDialogOpen}>
        <DialogContent className="max-w-2xl">
          {selectedDish && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedDish.name}</DialogTitle>
                <DialogDescription>
                  Detailed information about this dish
                </DialogDescription>
              </DialogHeader>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="rounded-2xl overflow-hidden bg-gray-100 h-64">
                  {selectedDish.image ? (
                    <Image
                      src={selectedDish.image}
                      alt={selectedDish.name}
                      width={400}
                      height={400}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Utensils size={48} className="text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge className={selectedDish.type === "veg" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                      {selectedDish.type === "veg" ? "🟢 Pure Vegetarian" : "🔴 Non-vegetarian"}
                    </Badge>
                    {selectedDish.spicyLevel && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        {getSpicyIcon(selectedDish.spicyLevel)}
                        {selectedDish.spicyLevel.charAt(0).toUpperCase() + selectedDish.spicyLevel.slice(1)}
                      </Badge>
                    )}
                  </div>

                  <div>
                    <p className="text-3xl font-bold text-primary">₹{selectedDish.price}</p>
                  </div>

                  {selectedDish.description && (
                    <div>
                      <h4 className="font-medium mb-1">Description</h4>
                      <p className="text-gray-600">{selectedDish.description}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    {selectedDish.preparationTime && (
                      <div className="flex items-center gap-2">
                        <Clock size={18} className="text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">Prep Time</p>
                          <p className="font-medium">{selectedDish.preparationTime} mins</p>
                        </div>
                      </div>
                    )}
                    {selectedDish.rating && (
                      <div className="flex items-center gap-2">
                        <Star size={18} className="text-yellow-400 fill-yellow-400" />
                        <div>
                          <p className="text-sm text-gray-500">Rating</p>
                          <p className="font-medium">{selectedDish.rating} ★</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {isDishOrderingAllowed(selectedDish, selectedMealType) ? (
                    <Button 
                      className="w-full bg-primary hover:bg-accent rounded-full h-12 mt-4"
                      onClick={() => {
                        handleAddToCart(selectedDish, selectedMealType === "all" ? "lunch" : selectedMealType);
                        setIsDishDialogOpen(false);
                      }}
                    >
                      <ShoppingBag size={18} className="mr-2" />
                      Add to Cart
                    </Button>
                  ) : (
                    <Button 
                      disabled
                      className="w-full rounded-full h-12 mt-4 bg-gray-100 text-gray-400 cursor-not-allowed"
                    >
                      Closed after {getDishCutoffLabel(selectedDish, selectedMealType)}
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}