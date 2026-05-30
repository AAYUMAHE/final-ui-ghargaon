"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Clock,
  Leaf,
  Beef,
  CheckCircle,
  Award,
  TrendingUp,
  Sparkles,
  Calendar,
  Shield,
  ChevronRight
} from "lucide-react";
import { motion } from "framer-motion";
import { subscriptionApi } from "@/lib/menu-api";
import { useAppSelector } from "@/store/hooks";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

interface Plan {
  _id: string;
  name: string;
  durationDays: number;
  price: number;
  pricePerDay: number;
}

export default function SubscriptionPlansPage() {
  const router = useRouter();
  const user = useAppSelector((state) => state.user.user);
  
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const data = await subscriptionApi.getPlans();
      setPlans(data);
    } catch (error) {
      toast.error("Failed to load plans");
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = (planId: string) => {
    if (!user) {
      toast.error("Please login to subscribe", {
        action: {
          label: "Login",
          onClick: () => router.push(`//purchase/${planId}`)
        }
      });
      return;
    }
    router.push(`/subscription/purchase/${planId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-24 pb-16 px-4 max-w-7xl mx-auto">
        <Skeleton className="h-12 w-64 mb-8" />
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-96 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 bg-soft">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="bg-primary/10 text-primary mb-4">Subscription Plans</Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-textdark mb-4">
            Choose Your Meal Plan
          </h1>
          <p className="text-black text-lg max-w-2xl mx-auto">
            Flexible subscription plans that fit your lifestyle. Save more with longer commitments.
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan, index) => {
            const isPopular = index === 2; // Make the 3rd plan popular
            const savings = plan.durationDays >= 30 
              ? Math.round((plan.pricePerDay * plan.durationDays * 0.2))
              : 0;

            return (
              <motion.div
                key={plan._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative"
              >
                {isPopular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                    <Badge className="bg-accent text-white px-4 py-1 flex items-center gap-1">
                      <Award size={14} /> Most Popular
                    </Badge>
                  </div>
                )}

                <Card className={`rounded-2xl h-full hover:shadow-xl transition-all ${
                  isPopular ? 'border-2 border-primary scale-105' : ''
                }`}>
                  <CardContent className="p-6 flex flex-col h-full">
                    {/* Plan Header */}
                    <div className="mb-4">
                      <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold text-primary">₹{plan.price}</span>
                        <span className="text-sm text-black">/ {plan.durationDays} days</span>
                      </div>
                      <p className="text-sm text-black mt-1">₹{plan.pricePerDay}/day</p>
                    </div>

                    {/* Savings Badge */}
                    {savings > 0 }
                    {/* We have removed this temp */}
                    {/* && (     
                      <div className="bg-green-50 text-green-700 p-2 rounded-lg mb-4 text-sm flex items-center gap-1">
                        <TrendingUp size={14} />
                        Save ₹{savings} compared to daily
                      </div> */}

                    {/* Features */}
                    <ul className="space-y-3 mb-6 flex-1">
                      <li className="flex items-center gap-2 text-sm">
                        <CheckCircle size={16} className="text-green-600" />
                        <span>{plan.durationDays} days of meals</span>
                      </li>
                     
                      <li className="flex items-center gap-2 text-sm">
                        <CheckCircle size={16} className="text-green-600" />
                        <span>Free delivery</span>
                      </li>
                      {plan.durationDays >= 30 && (
                        <li className="flex items-center gap-2 text-sm">
                          <CheckCircle size={16} className="text-green-600" />
                          <span>Weekends available</span>
                        </li>
                      )}
                     
                    </ul>

                    {/* Subscribe Button */}
                    <Button
                      onClick={() => handleSubscribe(plan._id)}
                      className={`w-full rounded-full ${
                        isPopular 
                          ? 'bg-primary hover:bg-accent' 
                          : 'bg-soft text-primary hover:bg-primary hover:text-white'
                      }`}
                    >
                      Subscribe Now
                      <ChevronRight size={16} className="ml-1" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Features Section */}
        <div className="mt-16 grid md:grid-cols-3 gap-6">
          <Card className="rounded-2xl bg-white/50">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="text-primary" size={24} />
              </div>
              <h3 className="font-semibold mb-2">Flexible Schedule</h3>
              <p className="text-sm text-black">Choose your meals and delivery days</p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl bg-white/50">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="text-primary" size={24} />
              </div>
              <h3 className="font-semibold mb-2">Hygienic & Fresh</h3>
              <p className="text-sm text-black">Prepared in clean, hygienic kitchens</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}