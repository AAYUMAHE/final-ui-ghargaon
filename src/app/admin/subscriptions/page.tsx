"use client"

import { useEffect, useState } from "react"
import {
  Search,
  Filter,
  Eye,
  MoreVertical,
  Calendar,
  User,
  CreditCard,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Download,
  Trash2,
  Ban,
  Plus,
  PenSquare
} from "lucide-react"
import Link from "next/link"
import { format, parseISO, differenceInDays } from "date-fns"
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface Subscription {
  _id: string
  userId: {
    _id: string
    email: string
    fullName?: string
    username?: string
  }
  planId: {
    _id: string
    name: string
    durationDays: number
    price: number
  }
  meals?: string[]
  foodType?: string
  includeWeekends?: boolean
  startDate: string
  endDate: string
  status: "active" | "expired" | "cancelled"
  paymentStatus: "paid" | "pending" | "failed"
  autoRenew: boolean
  createdAt: string
  updatedAt: string
}

interface SubscriptionPlan {
  _id: string
  name: string
  durationDays: number
  price: number
  pricePerDay?: number
  createdAt?: string
  updatedAt?: string
}

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [filteredSubscriptions, setFilteredSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [planFilter, setPlanFilter] = useState<string>("all")
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null)
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false)
  const [isDeletePlanDialogOpen, setIsDeletePlanDialogOpen] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [deletingPlan, setDeletingPlan] = useState(false)
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [loadingPlans, setLoadingPlans] = useState(false)
  const [activeTab, setActiveTab] = useState("subscriptions")

  useEffect(() => {
    fetchSubscriptions()
    fetchPlans()
  }, [])

  useEffect(() => {
    filterSubscriptions()
  }, [search, statusFilter, planFilter, subscriptions])

  const fetchPlans = async () => {
    try {
      setLoadingPlans(true)
      const response = await api.get("/subscriptions/plans")
      
      let plansData: SubscriptionPlan[] = []
      
      if (Array.isArray(response.data)) {
        plansData = response.data
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        plansData = response.data.data
      } else if (response.data?.plans && Array.isArray(response.data.plans)) {
        plansData = response.data.plans
      }
      
      setPlans(plansData)
    } catch (error: any) {
      console.error("Failed to fetch plans:", error)
      toast.error(error.response?.data?.message || "Failed to fetch plans")
      setPlans([])
    } finally {
      setLoadingPlans(false)
    }
  }

  const fetchSubscriptions = async () => {
    try {
      setLoading(true)
      const response = await api.get("/subscriptions")
      
      let subscriptionsData: Subscription[] = []
      
      if (Array.isArray(response.data)) {
        subscriptionsData = response.data
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        subscriptionsData = response.data.data
      } else if (response.data?.subscriptions && Array.isArray(response.data.subscriptions)) {
        subscriptionsData = response.data.subscriptions
      } else if (response.data._id) {
        subscriptionsData = [response.data]
      }
      
      setSubscriptions(subscriptionsData)
      setFilteredSubscriptions(subscriptionsData)
    } catch (error: any) {
      console.error("Failed to fetch subscriptions:", error)
      toast.error(error.response?.data?.message || "Failed to fetch subscriptions")
      setSubscriptions([])
      setFilteredSubscriptions([])
    } finally {
      setLoading(false)
    }
  }

  const filterSubscriptions = () => {
    let filtered = [...subscriptions]

    if (search) {
      filtered = filtered.filter(sub =>
        sub.userId?.email?.toLowerCase().includes(search.toLowerCase()) ||
        sub.userId?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
        sub.planId?.name?.toLowerCase().includes(search.toLowerCase()) ||
        sub._id.toLowerCase().includes(search.toLowerCase())
      )
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(sub => sub.status === statusFilter)
    }

    if (planFilter !== "all") {
      filtered = filtered.filter(sub => sub.planId?._id === planFilter)
    }

    setFilteredSubscriptions(filtered)
  }

  const cancelSubscription = async () => {
    if (!selectedSubscription) return

    setCancelling(true)
    try {
      const response = await api.patch(`/subscriptions/${selectedSubscription._id}/cancel`)
      
      // Update the subscription in the state
      setSubscriptions(prev =>
        prev.map(sub =>
          sub._id === selectedSubscription._id
            ? { ...sub, status: "cancelled" as const }
            : sub
        )
      )
      
      toast.success("Subscription cancelled successfully")
      setIsCancelDialogOpen(false)
      setIsViewDialogOpen(false)
      setSelectedSubscription(null)
    } catch (error: any) {
      console.error("Failed to cancel subscription:", error)
      toast.error(error.response?.data?.message || "Failed to cancel subscription")
    } finally {
      setCancelling(false)
    }
  }

  const deletePlan = async () => {
    if (!selectedPlan) return

    setDeletingPlan(true)
    try {
      // Check if plan has any active subscriptions
      const hasActiveSubscriptions = subscriptions.some(
        sub => sub.planId?._id === selectedPlan._id && sub.status === "active"
      )

      if (hasActiveSubscriptions) {
        toast.error("Cannot delete plan with active subscriptions. Please cancel or expire those subscriptions first.")
        setIsDeletePlanDialogOpen(false)
        setSelectedPlan(null)
        setDeletingPlan(false)
        return
      }

      const response = await api.delete(`/subscriptions/plans/${selectedPlan._id}`)
      
      // Remove the plan from plans list
      setPlans(prev => prev.filter(plan => plan._id !== selectedPlan._id))
      
      // Update planFilter if the deleted plan was selected
      if (planFilter === selectedPlan._id) {
        setPlanFilter("all")
      }
      
      toast.success(`Plan "${selectedPlan.name}" deleted successfully`)
      setIsDeletePlanDialogOpen(false)
      setSelectedPlan(null)
    } catch (error: any) {
      console.error("Failed to delete plan:", error)
      toast.error(error.response?.data?.message || "Failed to delete plan")
    } finally {
      setDeletingPlan(false)
    }
  }

  const getInitials = (name: string) => {
    if (!name) return "U"
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getRemainingDays = (endDate: string) => {
    try {
      const daysLeft = differenceInDays(parseISO(endDate), new Date())
      return daysLeft > 0 ? daysLeft : 0
    } catch {
      return 0
    }
  }

  const getStatusBadge = (status: string, endDate: string) => {
    if (status === 'cancelled') {
      return { label: 'Cancelled', color: 'bg-red-100 text-red-800 border-red-200' }
    }

    const daysLeft = getRemainingDays(endDate)
    if (daysLeft === 0) {
      return { label: 'Expired', color: 'bg-gray-100 text-gray-800 border-gray-200' }
    }
    if (daysLeft < 7) {
      return { label: 'Expiring Soon', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' }
    }
    return { label: 'Active', color: 'bg-green-100 text-green-800 border-green-200' }
  }

  if (loading && subscriptions.length === 0) {
    return (
      <div className="p-8">
        <Skeleton className="h-10 w-64 mb-8" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    )
  }

  // Get unique plans for filter
  const uniquePlans = Array.from(new Map(
    subscriptions.filter(sub => sub.planId).map(sub => [sub.planId!._id, sub.planId])
  ).values()).filter(Boolean)

  return (
    <div className="p-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-textdark">Subscriptions Management</h1>
          <p className="text-black mt-1">Manage all customer subscriptions and plans</p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => {
            fetchSubscriptions()
            fetchPlans()
          }} className="rounded-full">
            <RefreshCw size={16} className="mr-2" />
            Refresh
          </Button>
          <Button variant="outline" className="rounded-full">
            <Download size={16} className="mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="grid w-full max-w-md grid-cols-1">
          <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
        </TabsList>

        {/* Subscriptions Tab */}
        <TabsContent value="subscriptions" className="mt-6">
          {/* Filters */}
          <Card className="rounded-2xl mb-6">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black" size={18} />
                  <Input
                    placeholder="Search by customer or plan..."
                    className="pl-10"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={planFilter} onValueChange={setPlanFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Plan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Plans</SelectItem>
                    {uniquePlans.map((plan: any) => (
                      <SelectItem key={plan._id} value={plan._id}>
                        {plan.name} - ₹{plan.price}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  onClick={() => {
                    setSearch("")
                    setStatusFilter("all")
                    setPlanFilter("all")
                  }}
                  className="rounded-full"
                >
                  Reset Filters
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Subscriptions Table */}
          <Card className="rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Remaining</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubscriptions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-12">
                        <div className="text-center">
                          <p className="text-black">No subscriptions found</p>
                          <Button 
                            variant="link" 
                            onClick={() => {
                              setSearch("")
                              setStatusFilter("all")
                              setPlanFilter("all")
                            }}
                          >
                            Clear filters
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredSubscriptions.map((sub) => {
                      const status = getStatusBadge(sub.status, sub.endDate)
                      const remainingDays = getRemainingDays(sub.endDate)

                      return (
                        <TableRow key={sub._id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="bg-primary/10 text-primary">
                                  {getInitials(sub.userId?.fullName || sub.userId?.email || 'U')}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-sm">{sub.userId?.fullName || 'N/A'}</p>
                                <p className="text-xs text-black">{sub.userId?.email || 'No email'}</p>
                              </div>
                            </div>
                          </TableCell>

                          <TableCell>
                            <div>
                              <p className="font-medium">{sub.planId?.name || 'Unknown Plan'}</p>
                              <p className="text-xs text-black">₹{sub.planId?.price || 0}</p>
                            </div>
                          </TableCell>

                          <TableCell>
                            <span>{sub.planId?.durationDays || 0} days</span>
                          </TableCell>

                          <TableCell>
                            {sub.startDate ? format(parseISO(sub.startDate), "dd MMM yyyy") : 'N/A'}
                          </TableCell>

                          <TableCell>
                            {sub.endDate ? format(parseISO(sub.endDate), "dd MMM yyyy") : 'N/A'}
                          </TableCell>

                          <TableCell>
                            <Badge variant="outline" className={
                              remainingDays < 7 && remainingDays > 0 ? 'border-yellow-500 text-yellow-700' : ''
                            }>
                              <Clock size={12} className="mr-1" />
                              {remainingDays} days
                            </Badge>
                          </TableCell>

                          <TableCell>
                            <Badge className={status.color}>
                              {status.label}
                            </Badge>
                          </TableCell>

                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="rounded-full">
                                  <MoreVertical size={16} />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => {
                                  setSelectedSubscription(sub)
                                  setIsViewDialogOpen(true)
                                }}>
                                  <Eye size={14} className="mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                {sub.status === "active" && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem 
                                      onClick={() => {
                                        setSelectedSubscription(sub)
                                        setIsCancelDialogOpen(true)
                                      }}
                                      className="text-red-600"
                                    >
                                      <Ban size={14} className="mr-2" />
                                      Cancel Subscription
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
        </TabsContent>

        {/* Plans Management Tab */}
        <TabsContent value="plans" className="mt-6">
          <Card className="rounded-2xl">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold">Subscription Plans</h2>
                  <p className="text-black mt-1">Manage your subscription plans</p>
                </div>
                <Button className="bg-primary hover:bg-accent rounded-full">
                  <Plus size={16} className="mr-2" />
                  Add New Plan
                </Button>
              </div>
              
              {loadingPlans ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-32 rounded-xl" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {plans.map((plan) => {
                    const hasActiveSubscriptions = subscriptions.some(
                      sub => sub.planId?._id === plan._id && sub.status === "active"
                    )
                    
                    return (
                      <Card key={plan._id} className="relative hover:shadow-lg transition-shadow">
                        <CardContent className="p-6">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h3 className="text-xl font-bold">{plan.name}</h3>
                              <p className="text-3xl font-bold text-primary mt-2">₹{plan.price}</p>
                              <p className="text-sm text-black">{plan.durationDays} days</p>
                              {plan.pricePerDay && (
                                <p className="text-xs text-black mt-1">₹{plan.pricePerDay}/day</p>
                              )}
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical size={16} />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <Eye size={14} className="mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <PenSquare size={14} className="mr-2" />
                                  Edit Plan
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => {
                                    setSelectedPlan(plan)
                                    setIsDeletePlanDialogOpen(true)
                                  }}
                                  className="text-red-600"
                                  disabled={hasActiveSubscriptions}
                                >
                                  <Trash2 size={14} className="mr-2" />
                                  Delete Plan
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                          
                          {/* Warning for plans with active subscriptions */}
                          {hasActiveSubscriptions && (
                            <div className="mt-4 pt-4 border-t">
                              <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                                ⚠️ Has active subscriptions
                              </Badge>
                              <p className="text-xs text-black mt-2">
                                Cannot delete until all subscriptions are cancelled or expired
                              </p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )
                  })}
                  
                  {plans.length === 0 && (
                    <div className="col-span-full text-center py-12">
                      <p className="text-black">No plans found</p>
                      <Button variant="link" className="mt-2">
                        Create your first plan
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* View Subscription Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedSubscription && (
            <>
              <DialogHeader>
                <DialogTitle>Subscription Details</DialogTitle>
                <DialogDescription>
                  View complete subscription information
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-3">Customer Information</h3>
                    <div className="space-y-2">
                      <p><span className="text-black">Name:</span> {selectedSubscription.userId?.fullName || 'N/A'}</p>
                      <p><span className="text-black">Email:</span> {selectedSubscription.userId?.email || 'N/A'}</p>
                      <p><span className="text-black">Username:</span> @{selectedSubscription.userId?.username || 'N/A'}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-3">Plan Details</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-black">Plan Name</p>
                        <p className="font-medium">{selectedSubscription.planId?.name || 'Unknown'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-black">Duration</p>
                        <p>{selectedSubscription.planId?.durationDays || 0} days</p>
                      </div>
                      <div>
                        <p className="text-sm text-black">Price</p>
                        <p className="text-primary font-bold">₹{selectedSubscription.planId?.price || 0}</p>
                      </div>
                      <div>
                        <p className="text-sm text-black">Auto Renew</p>
                        <Badge variant={selectedSubscription.autoRenew ? "default" : "outline"}>
                          {selectedSubscription.autoRenew ? 'Yes' : 'No'}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-3">Subscription Timeline</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-black">Start Date:</span>
                        <span className="font-medium">{selectedSubscription.startDate ? format(parseISO(selectedSubscription.startDate), "PPP") : 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-black">End Date:</span>
                        <span className="font-medium">{selectedSubscription.endDate ? format(parseISO(selectedSubscription.endDate), "PPP") : 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-black">Status:</span>
                        <Badge className={getStatusBadge(selectedSubscription.status, selectedSubscription.endDate).color}>
                          {getStatusBadge(selectedSubscription.status, selectedSubscription.endDate).label}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-black">Payment:</span>
                        <Badge className={
                          selectedSubscription.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                            selectedSubscription.paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                        }>
                          {selectedSubscription.paymentStatus || 'N/A'}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-black">Created:</span>
                        <span>{selectedSubscription.createdAt ? format(parseISO(selectedSubscription.createdAt), "PPP") : 'N/A'}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {selectedSubscription.meals && selectedSubscription.meals.length > 0 && (
                  <Card>
                    <CardContent className="p-4">
                      <h3 className="font-semibold mb-3">Meal Preferences</h3>
                      <div className="space-y-2">
                        <div>
                          <p className="text-sm text-black">Meals Included</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {selectedSubscription.meals.map(meal => (
                              <Badge key={meal} variant="outline">
                                {meal}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-black">Food Type</p>
                          <Badge className={selectedSubscription.foodType === "veg" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                            {selectedSubscription.foodType === "veg" ? "Vegetarian" : "Non-Vegetarian"}
                          </Badge>
                        </div>
                        <div>
                          <p className="text-sm text-black">Weekends</p>
                          <p>{selectedSubscription.includeWeekends ? "Included" : "Excluded"}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              <DialogFooter className="gap-2">
                {selectedSubscription.status === "active" && (
                  <Button
                    variant="destructive"
                    onClick={() => {
                      setIsViewDialogOpen(false)
                      setIsCancelDialogOpen(true)
                    }}
                  >
                    <Ban size={16} className="mr-2" />
                    Cancel Subscription
                  </Button>
                )}
                <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Cancel Subscription Confirmation Dialog */}
      <AlertDialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Subscription</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel the subscription for <strong>{selectedSubscription?.userId?.fullName || selectedSubscription?.userId?.email}</strong>?
              <br /><br />
              Plan: <strong>{selectedSubscription?.planId?.name}</strong> (₹{selectedSubscription?.planId?.price})
              <br /><br />
              This action cannot be undone. The user will continue to receive meals until the end of their billing period.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
            <AlertDialogAction
              onClick={cancelSubscription}
              disabled={cancelling}
              className="bg-red-600 hover:bg-red-700"
            >
              {cancelling ? "Cancelling..." : "Yes, Cancel Subscription"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Plan Confirmation Dialog */}
      <AlertDialog open={isDeletePlanDialogOpen} onOpenChange={setIsDeletePlanDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Plan</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the plan <strong>{selectedPlan?.name}</strong>?
              <br /><br />
              Price: ₹{selectedPlan?.price}<br />
              Duration: {selectedPlan?.durationDays} days
              <br /><br />
              {subscriptions.some(sub => sub.planId?._id === selectedPlan?._id && sub.status === "active") ? (
                <span className="text-red-600 font-semibold block mt-2">
                  ⚠️ This plan has active subscriptions. Please cancel or expire those subscriptions before deleting this plan.
                </span>
              ) : (
                "This action cannot be undone."
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={deletePlan}
              disabled={deletingPlan || subscriptions.some(sub => sub.planId?._id === selectedPlan?._id && sub.status === "active")}
              className="bg-red-600 hover:bg-red-700"
            >
              {deletingPlan ? "Deleting..." : "Yes, Delete Plan"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}