"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingBag,
  Clock,
  Star,
  Flame,
  Filter,
  Calendar,
  ChevronDown,
  X,
  Search,
  Leaf,
  Beef,
  Utensils,
  Info
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { format, isToday, parseISO } from "date-fns";
import { menuApi } from "@/lib/menu-api";
import { useCart } from "@/hooks/useCart";
import { Dish, Menu } from "@/components/types/menu.types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useAppSelector } from "@/store/hooks";

const MEAL_TYPES = [
  { id: "breakfast", label: "Breakfast", icon: "🍳", color: "bg-orange-100 text-orange-700" },
  { id: "lunch", label: "Lunch", icon: "🍛", color: "bg-primary/10 text-primary" },
  { id: "dinner", label: "Dinner", icon: "🍽️", color: "bg-purple-100 text-purple-700" }
];

const SORT_OPTIONS = [
  { label: "Popular", value: "popular" },
  { label: "Price: Low to High", value: "price_asc" },
  { label: "Price: High to Low", value: "price_desc" },
  { label: "Name", value: "name" }
];

export default function TodaysMenuPage() {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [allDishes, setAllDishes] = useState<Dish[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMealType, setSelectedMealType] = useState<string>("all");
  const [dietaryFilter, setDietaryFilter] = useState<"all" | "veg" | "nonveg">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("popular");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500]);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedDish, setSelectedDish] = useState<Dish | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  
  const { addItem } = useCart();
  const user = useAppSelector((state) => state.user.user);

  useEffect(() => {
    fetchTodaysMenu();
  }, []);

  const fetchTodaysMenu = async () => {
    try {
      setLoading(true);
      const today = format(new Date(), "yyyy-MM-dd");
      
      // Fetch menus for today
      const menusData = await menuApi.getMenusByDate(today);
      
      // Fetch all dishes for details
      const dishesData = await menuApi.getAllDishes();
      const dishesMap = new Map(dishesData.map((d: Dish) => [d._id, d]));
      
      // Enrich menus with full dish details
      const enrichedMenus = menusData.map((menu: any) => ({
        ...menu,
        dishes: menu.dishes
          .map((dishId: string) => dishesMap.get(dishId))
          .filter(Boolean)
      }));
      
      setMenus(enrichedMenus);
      
      // Collect all unique dishes from all meal types
      const uniqueDishes = new Map();
      enrichedMenus.forEach((menu: Menu) => {
        menu.dishes.forEach((dish: Dish) => {
          if (!uniqueDishes.has(dish._id)) {
            uniqueDishes.set(dish._id, dish);
          }
        });
      });
      
      setAllDishes(Array.from(uniqueDishes.values()));
    } catch (error) {
      console.error("Failed to fetch today's menu:", error);
      toast.error("Failed to load today's menu");
    } finally {
      setLoading(false);
    }
  };

  const isOrderingAllowed = (mealType: string): boolean => {
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

  const handleAddToCart = (dish: Dish, mealType?: string) => {
    if (!user) {
      toast.error("Please login to add items to cart", {
        action: {
          label: "Login",
          onClick: () => window.location.href = "/auth/login"
        }
      });
      return;
    }

    const preferredMeal = mealType || "lunch";
    const targetMeal = getTargetMealType(dish, preferredMeal);

    if (!isOrderingAllowed(targetMeal)) {
      toast.error(
        `${targetMeal.charAt(0).toUpperCase() + targetMeal.slice(1)} ordering is closed after ${getCutoffLabel(targetMeal)}`,
        { description: "Please order before the cutoff time for same-day delivery." }
      );
      return;
    }

    addItem({
      dishId: dish._id,
      name: dish.name,
      image: dish.image,
      price: dish.price,
      quantity: 1,
      mealType: targetMeal as any,
      type: dish.type,
      date: format(new Date(), "yyyy-MM-dd")
    });
  };

  const getFilteredAndSortedDishes = () => {
    let filtered = [...allDishes];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(dish =>
        dish.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Dietary filter
    if (dietaryFilter !== "all") {
      filtered = filtered.filter(dish => dish.type === dietaryFilter);
    }

    // Price range filter
    filtered = filtered.filter(
      dish => dish.price >= priceRange[0] && dish.price <= priceRange[1]
    );

    // Sort
    switch (sortBy) {
      case "price_asc":
        filtered.sort((a, b) => a.price - b.price);
        break;
      case "price_desc":
        filtered.sort((a, b) => b.price - a.price);
        break;
      case "name":
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      default: // popular
        filtered.sort((a, b) => (b.totalOrders || 0) - (a.totalOrders || 0));
    }

    return filtered;
  };

  const getDishesByMealType = (mealType: string) => {
    const menu = menus.find(m => m.mealType === mealType);
    return menu?.dishes || [];
  };

  const getSpicyIcon = (level?: string) => {
    switch(level) {
      case "mild": return <Leaf size={14} className="text-green-600" />;
      case "medium": return <Flame size={14} className="text-orange-500" />;
      case "hot": return <Flame size={14} className="text-red-600" />;
      default: return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-24 pb-16 px-4 max-w-7xl mx-auto">
        <div className="mb-8">
          <Skeleton className="h-12 w-64 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>
        
        {/* Meal Type Tabs Skeleton */}
        <div className="flex gap-2 mb-8">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-10 w-24 rounded-full" />
          ))}
        </div>

        {/* Dishes Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <Skeleton key={i} className="h-80 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  const filteredDishes = getFilteredAndSortedDishes();

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 bg-soft">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="text-primary" size={24} />
            <h1 className="text-4xl font-bold text-textdark">Today's Menu</h1>
          </div>
          <p className="text-black text-lg">
            Freshly prepared meals for {format(new Date(), "EEEE, MMMM d, yyyy")}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <Badge className="bg-primary/10 text-primary">
              {allDishes.length} Dishes Available
            </Badge>
            <Badge variant="outline">
              {menus.length} Meal Types
            </Badge>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-white rounded-2xl shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black" size={18} />
              <Input
                placeholder="Search dishes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none"
            >
              {SORT_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>

            {/* Filter Button (Mobile) */}
            <Sheet open={showFilters} onOpenChange={setShowFilters}>
              <SheetTrigger asChild>
                <Button variant="outline" className="md:hidden">
                  <Filter size={18} className="mr-2" />
                  Filters
                </Button>
              </SheetTrigger>
              <SheetContent side="left">
                <SheetHeader>
                  <SheetTitle>Filter Dishes</SheetTitle>
                </SheetHeader>
                <MobileFilters
                  dietaryFilter={dietaryFilter}
                  setDietaryFilter={setDietaryFilter}
                  priceRange={priceRange}
                  setPriceRange={setPriceRange}
                  onClose={() => setShowFilters(false)}
                />
              </SheetContent>
            </Sheet>

            {/* Desktop Filters */}
            <div className="hidden md:flex items-center gap-3">
              <Button
                variant={dietaryFilter === "veg" ? "default" : "outline"}
                onClick={() => setDietaryFilter(dietaryFilter === "veg" ? "all" : "veg")}
                className="rounded-full"
              >
                <Leaf size={16} className="mr-2 text-green-600" />
                Veg
              </Button>
              <Button
                variant={dietaryFilter === "nonveg" ? "default" : "outline"}
                onClick={() => setDietaryFilter(dietaryFilter === "nonveg" ? "all" : "nonveg")}
                className="rounded-full"
              >
                <Beef size={16} className="mr-2 text-red-600" />
                Non-veg
              </Button>
            </div>
          </div>
        </div>

        {/* Meal Type Tabs */}
        <Tabs defaultValue="all" value={selectedMealType} onValueChange={setSelectedMealType} className="mb-8">
          <TabsList className="w-full flex justify-start gap-2 bg-transparent h-auto p-0 overflow-x-auto">
            <TabsTrigger
              value="all"
              className="px-6 py-3 rounded-full data-[state=active]:bg-primary data-[state=active]:text-white"
            >
              All Dishes
            </TabsTrigger>
            {MEAL_TYPES.map((type) => (
              <TabsTrigger
                key={type.id}
                value={type.id}
                className="px-6 py-3 rounded-full data-[state=active]:bg-primary data-[state=active]:text-white"
              >
                <span className="mr-2">{type.icon}</span>
                {type.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* All Dishes Tab */}
          <TabsContent value="all" className="mt-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedMealType + dietaryFilter + searchQuery}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              >
                {filteredDishes.length > 0 ? (
                  filteredDishes.map((dish, index) => (
                    <DishCard
                      key={dish._id}
                      dish={dish}
                      index={index}
                      orderingAllowed={isDishOrderingAllowed(dish, selectedMealType)}
                      cutoffLabel={getDishCutoffLabel(dish, selectedMealType)}
                      onAddToCart={() => handleAddToCart(dish)}
                      onViewDetails={() => {
                        setSelectedDish(dish);
                        setIsDetailOpen(true);
                      }}
                    />
                  ))
                ) : (
                  <div className="col-span-full text-center py-12">
                    <Utensils size={48} className="mx-auto text-black mb-4" />
                    <p className="text-black text-lg">No dishes found</p>
                    <p className="text-sm text-black">Try adjusting your filters</p>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </TabsContent>
 
          {/* Individual Meal Type Tabs */}
          {MEAL_TYPES.map((type) => (
            <TabsContent key={type.id} value={type.id} className="mt-6">
              <AnimatePresence mode="wait">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                >
                  {getDishesByMealType(type.id).map((dish, index) => (
                    <DishCard
                      key={dish._id}
                      dish={dish}
                      index={index}
                      mealType={type.id}
                      orderingAllowed={isOrderingAllowed(type.id)}
                      cutoffLabel={getCutoffLabel(type.id)}
                      onAddToCart={() => handleAddToCart(dish, type.id)}
                      onViewDetails={() => {
                        setSelectedDish(dish);
                        setIsDetailOpen(true);
                      }}
                    />
                  ))}
                </motion.div>
              </AnimatePresence>
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* Dish Detail Modal */}
      <DishDetailModal
        dish={selectedDish}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onAddToCart={handleAddToCart}
        isMealOrderingAllowed={isOrderingAllowed}
        getMealCutoffLabel={getCutoffLabel}
      />
    </div>
  );
}

// Dish Card Component
function DishCard({ dish, index, mealType, orderingAllowed = true, cutoffLabel = "", onAddToCart, onViewDetails }: {
  dish: Dish;
  index: number;
  mealType?: string;
  orderingAllowed?: boolean;
  cutoffLabel?: string;
  onAddToCart: () => void;
  onViewDetails: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -5 }}
      className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all overflow-hidden cursor-pointer"
      onClick={onViewDetails}
    >
      <div className="relative h-48 overflow-hidden">
        {dish.image ? (
          <Image
            src={dish.image}
            alt={dish.name}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
            <span className="text-4xl">🍽️</span>
          </div>
        )}
        
        {/* Type Badge */}
        <div className={`absolute top-3 left-3 px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1
          ${dish.type === 'veg' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
        >
          <div className={`w-2 h-2 rounded-full ${dish.type === 'veg' ? 'bg-green-600' : 'bg-red-600'}`} />
          {dish.type === 'veg' ? 'Veg' : 'Non-veg'}
        </div>

        {/* Spicy Level */}
        {dish.spicyLevel === 'hot' && (
          <div className="absolute top-3 right-3 px-2 py-1 rounded-full bg-red-500 text-white text-xs font-bold flex items-center gap-1">
            <Flame size={12} /> Hot
          </div>
        )}

        {/* Ordering closed overlay */}
        {!orderingAllowed && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
            <div className="bg-white/95 rounded-xl px-4 py-2 text-center shadow-lg">
              <p className="text-red-600 font-bold text-sm">Ordering Closed</p>
              {cutoffLabel && (
                <p className="text-xs text-gray-500 mt-0.5">Closed after {cutoffLabel}</p>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-lg line-clamp-1">{dish.name}</h3>
          {mealType && (
            <Badge variant="outline" className="text-xs">
              {mealType}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-3 mb-3">
          {dish.rating && (
            <div className="flex items-center gap-1 text-sm">
              <Star size={14} className="fill-yellow-400 text-yellow-400" />
              <span>{dish.rating}</span>
            </div>
          )}
          {dish.preparationTime && (
            <div className="flex items-center gap-1 text-xs text-black">
              <Clock size={12} />
              <span>{dish.preparationTime} min</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <p className="text-xl font-bold text-primary">₹{dish.price}</p>
          {orderingAllowed ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddToCart();
              }}
              className="p-2 bg-soft hover:bg-primary hover:text-white rounded-xl transition-colors"
            >
              <ShoppingBag size={18} />
            </button>
          ) : (
            <button
              disabled
              className="p-2 bg-gray-100 text-gray-400 rounded-xl cursor-not-allowed"
              onClick={(e) => e.stopPropagation()}
              title={cutoffLabel ? `Closed after ${cutoffLabel}` : "Ordering Closed"}
            >
              <ShoppingBag size={18} />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// Mobile Filters Component
function MobileFilters({ dietaryFilter, setDietaryFilter, priceRange, setPriceRange, onClose }: {
  dietaryFilter: string;
  setDietaryFilter: (value: "all" | "veg" | "nonveg") => void;
  priceRange: [number, number];
  setPriceRange: (range: [number, number]) => void;
  onClose: () => void;
}) {
  return (
    <div className="space-y-6 py-4">
      <div>
        <h4 className="font-medium mb-3">Dietary Preference</h4>
        <div className="space-y-2">
          {[
            { value: "all", label: "All" },
            { value: "veg", label: "Vegetarian", icon: <Leaf className="text-green-600" size={18} /> },
            { value: "nonveg", label: "Non-Vegetarian", icon: <Beef className="text-red-600" size={18} /> }
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => {
                setDietaryFilter(option.value as any);
                onClose();
              }}
              className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                dietaryFilter === option.value
                  ? 'bg-primary text-white'
                  : 'hover:bg-gray-100'
              }`}
            >
              {option.icon}
              <span>{option.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <h4 className="font-medium mb-3">Price Range</h4>
        <div className="px-2">
          <input
            type="range"
            min="0"
            max="500"
            value={priceRange[1]}
            onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
            className="w-full"
          />
          <div className="flex justify-between mt-2 text-sm">
            <span>₹{priceRange[0]}</span>
            <span>₹{priceRange[1]}</span>
          </div>
        </div>
      </div>

      <Button onClick={onClose} className="w-full">Apply Filters</Button>
    </div>
  );
}

// Dish Detail Modal Component
function DishDetailModal({ dish, isOpen, onClose, onAddToCart, isMealOrderingAllowed, getMealCutoffLabel }: {
  dish: Dish | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (dish: Dish, mealType?: string) => void;
  isMealOrderingAllowed?: (mealType: string) => boolean;
  getMealCutoffLabel?: (mealType: string) => string;
}) {
  const [quantity, setQuantity] = useState(1);
  const [selectedMealType, setSelectedMealType] = useState<"breakfast" | "lunch" | "dinner">("lunch");

  if (!dish) return null;

  const orderingAllowed = isMealOrderingAllowed ? isMealOrderingAllowed(selectedMealType) : true;
  const cutoffLabel = getMealCutoffLabel ? getMealCutoffLabel(selectedMealType) : "";

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Image */}
            <div className="relative h-64 bg-gray-100">
              {dish.image ? (
                <Image
                  src={dish.image}
                  alt={dish.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-6xl">🍽️</span>
                </div>
              )}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="flex items-center gap-2 mb-3">
                <Badge className={dish.type === "veg" ? "bg-success" : "bg-error"}>
                  {dish.type === "veg" ? "🟢 Vegetarian" : "🔴 Non-vegetarian"}
                </Badge>
                {dish.spicyLevel && (
                  <Badge variant="outline">
                    {dish.spicyLevel === "hot" ? "🌶️ Hot" : 
                     dish.spicyLevel === "medium" ? "🌶️ Medium" : "🟢 Mild"}
                  </Badge>
                )}
              </div>

              <h2 className="text-2xl font-bold mb-2">{dish.name}</h2>

              {dish.description && (
                <p className="text-black mb-4">{dish.description}</p>
              )}

              <div className="flex items-center gap-4 mb-6">
                {dish.rating && (
                  <div className="flex items-center gap-1">
                    <Star size={18} className="fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold">{dish.rating}</span>
                  </div>
                )}
                {dish.preparationTime && (
                  <div className="flex items-center gap-1 text-black">
                    <Clock size={18} />
                    <span>{dish.preparationTime} mins</span>
                  </div>
                )}
              </div>

              <p className="text-3xl font-bold text-primary mb-6">₹{dish.price}</p>

              {/* Meal Type Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Select Meal</label>
                <div className="flex gap-2">
                  {MEAL_TYPES.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setSelectedMealType(type.id as any)}
                      className={`flex-1 py-2 rounded-lg capitalize transition-colors ${
                        selectedMealType === type.id
                          ? 'bg-primary text-white'
                          : 'bg-gray-100 hover:bg-gray-200'
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity */}
              <div className="mb-8">
                <label className="block text-sm font-medium mb-2">Quantity</label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 rounded-full border flex items-center justify-center hover:bg-gray-100"
                  >
                    -
                  </button>
                  <span className="w-12 text-center font-semibold text-lg">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-10 h-10 rounded-full border flex items-center justify-center hover:bg-gray-100"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Add to Cart */}
              {orderingAllowed ? (
                <button
                  onClick={() => {
                    for (let i = 0; i < quantity; i++) {
                      onAddToCart(dish, selectedMealType);
                    }
                    onClose();
                  }}
                  className="w-full bg-primary hover:bg-accent text-white py-4 rounded-xl font-semibold text-lg flex items-center justify-center gap-2 transition-colors"
                >
                  <ShoppingBag size={20} />
                  Add to Cart · ₹{dish.price * quantity}
                </button>
              ) : (
                <button
                  disabled
                  className="w-full bg-gray-100 text-gray-400 py-4 rounded-xl font-semibold text-lg flex items-center justify-center gap-2 cursor-not-allowed"
                >
                  Closed after {cutoffLabel}
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}