"use client";
import { load } from "@cashfreepayments/cashfree-js";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  ShoppingCart,
  MapPin,
  Calendar,
  Clock,
  CreditCard,
  Utensils,
  Trash2,
  Plus,
  Minus,
  Loader2,
  CheckCircle,
  AlertCircle,
  Smartphone,
  Copy,
  Home,
  Briefcase,
  PlusCircle,
  Map,
  Banknote
} from "lucide-react";
import { format } from "date-fns";
import api from "@/lib/api";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import {
  selectCartItems,
  selectCartTotal,
  selectCartItemCount,
  clearCart,
  removeFromCart,
  updateCartItemQuantity,
  updateUser,
  setUser
} from "@/store/slices/userSlice";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import axios from "axios";

interface Address {
  type: "home" | "office" | "other"
  houseNumber: string
  area: string
  pincode: string
  coordinates: {
    lat: number
    lng: number
  }
  isDefault?: boolean
}

interface OrderItem {
  dishId: string
  quantity: number
}

export default function CheckoutPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.user.user);

  // Get cart data
  const cartItems = useAppSelector(selectCartItems);
  const cartTotal = useAppSelector(selectCartTotal);
  const cartItemCount = useAppSelector(selectCartItemCount);

  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [deliveryDate, setDeliveryDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [paymentMethod, setPaymentMethod] = useState<"upi">("upi");
  const [processing, setProcessing] = useState(false);

  // New address state
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState<Address>({
    type: "home",
    houseNumber: "",
    area: "",
    pincode: "",
    coordinates: { lat: 0, lng: 0 },
    isDefault: false
  });
  const [savingAddress, setSavingAddress] = useState(false);

  // Redirect if cart is empty
  useEffect(() => {
    if (cartItems.length === 0) {
      router.push("/menu");
    }
  }, [cartItems]);

  // Set default address - UPDATE when user changes
  useEffect(() => {
    if (user?.addresses && user.addresses.length > 0) {
      // Find default address or use first one
      const defaultAddr = user.addresses.find(addr => addr?.isDefault === true) || user.addresses[0];
      setSelectedAddress(defaultAddr);
    } else {
      setSelectedAddress(null);
    }
  }, [user]); // Re-run when user changes

  const handleUpdateQuantity = (dishId: string, mealType: string, date: string, quantity: number) => {
    if (quantity < 1) {
      dispatch(removeFromCart({ dishId, mealType, date }));
    } else {
      dispatch(updateCartItemQuantity({ dishId, mealType, date, quantity }));
    }
  };

  const handleRemoveItem = (dishId: string, mealType: string, date: string) => {
    dispatch(removeFromCart({ dishId, mealType, date }));
    toast.success("Item removed from cart");
  };

  const handleSaveNewAddress = async () => {
    // Validation
    if (!newAddress.houseNumber.trim()) {
      toast.error("Please enter house/flat number");
      return;
    }
    if (!newAddress.area.trim()) {
      toast.error("Please enter area/locality");
      return;
    }
    if (!newAddress.pincode.trim() || newAddress.pincode.length !== 6) {
      toast.error("Please enter a valid 6-digit pincode");
      return;
    }

    setSavingAddress(true);
    try {
      // Get existing addresses
      const existingAddresses = user?.addresses || [];

      // If this is default, remove default from others
      let updatedAddresses = [...existingAddresses];
      if (newAddress.isDefault) {
        updatedAddresses = updatedAddresses.map(addr => ({ ...addr, isDefault: false }));
      }

      // Add new address
      updatedAddresses.push({ ...newAddress });

      // Update user profile with new address
      const response = await api.put("/auth/update", { addresses: updatedAddresses });

      // IMPORTANT: Update Redux store with new user data
      if (response.data && response.data.user) {
        dispatch(setUser(response.data.user));
      } else {
        // If API returns updated user, update the user state
        const updatedUser = { ...user, addresses: updatedAddresses };
        dispatch(setUser(updatedUser as any));
      }

      // Reset form and close
      setShowNewAddressForm(false);
      resetNewAddressForm();

      toast.success("Address added successfully!");

    } catch (error: any) {
      console.error("Failed to save address:", error);
      toast.error(error.response?.data?.message || "Failed to save address");
    } finally {
      setSavingAddress(false);
    }
  };

  const resetNewAddressForm = () => {
    setNewAddress({
      type: "home",
      houseNumber: "",
      area: "",
      pincode: "",
      coordinates: { lat: 0, lng: 0 },
      isDefault: false
    });
  };

  const validateOrder = () => {
    if (!selectedAddress) {
      toast.error("Please select or add a delivery address");
      return false;
    }
    if (!deliveryDate) {
      toast.error("Please select a delivery date");
      return false;
    }
    return true;
  };

  const handlePlaceOrder = async () => {
    if (!validateOrder()) return;
    if (!user) {
      toast.error("Please login");
      router.push("/auth/login");
      return;
    }

    // if (paymentMethod === "cod") {
    //   return handleCODOrder();
    // }

    try {
      setProcessing(true);

      const cashfree = await load({
        mode: "production", // change to production later
      });

      const res = await api.post("/payments/create", {
        type: "order",
        orderData: {
          items: cartItems.map((item) => ({
            dishId: item.dishId,
            quantity: item.quantity,
          })),
          deliveryDate,
          deliveryAddress: selectedAddress,
        },
      });

      const { paymentSessionId } = res.data;

      await cashfree.checkout({
        paymentSessionId,
        redirectTarget: "_self",
      });

    } catch (err) {
      if (axios.isAxiosError(err)) {
        console.error("Payment API error:", err.response?.data || err.message);
        toast.error(err.response?.data?.message || "Payment failed");
      } else {
        console.error("Unexpected error:", err);
        toast.error("Payment failed");
      }
    } finally {
      setProcessing(false);
      clearCart();
    }
  };

  // const handleCODOrder = async () => {
  //   try {
  //     setProcessing(true);
  // 
  //     await api.post("/orders", {
  //       items: cartItems.map((item) => ({
  //         dishId: item.dishId,
  //         quantity: item.quantity,
  //       })),
  //       deliveryDate,
  //       deliveryAddress: selectedAddress,
  //     });
  // 
  //     dispatch(clearCart());
  //     toast.success("Order placed successfully! Pay on delivery.");
  //     router.push("/orders");
  // 
  //   } catch (err) {
  //     if (axios.isAxiosError(err)) {
  //       console.error("COD order error:", err.response?.data || err.message);
  //       toast.error(err.response?.data?.message || "Order failed. Please try again.");
  //     } else {
  //       console.error("Unexpected error:", err);
  //       toast.error("Order failed. Please try again.");
  //     }
  //   } finally {
  //     setProcessing(false);
  //   }
  // };

  // Helper function to get address icon
  const getAddressIcon = (type: string) => {
    switch (type) {
      case "home":
        return <Home size={16} className="text-primary" />;
      case "office":
        return <Briefcase size={16} className="text-primary" />;
      case "other":
        return <Map size={16} className="text-primary" />;
      default:
        return <MapPin size={16} className="text-primary" />;
    }
  };

  // Helper function to get address label
  const getAddressLabel = (type: string) => {
    switch (type) {
      case "home":
        return "Home";
      case "office":
        return "Office";
      case "other":
        return "Other";
      default:
        return type;
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen pt-24 pb-16 px-4 bg-soft flex items-center justify-center">
        <div className="text-center">
          <ShoppingCart size={64} className="mx-auto text-black mb-4" />
          <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
          <p className="text-black mb-4">Add items from the menu to get started</p>
          <Link href="/menu">
            <Button className="bg-primary hover:bg-accent rounded-full">
              Browse Menu
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 bg-soft">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/menu"
            className="inline-flex items-center gap-2 text-black hover:text-primary mb-4"
          >
            <ArrowLeft size={18} />
            Back to Menu
          </Link>
          <h1 className="text-4xl font-bold text-textdark mb-2">Checkout</h1>
          <p className="text-black">Complete your order ({cartItemCount} items)</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Checkout Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Delivery Address */}
            <Card className="rounded-2xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <MapPin size={18} className="text-primary" />
                    Delivery Address
                  </h2>
                  {!showNewAddressForm && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowNewAddressForm(true)}
                      className="rounded-full text-primary"
                    >
                      <PlusCircle size={16} className="mr-1" />
                      Add New Address
                    </Button>
                  )}
                </div>

                {/* New Address Form */}
                {showNewAddressForm && (
                  <div className="border rounded-xl p-4 mb-4 bg-gray-50">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium">Add New Address</h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setShowNewAddressForm(false);
                          resetNewAddressForm();
                        }}
                        className="rounded-full h-8 w-8 p-0"
                      >
                        ✕
                      </Button>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm">Address Type</Label>
                        <div className="flex gap-3 mt-1 flex-wrap">
                          <button
                            type="button"
                            onClick={() => setNewAddress({ ...newAddress, type: "home" })}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm border transition-all ${newAddress.type === "home"
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-gray-200 hover:border-gray-300"
                              }`}
                          >
                            <Home size={14} />
                            Home
                          </button>
                          <button
                            type="button"
                            onClick={() => setNewAddress({ ...newAddress, type: "office" })}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm border transition-all ${newAddress.type === "office"
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-gray-200 hover:border-gray-300"
                              }`}
                          >
                            <Briefcase size={14} />
                            Office
                          </button>
                          <button
                            type="button"
                            onClick={() => setNewAddress({ ...newAddress, type: "other" })}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm border transition-all ${newAddress.type === "other"
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-gray-200 hover:border-gray-300"
                              }`}
                          >
                            <Map size={14} />
                            Other
                          </button>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="houseNumber" className="text-sm">House/Flat/Building Number *</Label>
                        <Input
                          id="houseNumber"
                          value={newAddress.houseNumber}
                          onChange={(e) => setNewAddress({ ...newAddress, houseNumber: e.target.value })}
                          placeholder="e.g., H-24, 3rd Floor, Apts"
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label htmlFor="area" className="text-sm">Area / Locality / Street *</Label>
                        <Input
                          id="area"
                          value={newAddress.area}
                          onChange={(e) => setNewAddress({ ...newAddress, area: e.target.value })}
                          placeholder="e.g., Vaishali Nagar, Sector 4"
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label htmlFor="pincode" className="text-sm">Pincode *</Label>
                        <Input
                          id="pincode"
                          value={newAddress.pincode}
                          onChange={(e) => setNewAddress({ ...newAddress, pincode: e.target.value.slice(0, 6) })}
                          placeholder="6 digit pincode"
                          maxLength={6}
                          className="mt-1"
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="isDefault"
                          checked={newAddress.isDefault}
                          onChange={(e) => setNewAddress({ ...newAddress, isDefault: e.target.checked })}
                          className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <Label htmlFor="isDefault" className="text-sm cursor-pointer">
                          Set as default address
                        </Label>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button
                          onClick={handleSaveNewAddress}
                          disabled={savingAddress}
                          className="bg-primary hover:bg-accent rounded-full flex-1"
                        >
                          {savingAddress ? (
                            <Loader2 size={16} className="animate-spin mr-2" />
                          ) : (
                            <CheckCircle size={16} className="mr-2" />
                          )}
                          Save Address
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setShowNewAddressForm(false);
                            resetNewAddressForm();
                          }}
                          className="rounded-full"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Existing Addresses */}
                {user?.addresses && user.addresses.length > 0 ? (
                  <RadioGroup
                    value={selectedAddress?.type}
                    onValueChange={(value) => {
                      const address = user.addresses.find(a => a.type === value);
                      if (address) setSelectedAddress(address);
                    }}
                  >
                    {user.addresses.map((address, index) => (
                      <div key={index} className="flex items-start space-x-2 border rounded-xl p-4 mb-2 hover:border-primary transition-colors">
                        <RadioGroupItem value={address.type} id={address.type} />
                        <Label htmlFor={address.type} className="flex-1 cursor-pointer">
                          <div className="flex items-center gap-2 mb-1">
                            {getAddressIcon(address.type)}
                            <Badge variant="outline" className="capitalize">
                              {getAddressLabel(address.type)}
                            </Badge>
                            {address.isDefault && (
                              <Badge className="bg-primary/10 text-primary">Default</Badge>
                            )}
                          </div>
                          <p className="text-sm">
                            {address.houseNumber}, {address.area}
                          </p>
                          <p className="text-xs text-black">{address.pincode}</p>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                ) : (
                  !showNewAddressForm && (
                    <div className="text-center py-8">
                      <MapPin size={48} className="mx-auto text-black mb-4" />
                      <p className="text-black mb-2">No saved addresses</p>
                      <p className="text-sm text-black mb-4">Add a delivery address to continue</p>
                      <Button
                        onClick={() => setShowNewAddressForm(true)}
                        className="bg-primary hover:bg-accent rounded-full"
                      >
                        <PlusCircle size={16} className="mr-2" />
                        Add Address
                      </Button>
                    </div>
                  )
                )}
              </CardContent>
            </Card>

            {/* Delivery Date */}
            <Card className="rounded-2xl">
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Calendar size={18} className="text-primary" />
                  Delivery Date
                </h2>

                <Input
                  type="date"
                  disabled
                  value={deliveryDate}
                  min={format(new Date(), "yyyy-MM-dd")}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  className="max-w-xs"
                />
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card className="rounded-2xl">
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <CreditCard size={18} className="text-primary" />
                  Payment Method
                </h2>

                <RadioGroup value={paymentMethod} onValueChange={(v: any) => setPaymentMethod(v)}>
                  <div className={`border rounded-xl p-4 transition-colors ${
                    paymentMethod === "upi" ? "border-primary bg-primary/5" : ""
                  }`}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="upi" id="upi" />
                      <Label htmlFor="upi" className="flex-1 cursor-pointer">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Smartphone size={18} />
                            <span className="font-medium">UPI</span>
                          </div>
                          <Badge variant="outline">Google Pay • PhonePe • Paytm</Badge>
                        </div>
                      </Label>
                    </div>
                  </div>

                  {/* Cash on Delivery option commented out */}
                  {/* <div className={`border rounded-xl p-4 transition-colors ${
                    paymentMethod === "cod" ? "border-primary bg-primary/5" : ""
                  }`}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="cod" id="cod" />
                      <Label htmlFor="cod" className="flex-1 cursor-pointer">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Banknote size={18} />
                            <span className="font-medium">Cash on Delivery (COD)</span>
                          </div>
                          <Badge variant="outline">Pay when delivered</Badge>
                        </div>
                      </Label>
                    </div>
                  </div> */}
                </RadioGroup>

                {/* Warning box commented out */}
                {/* <div className="mt-4 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3">
                  <AlertCircle size={18} className="text-amber-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-amber-800">
                    If Payment fails please select COD, we will deliver order.
                  </p>
                </div> */}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-1">
            <Card className="rounded-2xl sticky top-24">
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold mb-4">Order Summary</h2>

                {/* Items List */}
                <div className="space-y-4 max-h-96 overflow-y-auto mb-4">
                  {cartItems.map((item, index) => (
                    <div key={`${item.dishId}-${item.mealType}-${item.date}`} className="flex gap-3">
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
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium text-sm">{item.name}</p>
                            <Badge className={item.type === "veg" ? "bg-success" : "bg-error"} >
                              {item.type}
                            </Badge>
                          </div>
                          <p className="font-semibold text-primary">₹{item.price * item.quantity}</p>
                        </div>

                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6 rounded-full"
                              onClick={() => handleUpdateQuantity(item.dishId, item.mealType, item.date, item.quantity - 1)}
                            >
                              <Minus size={10} />
                            </Button>
                            <span className="text-xs w-6 text-center">{item.quantity}</span>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6 rounded-full"
                              onClick={() => handleUpdateQuantity(item.dishId, item.mealType, item.date, item.quantity + 1)}
                            >
                              <Plus size={10} />
                            </Button>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveItem(item.dishId, item.mealType, item.date)}
                            className="h-6 px-2 text-error hover:text-error"
                          >
                            <Trash2 size={12} />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <Separator className="my-4" />

                {/* Price Breakdown */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-black">Subtotal</span>
                    <span>₹{cartTotal}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-black">Delivery Fee</span>
                    <span className="text-success">Free</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-black">Taxes</span>
                    <span>Included</span>
                  </div>
                </div>

                <Separator className="my-4" />

                {/* Total */}
                <div className="flex justify-between items-center mb-6">
                  <span className="font-semibold">Total Amount</span>
                  <span className="text-2xl font-bold text-primary">₹{cartTotal}</span>
                </div>

                {/* Place Order Button */}
                <Button
                  onClick={handlePlaceOrder}
                  disabled={processing || !selectedAddress}
                  className="w-full bg-primary hover:bg-accent rounded-full h-12 text-lg"
                >
                  {processing ? (
                    <>
                      <Loader2 size={18} className="mr-2 animate-spin" />
                      Processing...
                    </>
                  // ) : paymentMethod === "cod" ? (
                  //   <>
                  //     <Banknote size={18} className="mr-2" />
                  //     Place Order (COD)
                  //   </>
                  ) : (
                    "Place Order"
                  )}
                </Button>

                <p className="text-xs text-black text-center mt-4">
                  By placing this order, you agree to our Terms of Service
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}