export interface Dish {
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
  isAvailable?: boolean
}

export interface Menu {
  _id: string
  date: string
  mealType: "breakfast" | "lunch" | "dinner"
  dishes: Dish[]
}

export interface Plan {
  _id: string
  name: string
  durationDays: number
  price: number
  pricePerDay: number
  meals?: Array<"breakfast" | "lunch" | "dinner">
  foodType?: "veg" | "nonveg"
  includeWeekends?: boolean
}

export interface SubscriptionPlan extends Plan {
  description?: string
  features?: string[]
  isPopular?: boolean
  savings?: string
}

export interface CartItem {
  dishId: string
  name: string
  image?: string
  price: number
  quantity: number
  mealType: "breakfast" | "lunch" | "dinner"
  type: "veg" | "nonveg"
  date: string
  specialInstructions?: string
}

export interface DateOption {
  label: string
  value: string
  dayOfWeek: string
  isAvailable: boolean
}