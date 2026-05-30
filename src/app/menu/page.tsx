"use client"

import { useEffect, useState } from "react"
import { 
  Search, 
  Clock, 
  Leaf, 
  Flame, 
  Star,
  ShoppingCart,
  ChevronLeft,
  ChevronRight,
  Utensils,
  X,
  Plus,
  Minus,
  Trash2
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { format, addDays, isToday, isTomorrow } from "date-fns"
import api from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { useAppSelector, useAppDispatch } from "@/store/hooks"
import { 
  addToCart,
  removeFromCart,
  updateCartItemQuantity,
  clearCart,
} from "@/store/slices/userSlice"
import { useRouter } from "next/navigation"

interface Dish {
  _id: string
  name: string
  image: string
  price: number
  type: "veg" | "nonveg"
  description?: string
  spicyLevel?: "mild" | "medium" | "hot"
  preparationTime?: number
  rating?: number
  totalOrders?: number
}

interface MenuItem {
  _id: string
  mealType: "breakfast" | "lunch" | "dinner"
  dishes: Dish[]
}

export default function UserMenuPage() {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const user = useAppSelector((state) => state.user.user)
  
  // SAFE SELECTORS - Provide default values to prevent undefined errors
  const cartState = useAppSelector((state) => state.user.cart)
  const cartItems = cartState?.items || []
  const cartTotal = cartState?.totalAmount || 0
  const cartItemCount = cartState?.totalItems || 0
  
  const [loading, setLoading] = useState(true)
  const [menus, setMenus] = useState<MenuItem[]>([])
  const [allDishes, setAllDishes] = useState<Dish[]>([])
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedType, setSelectedType] = useState<string>("all")
  const [selectedMealType, setSelectedMealType] = useState<string>("all")
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [selectedDish, setSelectedDish] = useState<Dish | null>(null)
  const [isDishDialogOpen, setIsDishDialogOpen] = useState(false)

  useEffect(() => {
    fetchData()
  }, [selectedDate])

  const fetchData = async () => {
    try {
      const [menusRes, dishesRes] = await Promise.all([
        api.get(`/menu?date=${format(selectedDate, "yyyy-MM-dd")}`),
        api.get("/dishes")
      ])
      setMenus(menusRes.data)
      setAllDishes(dishesRes.data)
    } catch (error) {
      toast.error("Failed to load menu")
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = (dish: Dish, mealType: string) => {
    if (!user) {
      toast.error("Please login to add items to cart", {
        action: {
          label: "Login",
          onClick: () => router.push("/auth/login")
        }
      })
      return
    }

    const dateStr = format(selectedDate, "yyyy-MM-dd")

    // Check if item already exists in cart
    const existingItem = cartItems.find(
      item => item?.dishId === dish._id && 
      item?.mealType === mealType && 
      item?.date === dateStr
    )

    if (existingItem) {
      // Update quantity if exists
      dispatch(updateCartItemQuantity({
        dishId: dish._id,
        mealType,
        date: dateStr,
        quantity: (existingItem.quantity || 1) + 1
      }))
      toast.success(`Added another ${dish.name} to cart`)
    } else {
      // Add new item
      dispatch(addToCart({
        dishId: dish._id,
        name: dish.name,
        image: dish.image,
        price: dish.price,
        quantity: 1,
        mealType: mealType as "breakfast" | "lunch" | "dinner",
        type: dish.type,
        date: dateStr
      }))
      toast.success(`${dish.name} added to cart`)
    }
  }

  const handleRemoveFromCart = (dishId: string, mealType: string, date: string) => {
    dispatch(removeFromCart({ dishId, mealType, date }))
    toast.success("Item removed from cart")
  }

  const handleUpdateQuantity = (dishId: string, mealType: string, date: string, newQuantity: number) => {
    if (newQuantity < 1) {
      handleRemoveFromCart(dishId, mealType, date)
      return
    }

    dispatch(updateCartItemQuantity({ dishId, mealType, date, quantity: newQuantity }))
  }

  const handleClearCart = () => {
    dispatch(clearCart())
    toast.success("Cart cleared")
  }

  const getDateLabel = (date: Date) => {
    if (isToday(date)) return "Today"
    if (isTomorrow(date)) return "Tomorrow"
    return format(date, "EEEE, MMM d")
  }

  const filteredDishes = () => {
    let dishes: Dish[] = []
    
    if (selectedMealType === "all") {
      menus.forEach(menu => {
        dishes = [...dishes, ...menu.dishes]
      })
    } else {
      const menu = menus.find(m => m.mealType === selectedMealType)
      if (menu) {
        dishes = menu.dishes
      }
    }

    // Remove duplicates
    dishes = Array.from(new Map(dishes.map(dish => [dish._id, dish])).values())

    // Apply filters
    return dishes.filter(dish => {
      const matchesSearch = dish.name.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesType = selectedType === "all" || dish.type === selectedType
      return matchesSearch && matchesType
    })
  }

  const getSpicyIcon = (level?: string) => {
    switch(level) {
      case "mild": return <Leaf size={16} className="text-success" />
      case "medium": return <Flame size={16} className="text-warning" />
      case "hot": return <Flame size={16} className="text-error" />
      default: return null
    }
  }

  const getDishById = (dishId: string) => {
    return allDishes.find(d => d._id === dishId) || null
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-soft flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-soft pt-20">
      {/* Header */}
      <div className="bg-white border-b sticky top-20 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-textdark">
                Today's Menu
              </h1>
              <p className="text-black mt-1">
                Fresh homemade meals prepared just for you
              </p>
            </div>

            {/* Date Navigation */}
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                disabled={isToday(selectedDate)}
                onClick={() => setSelectedDate(new Date(selectedDate.setDate(selectedDate.getDate() - 1)))}
                className="rounded-full"
              >
                <ChevronLeft size={18} />
              </Button>
              <div className="bg-soft px-4 py-2 rounded-full">
                <span className="font-medium">{getDateLabel(selectedDate)}</span>
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setSelectedDate(new Date(selectedDate.setDate(selectedDate.getDate() + 1)))}
                className="rounded-full"
              >
                <ChevronRight size={18} />
              </Button>
            </div>

            {/* Cart Button */}
            <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
              <SheetTrigger asChild>
                <Button className="bg-primary hover:bg-accent rounded-full relative">
                  <ShoppingCart size={18} className="mr-2" />
                  Cart
                  {cartItemCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-error text-white text-xs w-5 h-5 rounded-full flex items-center justify-center animate-pulse">
                      {cartItemCount}
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent className="w-full sm:max-w-lg">
                <SheetHeader>
                  <SheetTitle className="flex items-center text-black justify-between">
                    <span>Your Cart ({cartItemCount} items)</span>
                    {cartItemCount > 0 && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={handleClearCart}
                        className="text-error hover:text-error"
                      >
                        <Trash2 size={16} className="mr-1" />
                        Clear
                      </Button>
                    )}
                  </SheetTitle>
                </SheetHeader>

                <div className="mt-6 flex-1 overflow-y-auto max-h-[calc(100vh-200px)]">
                  {cartItems.length > 0 ? (
                    <div className="space-y-4">
                      {cartItems.map((item, index) => {
                        const dish = getDishById(item.dishId)
                        if (!dish) return null
                        
                        return (
                          <div key={`${item.dishId}-${item.mealType}-${item.date}-${index}`} className="flex items-start gap-3 p-3 border rounded-lg">
                            <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                              {item.image ? (
                                <Image
                                  src={item.image}
                                  alt={item.name}
                                  width={64}
                                  height={64}
                                  className="object-cover w-full h-full"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Utensils size={20} className="text-black" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="font-medium">{item.name}</p>
                                <Badge className={item.type === "veg" ? "bg-success" : "bg-error"} >
                                  {item.type === "veg" ? "Veg" : "Non-veg"}
                                </Badge>
                              </div>
                              <p className="text-sm text-black">₹{item.price} × {item.quantity}</p>
                              <p className="text-xs text-black capitalize">{item.mealType} • {item.date}</p>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                size="icon"
                                variant="outline"
                                className="h-8 w-8 rounded-full"
                                onClick={() => handleUpdateQuantity(item.dishId, item.mealType, item.date, item.quantity - 1)}
                              >
                                <Minus size={12} />
                              </Button>
                              <span className="w-8 text-center">{item.quantity}</span>
                              <Button
                                size="icon"
                                variant="outline"
                                className="h-8 w-8 rounded-full"
                                onClick={() => handleUpdateQuantity(item.dishId, item.mealType, item.date, item.quantity + 1)}
                              >
                                <Plus size={12} />
                              </Button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <ShoppingCart size={48} className="mx-auto text-black mb-2" />
                      <p className="text-black">Your cart is empty</p>
                      <p className="text-sm text-black mt-2">Add items from the menu to get started</p>
                    </div>
                  )}
                </div>
                
                {cartItems.length > 0 && (
                  <SheetFooter className="border-t pt-4 mt-4">
                    <div className="w-full space-y-3">
                      <div className="flex justify-between items-center mb-4">
                        <span className="font-semibold">Total:</span>
                        <span className="text-2xl font-bold text-primary">₹{cartTotal}</span>
                      </div>
                      <Button 
                        className="w-full bg-primary hover:bg-accent rounded-full h-12"
                        onClick={() => {
                          setIsCartOpen(false)
                          router.push("/checkout")
                        }}
                      >
                        Proceed to Checkout
                      </Button>
                      <SheetClose asChild>
                        <Button variant="outline" className="w-full rounded-full">
                          Continue Shopping
                        </Button>
                      </SheetClose>
                    </div>
                  </SheetFooter>
                )}
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      {/* Rest of the component remains the same... */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-md p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black" size={18} />
              <Input
                placeholder="Search dishes..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Meal Type Filter */}
            <Select value={selectedMealType} onValueChange={setSelectedMealType}>
              <SelectTrigger>
                <SelectValue placeholder="Meal Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Meals</SelectItem>
                <SelectItem value="breakfast">Breakfast</SelectItem>
                <SelectItem value="lunch">Lunch</SelectItem>
                <SelectItem value="dinner">Dinner</SelectItem>
              </SelectContent>
            </Select>

            {/* Food Type Filter */}
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger>
                <SelectValue placeholder="Food Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="veg">Veg Only</SelectItem>
                <SelectItem value="nonveg">Non-veg Only</SelectItem>
              </SelectContent>
            </Select>

            {/* Reset Filters */}
            <Button 
              variant="outline" 
              onClick={() => {
                setSearchQuery("")
                setSelectedMealType("all")
                setSelectedType("all")
              }}
              className="rounded-full"
            >
              Reset Filters
            </Button>
          </div>
        </div>

        {/* Meal Type Tabs */}
        {selectedMealType === "all" ? (
          <Tabs defaultValue="breakfast" className="mb-8">
            <TabsList className="grid w-full grid-cols-3 max-w-md mx-auto">
              <TabsTrigger value="breakfast">Breakfast</TabsTrigger>
              <TabsTrigger value="lunch">Lunch</TabsTrigger>
              <TabsTrigger value="dinner">Dinner</TabsTrigger>
            </TabsList>

            {["breakfast", "lunch", "dinner"].map((mealType) => (
              <TabsContent key={mealType} value={mealType}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {menus
                    .find(m => m.mealType === mealType)
                    ?.dishes
                    .filter(dish => {
                      const matchesSearch = dish.name.toLowerCase().includes(searchQuery.toLowerCase())
                      const matchesType = selectedType === "all" || dish.type === selectedType
                      return matchesSearch && matchesType
                    })
                    .map((dish) => (
                      <DishCard
                        key={dish._id}
                        dish={dish}
                        mealType={mealType}
                        onAddToCart={() => handleAddToCart(dish, mealType)}
                        onViewDetails={() => {
                          setSelectedDish(dish)
                          setIsDishDialogOpen(true)
                        }}
                      />
                    ))
                  }
                </div>
                {menus.find(m => m.mealType === mealType)?.dishes.length === 0 && (
                  <div className="text-center py-12">
                    <Utensils size={48} className="mx-auto text-black mb-2" />
                    <p className="text-black">No dishes available for {mealType}</p>
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDishes().map((dish) => (
              <DishCard
                key={dish._id}
                dish={dish}
                mealType={selectedMealType}
                onAddToCart={() => handleAddToCart(dish, selectedMealType)}
                onViewDetails={() => {
                  setSelectedDish(dish)
                  setIsDishDialogOpen(true)
                }}
              />
            ))}
          </div>
        )}

        {filteredDishes().length === 0 && (
          <div className="text-center py-12">
            <Search size={48} className="mx-auto text-black mb-2" />
            <h3 className="text-lg font-medium mb-2">No dishes found</h3>
            <p className="text-black">Try adjusting your filters</p>
          </div>
        )}
      </div>

      {/* Dish Details Dialog */}
      <Dialog open={isDishDialogOpen} onOpenChange={setIsDishDialogOpen}>
        <DialogContent className="max-w-2xl">
          {selectedDish && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedDish.name}</DialogTitle>
                <DialogDescription>
                  Detailed information about this dish
                </DialogDescription>
              </DialogHeader>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="rounded-2xl overflow-hidden bg-gray-100 h-64">
                  {selectedDish.image ? (
                    <Image
                      src={selectedDish.image}
                      alt={selectedDish.name}
                      width={400}
                      height={400}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Utensils size={48} className="text-black" />
                    </div>
                  )}
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge className={selectedDish.type === "veg" ? "bg-success" : "bg-error"}>
                      {selectedDish.type === "veg" ? "🟢 Pure Vegetarian" : "🔴 Non-vegetarian"}
                    </Badge>
                    {selectedDish.spicyLevel && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        {getSpicyIcon(selectedDish.spicyLevel)}
                        {selectedDish.spicyLevel.charAt(0).toUpperCase() + selectedDish.spicyLevel.slice(1)}
                      </Badge>
                    )}
                  </div>

                  <div>
                    <p className="text-3xl font-bold text-primary">₹{selectedDish.price}</p>
                  </div>

                  {selectedDish.description && (
                    <div>
                      <h4 className="font-medium mb-1">Description</h4>
                      <p className="text-black">{selectedDish.description}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    {selectedDish.preparationTime && (
                      <div className="flex items-center gap-2">
                        <Clock size={18} className="text-black" />
                        <div>
                          <p className="text-sm text-black">Prep Time</p>
                          <p className="font-medium">{selectedDish.preparationTime} mins</p>
                        </div>
                      </div>
                    )}
                    {selectedDish.rating && (
                      <div className="flex items-center gap-2">
                        <Star size={18} className="text-warning fill-warning" />
                        <div>
                          <p className="text-sm text-black">Rating</p>
                          <p className="font-medium">{selectedDish.rating} ★</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <Button 
                    className="w-full bg-primary hover:bg-accent rounded-full h-12 mt-4"
                    onClick={() => {
                      handleAddToCart(selectedDish, selectedMealType)
                      setIsDishDialogOpen(false)
                    }}
                  >
                    <ShoppingCart size={18} className="mr-2" />
                    Add to Cart
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Dish Card Component
function DishCard({ dish, mealType, onAddToCart, onViewDetails }: { 
  dish: Dish, 
  mealType: string,
  onAddToCart: () => void,
  onViewDetails: () => void
}) {
  return (
    <Card className="rounded-2xl overflow-hidden hover:shadow-xl transition-all group cursor-pointer" onClick={onViewDetails}>
      <div className="relative h-48 bg-gray-100">
        {dish.image ? (
          <Image
            src={dish.image}
            alt={dish.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Utensils size={48} className="text-black" />
          </div>
        )}
        <Badge 
          className={`absolute top-3 left-3 ${dish.type === "veg" ? "bg-success" : "bg-error"}`}
        >
          {dish.type === "veg" ? "Veg" : "Non-veg"}
        </Badge>
        {dish.spicyLevel === "hot" && (
          <Badge className="absolute top-3 right-3 bg-error">
            <Flame size={12} className="mr-1" /> Hot
          </Badge>
        )}
      </div>
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="font-semibold text-lg">{dish.name}</h3>
            <p className="text-sm text-black capitalize">{mealType}</p>
          </div>
          <p className="text-xl font-bold text-primary">₹{dish.price}</p>
        </div>
        
        <div className="flex items-center gap-2 mb-3">
          {dish.rating && (
            <div className="flex items-center gap-1 text-sm">
              <Star size={14} className="text-warning fill-warning" />
              <span>{dish.rating}</span>
            </div>
          )}
          {dish.totalOrders && (
            <span className="text-xs text-black">{dish.totalOrders}+ orders</span>
          )}
        </div>

        <Button 
          className="w-full bg-primary hover:bg-accent rounded-full"
          onClick={(e) => {
            e.stopPropagation()
            onAddToCart()
          }}
        >
          Add to Cart
        </Button>
      </CardContent>
    </Card>
  )
}