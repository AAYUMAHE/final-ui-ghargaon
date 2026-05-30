"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import {
    ArrowLeft,
    MapPin,
    User,
    Phone,
    Mail,
    Calendar,
    Package,
    CheckCircle,
    XCircle,
    Truck,
    ChefHat,
    ExternalLink,
    Edit
} from "lucide-react"
import Link from "next/link"
import { format, parseISO } from "date-fns"
import api from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

interface Order {
    _id: string
    userId: {
        _id: string
        email: string
        fullName?: string
        mobile?: string
        username?: string
    }
    items: Array<{
        dishId: {
            _id: string
            name: string
            price: number
            type: "veg" | "nonveg"
            image?: string
        } | null
        quantity: number
        _id: string
    }>
    totalAmount: number
    paymentStatus: "pending" | "paid" | "failed"
    orderStatus: "received" | "confirmed" | "preparing" | "packing" | "out_for_delivery" | "delivered" | "cancelled"
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
    received: { label: "Received", color: "bg-blue-100 text-blue-800", icon: Package },
    confirmed: { label: "Confirmed", color: "bg-purple-100 text-purple-800", icon: CheckCircle },
    preparing: { label: "Preparing", color: "bg-yellow-100 text-yellow-800", icon: ChefHat },
    packing: { label: "Packing", color: "bg-orange-100 text-orange-800", icon: Package },
    out_for_delivery: { label: "Out for Delivery", color: "bg-indigo-100 text-indigo-800", icon: Truck },
    delivered: { label: "Delivered", color: "bg-green-100 text-green-800", icon: CheckCircle },
    cancelled: { label: "Cancelled", color: "bg-red-100 text-red-800", icon: XCircle }
}

