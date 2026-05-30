"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Package,
  Calendar,
  Clock,
  ChevronRight,
  Search,
  RefreshCw,
  Utensils,
  CheckCircle,
  XCircle,
  Truck,
  ChefHat,
  ShoppingBag
} from "lucide-react";
import { format, parseISO } from "date-fns";
import api from "@/lib/api";
import { useAppSelector } from "@/store/hooks";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
// import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

interface Dish {
  _id: string
  name: string
  image: string
  price: number
  type: "veg" | "nonveg"
}

interface OrderItem {
  dishId: Dish
  quantity: number
  _id: string
}

interface Order {
  _id: string
  items: OrderItem[]
  totalAmount: number
  paymentStatus: "pending" | "paid" | "failed"
  orderStatus: "order_received" | "confirmed" | "in_preparation" | "packed" | "out_for_delivery" | "delivered" | "cancelled"
  deliveryAddress: {
    houseNumber: string
    area: string
    pincode: string
  }
  deliveryDate: string
  createdAt: string
  updatedAt: string
}

const orderStatusConfig = {
  order_received: {
    label: "Order Received",
    color: "bg-blue-100 text-blue-800",
    icon: Package,
    step: 1
  },
  confirmed: {
    label: "Confirmed",
    color: "bg-purple-100 text-purple-800",
    icon: CheckCircle,
    step: 2
  },
  in_preparation: {
    label: "In Preparation",
    color: "bg-yellow-100 text-yellow-800",
    icon: ChefHat,
    step: 3
  },
  packed: {
    label: "Packed",
    color: "bg-orange-100 text-orange-800",
    icon: Package,
    step: 4
  },
  out_for_delivery: {
    label: "Out for Delivery",
    color: "bg-indigo-100 text-indigo-800",
    icon: Truck,
    step: 5
  },
  delivered: {
    label: "Delivered",
    color: "bg-green-100 text-green-800",
    icon: CheckCircle,
    step: 6
  },
  cancelled: {
    label: "Cancelled",
    color: "bg-red-100 text-red-800",
    icon: XCircle,
    step: 0
  }
};

const paymentStatusConfig = {
  pending: { label: "Pending", color: "bg-yellow-100 text-yellow-800" },
  paid: { label: "Paid", color: "bg-green-100 text-green-800" },
  failed: { label: "Failed", color: "bg-red-100 text-red-800" }
};

