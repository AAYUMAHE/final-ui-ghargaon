"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Leaf,
  Shield,
  CheckCircle,
  CreditCard,
  AlertCircle,
  Package
} from "lucide-react";
import { subscriptionApi } from "@/lib/menu-api";
import { SubscriptionPlan } from "@/components/types/menu.types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useAppSelector } from "@/store/hooks";
import { format, addDays } from "date-fns";
import { load } from "@cashfreepayments/cashfree-js";
import api from "@/lib/api";

interface Subscription {
  _id: string;
  planId: {
    _id: string;
    name: string;
    durationDays: number;
    price: number;
  };
  status: "active" | "cancelled" | "expired";
  endDate: string;
  startDate: string;
}

export default function SubscriptionCheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planId = searchParams.get("planId");
  const user = useAppSelector((state) => state.user.user);
  const isAuthLoaded = useAppSelector((state) => state.user.isAuthLoaded);

  const [plan, setPlan] = useState<SubscriptionPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedMeals, setSelectedMeals] = useState<string[]>(["lunch", "dinner"]);
  const [foodType, setFoodType] = useState<"veg" | "nonveg">("veg");
  const [includeWeekends, setIncludeWeekends] = useState(false);
  const [startDate, setStartDate] = useState(format(addDays(new Date(), 1), "yyyy-MM-dd"));

  useEffect(() => {
    if (!isAuthLoaded) return;
    if (!user) {
      router.push("/");
      return;
    }

    if (!planId) {
      router.push("/subscription");
      return;
    }

    checkAndFetch();
  }, [planId, user, isAuthLoaded]);

  const checkAndFetch = async () => {
    try {
      setLoading(true);
      
      // First check if user has active subscription
      const subsResponse = await api.get("/subscriptions/me");
      const subscription = subsResponse.data;
      
      // If user has an active subscription, redirect to subscriptions page
      if (subscription && subscription.status === "active") {
        toast.info("You already have an active subscription");
        router.push("/subscription");
        return;
      }
      
      // If no active subscription, fetch the plan details
      const planData = await subscriptionApi.getPlanById(planId!);
      setPlan(planData);
      
    } catch (error: any) {
      console.error("Error:", error);
      
      // If 404 (no subscription), that's fine - continue
      if (error.response?.status !== 404) {
        toast.error("Failed to load plan");
        router.push("/subscription");
      } else {
        // No subscription found, fetch plan
        const planData = await subscriptionApi.getPlanById(planId!);
        setPlan(planData);
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleMeal = (meal: string) => {
    setSelectedMeals(prev =>
      prev.includes(meal)
        ? prev.filter(m => m !== meal)
        : [...prev, meal]
    );
  };

  const calculateTotal = () => {
    if (!plan) return 0;
    let total = plan.price;
    if (includeWeekends && plan.durationDays >= 30) {
      total += Math.round(plan.price * 0.1);
    }
    return total;
  };

  const handleSubmit = async () => {
    if (!plan || !user) return;

    if (selectedMeals.length === 0) {
      toast.error("Please select at least one meal type");
      return;
    }

    try {
      setSubmitting(true);

      const cashfree = await load({
        mode: "production",
      });

      const res = await api.post("/payments/create", {
        type: "subscription",
        subscriptionData: {
          planId: plan._id,
          meals: selectedMeals,
          foodType,
          includeWeekends,
          startDate,
        },
      });

      const { paymentSessionId } = res.data;

      await cashfree.checkout({
        paymentSessionId,
        redirectTarget: "_self",
      });

    } catch (error: any) {
      console.error("Payment error:", error);
      toast.error(error.response?.data?.message || "Payment failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !isAuthLoaded) {
    return (
      <div className="min-h-screen pt-24 px-4 max-w-4xl mx-auto">
        <Skeleton className="h-96 rounded-3xl" />
      </div>
    );
  }

  if (!plan) return null;

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 max-w-4xl mx-auto">
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-black hover:text-primary mb-6"
      >
        <ArrowLeft size={18} />
        Back to Plans
      </button>

      <h1 className="text-3xl font-bold mb-2">Complete Your Subscription</h1>
      <p className="text-black mb-8">Customize your {plan.name}</p>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column - Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Plan Summary */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold">{plan.name}</h3>
                  <p className="text-sm text-black">{plan.durationDays} days • ₹{plan.pricePerDay}/day</p>
                </div>
                <Badge className="bg-primary">₹{plan.price}</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Meal Selection */}
          {/* <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4">Select Meals</h3>
              <div className="space-y-3">
                {["breakfast", "lunch", "dinner"].map((meal) => (
                  <div key={meal} className="flex items-center space-x-2">
                    <Checkbox
                      id={meal}
                      checked={selectedMeals.includes(meal)}
                      onCheckedChange={() => toggleMeal(meal)}
                    />
                    <Label htmlFor={meal} className="capitalize cursor-pointer">
                      {meal}
                    </Label>
                  </div>
                ))}
              </div>
              {selectedMeals.length === 0 && (
                <p className="text-xs text-error mt-2">Select at least one meal</p>
              )}
            </CardContent>
          </Card> */}

          {/* Food Type */}
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4">Food Preference</h3>
              <RadioGroup value={foodType} onValueChange={(v: any) => setFoodType(v)}>
                <div className="flex items-center space-x-2 mb-2">
                  <RadioGroupItem value="veg" id="veg" />
                  <Label htmlFor="veg" className="text-success cursor-pointer">Vegetarian</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="nonveg" id="nonveg" />
                  <Label htmlFor="nonveg" className="text-error cursor-pointer">Non-Vegetarian</Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Start Date */}
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4">Start Date</h3>
              <input
                type="date"
                value={startDate}
                min={format(addDays(new Date(), 1), "yyyy-MM-dd")}
                max={format(addDays(new Date(), 30), "yyyy-MM-dd")}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary outline-none"
              />
              <p className="text-xs text-black mt-2">
                Subscriptions start the day after purchase
              </p>
            </CardContent>
          </Card>

          {/* Weekends Option */}
          {/* <Card>
            <CardContent className="p-6">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="weekends"
                  checked={includeWeekends}
                  onCheckedChange={(checked) => setIncludeWeekends(checked as boolean)}
                />
                <div className="space-y-1">
                  <Label htmlFor="weekends" className="font-medium cursor-pointer">
                    Include Weekends
                  </Label>
                  <p className="text-sm text-black">
                    Get delivery on Saturdays and Sundays
                    {plan.durationDays >= 30 && " (additional 10% charge)"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card> */}
        </div>

        {/* Right Column - Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-24">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4">Order Summary</h3>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-black">Plan Price</span>
                  <span>₹{plan.price}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-black">Meals Selected</span>
                  <span>{selectedMeals.length} meals/day</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-black">Duration</span>
                  <span>{plan.durationDays} days</span>
                </div>
                {includeWeekends && plan.durationDays >= 30 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-black">Weekend Surcharge</span>
                    <span>+₹{Math.round(plan.price * 0.1)}</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold pt-3 border-t">
                  <span>Total</span>
                  <span className="text-primary text-xl">₹{calculateTotal()}</span>
                </div>
              </div>

              <Button
                onClick={handleSubmit}
                disabled={submitting || selectedMeals.length === 0}
                className="w-full bg-primary hover:bg-accent rounded-full h-12"
              >
                {submitting ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    <CreditCard size={18} className="mr-2" />
                    Proceed to Payment
                  </>
                )}
              </Button>

              <div className="mt-4 text-xs text-black text-center">
                <Shield size={12} className="inline mr-1" />
                Secure payment 
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}