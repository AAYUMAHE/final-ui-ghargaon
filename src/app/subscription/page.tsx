"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Leaf,
  Beef,
  XCircle,
  Package,
  Utensils,
  ChevronRight,
  Plus,
  RefreshCw,
  Search
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format, parseISO, differenceInDays, isAfter, isBefore } from "date-fns";
import api from "@/lib/api";
import { useAppSelector } from "@/store/hooks";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

interface Plan {
  _id: string;
  name: string;
  durationDays: number;
  price: number;
  pricePerDay: number;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

interface Subscription {
  _id: string;
  userId: string;
  planId: Plan | null;
  meals: string[];
  foodType: "veg" | "nonveg";
  includeWeekends: boolean;
  startDate: string;
  endDate: string;
  status: "active" | "cancelled" | "expired";
  createdAt: string;
  updatedAt: string;
  __v: number;
}

interface ApiResponse {
  success: boolean;
  data: Subscription[];
  message?: string;
}

export default function MySubscriptionsPage() {
  const router = useRouter();
  const user = useAppSelector((state) => state.user.user);
  const isAuthLoaded = useAppSelector((state) => state.user.isAuthLoaded);
  
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [filteredSubscriptions, setFilteredSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const safeFormatDate = (dateStr: string, formatStr: string) => {
    try {
      if (!dateStr) return "N/A";
      const parsed = parseISO(dateStr);
      if (isNaN(parsed.getTime())) return "N/A";
      return format(parsed, formatStr);
    } catch {
      return "N/A";
    }
  };

  useEffect(() => {
    if (!isAuthLoaded) return;
    if (!user) {
      router.push("/auth/login");
      return;
    }
    fetchSubscriptions();
  }, [user, isAuthLoaded]);

  useEffect(() => {
    filterSubscriptions();
  }, [searchQuery, statusFilter, subscriptions]);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const response = await api.get("/subscriptions/me");
      
      console.log("Full API Response:", response);
      console.log("Response data:", response.data);
      
      // Handle different response structures
      let subscriptionsData: Subscription[] = [];
      
      if (Array.isArray(response.data)) {
        subscriptionsData = response.data;
      } else if (response.data && typeof response.data === 'object') {
        if (Array.isArray(response.data.data)) {
          subscriptionsData = response.data.data;
        } 
        else if (Array.isArray(response.data.subscriptions)) {
          subscriptionsData = response.data.subscriptions;
        }
        else if (response.data._id) {
          subscriptionsData = [response.data];
        }
      }
      
      // Filter out subscriptions that don't have valid planId
      const validSubscriptions = subscriptionsData.filter(sub => sub && sub.planId);
      
      // Log invalid subscriptions for debugging
      const invalidSubscriptions = subscriptionsData.filter(sub => sub && !sub.planId);
      if (invalidSubscriptions.length > 0) {
        console.warn("Found subscriptions without planId:", invalidSubscriptions);
      }
      
      // Update status based on dates
      const updatedSubs = validSubscriptions.map((sub: Subscription) => {
        const now = new Date();
        const endDate = parseISO(sub.endDate);
        
        if (sub.status === "active" && isAfter(now, endDate)) {
          return { ...sub, status: "expired" as const };
        }
        return sub;
      });
      
      setSubscriptions(updatedSubs);
      setFilteredSubscriptions(updatedSubs);
      
      if (updatedSubs.length === 0) {
        if (subscriptionsData.length > 0 && validSubscriptions.length === 0) {
          toast.warning("Some subscriptions have missing plan information");
        } else {
          toast.info("No subscriptions found");
        }
      }
    } catch (error: any) {
      console.error("Failed to fetch subscriptions:", error);
      toast.error(error.response?.data?.message || "Failed to load subscriptions");
      setSubscriptions([]);
      setFilteredSubscriptions([]);
    } finally {
      setLoading(false);
    }
  };

