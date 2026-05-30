import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { 
  addToCart,
  removeFromCart,
  updateCartItemQuantity,
  clearCart,
  setCartDeliveryInfo,
} from "@/store/slices/userSlice"
import { toast } from "sonner"
import { CartItem } from "@/store/slices/userSlice"

export const useCart = () => {
  const dispatch = useAppDispatch()
  
  // SAFE SELECTORS with default values
  const cartState = useAppSelector((state) => state.user.cart)
  const items = cartState?.items || []
  const total = cartState?.totalAmount || 0
  const itemCount = cartState?.totalItems || 0

  const addItem = (item: CartItem) => {
    dispatch(addToCart(item))
    toast.success(`${item.name} added to cart`)
  }

  const removeItem = (dishId: string, mealType: string, date: string) => {
    dispatch(removeFromCart({ dishId, mealType, date }))
    toast.success("Item removed from cart")
  }

  const updateQuantity = (dishId: string, mealType: string, date: string, quantity: number) => {
    dispatch(updateCartItemQuantity({ dishId, mealType, date, quantity }))
  }

  const clearAll = () => {
    dispatch(clearCart())
    toast.success("Cart cleared")
  }

  const setDeliveryInfo = (deliveryDate?: string, deliveryAddress?: any) => {
    dispatch(setCartDeliveryInfo({ deliveryDate, deliveryAddress }))
  }

  return {
    items,
    total,
    itemCount,
    addItem,
    removeItem,
    updateQuantity,
    clearAll,
    setDeliveryInfo
  }
}