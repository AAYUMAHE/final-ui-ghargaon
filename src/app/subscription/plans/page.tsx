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
  const [selectedDuration, setSelectedDuration] = useState<string>("all");
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

  // Filter plans based on selected duration
  const filteredPlans = selectedDuration === "all"
    ? plans
    : plans.filter((plan) => plan.durationDays.toString() === selectedDuration);

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

        {/* Filter Dropdown */}
        <div className="flex flex-col sm:flex-row justify-center items-center gap-3 mb-10">
          <span className="text-sm font-semibold text-black/60 uppercase tracking-wider">
            Filter Plans:
          </span>
          <div className="relative min-w-[180px]">
            <select
              value={selectedDuration}
              onChange={(e) => setSelectedDuration(e.target.value)}
              className="w-full bg-white hover:bg-orange-50/50 text-black border border-orange-100 px-4 py-2.5 rounded-xl text-sm font-medium shadow-sm outline-none cursor-pointer appearance-none transition-all focus:ring-2 focus:ring-primary/20 focus:border-primary pr-10"
            >
              <option value="all">All Plans</option>
              <option value="30">30 Days</option>
              <option value="15">15 Days</option>
              <option value="7">7 Days</option>
            </select>
            {/* Custom arrow indicator */}
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-black/60">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Plans Grid */}
        {filteredPlans.length === 0 ? (
          <div className="text-center py-12 text-black/60 bg-white rounded-2xl border border-orange-100 shadow-sm max-w-lg mx-auto">
            <p className="font-semibold text-lg mb-2">No plans available</p>
            <p className="text-sm">There are currently no subscription plans available for {selectedDuration} days.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredPlans.map((plan, index) => {
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
                  <Card className="rounded-2xl h-full hover:shadow-xl transition-all">
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
                      {savings > 0 && (
                        <div className="bg-green-50 text-green-700 p-2 rounded-lg mb-4 text-sm flex items-center gap-1">
                          <TrendingUp size={14} />
                          Save ₹{savings} compared to daily
                        </div>
                      )}

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
                        className="w-full rounded-full bg-soft text-primary hover:bg-primary hover:text-white"
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
        )}

        {/* Features Section */}
        <div className="mt-16 grid md:grid-cols-2 gap-6">
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