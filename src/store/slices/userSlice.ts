import { createSlice, PayloadAction } from "@reduxjs/toolkit"

// Address Interface
interface Address {
  type: "home" | "office" | "other"  // Added "other"
  houseNumber: string
  area: string
  pincode: string
  coordinates: {
    lat: number
    lng: number
  }
  isDefault?: boolean  // Optional default flag
}

// Plan Interface
interface Plan {
  _id: string
  name: string
  durationDays: number
  price: number
  pricePerDay: number
}

// Subscription Interface
export interface Subscription {
  _id: string
  userId: string | {
    _id: string
    email: string
    username?: string
  }
  planId: Plan
  meals: Array<"breakfast" | "lunch" | "dinner">
  foodType: "veg" | "nonveg"
  includeWeekends: boolean
  startDate: string
  endDate: string
  status: "active" | "cancelled" | "expired"
  createdAt: string
  updatedAt: string
}

// User Interface
export interface User {
  _id: string
  email: string
  isVerified: boolean
  username: string
  referralCode: string
  fullName: string
  mobile: string
  role: "user" | "admin"
  addresses: Address[]
  createdAt?: string
  updatedAt?: string
}

// Cart Item Interface
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

// Cart Interface
export interface Cart {
  items: CartItem[]
  totalAmount: number
  totalItems: number
  deliveryDate?: string
  deliveryAddress?: Address
}

// User State Interface
interface UserState {
  user: User | null
  subscriptions: Subscription[]
  activeSubscription: Subscription | null
  cart: Cart
  isLoading: boolean
  isCartLoading: boolean
  isSubscriptionsLoading: boolean
  isAuthLoaded: boolean
}

// Initial Cart State
const initialCart: Cart = {
  items: [],
  totalAmount: 0,
  totalItems: 0
}

// Initial State
const initialState: UserState = {
  user: null,
  subscriptions: [],
  activeSubscription: null,
  cart: initialCart,
  isLoading: false,
  isCartLoading: false,
  isSubscriptionsLoading: false,
  isAuthLoaded: false
}

