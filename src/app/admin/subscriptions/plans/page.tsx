"use client"

import { useEffect, useState } from "react"
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Calendar,
  CreditCard,
  Users,
  MoreVertical,
  Copy,
  RefreshCw,
  TrendingUp,
  Clock
} from "lucide-react"
import Link from "next/link"
import { format, parseISO } from "date-fns"
import api from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"

interface SubscriptionPlan {
  _id: string
  name: string
  durationDays: number
  price: number
  pricePerDay: number
  createdAt: string
  updatedAt: string
  isActive?: boolean
}

interface PlanFormData {
  name: string
  durationDays: number
  price: number
}

export default function SubscriptionPlansPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [filteredPlans, setFilteredPlans] = useState<SubscriptionPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null)
  const [formData, setFormData] = useState<PlanFormData>({
    name: "",
    durationDays: 30,
    price: 0
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchPlans()
  }, [])

  useEffect(() => {
    filterPlans()
  }, [search, plans])

  const fetchPlans = async () => {
    try {
      setLoading(true)
      const response = await api.get("/subscriptions/plans")
      
      // Add some mock data for demonstration (you can remove this in production)
      const plansWithStats = response.data.map((plan: SubscriptionPlan) => ({
        ...plan,
        totalSubscribers: Math.floor(Math.random() * 50) // Mock data
      }))
      
      setPlans(plansWithStats)
      setFilteredPlans(plansWithStats)
    } catch (error) {
      toast.error("Failed to fetch subscription plans")
    } finally {
      setLoading(false)
    }
  }

  const filterPlans = () => {
    if (!search) {
      setFilteredPlans(plans)
      return
    }

    const filtered = plans.filter(plan =>
      plan.name.toLowerCase().includes(search.toLowerCase()) ||
      plan.durationDays.toString().includes(search) ||
      plan.price.toString().includes(search)
    )
    setFilteredPlans(filtered)
  }

  const handleCreatePlan = async () => {
    // Validation
    if (!formData.name.trim()) {
      toast.error("Please enter a plan name")
      return
    }
    if (formData.durationDays < 1) {
      toast.error("Duration must be at least 1 day")
      return
    }
    if (formData.price < 1) {
      toast.error("Price must be greater than 0")
      return
    }

    setSubmitting(true)
    try {
      const response = await api.post("/subscriptions/plans", formData)
      
      // Add mock subscriber count
      const newPlan = {
        ...response.data,
      }
      
      setPlans([...plans, newPlan])
      toast.success("Subscription plan created successfully")
      setIsCreateDialogOpen(false)
      resetForm()
    } catch (error: any) {
      if (error.response?.data?.message === "Plan already exists") {
        toast.error("A plan with this name already exists")
      } else {
        toast.error("Failed to create subscription plan")
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdatePlan = async () => {
    if (!selectedPlan) return

    // Validation
    if (!formData.name.trim()) {
      toast.error("Please enter a plan name")
      return
    }
    if (formData.durationDays < 1) {
      toast.error("Duration must be at least 1 day")
      return
    }
    if (formData.price < 1) {
      toast.error("Price must be greater than 0")
      return
    }

    setSubmitting(true)
    try {
      const response = await api.put(`/subscriptions/plans/${selectedPlan._id}`, formData)
      
      setPlans(plans.map(plan =>
        plan._id === selectedPlan._id
          ? { ...response.data }
          : plan
      ))
      
      toast.success("Subscription plan updated successfully")
      setIsEditDialogOpen(false)
      resetForm()
    } catch (error: any) {
      if (error.response?.data?.message === "Plan already exists") {
        toast.error("A plan with this name already exists")
      } else {
        toast.error("Failed to update subscription plan")
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeletePlan = async () => {
    if (!selectedPlan) return

    try {
      await api.delete(`/subscriptions/plans/${selectedPlan._id}`)
      
      setPlans(plans.filter(plan => plan._id !== selectedPlan._id))
      toast.success("Subscription plan deleted successfully")
      setIsDeleteDialogOpen(false)
      setSelectedPlan(null)
    } catch (error) {
      toast.error("Failed to delete subscription plan")
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      durationDays: 30,
      price: 0
    })
    setSelectedPlan(null)
  }

  const openEditDialog = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan)
    setFormData({
      name: plan.name,
      durationDays: plan.durationDays,
      price: plan.price
    })
    setIsEditDialogOpen(true)
  }

  const calculatePricePerDay = (price: number, days: number) => {
    return (price / days).toFixed(2)
  }

 

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex justify-between items-center mb-8">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    )
  }

  // Calculate stats
  const totalPlans = plans.length
  const averagePrice = plans.length > 0 
    ? Math.round(plans.reduce((sum, plan) => sum + plan.price, 0) / plans.length)
    : 0
  

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-textdark">Subscription Plans</h1>
          <p className="text-black mt-1">Create and manage subscription plans for your customers</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={fetchPlans}
            className="rounded-full"
          >
            <RefreshCw size={16} className="mr-2" />
            Refresh
          </Button>
          <Button 
            onClick={() => {
              resetForm()
              setIsCreateDialogOpen(true)
            }}
            className="bg-primary hover:bg-accent rounded-full"
          >
            <Plus size={18} className="mr-2" />
            Create New Plan
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card className="rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-black mb-1">Total Plans</p>
                <p className="text-3xl font-bold text-primary">{totalPlans}</p>
              </div>
              <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                <CreditCard className="text-primary" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-black mb-1">Average Price</p>
                <p className="text-3xl font-bold text-blue-600">₹{averagePrice}</p>
              </div>
              <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
                <TrendingUp className="text-blue-600" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

       
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black" size={18} />
          <Input
            placeholder="Search plans by name, duration, or price..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Plans Table */}
      <Card className="rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plan Name</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Price Per Day</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPlans.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12">
                    <div className="flex flex-col items-center">
                      <CreditCard size={48} className="text-black mb-4" />
                      <p className="text-black text-lg">No subscription plans found</p>
                      <p className="text-sm text-black mb-4">Create your first subscription plan</p>
                      <Button 
                        onClick={() => {
                          resetForm()
                          setIsCreateDialogOpen(true)
                        }}
                        className="bg-primary hover:bg-accent rounded-full"
                      >
                        <Plus size={16} className="mr-2" />
                        Create Plan
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredPlans.map((plan) => {
                
                  return (
                    <TableRow key={plan._id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{plan.name}</p>
                          <p className="text-xs text-black">ID: {plan._id.slice(-6)}</p>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar size={14} className="text-black" />
                          <span>{plan.durationDays} days</span>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <span className="font-semibold text-primary">₹{plan.price}</span>
                      </TableCell>
                      
                      <TableCell>
                        <Badge variant="outline" className="bg-gray-50">
                          ₹{calculatePricePerDay(plan.price, plan.durationDays)}/day
                        </Badge>
                      </TableCell>
                      
                    
                      
                      <TableCell>
                        <div className="text-xs text-black">
                          {format(parseISO(plan.createdAt), "dd MMM yyyy")}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="rounded-full">
                              <MoreVertical size={16} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditDialog(plan)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Plan
                            </DropdownMenuItem>
                            
                            <DropdownMenuItem 
                              onClick={() => {
                                navigator.clipboard.writeText(plan._id)
                                toast.success("Plan ID copied to clipboard")
                              }}
                            >
                              <Copy className="mr-2 h-4 w-4" />
                              Copy ID
                            </DropdownMenuItem>
                            
                            <DropdownMenuSeparator />
                            
                            <DropdownMenuItem 
                              onClick={() => {
                                setSelectedPlan(plan)
                                setIsDeleteDialogOpen(true)
                              }}
                              className="text-error"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Plan
                            </DropdownMenuItem>
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

      {/* Create Plan Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Subscription Plan</DialogTitle>
            <DialogDescription>
              Add a new subscription plan for your customers
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Plan Name</Label>
              <Input
                id="name"
                placeholder="e.g., Monthly Premium Plan"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="duration">Duration (Days)</Label>
              <Input
                id="duration"
                type="number"
                min="1"
                placeholder="30"
                value={formData.durationDays}
                onChange={(e) => setFormData({ ...formData, durationDays: parseInt(e.target.value) || 0 })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="price">Price (₹)</Label>
              <Input
                id="price"
                type="number"
                min="1"
                placeholder="2999"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
              />
            </div>
            
            {formData.durationDays > 0 && formData.price > 0 && (
              <div className="bg-soft p-3 rounded-lg">
                <p className="text-sm text-black">Price per day</p>
                <p className="text-lg font-semibold text-primary">
                  ₹{calculatePricePerDay(formData.price, formData.durationDays)}/day
                </p>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreatePlan}
              disabled={submitting}
              className="bg-primary hover:bg-accent"
            >
              {submitting ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                "Create Plan"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Plan Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Subscription Plan</DialogTitle>
            <DialogDescription>
              Update the subscription plan details
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Plan Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-duration">Duration (Days)</Label>
              <Input
                id="edit-duration"
                type="number"
                min="1"
                value={formData.durationDays}
                onChange={(e) => setFormData({ ...formData, durationDays: parseInt(e.target.value) || 0 })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-price">Price (₹)</Label>
              <Input
                id="edit-price"
                type="number"
                min="1"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
              />
            </div>
            
            {formData.durationDays > 0 && formData.price > 0 && (
              <div className="bg-soft p-3 rounded-lg">
                <p className="text-sm text-black">Price per day</p>
                <p className="text-lg font-semibold text-primary">
                  ₹{calculatePricePerDay(formData.price, formData.durationDays)}/day
                </p>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsEditDialogOpen(false)
              resetForm()
            }}>
              Cancel
            </Button>
            <Button 
              onClick={handleUpdatePlan}
              disabled={submitting}
              className="bg-primary hover:bg-accent"
            >
              {submitting ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                "Update Plan"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              subscription plan "{selectedPlan?.name}" and may affect existing subscribers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedPlan(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeletePlan}
              className="bg-error hover:bg-error/90"
            >
              Delete Plan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}