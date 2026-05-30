"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Leaf,
  Beef,
  CheckCircle,
  CreditCard,
  Shield,
  Info,
  ChevronRight,
  Sparkles,
  Award,
  TrendingUp,
  Package,
  Utensils,
  Loader2
} from "lucide-react";
import { motion } from "framer-motion";
import { format, addDays } from "date-fns";
import { subscriptionApi } from "@/lib/menu-api";
import api from "@/lib/api";
import { useAppSelector } from "@/store/hooks";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { load } from "@cashfreepayments/cashfree-js";

interface Plan {
  _id: string;
  name: string;
  durationDays: number;
  price: number;
  pricePerDay: number;
  description?: string;
  features?: string[];
}

export default function SubscriptionPurchasePage() {
  const params = useParams();
  const router = useRouter();
  const planId = params.id as string;
  const user = useAppSelector((state) => state.user.user);
  const isAuthLoaded = useAppSelector((state) => state.user.isAuthLoaded);

  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(1);

  // Form state
  const [selectedMeals, setSelectedMeals] = useState<string[]>(["lunch", "dinner"]);
  const [foodType, setFoodType] = useState<"veg" | "nonveg">("veg");
  const [includeWeekends, setIncludeWeekends] = useState(false);
  const [startDate, setStartDate] = useState(format(addDays(new Date(), 1), "yyyy-MM-dd"));

  useEffect(() => {
    if (!isAuthLoaded) return;
    if (!user) {
      toast.error("Please login to purchase subscription", {
        action: {
          label: "Login",
          onClick: () => router.push("/auth/login")
        }
      });
      router.push("/auth/login");
      return;
    }
    checkAndFetch();

  }, [planId, user, isAuthLoaded]);

  const checkAndFetch = async () => {
    try {
      setLoading(true);

      // Check if user has any subscription
      const subsResponse = await api.get("/subscriptions/me");
      const subscription = subsResponse.data;

      if (subscription) {
        const currentDate = new Date();
        const endDate = new Date(subscription.endDate);
        const startDate = new Date(subscription.startDate);

        // Case 1: Active subscription (not expired)
        if (subscription.status === "active" && endDate > currentDate) {
          const daysLeft = Math.ceil((endDate.getTime() - currentDate.getTime()) / (1000 * 3600 * 24));

          toast.error(
            `You already have an active subscription! ${daysLeft} days remaining until ${format(endDate, "dd MMM yyyy")}`,
            {
              duration: 5000,
              action: {
                label: "View Subscription",
                onClick: () => router.push("/subscription")
              }
            }
          );

          // Redirect after 3 seconds
          setTimeout(() => {
            router.push("/subscription");
          }, 3000);

          return;
        }

        // Case 2: Expired subscription
        if (endDate <= currentDate || subscription.status === "expired") {
          toast.info(
            `Your previous subscription expired on ${format(endDate, "dd MMM yyyy")}. You can start a new subscription!`,
            { duration: 4000 }
          );
          // Continue to fetch plan for new subscription
        }

        // Case 3: Cancelled but not expired (if you support cancellation)
        if (subscription.status === "cancelled" && endDate > currentDate) {
          toast.warning(
            `Your subscription is cancelled but active until ${format(endDate, "dd MMM yyyy")}`,
            {
              action: {
                label: "Reactivate",
                onClick: () => router.push(`/subscription/reactivate/${subscription._id}`)
              }
            }
          );
          return;
        }
      }

      // Fetch the plan details for new subscription
      const planData = await subscriptionApi.getPlanById(planId);
      setPlan(planData);

      // Set default meals based on plan duration
      if (planData.durationDays <= 7) {
        setSelectedMeals(["lunch"]);
      }

    } catch (error: any) {
      console.error("Error:", error);

      // If 404 (no subscription found), that's fine - allow new purchase
      if (error.response?.status === 404) {
        const planData = await subscriptionApi.getPlanById(planId);
        setPlan(planData);

        // Set default meals based on plan duration
        if (planData.durationDays <= 7) {
          setSelectedMeals(["lunch"]);
        }
      } else {
        toast.error("Failed to load plan");
        router.push("/subscription");
      }
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = () => {
    if (!plan) return 0;
    let total = plan.price;
    if (includeWeekends && plan.durationDays >= 30) {
      total += Math.round(plan.price * 0.1);
    }
    return total;
  };

  const calculateSavings = () => {
    if (!plan) return 0;
    const dailyRate = plan.pricePerDay;
    const payPerDay = plan.price / plan.durationDays;
    return Math.round((dailyRate - payPerDay) * plan.durationDays);
  };

  const handleMealToggle = (meal: string) => {
    setSelectedMeals(prev =>
      prev.includes(meal)
        ? prev.filter(m => m !== meal)
        : [...prev, meal]
    );
  };

  const validateStep = () => {
    if (step === 1) {
      if (selectedMeals.length === 0) {
        toast.error("Please select at least one meal type");
        return false;
      }
    }
    if (step === 2) {
      if (!startDate) {
        toast.error("Please select a start date");
        return false;
      }
      if (!user?.addresses || user.addresses.length === 0) {
        toast.error("Please add a delivery address");
        return false;
      }
    }
    return true;
  };

  const nextStep = () => {
    if (validateStep()) {
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    setStep(step - 1);
  };

  const handleSubmit = async () => {
    if (!plan || !user) return;

    if (selectedMeals.length === 0) {
      toast.error("Please select at least one meal type");
      return;
    }

    if (!user.addresses || user.addresses.length === 0) {
      toast.error("Please add a delivery address first");
      router.push("/profile?tab=addresses");
      return;
    }

    try {
      setSubmitting(true);

      // Initialize Cashfree
      const cashfree = await load({
        mode: "production",
      });

      // Create payment order
      const response = await api.post("/payments/create", {
        type: "subscription",
        subscriptionData: {
          planId: plan._id,
          meals: selectedMeals,
          foodType,
          includeWeekends,
          startDate,
          address: user.addresses[0],
        },
      });

      const { paymentSessionId } = response.data;

      // Redirect to Cashfree checkout
      await cashfree.checkout({
        paymentSessionId,
        redirectTarget: "_self",
      });

    } catch (error: any) {
      console.error("Payment error:", error);
      toast.error(error.response?.data?.message || "Payment failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Show loading state
  if (loading || !isAuthLoaded) {
    return (
      <div className="min-h-screen pt-24 pb-16 px-4 max-w-6xl mx-auto">
        <Skeleton className="h-12 w-64 mb-8" />
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Skeleton className="h-96 rounded-2xl mb-4" />
          </div>
          <div>
            <Skeleton className="h-96 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!plan) return null;

  const totalAmount = calculateTotal();
  const savings = calculateSavings();

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 bg-soft">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/subscription"
            className="inline-flex items-center gap-2 text-black hover:text-primary mb-4"
          >
            <ArrowLeft size={18} />
            Back to Plans
          </Link>
          <h1 className="text-4xl font-bold text-textdark mb-2">Complete Your Subscription</h1>
          <p className="text-black text-lg">
            You're subscribing to <span className="font-semibold text-primary">{plan.name}</span>
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between max-w-2xl">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center flex-1">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold
                  ${step >= i ? 'bg-primary text-white' : 'bg-gray-200 text-gray-500'}`}
                >
                  {step > i ? <CheckCircle size={20} /> : i}
                </div>
                {i < 3 && (
                  <div className={`flex-1 h-1 mx-2 rounded
                    ${step > i ? 'bg-primary' : 'bg-gray-200'}`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between max-w-2xl mt-2 text-sm">
            <span className={step >= 1 ? 'text-primary font-medium' : 'text-black'}>Choose Meals</span>
            <span className={step >= 2 ? 'text-primary font-medium' : 'text-black'}>Delivery Details</span>
            <span className={step >= 3 ? 'text-primary font-medium' : 'text-black'}>Payment</span>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <Card className="rounded-2xl">
              <CardContent className="p-6">
                {/* Step 1: Meal Selection */}
                {step === 1 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    <h2 className="text-xl font-semibold mb-6">Select Your Meals</h2>

                    <div className="space-y-6">
                      {/* <div> */}
                        {/* <label className="block text-sm font-medium mb-3">Meal Types</label>
                        <div className="grid grid-cols-3 gap-3">
                          {["breakfast", "lunch", "dinner"].map((meal) => (
                            <div
                              key={meal}
                              onClick={() => handleMealToggle(meal)}
                              className={`border rounded-xl p-4 cursor-pointer transition-all ${selectedMeals.includes(meal)
                                ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                                : 'hover:border-gray-300'
                                }`}
                            >
                              <div className="flex items-center gap-2 mb-2">
                                <Checkbox
                                  checked={selectedMeals.includes(meal)}
                                  onCheckedChange={() => handleMealToggle(meal)}
                                  className="data-[state=checked]:bg-primary"
                                />
                                <span className="font-medium capitalize">{meal}</span>
                              </div>
                              <p className="text-xs text-black">
                                {meal === "breakfast" ? "7:00 AM - 9:00 AM" :
                                  meal === "lunch" ? "12:00 PM - 2:00 PM" :
                                    "7:00 PM - 9:00 PM"}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div> */}

                      <Separator />

                      <div>
                        <label className="block text-sm font-medium mb-3">Food Preference</label>
                        <RadioGroup value={foodType} onValueChange={(v: any) => setFoodType(v)}>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="flex items-center space-x-2 border rounded-xl p-4">
                              <RadioGroupItem value="veg" id="veg" />
                              <Label htmlFor="veg" className="flex items-center gap-2 cursor-pointer">
                                <Leaf className="text-green-600" size={18} />
                                <span>Vegetarian</span>
                              </Label>
                            </div>
                          </div>
                        </RadioGroup>
                      </div>

                      {/* {plan.durationDays >= 30 && (
                        <>
                          <Separator />

                          <div>
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
                          </div>
                        </>
                      )} */}

                      {/* <Alert>
                        <Info size={16} />
                        <AlertDescription>
                          You can change meal preferences later, but changes will apply from next cycle.
                        </AlertDescription>
                      </Alert> */}
                    </div>
                  </motion.div>
                )}

                {/* Step 2: Delivery Details */}
                {step === 2 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    <h2 className="text-xl font-semibold mb-6">Delivery Details</h2>

                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium mb-2">Start Date</label>
                        <input
                          type="date"
                          value={startDate}
                          min={format(addDays(new Date(), 1), "yyyy-MM-dd")}
                          max={format(addDays(new Date(), 30), "yyyy-MM-dd")}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-primary outline-none"
                        />
                        <p className="text-xs text-black mt-2">
                          Subscriptions start the day after purchase
                        </p>
                      </div>

                      <Separator />

                      <div>
                        <label className="block text-sm font-medium mb-2">Delivery Address</label>
                        {user?.addresses && user.addresses.length > 0 ? (
                          <RadioGroup defaultValue={user.addresses[0]?.type}>
                            {user.addresses.map((address, index) => (
                              <div key={index} className="flex items-start space-x-2 border rounded-xl p-4 mb-2">
                                <RadioGroupItem value={address.type} id={address.type} />
                                <Label htmlFor={address.type} className="flex-1 cursor-pointer">
                                  <div className="flex items-center gap-2 mb-1">
                                    <Badge variant="outline" className="capitalize">{address.type}</Badge>
                                  </div>
                                  <p className="text-sm">
                                    {address.houseNumber}, {address.area}
                                  </p>
                                  <p className="text-xs text-black">{address.pincode}</p>
                                </Label>
                              </div>
                            ))}
                          </RadioGroup>
                        ) : (
                          <div className="text-center p-6 border rounded-xl">
                            <p className="text-black mb-4">No delivery address found</p>
                            <Link href="/profile?tab=addresses">
                              <Button variant="outline" className="rounded-full">
                                Add Delivery Address
                              </Button>
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Step 3: Payment */}
                {step === 3 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    <h2 className="text-xl font-semibold mb-6">Payment Method</h2>

                    <div className="space-y-6">
                      <div className="border rounded-xl p-6 text-center">
                        <CreditCard size={48} className="mx-auto text-primary mb-4" />
                        <h3 className="font-semibold text-lg mb-2">Cashfree Payments</h3>
                        <p className="text-black text-sm mb-4">
                          You will be redirected to the secure payment gateway
                        </p>
                        <div className="flex justify-center gap-4 text-xs text-black">
                          <span>✅ Credit/Debit Cards</span>
                          <span>✅ UPI</span>
                          <span>✅ Net Banking</span>
                          <span>✅ Wallets</span>
                        </div>
                      </div>

                      <Alert>
                        <Shield size={16} />
                        <AlertDescription>
                          Your payment is secured by Cashfree. We never store your card details.
                        </AlertDescription>
                      </Alert>
                    </div>
                  </motion.div>
                )}

                {/* Navigation Buttons */}
                <div className="flex justify-between mt-8">
                  {step > 1 && (
                    <Button variant="outline" onClick={prevStep} className="rounded-full">
                      Back
                    </Button>
                  )}
                  {step < 3 ? (
                    <Button onClick={nextStep} className="ml-auto bg-primary hover:bg-accent rounded-full">
                      Continue <ChevronRight size={16} className="ml-1" />
                    </Button>
                  ) : (
                    <Button
                      onClick={handleSubmit}
                      disabled={submitting}
                      className="ml-auto bg-primary hover:bg-accent rounded-full min-w-[200px]"
                    >
                      {submitting ? (
                        <>
                          <Loader2 size={16} className="mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Sparkles size={16} className="mr-2" />
                          Pay ₹{totalAmount}
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="rounded-2xl sticky top-24">
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg mb-4">Order Summary</h3>

                {/* Plan Details */}
                <div className="space-y-4 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                      <Package className="text-primary" size={24} />
                    </div>
                    <div>
                      <p className="font-medium">{plan.name}</p>
                      <p className="text-sm text-black">{plan.durationDays} days</p>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-black">Plan Price</span>
                      <span className="font-medium">₹{plan.price}</span>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span className="text-black">Meals</span>
                      <span className="font-medium capitalize">
                        {selectedMeals.join(", ")}
                      </span>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span className="text-black">Food Type</span>
                      <span className="font-medium capitalize">{foodType}</span>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span className="text-black">Weekends</span>
                      <span className="font-medium">{includeWeekends ? "Included" : "Excluded"}</span>
                    </div>

                    {includeWeekends && plan.durationDays >= 30 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-black">Weekend Surcharge</span>
                        <span className="font-medium">+₹{Math.round(plan.price * 0.1)}</span>
                      </div>
                    )}
                  </div>

                  <Separator />

                  <div className="space-y-1">
                    <div className="flex justify-between text-lg font-semibold">
                      <span>Total</span>
                      <span className="text-primary">₹{totalAmount}</span>
                    </div>
                    <p className="text-xs text-black text-right">
                      ₹{Math.round(totalAmount / plan.durationDays)}/day
                    </p>
                  </div>

                  {savings > 0 && (
                    <div className="bg-green-50 p-3 rounded-xl">
                      <div className="flex items-center gap-2 text-green-700">
                        <Award size={16} />
                        <span className="text-sm font-medium">You save ₹{savings}</span>
                      </div>
                      <p className="text-xs text-green-600 mt-1">
                        Compared to daily purchase
                      </p>
                    </div>
                  )}
                </div>

                {/* Timeline */}
                <div className="space-y-3">
                  <h4 className="font-medium text-sm">Subscription Timeline</h4>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar size={14} className="text-black" />
                    <span>Starts: {format(new Date(startDate), "dd MMM yyyy")}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar size={14} className="text-black" />
                    <span>Ends: {format(addDays(new Date(startDate), plan.durationDays -1 ), "dd MMM yyyy")}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <TrendingUp size={14} className="text-black" />
                    <span>{plan.durationDays} days total </span>
                  </div>
                </div>

                {/* Features */}
                <div className="mt-6 pt-6 border-t">
                  <h4 className="font-medium text-sm mb-3">What's included:</h4>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2 text-sm text-black">
                      <CheckCircle size={14} className="text-green-600" />
                      Free delivery
                    </li>
                   
                    <li className="flex items-center gap-2 text-sm text-black">
                      <CheckCircle size={14} className="text-green-600" />
                      Hygienic packaging
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}