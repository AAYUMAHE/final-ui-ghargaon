"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronRight, Star, ShoppingBag, Leaf, 
  Clock, ShieldCheck, MapPin, Menu as MenuIcon, X,
  Utensils, Truck, Heart
} from "lucide-react";
import Link from "next/link";


const Hero = () => {
  const images = [
    "https://images.unsplash.com/photo-1625398407796-82650a8c135f?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8aW5kaWFuJTIwZm9vZHxlbnwwfHwwfHx8MA%3D%3D",
    "https://images.unsplash.com/photo-1596797038530-2c107229654b?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTZ8fGluZGlhbiUyMGZvb2R8ZW58MHx8MHx8fDA%3D",
    "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8aW5kaWFuJTIwZm9vZHxlbnwwfHwwfHx8MA%3D%3D",
    "https://images.unsplash.com/photo-1728910107534-e04e261768ae?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MzJ8fGluZGlhbiUyMGZvb2R8ZW58MHx8MHx8fDA%3D"
  ];
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setIdx((prev) => (prev + 1) % images.length), 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative pt-32 pb-20 px-6 overflow-hidden min-h-[90vh] flex items-center">
      <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
        <motion.div 
          initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }}
          className="z-10"
        >
          <h1 className="text-5xl md:text-7xl font-extrabold leading-[1.1] mb-6">
            Fresh Homemade <br />
            <span className="text-primary italic">Meals Delivered Daily</span>
          </h1>
          <p className="text-lg text-gray-500 mb-10 max-w-lg leading-relaxed">
            Experience authentic ghar ka khana made with love and fresh ingredients. No preservatives, just pure village goodness delivered to your doorstep.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/menu/today/" className="bg-primary hover:bg-accent text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-xl shadow-primary/20 transition-all flex items-center justify-center gap-2 group">
              Order Today's Meal <ChevronRight className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="#subscription" className="border-2 border-primary text-primary hover:bg-primary/5 px-8 py-4 rounded-2xl font-bold text-lg transition-all">
              View Subscription
            </Link>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1 }}
          className="relative aspect-square"
        >
          <div className="absolute inset-0 bg-soft rounded-full -z-10 animate-pulse" />
          <AnimatePresence mode="wait">
            <motion.img
              key={idx}
              src={images[idx]}
              initial={{ opacity: 0, rotate: 10, scale: 0.9 }}
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              exit={{ opacity: 0, rotate: -10, scale: 0.9 }}
              transition={{ duration: 0.6 }}
              className="w-full h-full object-cover rounded-3xl shadow-2xl"
            />
          </AnimatePresence>
          <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-2xl shadow-xl flex items-center gap-3">
             <div className="w-12 h-12 bg-veg/10 text-veg rounded-full flex items-center justify-center"><Leaf /></div>
             <div>
               <p className="text-xs text-gray-400 font-bold uppercase">Pure</p>
               <p className="font-bold">Organic Veggies</p>
             </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};


export default Hero