  const filterSubscriptions = () => {
    let filtered = [...subscriptions];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(sub =>
        (sub.planId?.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        sub._id.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(sub => sub.status === statusFilter);
    }

    setFilteredSubscriptions(filtered);
  };

  const cancelSubscription = async () => {
    if (!selectedSubscription) return;

    setCancelling(true);
    try {
      await api.patch(`/subscriptions/${selectedSubscription._id}/cancel`);
      
      setSubscriptions(prev =>
        prev.map(sub =>
          sub._id === selectedSubscription._id
            ? { ...sub, status: "cancelled" as const }
            : sub
        )
      );
      
      toast.success("Subscription cancelled successfully");
      setIsCancelDialogOpen(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to cancel subscription");
    } finally {
      setCancelling(false);
      setSelectedSubscription(null);
    }
  };

  const getStatusBadge = (status: string, endDate: string) => {
    const now = new Date();
    const end = parseISO(endDate);
    const daysLeft = differenceInDays(end, now);

    switch (status) {
      case "active":
        if (daysLeft < 7 && daysLeft >= 0) {
          return { label: `Expires in ${daysLeft} days`, color: "bg-yellow-100 text-yellow-800 border-yellow-200" };
        }
        return { label: "Active", color: "bg-green-100 text-green-800 border-green-200" };
      case "cancelled":
        return { label: "Cancelled", color: "bg-red-100 text-red-800 border-red-200" };
      case "expired":
        return { label: "Expired", color: "bg-gray-100 text-gray-800 border-gray-200" };
      default:
        return { label: status, color: "bg-gray-100 text-gray-800" };
    }
  };

  const getMealIcon = (meal: string) => {
    switch (meal) {
      case "breakfast": return "🍳";
      case "lunch": return "🍛";
      case "dinner": return "🍽️";
      default: return "🍽️";
    }
  };

  const calculateProgress = (startDate: string, endDate: string) => {
    const start = parseISO(startDate).getTime();
    const end = parseISO(endDate).getTime();
    const now = new Date().getTime();
    
    if (now < start) return 0;
    if (now > end) return 100;
    
    return ((now - start) / (end - start)) * 100;
  };

  if (loading || !isAuthLoaded) {
    return (
      <div className="min-h-screen pt-24 pb-16 px-4 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-48 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  const activeSubscriptions = subscriptions.filter(s => s.status === "active" && s.planId).length;
  const totalSpent = subscriptions
    .filter(s => (s.status === "active" || s.status === "expired") && s.planId)
    .reduce((sum, s) => sum + (s.planId?.price || 0), 0);

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 bg-soft">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold text-textdark mb-2">My Subscriptions</h1>
            <p className="text-black">Manage your meal subscriptions</p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={fetchSubscriptions} className="rounded-full">
              <RefreshCw size={16} className="mr-2" />
              Refresh
            </Button>
            <Link href="/subscription/plans">
              <Button className="bg-primary hover:bg-accent rounded-full">
                <Plus size={16} className="mr-2" />
                New Subscription
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-black mb-1">Active Subscriptions</p>
                  <p className="text-3xl font-bold text-primary">{activeSubscriptions}</p>
                </div>
                <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                  <Package className="text-primary" size={24} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl bg-gradient-to-br from-green-500/10 to-green-500/5">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-black mb-1">Total Spent</p>
                  <p className="text-3xl font-bold text-green-600">₹{totalSpent}</p>
                </div>
                <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                  <span className="text-green-600 text-xl">₹</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl bg-gradient-to-br from-blue-500/10 to-blue-500/5">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-black mb-1">Meals Per Day</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {subscriptions
                      .filter(s => s.status === "active" && s.planId)
                      .reduce((sum, s) => sum + (s.meals?.length || 0), 0)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
                  <Utensils className="text-blue-600" size={24} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black" size={18} />
              <Input
                placeholder="Search by plan name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subscriptions</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Subscriptions List */}
        {filteredSubscriptions.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl">
            <Package size={64} className="mx-auto text-black mb-4" />
            <h3 className="text-xl font-semibold mb-2">No subscriptions found</h3>
            <p className="text-black mb-6">
              {searchQuery || statusFilter !== "all" 
                ? "Try adjusting your filters" 
                : "You haven't purchased any subscriptions yet"}
            </p>
            <Link href="/subscription/plans">
              <Button className="bg-primary hover:bg-accent rounded-full">
                Browse Plans
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {filteredSubscriptions.map((subscription) => {
                // Skip rendering if planId is missing
                if (!subscription.planId) {
                  console.warn('Subscription missing planId:', subscription._id);
                  return null;
                }
                
                const status = getStatusBadge(subscription.status, subscription.endDate);
                const progress = calculateProgress(subscription.startDate, subscription.endDate);
                const daysLeft = differenceInDays(parseISO(subscription.endDate), new Date());
                
                return (
                  <motion.div
                    key={subscription._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <Card 
                      className="rounded-2xl hover:shadow-lg transition-all cursor-pointer"
                      onClick={() => router.push(`/subscription/${subscription._id}`)}
                    >
                      <CardContent className="p-6">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                          {/* Left Section - Plan Info */}
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-xl font-semibold">{subscription.planId.name}</h3>
                              <Badge className={status.color}>
                                {status.label}
                              </Badge>
                            </div>

                            <div className="flex flex-wrap items-center gap-4 text-sm">
                              <div className="flex items-center gap-1 text-black">
                                <Calendar size={14} />
                                <span>Started: {safeFormatDate(subscription.startDate, "dd MMM yyyy")}</span>
                              </div>
                              <div className="flex items-center gap-1 text-black">
                                <Calendar size={14} />
                                <span>Ends: {safeFormatDate(subscription.endDate, "dd MMM yyyy")}</span>
                              </div>
                              {subscription.status === "active" && daysLeft > 0 && (
                                <Badge variant="outline" className="text-primary">
                                  {daysLeft} days left
                                </Badge>
                              )}
                            </div>

                            {/* Progress Bar for Active Subscriptions */}
                            {subscription.status === "active" && (
                              <div className="mt-4 max-w-md">
                                <div className="flex justify-between text-xs mb-1">
                                  <span>Progress</span>
                                  <span>{Math.round(progress)}%</span>
                                </div>
                                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-primary transition-all duration-500"
                                    style={{ width: `${progress}%` }}
                                  />
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Middle Section - Meal Details */}
                          <div className="flex-1">
                            <div className="bg-soft rounded-xl p-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <p className="text-xs text-black mb-1">Meals</p>
                                  <div className="flex flex-wrap gap-1">
                                    {subscription.meals?.map(meal => (
                                      <Badge key={meal} variant="outline" className="text-xs">
                                        {getMealIcon(meal)} {meal}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                                <div>
                                  <p className="text-xs text-black mb-1">Food Type</p>
                                  <Badge className={subscription.foodType === "veg" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                                    {subscription.foodType === "veg" ? (
                                      <><Leaf size={12} className="mr-1" /> Veg</>
                                    ) : (
                                      <><Beef size={12} className="mr-1" /> Non-veg</>
                                    )}
                                  </Badge>
                                </div>
                                <div>
                                  <p className="text-xs text-black mb-1">Weekends</p>
                                  <p className="text-sm">{subscription.includeWeekends ? "Included" : "Excluded"}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-black mb-1">Price</p>
                                  <p className="text-sm font-semibold text-primary">₹{subscription.planId.price}</p>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Right Section - Actions */}
                          <div className="flex items-center gap-2">
                            {subscription.status === "active" && (
                              <Button
                                variant="outline"
                                className="text-red-600 hover:text-red-600 hover:bg-red-50 rounded-full"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedSubscription(subscription);
                                  setIsCancelDialogOpen(true);
                                }}
                              >
                                <XCircle size={16} className="mr-2" />
                                Cancel
                              </Button>
                            )}
                            <Button variant="ghost" size="icon" className="rounded-full">
                              <ChevronRight size={18} />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {/* Cancel Confirmation Dialog */}
        <AlertDialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Cancel Subscription</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to cancel your {selectedSubscription?.planId?.name}?
                This action cannot be undone. You will continue to receive meals until the end of your billing period.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
              <AlertDialogAction
                onClick={cancelSubscription}
                disabled={cancelling}
                className="bg-red-600 hover:bg-red-700"
              >
                {cancelling ? "Cancelling..." : "Yes, Cancel"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}