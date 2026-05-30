"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { ArrowLeft, Save, Trash2, Plus, Utensils } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { format, parseISO } from "date-fns"
import api from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"

interface Dish {
  _id: string
  name: string
  image: string
  price: number
  type: "veg" | "nonveg"
}

interface Menu {
  _id: string
  date: string
  mealType: "breakfast" | "lunch" | "dinner"
  dishes: Dish[]
  createdAt: string
  updatedAt: string
}

export default function EditMenuPage() {
  const router = useRouter()
  const params = useParams()
  const menuId = params.id as string

  const [menu, setMenu] = useState<Menu | null>(null)
  const [allDishes, setAllDishes] = useState<Dish[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isAddDishOpen, setIsAddDishOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  useEffect(() => {
    fetchData()
  }, [menuId])

  const fetchData = async () => {
    try {
      const [menuRes, dishesRes] = await Promise.all([
        api.get(`/menu/${menuId}`),
        api.get("/dishes")
      ])
      setMenu(menuRes.data)
      setAllDishes(dishesRes.data)
    } catch (error) {
      toast.error("Failed to fetch menu")
      router.push("/admin/menu")
    } finally {
      setLoading(false)
    }
  }

  const addDishToMenu = async (dishId: string) => {
    if (!menu) return

    try {
      const response = await api.patch(`/menu/${menuId}/add-dish`, { dishId })
      setMenu(response.data)
      toast.success("Dish added to menu")
      setIsAddDishOpen(false)
    } catch (error) {
      toast.error("Failed to add dish")
    }
  }

  const removeDishFromMenu = async (dishId: string) => {
    if (!menu) return

    try {
      const response = await api.patch(`/menu/${menuId}/remove-dish`, { dishId })
      setMenu(response.data)
      toast.success("Dish removed from menu")
    } catch (error) {
      toast.error("Failed to remove dish")
    }
  }

  const deleteMenu = async () => {
    try {
      await api.delete(`/menu/${menuId}`)
      toast.success("Menu deleted successfully")
      router.push("/admin/menu")
    } catch (error) {
      toast.error("Failed to delete menu")
    }
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

  if (!menu) return null

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/admin/menu">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft size={20} />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-textdark">Edit Menu</h1>
            <p className="text-black mt-1">
              {format(parseISO(menu.date), "EEEE, MMMM d, yyyy")} • {menu.mealType}
            </p>
          </div>
        </div>
        
        <Button 
          variant="destructive" 
          onClick={() => setIsDeleteDialogOpen(true)}
          className="rounded-full"
        >
          <Trash2 size={16} className="mr-2" />
          Delete Menu
        </Button>
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Menu Details */}
        <div className="lg:col-span-2">
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle>Menu Dishes</CardTitle>
            </CardHeader>
            <CardContent>
              {menu.dishes.length > 0 ? (
                <div className="space-y-3">
                  {menu.dishes.map((dish) => (
                    <div
                      key={dish._id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100">
                          {dish.image ? (
                            <Image
                              src={dish.image}
                              alt={dish.name}
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
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{dish.name}</p>
                            <Badge className={dish.type === "veg" ? "bg-success" : "bg-error"}>
                              {dish.type}
                            </Badge>
                          </div>
                          <p className="text-sm text-black">₹{dish.price}</p>
                        </div>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="opacity-0 group-hover:opacity-100 rounded-full"
                        onClick={() => removeDishFromMenu(dish._id)}
                      >
                        <Trash2 size={16} className="text-error" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Utensils size={48} className="mx-auto text-black mb-4" />
                  <p className="text-black mb-2">No dishes in this menu</p>
                  <p className="text-sm text-black">Add dishes to create your menu</p>
                </div>
              )}

              {/* Add Dish Button */}
              <Dialog open={isAddDishOpen} onOpenChange={setIsAddDishOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full mt-4 rounded-full" variant="outline">
                    <Plus size={16} className="mr-2" />
                    Add Dish to Menu
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Add Dish to Menu</DialogTitle>
                    <DialogDescription>
                      Select a dish to add to this menu
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="max-h-96 overflow-y-auto space-y-2">
                    {allDishes
                      .filter(dish => !menu.dishes.some(d => d._id === dish._id))
                      .map((dish) => (
                        <div
                          key={dish._id}
                          className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer border"
                          onClick={() => addDishToMenu(dish._id)}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100">
                              {dish.image ? (
                                <Image
                                  src={dish.image}
                                  alt={dish.name}
                                  width={48}
                                  height={48}
                                  className="object-cover w-full h-full"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Utensils size={20} className="text-black" />
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="font-medium">{dish.name}</p>
                              <p className="text-sm text-black">₹{dish.price}</p>
                            </div>
                          </div>
                          <Badge className={dish.type === "veg" ? "bg-success" : "bg-error"}>
                            {dish.type}
                          </Badge>
                        </div>
                      ))}
                      
                    {allDishes.filter(dish => !menu.dishes.some(d => d._id === dish._id)).length === 0 && (
                      <div className="text-center py-8">
                        <p className="text-black mb-2">All dishes are already in this menu</p>
                        <Link href="/admin/dishes/new">
                          <Button variant="link" className="text-primary">
                            Create a new dish
                          </Button>
                        </Link>
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Menu Info */}
        <div className="lg:col-span-1">
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle>Menu Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Date</Label>
                <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                  {format(parseISO(menu.date), "EEEE, MMMM d, yyyy")}
                </div>
              </div>
              
              <div>
                <Label>Meal Type</Label>
                <div className="mt-1 p-3 bg-gray-50 rounded-lg capitalize">
                  {menu.mealType}
                </div>
              </div>
              
              <div>
                <Label>Total Dishes</Label>
                <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                  {menu.dishes.length} dishes
                </div>
              </div>
              
              <div>
                <Label>Created At</Label>
                <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                  {format(parseISO(menu.createdAt), "MMM d, yyyy hh:mm a")}
                </div>
              </div>
              
              <div>
                <Label>Last Updated</Label>
                <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                  {format(parseISO(menu.updatedAt), "MMM d, yyyy hh:mm a")}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this menu
              and remove all dish associations.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteMenu} className="bg-error hover:bg-error/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}