export default function OrderDetailsPage() {
    const router = useRouter()
    const params = useParams()
    const orderId = params.id as string

    const [order, setOrder] = useState<Order | null>(null)
    const [loading, setLoading] = useState(true)
    const [updating, setUpdating] = useState(false)

    useEffect(() => {
        fetchOrder()
    }, [orderId])

    const fetchOrder = async () => {
        try {
            const response = await api.get(`/orders/${orderId}`)
            setOrder(response.data)
        } catch (error) {
            toast.error("Failed to fetch order")
            router.push("/admin/orders")
        } finally {
            setLoading(false)
        }
    }

    const updateOrderStatus = async (newStatus: string) => {
        if (!order) return

        try {
            setUpdating(true)
            await api.patch(`/orders/${orderId}/status`, {
                orderStatus: newStatus
            })

            setOrder({ ...order, orderStatus: newStatus as any })
            toast.success(`Order status updated to ${orderStatusConfig[newStatus as keyof typeof orderStatusConfig].label}`)
        } catch (error) {
            toast.error("Failed to update order status")
        } finally {
            setUpdating(false)
        }
    }

    const openGoogleMaps = () => {
        if (!order) return

        if (order.deliveryAddress.coordinates?.lat && order.deliveryAddress.coordinates?.lng) {
            window.open(`https://www.google.com/maps?q=${order.deliveryAddress.coordinates.lat},${order.deliveryAddress.coordinates.lng}`, '_blank')
        } else {
            const query = encodeURIComponent(`${order.deliveryAddress.houseNumber} ${order.deliveryAddress.area} ${order.deliveryAddress.pincode}`)
            window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank')
        }
    }

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .slice(0, 2)
    }

    if (loading) {
        return (
            <div className="p-8">
                <div className="flex items-center gap-4 mb-8">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <Skeleton className="h-10 w-64" />
                </div>
                <Skeleton className="h-96 rounded-2xl" />
            </div>
        )
    }

    if (!order) return null

    const CurrentStatusIcon = orderStatusConfig[order.orderStatus].icon

    return (
        <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <Link href="/admin/orders">
                        <Button variant="ghost" size="icon" className="rounded-full">
                            <ArrowLeft size={20} />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-textdark">Order Details</h1>
                        <p className="text-black mt-1">Order ID: {order._id}</p>
                    </div>
                </div>

                <Badge className={`${orderStatusConfig[order.orderStatus].color} px-4 py-2 text-base`}>
                    <CurrentStatusIcon size={18} className="mr-2" />
                    {orderStatusConfig[order.orderStatus].label}
                </Badge>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Left Column - Order Info */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Status Update */}
                    <Card className="rounded-2xl">
                        <CardContent className="p-6">
                            <h3 className="font-semibold mb-4">Update Order Status</h3>
                            <div className="flex flex-wrap gap-2">
                                {Object.entries(orderStatusConfig).map(([key, config]) => {
                                    if (key === 'cancelled' || key === 'delivered') return null
                                    const isDisabled =
                                        (key === order.orderStatus) ||
                                        (order.orderStatus === 'delivered') ||
                                        (order.orderStatus === 'cancelled')

                                    return (
                                        <Button
                                            key={key}
                                            variant={key === order.orderStatus ? "default" : "outline"}
                                            className={`${key === order.orderStatus ? 'bg-primary' : ''}`}
                                            disabled={isDisabled || updating}
                                            onClick={() => updateOrderStatus(key)}
                                        >
                                            <config.icon size={16} className="mr-2" />
                                            {config.label}
                                        </Button>
                                    )
                                })}
                                {order.orderStatus !== 'cancelled' && order.orderStatus !== 'delivered' && (
                                    <Button
                                        variant="destructive"
                                        disabled={updating}
                                        onClick={() => updateOrderStatus('cancelled')}
                                    >
                                        <XCircle size={16} className="mr-2" />
                                        Cancel Order
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Order Items */}
                    <Card className="rounded-2xl">
                        <CardContent className="p-6">
                            <h3 className="font-semibold mb-4">Order Items</h3>
                            <div className="space-y-4">
                                {order.items.map((item, index) => (
                                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center">
                                                {item.dishId ? (
                                                    <span className="text-2xl">🍽️</span>
                                                ) : (
                                                    <Package size={24} className="text-black" />
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-medium">
                                                    {item.dishId?.name || 'Dish unavailable'}
                                                </p>
                                                <p className="text-sm text-black">
                                                    ₹{item.dishId?.price || 0} × {item.quantity}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-semibold text-lg">
                                                ₹{(item.dishId?.price || 0) * item.quantity}
                                            </p>
                                            {item.dishId?.type && (
                                                <Badge className={item.dishId.type === 'veg' ? 'bg-success' : 'bg-error'}>
                                                    {item.dishId.type}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                ))}

                                <div className="flex justify-between items-center pt-4 border-t">
                                    <span className="text-lg font-semibold">Total Amount</span>
                                    <span className="text-2xl font-bold text-primary">₹{order.totalAmount}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column - Customer & Delivery Info */}
                <div className="space-y-6">
                    {/* Customer Info */}
                    <Card className="rounded-2xl">
                        <CardContent className="p-6">
                            <h3 className="font-semibold mb-4 flex items-center gap-2">
                                <User size={18} />
                                Customer Information
                            </h3>

                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-12 w-12">
                                        <AvatarFallback className="bg-primary/10 text-primary">
                                            {getInitials(order.userId.fullName || order.userId.email)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-medium">{order.userId.fullName || 'N/A'}</p>
                                        <p className="text-sm text-black">@{order.userId.username || 'username'}</p>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <p className="text-sm flex items-center gap-2">
                                        <Mail size={16} className="text-black" />
                                        <span>{order.userId.email}</span>
                                    </p>
                                    <p className="text-sm flex items-center gap-2">
                                        <Phone size={16} className="text-black" />
                                        <span>{order.userId.mobile || 'N/A'}</span>
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Delivery Address */}
                    <Card className="rounded-2xl">
                        <CardContent className="p-6">
                            <h3 className="font-semibold mb-4 flex items-center gap-2">
                                <MapPin size={18} />
                                Delivery Address
                            </h3>

                            <div className="space-y-3">
                                <p className="text-sm">
                                    {order.deliveryAddress.houseNumber}, {order.deliveryAddress.area}
                                </p>
                                <p className="text-sm">Pincode: {order.deliveryAddress.pincode}</p>

                                {order.deliveryAddress.coordinates && (
                                    <p className="text-xs text-black">
                                        Coordinates: {order.deliveryAddress.coordinates.lat}, {order.deliveryAddress.coordinates.lng}
                                    </p>
                                )}

                                <Button
                                    variant="outline"
                                    className="w-full rounded-full"
                                    onClick={openGoogleMaps}
                                >
                                    <MapPin size={16} className="mr-2" />
                                    View on Google Maps
                                    <ExternalLink size={14} className="ml-2" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Order Timeline */}
                    <Card className="rounded-2xl">
                        <CardContent className="p-6">
                            <h3 className="font-semibold mb-4 flex items-center gap-2">
                                <Calendar size={18} />
                                Order Timeline
                            </h3>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-black">Order Placed</span>
                                    <span className="font-medium">
                                        {format(parseISO(order.createdAt), "dd MMM yyyy, hh:mm a")}
                                    </span>
                                </div>

                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-black">Delivery Date</span>
                                    <span className="font-medium">
                                        {format(parseISO(order.deliveryDate), "dd MMM yyyy")}
                                    </span>
                                </div>

                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-black">Last Updated</span>
                                    <span className="font-medium">
                                        {format(parseISO(order.updatedAt), "dd MMM yyyy, hh:mm a")}
                                    </span>
                                </div>

                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-black">Payment Status</span>
                                    <Badge className={
                                        order.paymentStatus === 'paid' ? 'bg-success' :
                                            order.paymentStatus === 'failed' ? 'bg-error' : 'bg-warning'
                                    }>
                                        {order.paymentStatus}
                                    </Badge>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}