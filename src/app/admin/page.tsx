"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { 
  Users, 
  Utensils, 
  ClipboardList, 
  CreditCard,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Calendar,
  Eye,
  ArrowRight,
  DollarSign,
  UserPlus,
  ShoppingBag,
  Award
} from "lucide-react"
import { format, parseISO, isToday, subDays } from "date-fns"
import api from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts'

interface DashboardStats {
  totalUsers: number
  totalOrders: number
  totalDishes: number
  activeSubscriptions: number
  todayOrders: number
  pendingOrders: number
  completedOrders: number
  cancelledOrders: number
  revenue: number
  todayRevenue: number
  averageOrderValue: number
  newUsersToday: number
}

interface Order {
  _id: string
  userId: any
  items: any[]
  totalAmount: number
  paymentStatus: string
  orderStatus: string
  deliveryDate: string
  createdAt: string
}

interface User {
  _id: string
  email: string
  fullName?: string
  username?: string
  role: string
  createdAt: string
}

interface Dish {
  _id: string
  name: string
  type: string
  price: number
}

interface ChartData {
  name: string
  orders: number
  revenue: number
}

interface StatusData {
  name: string
  value: number
  color: string
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalOrders: 0,
    totalDishes: 0,
    activeSubscriptions: 0,
    todayOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    cancelledOrders: 0,
    revenue: 0,
    todayRevenue: 0,
    averageOrderValue: 0,
    newUsersToday: 0
  })
  const [recentOrders, setRecentOrders] = useState<Order[]>([])
  const [recentUsers, setRecentUsers] = useState<User[]>([])
  const [popularDishes, setPopularDishes] = useState<any[]>([])
  const [chartData, setChartData] = useState<ChartData[]>([])
  const [statusData, setStatusData] = useState<StatusData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const [usersRes, ordersRes, dishesRes] = await Promise.all([
        api.get("/auth/all"),
        api.get("/orders"),
        api.get("/dishes")
      ])

      // Process orders
      const orders = ordersRes.data
      const today = format(new Date(), "yyyy-MM-dd")
      
      const todayOrders = orders.filter((order: Order) => 
        format(parseISO(order.createdAt), "yyyy-MM-dd") === today
      )
      
      const pendingOrders = orders.filter(
        (order: Order) => !["delivered", "cancelled"].includes(order.orderStatus)
      )
      
      const completedOrders = orders.filter(
        (order: Order) => order.orderStatus === "delivered"
      )
      
      const cancelledOrders = orders.filter(
        (order: Order) => order.orderStatus === "cancelled"
      )

      const totalRevenue = orders
        .filter((order: Order) => order.orderStatus === "delivered")
        .reduce((sum: number, order: Order) => sum + (order.totalAmount || 0), 0)

      const todayRevenue = todayOrders
        .filter((order: Order) => order.orderStatus === "delivered")
        .reduce((sum: number, order: Order) => sum + (order.totalAmount || 0), 0)

      const averageOrderValue = orders.length > 0
        ? totalRevenue / orders.length
        : 0

      // Process users
      const users = usersRes.data
      const newUsersToday = users.filter((user: User) => 
        format(parseISO(user.createdAt), "yyyy-MM-dd") === today
      ).length

      const activeSubscriptions = users.filter((u: User) => 
        Math.random() > 0.7 // Mock data - replace with actual subscription data
      ).length

      // Process dishes for popularity (mock data based on orders)
      const dishCount = new Map()
      orders.forEach((order: Order) => {
        order.items.forEach((item: any) => {
          if (item.dishId?._id) {
            const count = dishCount.get(item.dishId._id) || 0
            dishCount.set(item.dishId._id, count + item.quantity)
          }
        })
      })

      const popular = Array.from(dishCount.entries())
        .map(([id, count]) => ({
          id,
          name: dishesRes.data.find((d: Dish) => d._id === id)?.name || 'Unknown Dish',
          count,
          type: dishesRes.data.find((d: Dish) => d._id === id)?.type || 'veg'
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)

      setPopularDishes(popular)

      // Generate chart data for last 7 days
      const last7Days = []
      for (let i = 6; i >= 0; i--) {
        const date = subDays(new Date(), i)
        const dateStr = format(date, "yyyy-MM-dd")
        const dayOrders = orders.filter((order: Order) => 
          format(parseISO(order.createdAt), "yyyy-MM-dd") === dateStr
        )
        const dayRevenue = dayOrders
          .filter((order: Order) => order.orderStatus === "delivered")
          .reduce((sum: number, order: Order) => sum + (order.totalAmount || 0), 0)

        last7Days.push({
          name: format(date, "EEE"),
          orders: dayOrders.length,
          revenue: dayRevenue
        })
      }
      setChartData(last7Days)

      // Status distribution for pie chart
      setStatusData([
        { name: 'Pending', value: pendingOrders.length, color: '#F59E0B' },
        { name: 'Completed', value: completedOrders.length, color: '#10B981' },
        { name: 'Cancelled', value: cancelledOrders.length, color: '#EF4444' }
      ])

      setStats({
        totalUsers: users.length,
        totalOrders: orders.length,
        totalDishes: dishesRes.data.length,
        activeSubscriptions,
        todayOrders: todayOrders.length,
        pendingOrders: pendingOrders.length,
        completedOrders: completedOrders.length,
        cancelledOrders: cancelledOrders.length,
        revenue: totalRevenue,
        todayRevenue,
        averageOrderValue,
        newUsersToday
      })

      // Set recent orders and users
      setRecentOrders(orders.slice(0, 5))
      setRecentUsers(users.slice(0, 5))

    } catch (error) {
      console.error("Failed to fetch dashboard data", error)
    } finally {
      setLoading(false)
    }
  }

  const getInitials = (name?: string, email?: string) => {
    if (name) {
      return name
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }
    return email?.slice(0, 2).toUpperCase() || 'U'
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      received: "bg-blue-100 text-blue-800",
      confirmed: "bg-purple-100 text-purple-800",
      preparing: "bg-yellow-100 text-yellow-800",
      packing: "bg-orange-100 text-orange-800",
      out_for_delivery: "bg-indigo-100 text-indigo-800",
      delivered: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800"
    }
    return colors[status] || "bg-gray-100 text-gray-800"
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="mb-8">
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
        <div className="grid lg:grid-cols-3 gap-6">
          <Skeleton className="lg:col-span-2 h-96 rounded-2xl" />
          <Skeleton className="h-96 rounded-2xl" />
        </div>
      </div>
    )
  }

  const statCards = [
    { 
      title: "Total Users", 
      value: stats.totalUsers, 
      icon: Users, 
      color: "bg-blue-500",
      link: "/admin/users",
      change: `+${stats.newUsersToday} today`
    },
    { 
      title: "Total Orders", 
      value: stats.totalOrders, 
      icon: ClipboardList, 
      color: "bg-green-500",
      link: "/admin/orders",
      change: `+${stats.todayOrders} today`
    },
    { 
      title: "Total Dishes", 
      value: stats.totalDishes, 
      icon: Utensils, 
      color: "bg-orange-500",
      link: "/admin/dishes",
      change: "active"
    },
    { 
      title: "Active Subs", 
      value: stats.activeSubscriptions, 
      icon: Award, 
      color: "bg-purple-500",
      link: "/admin/subscriptions",
      change: "active"
    },
    { 
      title: "Today's Orders", 
      value: stats.todayOrders, 
      icon: TrendingUp, 
      color: "bg-pink-500",
      link: "/admin/orders",
      change: `₹${stats.todayRevenue} revenue`
    },
    { 
      title: "Pending", 
      value: stats.pendingOrders, 
      icon: Clock, 
      color: "bg-yellow-500",
      link: "/admin/orders?status=pending",
      change: "need attention"
    },
    { 
      title: "Completed", 
      value: stats.completedOrders, 
      icon: CheckCircle, 
      color: "bg-emerald-500",
      link: "/admin/orders?status=delivered",
      change: "delivered"
    },
    { 
      title: "Revenue", 
      value: `₹${stats.revenue}`, 
      icon: DollarSign, 
      color: "bg-primary",
      link: "/admin/orders",
      change: `avg ₹${Math.round(stats.averageOrderValue)}/order`
    },
  ]

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-textdark">Dashboard</h1>
        <p className="text-black mt-1">
          Welcome back! Here's what's happening with your business today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((card, index) => {
          const Icon = card.icon
          return (
            <Link href={card.link} key={index}>
              <Card className="rounded-2xl hover:shadow-lg transition-all cursor-pointer group">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`${card.color} w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      <Icon className="text-white" size={24} />
                    </div>
                    <span className="text-3xl font-bold text-textdark">{card.value}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-black font-medium">{card.title}</h3>
                    <span className="text-xs text-black">{card.change}</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      {/* Charts Section */}
      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        {/* Orders Chart */}
        <Card className="lg:col-span-2 rounded-2xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold">Orders Overview</h3>
                <p className="text-sm text-black">Last 7 days</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-primary rounded-full"></div>
                  <span className="text-xs">Orders</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-xs">Revenue</span>
                </div>
              </div>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#E85D04" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#E85D04" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <CartesianGrid strokeDasharray="3 3" />
                  <Tooltip />
                  <Area 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="orders" 
                    stroke="#E85D04" 
                    fillOpacity={1} 
                    fill="url(#colorOrders)" 
                  />
                  <Area 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#10B981" 
                    fillOpacity={1} 
                    fill="url(#colorRevenue)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card className="rounded-2xl">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-6">Order Status Distribution</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 mt-4">
              {statusData.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                  <span className="text-xs">{item.name}: {item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <Card className="rounded-2xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Recent Orders</h3>
              <Link href="/admin/orders">
                <Button variant="ghost" size="sm" className="rounded-full">
                  View All <ArrowRight size={16} className="ml-1" />
                </Button>
              </Link>
            </div>
            <div className="space-y-4">
              {recentOrders.length > 0 ? (
                recentOrders.map((order) => (
                  <Link href={`/admin/orders/${order._id}`} key={order._id}>
                    <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <ShoppingBag size={18} className="text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">Order #{order._id.slice(-8)}</p>
                          <p className="text-xs text-black">
                            {format(parseISO(order.createdAt), "dd MMM yyyy, hh:mm a")}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold">₹{order.totalAmount}</span>
                        <Badge className={getStatusColor(order.orderStatus)}>
                          {order.orderStatus.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <p className="text-center text-black py-4">No recent orders</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Users */}
        <Card className="rounded-2xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">New Users</h3>
              <Link href="/admin/users">
                <Button variant="ghost" size="sm" className="rounded-full">
                  View All <ArrowRight size={16} className="ml-1" />
                </Button>
              </Link>
            </div>
            <div className="space-y-4">
              {recentUsers.length > 0 ? (
                recentUsers.map((user) => (
                  <Link href={`/admin/users/${user._id}`} key={user._id}>
                    <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {getInitials(user.fullName, user.email)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{user.fullName || user.email}</p>
                          <p className="text-xs text-black">{user.email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="text-xs">
                          {format(parseISO(user.createdAt), "dd MMM")}
                        </Badge>
                        {user.role === "admin" && (
                          <Badge className="bg-purple-600 ml-2">Admin</Badge>
                        )}
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <p className="text-center text-black py-4">No recent users</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Popular Dishes */}
        <Card className="lg:col-span-2 rounded-2xl">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Popular Dishes</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {popularDishes.length > 0 ? (
                popularDishes.map((dish, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        dish.type === 'veg' ? 'bg-success/20' : 'bg-error/20'
                      }`}>
                        <span className={dish.type === 'veg' ? 'text-success' : 'text-error'}>
                          {dish.type === 'veg' ? '🟢' : '🔴'}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{dish.name}</p>
                        <p className="text-xs text-black">{dish.count} orders</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-primary/10">
                      #{index + 1}
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-center text-black py-4 col-span-2">No data available</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}