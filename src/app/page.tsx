"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight, Star, ShoppingBag, Leaf,
  Clock, ShieldCheck, MapPin, Menu as MenuIcon, X,
  Utensils, Truck, Heart
} from "lucide-react";
import  { Footer, HowItWorks, MenuSection, SubscriptionSection, Testimonials } from "@/components/home/homepagesections";
import SubscriptionPlans from "@/components/SubscriptionPlans";
import TodaysMenu from "@/components/TodaysMenu";
import DetailedMenu from "@/components/DetailedMenu";





export default function GharGaonLanding() {
  const words = ["Welcome", "To", "GharGaon"];
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (index < words.length - 1) {
      const timer = setTimeout(() => {
        setIndex((prev) => prev + 1);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [index]);

  return (
    <div className="relative">

      {/* Custom Hero Section */}
      <section className="relative h-screen w-full flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('https://res.cloudinary.com/dj67gtxpi/image/upload/c_auto,h_1080,w_1920/Add_a_heading_ssui27.png')" }}
        >
          <div className="absolute inset-0 bg-black/60" />
        </div>

        <div className="relative z-10 flex items-center justify-center h-full w-full pt-16">
          <AnimatePresence mode="wait">
            <motion.h1
              key={index}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.2 }}
              transition={{ duration: 0.5 }}
              className="text-5xl md:text-7xl lg:text-9xl font-extrabold text-white tracking-wider text-center drop-shadow-2xl px-4"
            >
              {words[index]}
            </motion.h1>
          </AnimatePresence>
        </div>
      </section>
     <TodaysMenu />
      <SubscriptionPlans />
      <DetailedMenu />
     
      <HowItWorks />
     
      {/* App Features Grid */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { t: "Fresh Ingredients", i: <Leaf />, d: "Straight from local farms." },
            { t: "Daily Menu", i: <MenuIcon />, d: "Never get bored of eating." },
            { t: "Subscription", i: <Clock />, d: "Affordable and convenient." },
            { t: "Quick Delivery", i: <Truck />, d: "Always hot and on time." },
          ].map((f, i) => (
            <motion.div whileHover={{ scale: 1.05 }} key={i} className="p-8 rounded-3xl bg-soft border border-primary/10">
              <div className="text-primary mb-4">{f.i}</div>
              <h3 className="font-bold mb-2">{f.t}</h3>
              <p className="text-sm text-gray-500">{f.d}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <Testimonials />

      {/* CTA Section */}
      <section className="py-24 px-6">
        <motion.div
          initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }}
          className="max-w-7xl mx-auto bg-soft rounded-[3rem] p-12 md:p-20 text-center relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <h2 className="text-4xl md:text-6xl font-black mb-6">Eat Healthy, <br />Eat Homemade</h2>
          <p className="text-xl text-gray-600 mb-10 max-w-xl mx-auto">Join our happy customers who have switched to a healthier lifestyle with Ghar Gaon.</p>
          <button className="bg-primary hover:bg-accent text-white px-10 py-5 rounded-3xl font-bold text-xl shadow-2xl shadow-primary/30 transition-all active:scale-95">
            Start Subscription Today
          </button>
        </motion.div>
      </section>

      <Footer />
    </div>
  );
}