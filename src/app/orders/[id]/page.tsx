"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  Package,
  Calendar,
  Clock,
  MapPin,
  CreditCard,
  Utensils,
  CheckCircle,
  XCircle,
  Truck,
  ChefHat,
  Phone,
  Mail,
  User,
  Home
} from "lucide-react";
import { format, parseISO } from "date-fns";
import api from "@/lib/api";
import { useAppSelector } from "@/store/hooks";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
  userId: {
    _id: string
    email: string
    fullName?: string
    mobile?: string
  }
  items: OrderItem[]
  totalAmount: number
  paymentStatus: "pending" | "paid" | "failed"
  orderStatus: "order_received" | "confirmed" | "in_preparation" | "packed" | "out_for_delivery" | "delivered" | "cancelled"
  deliveryAddress: {
    houseNumber: string
    area: string
    pincode: string
    coordinates?: {
      lat: number
      lng: number
    }
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
    description: "Your order has been received and is being processed"
  },
  confirmed: {
    label: "Confirmed",
    color: "bg-purple-100 text-purple-800",
    icon: CheckCircle,
    description: "Your order has been confirmed by the restaurant"
  },
  in_preparation: {
    label: "In Preparation",
    color: "bg-yellow-100 text-yellow-800",
    icon: ChefHat,
    description: "Your food is being prepared fresh"
  },
  packed: {
    label: "Packed",
    color: "bg-orange-100 text-orange-800",
    icon: Package,
    description: "Your order has been packed and is ready for delivery"
  },
  out_for_delivery: {
    label: "Out for Delivery",
    color: "bg-indigo-100 text-indigo-800",
    icon: Truck,
    description: "Your order is on the way!"
  },
  delivered: {
    label: "Delivered",
    color: "bg-green-100 text-green-800",
    icon: CheckCircle,
    description: "Your order has been delivered. Enjoy your meal!"
  },
  cancelled: {
    label: "Cancelled",
    color: "bg-red-100 text-red-800",
    icon: XCircle,
    description: "This order has been cancelled"
  }
};

