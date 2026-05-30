"use client"

import { useEffect, useState } from "react"
import {
  Plus,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Edit,
  Trash2,
  Utensils,
  Clock,
  Sun,
  Moon,
  Coffee
} from "lucide-react"
import { format, addDays, subDays, isToday, parseISO } from "date-fns"
import Link from "next/link"
import Image from "next/image"
import api from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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

const mealTypeIcons = {
  breakfast: <Coffee size={18} />,
  lunch: <Sun size={18} />,
  dinner: <Moon size={18} />
}

const mealTypeColors = {
  breakfast: "bg-orange-100 text-orange-800",
  lunch: "bg-yellow-100 text-yellow-800",
  dinner: "bg-indigo-100 text-indigo-800"
}

export default function MenuPage() {
  const [menus, setMenus] = useState<Menu[]>([])
  const [allDishes, setAllDishes] = useState<Dish[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [selectedMenu, setSelectedMenu] = useState<Menu | null>(null)
  const [isAddDishDialogOpen, setIsAddDishDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [menuToDelete, setMenuToDelete] = useState<string | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [selectedMealType, setSelectedMealType] = useState<string>("lunch")

  useEffect(() => {
    fetchData()
  }, [selectedDate])

  const fetchData = async () => {
    try {
      setLoading(true)
      const formattedDate = format(selectedDate, "yyyy-MM-dd")
      const [menusRes, dishesRes] = await Promise.all([
        api.get(`/menu?date=${formattedDate}`),
        api.get("/dishes")
      ])
      setMenus(menusRes.data)
      setAllDishes(dishesRes.data)
    } catch (error) {
      toast.error("Failed to fetch menu data")
    } finally {
      setLoading(false)
    }
  }

  const createMenu = async () => {
    try {
      const formattedDate = format(selectedDate, "yyyy-MM-dd")
      const response = await api.post("/menu", {
        date: formattedDate,
        mealType: selectedMealType,
        dishes: []
      })

      toast.success(`${selectedMealType} menu created successfully`)
      setIsCreateDialogOpen(false)
      fetchData()
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to create menu")
    }
  }

  const deleteMenu = async () => {
    if (!menuToDelete) return

    try {
      await api.delete(`/menu/${menuToDelete}`)
      toast.success("Menu deleted successfully")
      fetchData()
    } catch (error) {
      toast.error("Failed to delete menu")
    } finally {
      setIsDeleteDialogOpen(false)
      setMenuToDelete(null)
    }
  }

  const addDishToMenu = async (menuId: string, dishId: string) => {
    try {
      const response = await api.patch(`/menu/${menuId}/add-dish`, { dishId })
      toast.success("Dish added to menu")
      fetchData()
      setIsAddDishDialogOpen(false)
    } catch (error) {
      toast.error("Failed to add dish")
    }
  }

  const removeDishFromMenu = async (menuId: string, dishId: string) => {
    try {
      const response = await api.patch(`/menu/${menuId}/remove-dish`, { dishId })
      toast.success("Dish removed from menu")
      fetchData()
    } catch (error) {
      toast.error("Failed to remove dish")
    }
  }

  const getMenuForMealType = (mealType: string) => {
    return menus.find(menu => menu.mealType === mealType)
  }

  const formatDate = (dateString: string) => {
    return format(parseISO(dateString), "hh:mm a")
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex justify-between items-center mb-8">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-64" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-96 rounded-2xl" />
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
          <h1 className="text-3xl font-bold text-textdark">Menu Management</h1>
          <p className="text-black mt-1">Create and manage daily menus</p>
        </div>

        {/* Date Navigation */}
        <div className="flex items-center gap-3 bg-white rounded-full shadow-sm p-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSelectedDate(subDays(selectedDate, 1))}
            className="rounded-full"
          >
            <ChevronLeft size={18} />
          </Button>

          <div className="flex items-center gap-2 px-4">
            <Calendar size={18} className="text-primary" />
            <span className="font-medium">{format(selectedDate, "EEEE, MMM d, yyyy")}</span>
            {isToday(selectedDate) && (
              <Badge className="bg-primary">Today</Badge>
            )}
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSelectedDate(addDays(selectedDate, 1))}
            className="rounded-full"
          >
            <ChevronRight size={18} />
          </Button>
        </div>
      </div>

      {/* Meal Type Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {["breakfast", "lunch", "dinner"].map((mealType) => {
          const menu = getMenuForMealType(mealType)

          return (
            <Card key={mealType} className="rounded-2xl overflow-hidden border-2 hover:border-primary/20 transition-all">
              <CardHeader className={`${mealTypeColors[mealType as keyof typeof mealTypeColors]} border-b`}>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    {mealTypeIcons[mealType as keyof typeof mealTypeIcons]}
                    <CardTitle className="capitalize">{mealType}</CardTitle>
                  </div>
                  {menu ? (
                    <div className="flex items-center gap-2">
                      <Link href={`/admin/menu/${menu._id}`}>
                        <Button size="icon" variant="ghost" className="rounded-full">
                          <Edit size={16} />
                        </Button>
                      </Link>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="rounded-full text-error hover:text-error"
                        onClick={() => {
                          setMenuToDelete(menu._id)
                          setIsDeleteDialogOpen(true)
                        }}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedMealType(mealType)
                        setIsCreateDialogOpen(true)
                      }}
                      className="rounded-full"
                    >
                      <Plus size={14} className="mr-1" />
                      Create
                    </Button>
                  )}
                </div>
              </CardHeader>

              <CardContent className="p-4">
                {menu ? (
                  <div className="space-y-3">
                    {menu.dishes.length > 0 ? (
                      menu.dishes.map((dish) => (
                        <div
                          key={dish._id}
                          className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg group border"
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
                              <p className="font-medium text-sm">{dish.name}</p>
                              <p className="text-xs text-black">₹{dish.price}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={dish.type === "veg" ? "bg-success" : "bg-error"} >
                              {dish.type === "veg" ? "Veg" : "Non-veg"}
                            </Badge>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="opacity-0 group-hover:opacity-100 rounded-full"
                              onClick={() => removeDishFromMenu(menu._id, dish._id)}
                            >
                              <Trash2 size={14} className="text-error" />
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <Utensils size={32} className="mx-auto text-black mb-2" />
                        <p className="text-black text-sm">No dishes added</p>
                      </div>
                    )}

                    {/* Add Dish Button */}
                    <Dialog open={isAddDishDialogOpen && selectedMenu?._id === menu._id} onOpenChange={(open) => {
                      setIsAddDishDialogOpen(open)
                      if (!open) setSelectedMenu(null)
                    }}>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full mt-2 rounded-full"
                          onClick={() => setSelectedMenu(menu)}
                        >
                          <Plus size={16} className="mr-1" />
                          Add Dish
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Add Dish to {mealType}</DialogTitle>
                          <DialogDescription>
                            Select a dish to add to the menu
                          </DialogDescription>
                        </DialogHeader>

                        <div className="max-h-96 overflow-y-auto space-y-2">
                          {allDishes
                            .filter(dish => !menu.dishes.some(d => d._id === dish._id))
                            .map((dish) => (
                              <div
                                key={dish._id}
                                className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer border"
                                onClick={() => addDishToMenu(menu._id, dish._id)}
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
                              <p className="text-black">All dishes are already added to this menu</p>
                              <Link href="/admin/dishes/new">
                                <Button variant="link" className="text-primary mt-2">
                                  Create new dish
                                </Button>
                              </Link>
                            </div>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>

                    {/* Menu Info */}
                    <div className="text-xs text-black mt-4 pt-2 border-t">
                      <div className="flex items-center justify-between">
                        <span>Created: {formatDate(menu.createdAt)}</span>
                        <span>Updated: {formatDate(menu.updatedAt)}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Clock size={32} className="mx-auto text-black mb-2" />
                    <p className="text-black text-sm">No menu created yet</p>
                    <p className="text-xs text-black mt-1">Click Create to add a menu</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Create Menu Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Menu</DialogTitle>
            <DialogDescription>
              Create a new menu for {format(selectedDate, "EEEE, MMM d, yyyy")}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Meal Type</label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {["breakfast", "lunch", "dinner"].map((type) => (
                    <Button
                      key={type}
                      type="button"
                      variant={selectedMealType === type ? "default" : "outline"}
                      className={`capitalize ${selectedMealType === type ? 'bg-primary' : ''}`}
                      onClick={() => setSelectedMealType(type)}
                    >
                      {mealTypeIcons[type as keyof typeof mealTypeIcons]}
                      <span className="ml-2">{type}</span>
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Date</label>
                <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                  {format(selectedDate, "EEEE, MMMM d, yyyy")}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={createMenu} className="bg-primary hover:bg-accent">
              Create Menu
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
              This action cannot be undone. This will permanently delete the menu
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