// Helper function to calculate cart totals
const calculateCartTotals = (items: CartItem[]): { totalAmount: number; totalItems: number } => {
  const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
  return { totalAmount, totalItems }
}

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    // User actions
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload
    },

    setAuthLoaded: (state, action: PayloadAction<boolean>) => {
      state.isAuthLoaded = action.payload
    },

    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload }
      }
    },

    clearUser: (state) => {
      state.user = null
      state.subscriptions = []
      state.activeSubscription = null
      state.cart = initialCart
      // Clear cart from localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('cart')
        localStorage.removeItem('activeSubscription')
      }
    },

    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload
    },

    // Subscription actions
    setSubscriptions: (state, action: PayloadAction<Subscription[]>) => {
      state.subscriptions = action.payload

      // Find active subscription
      const active = action.payload.find(sub => sub.status === "active")
      state.activeSubscription = active || null

      // Save active subscription to localStorage
      if (typeof window !== 'undefined' && active) {
        localStorage.setItem('activeSubscription', JSON.stringify(active))
      }
    },

    addSubscription: (state, action: PayloadAction<Subscription>) => {
      state.subscriptions.push(action.payload)
      if (action.payload.status === "active") {
        state.activeSubscription = action.payload
        if (typeof window !== 'undefined') {
          localStorage.setItem('activeSubscription', JSON.stringify(action.payload))
        }
      }
    },

    updateSubscription: (state, action: PayloadAction<{ id: string; updates: Partial<Subscription> }>) => {
      const index = state.subscriptions.findIndex(sub => sub._id === action.payload.id)
      if (index !== -1) {
        state.subscriptions[index] = { ...state.subscriptions[index], ...action.payload.updates }

        // Update active subscription if needed
        if (state.activeSubscription?._id === action.payload.id) {
          state.activeSubscription = { ...state.activeSubscription, ...action.payload.updates }
          if (typeof window !== 'undefined') {
            localStorage.setItem('activeSubscription', JSON.stringify(state.activeSubscription))
          }
        }
      }
    },

    cancelSubscription: (state, action: PayloadAction<string>) => {
      const index = state.subscriptions.findIndex(sub => sub._id === action.payload)
      if (index !== -1) {
        state.subscriptions[index].status = "cancelled"

        // Clear active subscription if this was the active one
        if (state.activeSubscription?._id === action.payload) {
          state.activeSubscription = null
          if (typeof window !== 'undefined') {
            localStorage.removeItem('activeSubscription')
          }
        }
      }
    },

    setSubscriptionsLoading: (state, action: PayloadAction<boolean>) => {
      state.isSubscriptionsLoading = action.payload
    },

    // Cart actions
    setCart: (state, action: PayloadAction<Cart>) => {
      state.cart = action.payload
      if (typeof window !== 'undefined') {
        localStorage.setItem('cart', JSON.stringify(action.payload))
      }
    },

    addToCart: (state, action: PayloadAction<CartItem>) => {
      const existingItemIndex = state.cart.items.findIndex(
        item => item.dishId === action.payload.dishId &&
          item.mealType === action.payload.mealType &&
          item.date === action.payload.date
      )

      if (existingItemIndex !== -1) {
        // Update existing item
        state.cart.items[existingItemIndex].quantity += action.payload.quantity
        if (action.payload.specialInstructions) {
          state.cart.items[existingItemIndex].specialInstructions = action.payload.specialInstructions
        }
      } else {
        // Add new item
        state.cart.items.push(action.payload)
      }

      // Recalculate totals
      const totals = calculateCartTotals(state.cart.items)
      state.cart.totalAmount = totals.totalAmount
      state.cart.totalItems = totals.totalItems

      // Save to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('cart', JSON.stringify(state.cart))
      }
    },

    updateCartItem: (state, action: PayloadAction<{
      dishId: string
      mealType: string
      date: string
      updates: Partial<CartItem>
    }>) => {
      const itemIndex = state.cart.items.findIndex(
        item => item.dishId === action.payload.dishId &&
          item.mealType === action.payload.mealType &&
          item.date === action.payload.date
      )

      if (itemIndex !== -1) {
        state.cart.items[itemIndex] = {
          ...state.cart.items[itemIndex],
          ...action.payload.updates
        }

        // Recalculate totals
        const totals = calculateCartTotals(state.cart.items)
        state.cart.totalAmount = totals.totalAmount
        state.cart.totalItems = totals.totalItems

        // Save to localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('cart', JSON.stringify(state.cart))
        }
      }
    },

    removeFromCart: (state, action: PayloadAction<{
      dishId: string
      mealType: string
      date: string
    }>) => {
      state.cart.items = state.cart.items.filter(
        item => !(item.dishId === action.payload.dishId &&
          item.mealType === action.payload.mealType &&
          item.date === action.payload.date)
      )

      // Recalculate totals
      const totals = calculateCartTotals(state.cart.items)
      state.cart.totalAmount = totals.totalAmount
      state.cart.totalItems = totals.totalItems

      // Save to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('cart', JSON.stringify(state.cart))
      }
    },

    updateCartItemQuantity: (state, action: PayloadAction<{
      dishId: string
      mealType: string
      date: string
      quantity: number
    }>) => {
      const itemIndex = state.cart.items.findIndex(
        item => item.dishId === action.payload.dishId &&
          item.mealType === action.payload.mealType &&
          item.date === action.payload.date
      )

      if (itemIndex !== -1) {
        if (action.payload.quantity <= 0) {
          // Remove item if quantity is 0 or negative
          state.cart.items.splice(itemIndex, 1)
        } else {
          // Update quantity
          state.cart.items[itemIndex].quantity = action.payload.quantity
        }

        // Recalculate totals
        const totals = calculateCartTotals(state.cart.items)
        state.cart.totalAmount = totals.totalAmount
        state.cart.totalItems = totals.totalItems

        // Save to localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('cart', JSON.stringify(state.cart))
        }
      }
    },

    clearCart: (state) => {
      state.cart = initialCart
      if (typeof window !== 'undefined') {
        localStorage.removeItem('cart')
      }
    },

    setCartDeliveryInfo: (state, action: PayloadAction<{
      deliveryDate?: string
      deliveryAddress?: Address
    }>) => {
      if (action.payload.deliveryDate !== undefined) {
        state.cart.deliveryDate = action.payload.deliveryDate
      }
      if (action.payload.deliveryAddress !== undefined) {
        state.cart.deliveryAddress = action.payload.deliveryAddress
      }

      // Save to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('cart', JSON.stringify(state.cart))
      }
    },

    setCartLoading: (state, action: PayloadAction<boolean>) => {
      state.isCartLoading = action.payload
    },

    // Load cart from localStorage (called on app init)
    loadCartFromStorage: (state) => {
      if (typeof window !== 'undefined') {
        const savedCart = localStorage.getItem('cart')
        if (savedCart) {
          try {
            const parsedCart = JSON.parse(savedCart)
            state.cart = parsedCart
          } catch (error) {
            console.error('Failed to parse cart from localStorage', error)
          }
        }

        const savedSubscription = localStorage.getItem('activeSubscription')
        if (savedSubscription) {
          try {
            state.activeSubscription = JSON.parse(savedSubscription)
          } catch (error) {
            console.error('Failed to parse subscription from localStorage', error)
          }
        }
      }
    }
  }
})

// Export actions
export const {
  // User actions
  setUser,
  setAuthLoaded,
  updateUser,
  clearUser,
  setLoading,

  // Subscription actions
  setSubscriptions,
  addSubscription,
  updateSubscription,
  cancelSubscription,
  setSubscriptionsLoading,

  // Cart actions
  setCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  updateCartItemQuantity,
  clearCart,
  setCartDeliveryInfo,
  setCartLoading,
  loadCartFromStorage
} = userSlice.actions

// Selectors
export const selectUser = (state: { user: UserState }) => state.user.user
export const selectIsAuthLoaded = (state: { user: UserState }) => state.user.isAuthLoaded
export const selectSubscriptions = (state: { user: UserState }) => state.user.subscriptions
export const selectActiveSubscription = (state: { user: UserState }) => state.user.activeSubscription
export const selectCart = (state: { user: UserState }) => state.user.cart
export const selectCartItems = (state: { user: UserState }) => state.user.cart.items
export const selectCartTotal = (state: { user: UserState }) => state.user.cart.totalAmount
export const selectCartItemCount = (state: { user: UserState }) => state.user.cart.totalItems
export const selectIsLoading = (state: { user: UserState }) => state.user.isLoading
export const selectIsCartLoading = (state: { user: UserState }) => state.user.isCartLoading
export const selectIsSubscriptionsLoading = (state: { user: UserState }) => state.user.isSubscriptionsLoading

export default userSlice.reducer