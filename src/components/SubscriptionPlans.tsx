"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Clock, Leaf, ShieldCheck, Award, CheckCircle, TrendingUp } from "lucide-react";
import Link from "next/link";
import { subscriptionApi } from "@/lib/menu-api";
import { SubscriptionPlan } from "@/components/types/menu.types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAppSelector } from "@/store/hooks";

interface SubscriptionPlansProps {
  limit?: number;
  showViewAll?: boolean;
}

export default function SubscriptionPlans({ limit = 4, showViewAll = true }: SubscriptionPlansProps) {
  const router = useRouter();
  const user = useAppSelector((state) => state.user.user);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const data = await subscriptionApi.getPlans();
      
      // Enhance plans with additional data
      const enhancedPlans = data.map((plan: SubscriptionPlan, index: number) => {
        const calculatedPricePerDay = Math.round(plan.price / plan.durationDays);
        return {
          ...plan,
          pricePerDay: calculatedPricePerDay,
          description: `Perfect for ${plan.durationDays === 3 ? 'trying our service' : 
                       plan.durationDays === 7 ? 'weekly meal prep' :
                       plan.durationDays === 30 ? 'monthly savings' : 'long-term commitment'}`,
          features: [
            `₹${calculatedPricePerDay}/day`,
            `${plan.durationDays} days of meals`,
            'Choice of meals (Lunch/Dinner)',
            plan.durationDays >= 30 ? 'Weekends included' : 'Weekends optional'
          ],
          isPopular: index === 2, // Make the 3rd plan popular
          savings: plan.durationDays >= 30 ? `Save ₹${(calculatedPricePerDay * plan.durationDays * 0.2).toFixed(0)}` : undefined
        };
      });
      
      setPlans(enhancedPlans.slice(0, limit));
    } catch (error) {
      console.error("Failed to fetch plans:", error);
      toast.error("Failed to load subscription plans");
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = (plan: SubscriptionPlan) => {
    if (!user) {
      toast.error("Please login to subscribe");
      router.push("/auth/login");
      return;
    }

    // Store selected plan in session storage
    sessionStorage.setItem("selectedPlan", JSON.stringify(plan));
    router.push(`/checkout/subscription?planId=${plan._id}`);
  };

  if (loading) {
    return (
      <section className="py-24 px-6 bg-soft">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Skeleton className="h-10 w-96 mx-auto mb-4" />
            <Skeleton className="h-5 w-64 mx-auto" />
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-96 rounded-3xl" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="subscription" className="py-24 px-6 bg-soft">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <Badge className="bg-primary/10 text-primary mb-4">Subscription Plans</Badge>
          <h2 className="text-4xl font-bold mb-4">Meal Subscription Plans</h2>
          <p className="text-gray-500 max-w-2xl mx-auto">
            Save more with our flexible long-term plans. Choose what works best for you.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan, i) => (
            <motion.div
              key={plan._id}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              className={`relative p-8 rounded-3xl flex flex-col transition-all ${
                plan.isPopular 
                  ? 'bg-primary text-white shadow-2xl scale-105 z-10 border-2 border-accent' 
                  : 'bg-white text-textdark border border-gray-100 hover:shadow-xl'
              }`}
            >
              {plan.isPopular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-accent text-white px-4 py-1 rounded-full text-xs font-bold shadow-lg flex items-center gap-1 whitespace-nowrap">
                  <Award size={14} /> Most Popular
                </div>
              )}

              {plan.savings && (
                <div className="absolute top-4 right-4">
                  <Badge className="bg-green-500 text-white">Save {plan.savings}</Badge>
                </div>
              )}

              <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
              <p className={`text-sm mb-4 ${plan.isPopular ? 'text-white/80' : 'text-gray-500'}`}>
                {plan.description}
              </p>
              
              <div className="mb-6">
                <p className="text-4xl font-black">{plan.price}</p>
                <p className={`text-sm ${plan.isPopular ? 'text-white/80' : 'text-gray-500'}`}>
                  ₹{plan.pricePerDay}/day
                </p>
              </div>

              <ul className="space-y-4 mb-10 text-sm flex-1">
                <li className="flex items-center gap-2">
                  <Clock size={16} className={plan.isPopular ? 'text-white' : 'text-primary'} />
                  <span>{plan.durationDays} days validity</span>
                </li>
                <li className="flex items-center gap-2">
                  <ShieldCheck size={16} className={plan.isPopular ? 'text-white' : 'text-primary'} />
                  <span>Free Delivery</span>
                </li>
                {plan.durationDays >= 30 && (
                  <li className="flex items-center gap-2">
                    <TrendingUp size={16} className={plan.isPopular ? 'text-white' : 'text-primary'} />
                    <span>Weekends Included</span>
                  </li>
                )}
              </ul>

              <button
                onClick={() => handleSubscribe(plan)}
                className={`w-full py-4 rounded-2xl font-bold transition-all mt-auto ${
                  plan.isPopular 
                    ? 'bg-white text-primary hover:bg-gray-100' 
                    : 'bg-primary text-white hover:bg-accent'
                }`}
              >
                Subscribe Now
              </button>
            </motion.div>
          ))}
        </div>

      
      </div>
    </section>
  );
}