export default function OrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;
  const user = useAppSelector((state) => state.user.user);
  const isAuthLoaded = useAppSelector((state) => state.user.isAuthLoaded);

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

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
    fetchOrder();
  }, [orderId, user, isAuthLoaded]);

  const fetchOrder = async () => {
    try {
      const response = await api.get(`/orders/${orderId}`);
      setOrder(response.data);
    } catch (error) {
      toast.error("Failed to fetch order details");
      router.push("/orders");
    } finally {
      setLoading(false);
    }
  };

  if (loading || !isAuthLoaded) {
    return (
      <div className="min-h-screen pt-24 pb-16 px-4 max-w-4xl mx-auto">
        <Skeleton className="h-12 w-64 mb-8" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  if (!order) return null;

  const statusConfig = orderStatusConfig[order.orderStatus];
  const StatusIcon = statusConfig.icon;

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 bg-soft">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/orders"
            className="inline-flex items-center gap-2 text-black hover:text-primary mb-4"
          >
            <ArrowLeft size={18} />
            Back to Orders
          </Link>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-textdark mb-2">
                Order #{order._id.slice(-8)}
              </h1>
              <p className="text-black">
                Placed on {safeFormatDate(order.createdAt, "EEEE, MMMM d, yyyy 'at' hh:mm a")}
              </p>
            </div>

            <Badge className={`${statusConfig.color} px-4 py-2 text-base`}>
              <StatusIcon size={18} className="mr-2" />
              {statusConfig.label}
            </Badge>
          </div>
        </div>

        {/* Status Timeline */}
        <Card className="rounded-2xl mb-6">
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className={`w-12 h-12 rounded-full ${statusConfig.color} flex items-center justify-center`}>
                <StatusIcon size={24} />
              </div>
              <div>
                <h3 className="font-semibold text-lg">{statusConfig.label}</h3>
                <p className="text-black">{statusConfig.description}</p>
              </div>
            </div>

            <div className="relative mt-8">
              <div className="absolute left-0 top-2 w-full h-1 bg-gray-200">
                <div
                  className="h-full bg-primary transition-all duration-500"
                  style={{
                    width: `${order.orderStatus === "cancelled" ? 0 :
                        order.orderStatus === "order_received" ? 20 :
                          order.orderStatus === "confirmed" ? 40 :
                            order.orderStatus === "in_preparation" ? 60 :
                              order.orderStatus === "out_for_delivery" ? 80 :
                                order.orderStatus === "delivered" ? 100 : 0
                      }%`
                  }}
                />
              </div>
              <div className="flex justify-between relative">
                {["order_received", "confirmed", "in_preparation", "packed", "out_for_delivery", "delivered"].map((status, index) => {
                  const isActive =
                    (order.orderStatus === status) ||
                    (order.orderStatus === "cancelled" ? false :
                      order.orderStatus === "order_received" && index <= 0 ||
                      order.orderStatus === "confirmed" && index <= 1 ||
                      order.orderStatus === "in_preparation" && index <= 2 ||
                      order.orderStatus === "packed" && index <= 3 ||
                      order.orderStatus === "out_for_delivery" && index <= 4 ||
                      order.orderStatus === "delivered" && index <= 5);

                  return (
                    <div key={status} className="text-center">
                      <div className={`w-4 h-4 rounded-full mx-auto mb-2 ${isActive ? 'bg-primary' : 'bg-gray-300'
                        }`} />
                      <p className={`text-xs ${isActive ? 'text-primary font-medium' : 'text-black'}`}>
                        {status === "order_received" ? "Ordered" :
                          status === "out_for_delivery" ? "Out for Delivery" :
                            status.charAt(0).toUpperCase() + status.slice(1)}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Order Items */}
          <Card className="rounded-2xl md:col-span-2">
            <CardContent className="p-6">
              <h3 className="font-semibold text-lg mb-4">Order Items</h3>
              <div className="space-y-4">
                {order.items.map((item, index) => (
                  <div key={index} className="flex items-center gap-4 p-3 border rounded-xl">
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100">
                      {item.dishId?.image ? (
                        <Image
                          src={item.dishId.image}
                          alt={item.dishId.name}
                          width={64}
                          height={64}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Utensils size={24} className="text-black" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium">{item.dishId?.name}</p>
                        <Badge className={item.dishId?.type === "veg" ? "bg-success" : "bg-error"} >
                          {item.dishId?.type === "veg" ? "Veg" : "Non-veg"}
                        </Badge>
                      </div>
                      <p className="text-sm text-black">
                        ₹{item.dishId?.price} × {item.quantity}
                      </p>
                    </div>
                    <p className="font-semibold text-primary">
                      ₹{(item.dishId?.price || 0) * item.quantity}
                    </p>
                  </div>
                ))}

                <Separator className="my-4" />

                <div className="flex justify-between items-center">
                  <span className="font-semibold text-lg">Total Amount</span>
                  <span className="text-2xl font-bold text-primary">₹{order.totalAmount}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Delivery Information */}
          <Card className="rounded-2xl">
            <CardContent className="p-6">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <MapPin size={18} className="text-primary" />
                Delivery Address
              </h3>

              <div className="space-y-2">
                <p className="text-sm">
                  {order.deliveryAddress.houseNumber}, {order.deliveryAddress.area}
                </p>
                <p className="text-sm">Pincode: {order.deliveryAddress.pincode}</p>
                {order.deliveryAddress.coordinates && (
                  <p className="text-xs text-black">
                    Coordinates: {order.deliveryAddress.coordinates.lat}, {order.deliveryAddress.coordinates.lng}
                  </p>
                )}
              </div>

              <Separator className="my-4" />

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar size={14} className="text-black" />
                  <span>Delivery Date: {safeFormatDate(order.deliveryDate, "dd MMM yyyy")}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock size={14} className="text-black" />
                  <span>Delivery Time: 7:00 AM - 9:00 PM</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Information */}
          <Card className="rounded-2xl">
            <CardContent className="p-6">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <CreditCard size={18} className="text-primary" />
                Payment Information
              </h3>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-black">Payment Method</span>
                  <span className="font-medium">UPI</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-black">Payment Status</span>
                  <Badge className={
                    order.paymentStatus === "paid" ? "bg-success" :
                      order.paymentStatus === "pending" ? "bg-warning" : "bg-error"
                  }>
                    {order.paymentStatus}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-black">Amount Paid</span>
                  <span className="font-semibold text-primary">₹{order.totalAmount}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}