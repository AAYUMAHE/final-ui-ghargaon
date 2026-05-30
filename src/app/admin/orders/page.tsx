"use client"

import { useEffect, useState } from "react"
import {
  Search,
  Filter,
  Eye,
  MoreVertical,
  Calendar,
  MapPin,
  User,
  Phone,
  Mail,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  Package,
  ChefHat,
  Download,
  RefreshCw,
  ExternalLink
} from "lucide-react"
import Link from "next/link"
import { format, parseISO, isToday, isYesterday, differenceInDays } from "date-fns"
import api from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  } | string
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
  // Fixed: Match the exact statuses from your model
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

// Status configuration - Updated to match your model exactly
const orderStatusConfig = {
  undefined: {
    label: "Undefined",
    color: "bg-gray-100 text-gray-800",
    icon: XCircle,
    next: null
  },
  order_received: {
    label: "Order Received",
    color: "bg-blue-100 text-blue-800",
    icon: Package,
    next: "confirmed"
  },
  confirmed: {
    label: "Confirmed",
    color: "bg-purple-100 text-purple-800",
    icon: CheckCircle,
    next: "in_preparation"
  },
  in_preparation: {
    label: "In Preparation",
    color: "bg-yellow-100 text-yellow-800",
    icon: ChefHat,
    next: "packed"
  },
  packed: {
    label: "Packed",
    color: "bg-orange-100 text-orange-800",
    icon: Package,
    next: "out_for_delivery"
  },
  out_for_delivery: {
    label: "Out for Delivery",
    color: "bg-indigo-100 text-indigo-800",
    icon: Truck,
    next: "delivered"
  },
  delivered: {
    label: "Delivered",
    color: "bg-green-100 text-green-800",
    icon: CheckCircle,
    next: null
  },
  cancelled: {
    label: "Cancelled",
    color: "bg-red-100 text-red-800",
    icon: XCircle,
    next: null
  }
}

const paymentStatusConfig = {
  pending: { label: "Pending", color: "bg-yellow-100 text-yellow-800" },
  paid: { label: "Paid", color: "bg-green-100 text-green-800" },
  failed: { label: "Failed", color: "bg-red-100 text-red-800" }
}