export default function MyOrdersPage() {
  const router = useRouter();
  const user = useAppSelector((state) => state.user.user);
  const isAuthLoaded = useAppSelector((state) => state.user.isAuthLoaded);
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

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
    fetchOrders();
  }, [user, isAuthLoaded]);

  useEffect(() => {
    filterOrders();
  }, [searchQuery, statusFilter, orders]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await api.get("/orders/my");
      setOrders(response.data);
      setFilteredOrders(response.data);
    } catch (error) {
      toast.error("Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  };

  const filterOrders = () => {
    let filtered = [...orders];

    if (searchQuery) {
      filtered = filtered.filter(order =>
        order._id.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(order => order.orderStatus === statusFilter);
    }

    setFilteredOrders(filtered);
  };

  const getStatusBadge = (status: string) => {
    const config = orderStatusConfig[status as keyof typeof orderStatusConfig];
    if (!config) {
      return (
        <Badge className="bg-gray-100 text-gray-800">
          Unknown
        </Badge>
      );
    }
    return (
      <Badge className={config.color}>
        <config.icon size={12} className="mr-1" />
        {config.label}
      </Badge>
    );
  };

  const getPaymentBadge = (status: string) => {
    const config = paymentStatusConfig[status as keyof typeof paymentStatusConfig];
    if (!config) {
      return (
        <Badge className="bg-gray-100 text-gray-800">
          Unknown
        </Badge>
      );
    }
    return (
      <Badge className={config.color} >
        {config.label}
      </Badge>
    );
  };

  if (loading || !isAuthLoaded) {
    return (
      <div className="min-h-screen pt-24 pb-16 px-4 max-w-7xl mx-auto">
        <Skeleton className="h-12 w-48 mb-8" />
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-48 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 bg-soft">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold text-textdark mb-2">My Orders</h1>
            <p className="text-black">View and track all your orders</p>
          </div>
          
          <Button 
            variant="outline" 
            onClick={fetchOrders}
            className="rounded-full"
          >
            <RefreshCw size={16} className="mr-2" />
            Refresh
          </Button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black" size={18} />
              <Input
                placeholder="Search by order ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-50">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Orders</SelectItem>
                <SelectItem value="order_received">Order Received</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="in_preparation">In Preparation</SelectItem>
                <SelectItem value="packed">Packed</SelectItem>
                <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl">
            <Package size={64} className="mx-auto text-black mb-4" />
            <h3 className="text-xl font-semibold mb-2">No orders found</h3>
            <p className="text-black mb-6">
              {searchQuery || statusFilter !== "all" 
                ? "Try adjusting your filters" 
                : "You haven't placed any orders yet"}
            </p>
            <Link href="/menu">
              <Button className="bg-primary hover:bg-accent rounded-full">
                Browse Menu
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => {
              const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);
              
              return (
                <Card 
                  key={order._id} 
                  className="rounded-2xl hover:shadow-lg transition-all cursor-pointer"
                  onClick={() => router.push(`/orders/${order._id}`)}
                >
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      {/* Left Section - Order Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold">Order #{order._id.slice(-8)}</h3>
                          {getStatusBadge(order.orderStatus)}
                          {getPaymentBadge(order.paymentStatus)}
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-sm text-black">
                          <div className="flex items-center gap-1">
                            <Calendar size={14} />
                            <span>Placed: {safeFormatDate(order.createdAt, "dd MMM yyyy, hh:mm a")}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock size={14} />
                            <span>Delivery: {safeFormatDate(order.deliveryDate, "dd MMM yyyy")}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <ShoppingBag size={14} />
                            <span>{totalItems} items</span>
                          </div>
                        </div>

                        {/* Order Items Preview */}
                        <div className="mt-4 flex items-center gap-2">
                          {order.items.slice(0, 3).map((item, idx) => (
                            <div key={idx} className="relative w-10 h-10 rounded-lg overflow-hidden bg-gray-100">
                              {item.dishId?.image ? (
                                <Image
                                  src={item.dishId.image}
                                  alt={item.dishId.name}
                                  fill
                                  className="object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Utensils size={16} className="text-black" />
                                </div>
                              )}
                            </div>
                          ))}
                          {order.items.length > 3 && (
                            <Badge variant="outline">+{order.items.length - 3} more</Badge>
                          )}
                        </div>
                      </div>

                      {/* Right Section - Total & Action */}
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm text-black">Total Amount</p>
                          <p className="text-2xl font-bold text-primary">₹{order.totalAmount}</p>
                        </div>
                        <Button variant="ghost" size="icon" className="rounded-full">
                          <ChevronRight size={18} />
                        </Button>
                      </div>
                    </div>

                    {/* Status Progress Bar (for active orders) */}
                    {order.orderStatus !== "cancelled" && order.orderStatus !== "delivered" && (
                      <div className="mt-4">
                        <div className="flex items-center gap-1">
                          {Object.entries(orderStatusConfig)
                            .filter(([key]) => key !== "cancelled")
                            .map(([key], index) => {
                              const statusConfig = orderStatusConfig[order.orderStatus as keyof typeof orderStatusConfig];
                              const currentStep = statusConfig ? statusConfig.step : 0;
                              const isCompleted = index + 1 <= currentStep;
                              const isCurrent = index + 1 === currentStep;
                              
                              return (
                                <div key={key} className="flex-1 relative">
                                  <div className={`h-1 ${isCompleted ? 'bg-primary' : 'bg-gray-200'}`} />
                                  {isCurrent && (
                                    <div className="absolute -top-1 left-1/2 transform -translate-x-1/2">
                                      <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                        </div>
                        <div className="flex justify-between mt-1 text-xs text-black">
                          <span>Ordered</span>
                          <span>Confirmed</span>
                          <span>Preparing</span>
                          <span>Packed</span>
                          <span>Out for Delivery</span>
                          <span>Delivered</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}