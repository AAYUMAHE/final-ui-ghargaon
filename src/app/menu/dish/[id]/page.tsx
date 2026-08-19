"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  ShoppingBag,
  Clock,
  Star,
  Flame,
  Leaf,
  Calendar,
  Info,
  CheckCircle,
  Truck,
  Shield,
  AlertCircle
} from "lucide-react";
import { menuApi } from "@/lib/menu-api";
import { useCart } from "@/hooks/useCart";
import { Dish } from "@/components/types/menu.types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { format } from "date-fns";

export default function DishDetailPage() {
  const params = useParams();
  const router = useRouter();
  const dishId = params.id as string;
  
  const [dish, setDish] = useState<Dish | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedMealType, setSelectedMealType] = useState<"breakfast" | "lunch" | "dinner">("lunch");
  const [specialInstructions, setSpecialInstructions] = useState("");
  const { addItem } = useCart();

  useEffect(() => {
    fetchDish();
  }, [dishId]);

  const fetchDish = async () => {
    try {
      const data = await menuApi.getDishById(dishId);
      setDish(data);
    } catch (error) {
      console.error("Failed to fetch dish:", error);
      toast.error("Dish not found");
      router.push("/menu");
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

  const handleAddToCart = () => {
    if (!dish) return;

    // Time-based cutoff check
    if (!isOrderingAllowed(selectedMealType)) {
      toast.error(
        `${selectedMealType.charAt(0).toUpperCase() + selectedMealType.slice(1)} ordering is closed after ${getCutoffLabel(selectedMealType)}`,
        { description: "Please order before the cutoff time for same-day delivery." }
      );
      return;
    }

    addItem({
      dishId: dish._id,
      name: dish.name,
      image: dish.image,
      price: dish.price,
      quantity,
      mealType: selectedMealType,
      type: dish.type,
      date: format(new Date(), "yyyy-MM-dd"),
      specialInstructions: specialInstructions || undefined
    });

    toast.success(`${dish.name} added to cart`, {
      
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-24 px-4 max-w-7xl mx-auto">
        <Skeleton className="h-96 rounded-3xl mb-8" />
      </div>
    );
  }

  if (!dish) return null;

  const orderingAllowed = isOrderingAllowed(selectedMealType);

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 max-w-7xl mx-auto">
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-black hover:text-primary mb-6"
      >
        <ArrowLeft size={18} />
        Back to Menu
      </button>

      <div className="grid lg:grid-cols-2 gap-12">
        {/* Left Column - Image */}
        <div>
          <div className="relative h-96 rounded-3xl overflow-hidden bg-gray-100">
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
          </div>
        </div>

        {/* Right Column - Details */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Badge className={dish.type === "veg" ? "bg-success" : "bg-error"}>
              {dish.type === "veg" ? "🟢 Pure Vegetarian" : "🔴 Non-vegetarian"}
            </Badge>
            {dish.spicyLevel === "hot" && (
              <Badge variant="outline" className="border-red-500 text-red-500">
                <Flame size={12} className="mr-1" /> Spicy
              </Badge>
            )}
          </div>

          <h1 className="text-4xl font-bold mb-2">{dish.name}</h1>

          <div className="flex items-center gap-4 mb-6">
            {dish.rating && (
              <div className="flex items-center gap-1">
                <Star size={18} className="fill-yellow-400 text-yellow-400" />
                <span className="font-semibold">{dish.rating}</span>
              </div>
            )}
            {dish.totalOrders && (
              <span className="text-sm text-black">{dish.totalOrders}+ orders</span>
            )}
          </div>

          <p className="text-3xl font-bold text-primary mb-6">₹{dish.price}</p>

          {/* Meal Type Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Select Meal Type</label>
            <div className="flex gap-3">
              {(["breakfast", "lunch", "dinner"] as const).map((type) => {
                const allowed = isOrderingAllowed(type);
                return (
                  <button
                    key={type}
                    onClick={() => setSelectedMealType(type)}
                    disabled={!allowed}
                    className={`px-4 py-2 rounded-full capitalize transition-colors ${
                      selectedMealType === type
                        ? allowed
                          ? "bg-primary text-white"
                          : "bg-red-100 text-red-600 border border-red-300"
                        : allowed
                        ? "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        : "bg-gray-100 text-gray-300 cursor-not-allowed line-through"
                    }`}
                  >
                    {type}
                    {!allowed && (
                      <span className="ml-1 text-[10px] no-underline">✕</span>
                    )}
                  </button>
                );
              })}
            </div>
            {!orderingAllowed && (
              <p className="text-xs text-red-500 mt-2">
                {selectedMealType.charAt(0).toUpperCase() + selectedMealType.slice(1)} ordering closed after {getCutoffLabel(selectedMealType)}
              </p>
            )}
          </div>

          {/* Quantity */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Quantity</label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-10 h-10 rounded-full border flex items-center justify-center hover:bg-gray-100"
              >
                -
              </button>
              <span className="w-12 text-center font-semibold">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-10 h-10 rounded-full border flex items-center justify-center hover:bg-gray-100"
              >
                +
              </button>
            </div>
          </div>

          {/* Special Instructions */}
          <div className="mb-8">
            <label className="block text-sm font-medium mb-2">Special Instructions (Optional)</label>
            <textarea
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              placeholder="e.g., Less spicy, extra gravy, no onions..."
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary outline-none"
              rows={3}
            />
          </div>

          {/* Add to Cart Button */}
          {orderingAllowed ? (
            <Button
              onClick={handleAddToCart}
              className="w-full bg-primary hover:bg-accent rounded-full h-14 text-lg"
            >
              <ShoppingBag size={20} className="mr-2" />
              Add to Cart · ₹{dish.price * quantity}
            </Button>
          ) : (
            <Button
              disabled
              className="w-full rounded-full h-14 text-lg bg-gray-100 text-gray-400 cursor-not-allowed"
            >
              Ordering Closed · After {getCutoffLabel(selectedMealType)}
            </Button>
          )}

          {/* Dish Details Tabs */}
          <Tabs defaultValue="description" className="mt-8">
            <TabsList className="w-full">
              <TabsTrigger value="description">Description</TabsTrigger>
              <TabsTrigger value="nutrition">Nutrition</TabsTrigger>
              <TabsTrigger value="delivery">Delivery</TabsTrigger>
            </TabsList>

            <TabsContent value="description" className="mt-4">
              <p className="text-black">
                {dish.description || "Freshly prepared with authentic ingredients and traditional recipes. Served hot and packed with care."}
              </p>
            </TabsContent>

            <TabsContent value="nutrition" className="mt-4">
              <div className="space-y-2">
                <p className="text-sm">• Calories: 450-550 kcal</p>
                <p className="text-sm">• Protein: 15-20g</p>
                <p className="text-sm">• Carbs: 60-70g</p>
                <p className="text-sm">• Fats: 15-20g</p>
                <p className="text-xs text-black mt-2">*Approximate values may vary</p>
              </div>
            </TabsContent>

            <TabsContent value="delivery" className="mt-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-primary" />
                  <span className="text-sm">Delivery in 45-60 minutes</span>
                </div>
                <div className="flex items-center gap-2">
                  <Truck size={16} className="text-primary" />
                  <span className="text-sm">Free delivery on orders above ₹199</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield size={16} className="text-primary" />
                  <span className="text-sm">Hygienically packed</span>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}