// Helper function to safely get status config
const getStatusConfig = (status: string) => {
  return orderStatusConfig[status as keyof typeof orderStatusConfig] || orderStatusConfig.undefined
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [paymentFilter, setPaymentFilter] = useState<string>("all")
  const [dateFilter, setDateFilter] = useState<string>("all")
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isMapDialogOpen, setIsMapDialogOpen] = useState(false)
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null)

  useEffect(() => {
    fetchOrders()
  }, [])

  useEffect(() => {
    filterOrders()
  }, [search, statusFilter, paymentFilter, dateFilter, orders])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const response = await api.get("/orders")
      setOrders(response.data)
      setFilteredOrders(response.data)
    } catch (error) {
      toast.error("Failed to fetch orders")
    } finally {
      setLoading(false)
    }
  }

  const filterOrders = () => {
    let filtered = [...orders]

    // Search filter
    if (search) {
      filtered = filtered.filter(order => {
        const userId = typeof order.userId === 'object' ? order.userId : null
        return (
          order._id.toLowerCase().includes(search.toLowerCase()) ||
          userId?.email?.toLowerCase().includes(search.toLowerCase()) ||
          userId?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
          userId?.mobile?.includes(search) ||
          order.deliveryAddress.area.toLowerCase().includes(search.toLowerCase()) ||
          order.deliveryAddress.pincode.includes(search)
        )
      })
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(order => order.orderStatus === statusFilter)
    }

    // Payment filter
    if (paymentFilter !== "all") {
      filtered = filtered.filter(order => order.paymentStatus === paymentFilter)
    }

    // Date filter
    if (dateFilter !== "all") {
      const now = new Date()
      filtered = filtered.filter(order => {
        const orderDate = parseISO(order.createdAt)
        switch (dateFilter) {
          case "today":
            return isToday(orderDate)
          case "yesterday":
            return isYesterday(orderDate)
          case "week":
            return differenceInDays(now, orderDate) <= 7
          case "month":
            return differenceInDays(now, orderDate) <= 30
          default:
            return true
        }
      })
    }

    setFilteredOrders(filtered)
  }

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      setUpdatingOrderId(orderId)
      const response = await api.patch(`/orders/${orderId}/status`, {
        orderStatus: newStatus
      })
      
      // Update the order in the list
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order._id === orderId 
            ? { ...order, orderStatus: newStatus as any, updatedAt: new Date().toISOString() }
            : order
        )
      )
      
      const statusConfig = getStatusConfig(newStatus)
      toast.success(`Order status updated to ${statusConfig.label}`)
    } catch (error) {
      toast.error("Failed to update order status")
    } finally {
      setUpdatingOrderId(null)
    }
  }

  const getUserName = (order: Order) => {
    if (typeof order.userId === 'object' && order.userId) {
      return order.userId.fullName || order.userId.username || order.userId.email?.split('@')[0] || 'N/A'
    }
    return 'N/A'
  }

  const getUserEmail = (order: Order) => {
    if (typeof order.userId === 'object' && order.userId) {
      return order.userId.email || 'N/A'
    }
    return 'N/A'
  }

  const getUserMobile = (order: Order) => {
    if (typeof order.userId === 'object' && order.userId) {
      return order.userId.mobile || 'N/A'
    }
    return 'N/A'
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const openGoogleMaps = (address: Order['deliveryAddress']) => {
    if (address.coordinates?.lat && address.coordinates?.lng) {
      window.open(`https://www.google.com/maps?q=${address.coordinates.lat},${address.coordinates.lng}`, '_blank')
    } else {
      const query = encodeURIComponent(`${address.houseNumber} ${address.area} ${address.pincode}`)
      window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank')
    }
  }

  const getStatusCounts = () => {
    const counts: Record<string, number> = {
      all: orders.length
    }
    orders.forEach(order => {
      counts[order.orderStatus] = (counts[order.orderStatus] || 0) + 1
    })
    return counts
  }

  const statusCounts = getStatusCounts()

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex justify-between items-center mb-8">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-textdark">Orders</h1>
          <p className="text-black mt-1">Manage and track all customer orders</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={fetchOrders}
            className="rounded-full"
          >
            <RefreshCw size={16} className="mr-2" />
            Refresh
          </Button>
          <Button 
            variant="outline"
            className="rounded-full"
          >
            <Download size={16} className="mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Status Tabs */}
      <Tabs defaultValue="all" className="mb-6" onValueChange={setStatusFilter}>
        <TabsList className="flex flex-wrap h-auto p-1 gap-1">
          <TabsTrigger value="all" className="relative">
            All Orders
            <Badge className="ml-2 bg-gray-100 text-gray-800">{statusCounts.all}</Badge>
          </TabsTrigger>
          {Object.entries(orderStatusConfig).map(([key, config]) => (
            key !== "undefined" && (
              <TabsTrigger key={key} value={key} className="relative">
                <config.icon size={14} className="mr-2" />
                {config.label}
                {statusCounts[key] > 0 && (
                  <Badge className="ml-2 bg-gray-100 text-gray-800">{statusCounts[key]}</Badge>
                )}
              </TabsTrigger>
            )
          ))}
        </TabsList>
      </Tabs>

      {/* Filters */}
      <Card className="rounded-2xl mb-6">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black" size={18} />
              <Input
                placeholder="Search by order ID, customer, address..."
                className="pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Payment Filter */}
            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Payment Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payments</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>

            {/* Date Filter */}
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="yesterday">Yesterday</SelectItem>
                <SelectItem value="week">Last 7 Days</SelectItem>
                <SelectItem value="month">Last 30 Days</SelectItem>
              </SelectContent>
            </Select>

            {/* Reset Filters */}
            <Button 
              variant="outline" 
              onClick={() => {
                setSearch("")
                setStatusFilter("all")
                setPaymentFilter("all")
                setDateFilter("all")
              }}
              className="rounded-full"
            >
              Reset Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card className="rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Delivery</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12">
                    <div className="flex flex-col items-center">
                      <Package size={48} className="text-black mb-4" />
                      <p className="text-black text-lg">No orders found</p>
                      <p className="text-sm text-black">Try adjusting your filters</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((order) => {
                  const statusConfig = getStatusConfig(order.orderStatus)
                  const StatusIcon = statusConfig.icon
                  const PaymentIcon = order.paymentStatus === 'paid' ? CheckCircle : 
                                     order.paymentStatus === 'failed' ? XCircle : Clock
                  
                  return (
                    <TableRow key={order._id}>
                      <TableCell>
                        <span className="font-mono text-sm">
                          #{order._id.slice(-8)}
                        </span>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {getInitials(getUserName(order))}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">{getUserName(order)}</p>
                            <p className="text-xs text-black">{getUserEmail(order)}</p>
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="text-sm">
                          <span className="font-medium">{order.items.length}</span>
                          <span className="text-black ml-1">items</span>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <span className="font-semibold">₹{order.totalAmount}</span>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar size={12} className="text-black" />
                          <span className="text-xs">
                            {format(parseISO(order.deliveryDate), "dd MMM")}
                          </span>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <Badge className={paymentStatusConfig[order.paymentStatus].color}>
                          <PaymentIcon size={12} className="mr-1" />
                          {paymentStatusConfig[order.paymentStatus].label}
                        </Badge>
                      </TableCell>
                      
                      <TableCell>
                        <Badge className={statusConfig.color}>
                          <StatusIcon size={12} className="mr-1" />
                          {statusConfig.label}
                        </Badge>
                      </TableCell>
                      
                      <TableCell>
                        <div className="text-xs text-black">
                          {format(parseISO(order.createdAt), "dd MMM yyyy")}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="rounded-full">
                              <MoreVertical size={16} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={() => {
                              setSelectedOrder(order)
                              setIsViewDialogOpen(true)
                            }}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            
                            <DropdownMenuItem onClick={() => openGoogleMaps(order.deliveryAddress)}>
                              <MapPin className="mr-2 h-4 w-4" />
                              View on Maps
                            </DropdownMenuItem>
                            
                            <DropdownMenuSeparator />
                            
                            {/* Status Update Options - Updated to match your model */}
                            {order.orderStatus !== 'cancelled' && order.orderStatus !== 'delivered' && (
                              <>
                                {order.orderStatus === 'order_received' && (
                                  <DropdownMenuItem onClick={() => updateOrderStatus(order._id, 'confirmed')}>
                                    <CheckCircle className="mr-2 h-4 w-4 text-purple-600" />
                                    Mark Confirmed
                                  </DropdownMenuItem>
                                )}
                                {order.orderStatus === 'confirmed' && (
                                  <DropdownMenuItem onClick={() => updateOrderStatus(order._id, 'in_preparation')}>
                                    <ChefHat className="mr-2 h-4 w-4 text-yellow-600" />
                                    Start Preparing
                                  </DropdownMenuItem>
                                )}
                                {order.orderStatus === 'in_preparation' && (
                                  <DropdownMenuItem onClick={() => updateOrderStatus(order._id, 'packed')}>
                                    <Package className="mr-2 h-4 w-4 text-orange-600" />
                                    Mark Packed
                                  </DropdownMenuItem>
                                )}
                                {order.orderStatus === 'packed' && (
                                  <DropdownMenuItem onClick={() => updateOrderStatus(order._id, 'out_for_delivery')}>
                                    <Truck className="mr-2 h-4 w-4 text-indigo-600" />
                                    Out for Delivery
                                  </DropdownMenuItem>
                                )}
                                {order.orderStatus === 'out_for_delivery' && (
                                  <DropdownMenuItem onClick={() => updateOrderStatus(order._id, 'delivered')}>
                                    <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                                    Mark Delivered
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => updateOrderStatus(order._id, 'cancelled')}
                                  className="text-red-600"
                                >
                                  <XCircle className="mr-2 h-4 w-4" />
                                  Cancel Order
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* View Order Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="min-w-5xl max-h-[90vh] overflow-y-auto">
          {selectedOrder && (
            <>
              <DialogHeader>
                <DialogTitle>Order Details</DialogTitle>
                <DialogDescription>
                  Order ID: {selectedOrder._id}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {/* Status Timeline */}
                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-3">Order Timeline</h3>
                    <div className="flex items-center justify-between">
                      {Object.entries(orderStatusConfig).map(([key, config], index, array) => {
                        if (key === "undefined") return null;
                        
                        const statusKeys = Object.keys(orderStatusConfig).filter(k => k !== "undefined");
                        const currentStatusIndex = statusKeys.indexOf(selectedOrder.orderStatus);
                        const statusIndex = statusKeys.indexOf(key);
                        
                        const isCompleted = statusIndex <= currentStatusIndex;
                        const isCurrent = key === selectedOrder.orderStatus;
                        
                        return (
                          <div key={key} className="flex-1 relative">
                            {index < array.length - 2 && (
                              <div className={`absolute top-4 left-1/2 w-full h-0.5 ${
                                isCompleted ? 'bg-primary' : 'bg-gray-200'
                              }`} />
                            )}
                            <div className="relative flex flex-col items-center">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                isCompleted ? 'bg-primary text-white' : 'bg-gray-100 text-gray-400'
                              } ${isCurrent ? 'ring-2 ring-primary ring-offset-2' : ''}`}>
                                <config.icon size={16} />
                              </div>
                              <p className={`text-xs mt-2 ${
                                isCompleted ? 'text-primary font-medium' : 'text-gray-500'
                              }`}>
                                {config.label}
                              </p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Customer Info */}
                  <Card>
                    <CardContent className="p-4">
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <User size={16} />
                        Customer Information
                      </h3>
                      <div className="space-y-2">
                        <p className="text-sm">
                          <span className="text-gray-500">Name:</span>{' '}
                          <span className="font-medium">{getUserName(selectedOrder)}</span>
                        </p>
                        <p className="text-sm flex items-center gap-2">
                          <Mail size={14} className="text-gray-400" />
                          <span>{getUserEmail(selectedOrder)}</span>
                        </p>
                        <p className="text-sm flex items-center gap-2">
                          <Phone size={14} className="text-gray-400" />
                          <span>{getUserMobile(selectedOrder)}</span>
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Delivery Address */}
                  <Card>
                    <CardContent className="p-4">
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <MapPin size={16} />
                        Delivery Address
                      </h3>
                      <div className="space-y-2">
                        <p className="text-sm">
                          {selectedOrder.deliveryAddress.houseNumber}, {selectedOrder.deliveryAddress.area}
                        </p>
                        <p className="text-sm">Pincode: {selectedOrder.deliveryAddress.pincode}</p>
                        {selectedOrder.deliveryAddress.coordinates && (
                          <p className="text-xs text-gray-500">
                            Lat: {selectedOrder.deliveryAddress.coordinates.lat}, 
                            Lng: {selectedOrder.deliveryAddress.coordinates.lng}
                          </p>
                        )}
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="mt-2 rounded-full"
                          onClick={() => openGoogleMaps(selectedOrder.deliveryAddress)}
                        >
                          <MapPin size={14} className="mr-2" />
                          Open in Maps
                          <ExternalLink size={12} className="ml-2" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Order Items */}
                  <Card className="md:col-span-2">
                    <CardContent className="p-4">
                      <h3 className="font-semibold mb-3">Order Items</h3>
                      <div className="space-y-3">
                        {selectedOrder.items.map((item, index) => (
                          <div key={index} className="flex items-center justify-between p-2 border rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                                {item.dishId ? (
                                  <span className="text-lg">🍽️</span>
                                ) : (
                                  <Package size={20} className="text-gray-400" />
                                )}
                              </div>
                              <div>
                                <p className="font-medium">
                                  {item.dishId?.name || 'Dish unavailable'}
                                </p>
                                <p className="text-sm text-gray-500">
                                  ₹{item.dishId?.price || 0} × {item.quantity}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold">
                                ₹{(item.dishId?.price || 0) * item.quantity}
                              </p>
                              {item.dishId?.type && (
                                <Badge className={item.dishId.type === 'veg' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'} >
                                  {item.dishId.type}
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))}
                        
                        {/* Total */}
                        <div className="flex justify-between items-center pt-3 border-t">
                          <span className="font-semibold">Total Amount</span>
                          <span className="text-xl font-bold text-primary">
                            ₹{selectedOrder.totalAmount}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Order Info */}
                  <Card className="md:col-span-2">
                    <CardContent className="p-4">
                      <h3 className="font-semibold mb-3">Order Information</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Order Date</p>
                          <p className="font-medium">
                            {format(parseISO(selectedOrder.createdAt), "dd MMM yyyy, hh:mm a")}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Delivery Date</p>
                          <p className="font-medium">
                            {format(parseISO(selectedOrder.deliveryDate), "dd MMM yyyy")}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Payment Status</p>
                          <Badge className={paymentStatusConfig[selectedOrder.paymentStatus].color}>
                            {paymentStatusConfig[selectedOrder.paymentStatus].label}
                          </Badge>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Order Status</p>
                          <Badge className={getStatusConfig(selectedOrder.orderStatus).color}>
                            {getStatusConfig(selectedOrder.orderStatus).label}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Status Update Actions - Updated to match your model */}
                <DialogFooter className="flex flex-col sm:flex-row gap-2">
                  {selectedOrder.orderStatus !== 'cancelled' && selectedOrder.orderStatus !== 'delivered' && (
                    <>
                      {selectedOrder.orderStatus === 'order_received' && (
                        <Button 
                          onClick={() => {
                            updateOrderStatus(selectedOrder._id, 'confirmed')
                            setIsViewDialogOpen(false)
                          }}
                          className="bg-purple-600 hover:bg-purple-700"
                        >
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Confirm Order
                        </Button>
                      )}
                      {selectedOrder.orderStatus === 'confirmed' && (
                        <Button 
                          onClick={() => {
                            updateOrderStatus(selectedOrder._id, 'in_preparation')
                            setIsViewDialogOpen(false)
                          }}
                          className="bg-yellow-600 hover:bg-yellow-700"
                        >
                          <ChefHat className="mr-2 h-4 w-4" />
                          Start Preparing
                        </Button>
                      )}
                      {selectedOrder.orderStatus === 'in_preparation' && (
                        <Button 
                          onClick={() => {
                            updateOrderStatus(selectedOrder._id, 'packed')
                            setIsViewDialogOpen(false)
                          }}
                          className="bg-orange-600 hover:bg-orange-700"
                        >
                          <Package className="mr-2 h-4 w-4" />
                          Mark Packed
                        </Button>
                      )}
                      {selectedOrder.orderStatus === 'packed' && (
                        <Button 
                          onClick={() => {
                            updateOrderStatus(selectedOrder._id, 'out_for_delivery')
                            setIsViewDialogOpen(false)
                          }}
                          className="bg-indigo-600 hover:bg-indigo-700"
                        >
                          <Truck className="mr-2 h-4 w-4" />
                          Out for Delivery
                        </Button>
                      )}
                      {selectedOrder.orderStatus === 'out_for_delivery' && (
                        <Button 
                          onClick={() => {
                            updateOrderStatus(selectedOrder._id, 'delivered')
                            setIsViewDialogOpen(false)
                          }}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Mark Delivered
                        </Button>
                      )}
                      <Button 
                        variant="destructive"
                        onClick={() => {
                          updateOrderStatus(selectedOrder._id, 'cancelled')
                          setIsViewDialogOpen(false)
                        }}
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Cancel Order
                      </Button>
                    </>
                  )}
                </DialogFooter>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}