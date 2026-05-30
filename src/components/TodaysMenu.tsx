"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ChevronRight, ShoppingBag, Clock, Star, Flame, Leaf } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { format, isToday, isTomorrow, parseISO } from "date-fns";
import { menuApi } from "@/lib/menu-api";
import { useCart } from "@/hooks/useCart";
import { Dish } from "@/components/types/menu.types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

interface TodaysMenuProps {
  limit?: number;
  showViewAll?: boolean;
}

export default function TodaysMenu({ limit = 4, showViewAll = true }: TodaysMenuProps) {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [loading, setLoading] = useState(true);
  const { addItem } = useCart();

  useEffect(() => {
    fetchTodaysDishes();
  }, []);

  const fetchTodaysDishes = async () => {
    try {
      const today = format(new Date(), "yyyy-MM-dd");
      const menus = await menuApi.getMenusByDate(today);
      
      // Extract all unique dishes from all meal types
      const allDishes = menus.reduce((acc: Dish[], menu: any) => {
        menu.dishes.forEach((dish: Dish) => {
          if (!acc.find(d => d._id === dish._id)) {
            acc.push(dish);
          }
        });
        return acc;
      }, []);
      
      setDishes(allDishes.slice(0, limit));
    } catch (error) {
      console.error("Failed to fetch today's dishes:", error);
      toast.error("Failed to load today's menu");
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (dish: Dish) => {
    addItem({
      dishId: dish._id,
      name: dish.name,
      image: dish.image,
      price: dish.price,
      quantity: 1,
      mealType: "lunch", // Default, user can change in detailed view
      type: dish.type,
      date: format(new Date(), "yyyy-MM-dd")
    });
  };

  if (loading) {
    return (
      <section className="py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-end mb-12">
            <div>
              <Skeleton className="h-10 w-64 mb-2" />
              <Skeleton className="h-5 w-48" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-96 rounded-3xl" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (dishes.length === 0) {
    return (
      <section className="py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4">Today's Menu</h2>
          <p className="text-gray-500 mb-8">No dishes available for today</p>
          <Link href="/menu">
            <Button className="bg-primary hover:bg-accent rounded-full">
              Browse Full Menu
            </Button>
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section id="menu" className="py-24 px-6 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h2 className="text-4xl font-bold mb-2">Today's Menu</h2>
            <p className="text-gray-500">Freshly prepared just for you</p>
          </div>
          {showViewAll && (
            <Link href="/menu">
              <Button variant="ghost" className="hidden md:flex items-center gap-2 rounded-full">
                View Full Menu <ChevronRight size={16} />
              </Button>
            </Link>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {dishes.map((dish, i) => (
            <motion.div
              key={dish._id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ y: -10 }}
              className="group bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all overflow-hidden"
            >
              <Link href={`/menu/dish/${dish._id}`}>
                <div className="relative h-56 overflow-hidden">
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
                  <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-white shadow-sm flex items-center gap-1 ${
                    dish.type === 'veg' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    <div className={`w-2 h-2 rounded-full ${dish.type === 'veg' ? 'bg-green-600' : 'bg-red-600'}`} />
                    {dish.type === 'veg' ? 'Veg' : 'Non-veg'}
                  </div>
                  {dish.spicyLevel === 'hot' && (
                    <div className="absolute top-4 left-4 px-2 py-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center gap-1">
                      <Flame size={12} /> Hot
                    </div>
                  )}
                </div>
              </Link>
              
              <div className="p-6">
                <Link href={`/menu/dish/${dish._id}`}>
                  <h3 className="text-lg font-bold mb-1 hover:text-primary transition-colors">{dish.name}</h3>
                </Link>
                
                <div className="flex items-center gap-2 mb-2">
                  {dish.rating && (
                    <div className="flex items-center gap-1 text-xs">
                      <Star size={12} className="fill-yellow-400 text-yellow-400" />
                      <span>{dish.rating}</span>
                    </div>
                  )}
                  {dish.preparationTime && (
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <Clock size={12} />
                      <span>{dish.preparationTime} min</span>
                    </div>
                  )}
                </div>

                <p className="text-primary font-black text-xl mb-4">₹{dish.price}</p>
                
                <button
                  onClick={() => handleAddToCart(dish)}
                  className="w-full bg-soft hover:bg-primary hover:text-white text-primary py-3 rounded-2xl font-bold transition-all flex items-center justify-center gap-2"
                >
                  <ShoppingBag size={18} /> Add to Order
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {showViewAll && (
          <div className="text-center mt-12 md:hidden">
            <Link href="/menu">
              <Button variant="outline" className="rounded-full">
                View Full Menu <ChevronRight size={16} className="ml-1" />
              </Button>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}