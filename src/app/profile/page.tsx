"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { updateUser, setUser } from "@/store/slices/userSlice";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Home,
  Briefcase,
  Plus,
  Trash2,
  Edit,
  Save,
  X,
  Loader2,
  CheckCircle,
  AlertCircle,
  Star,
  MoreVertical as Other
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import api from "@/lib/api";

interface Address {
  type: "home" | "office" | "other";
  houseNumber: string;
  area: string;
  pincode: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  isDefault?: boolean;
}

interface UserProfile {
  fullName: string;
  username: string;
  mobile: string;
  email: string;
  addresses: Address[];
}

export default function ProfilePage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.user.user);

  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<UserProfile>({
    fullName: "",
    username: "",
    mobile: "",
    email: "",
    addresses: [],
  });

  const isAuthLoaded = useAppSelector((state) => state.user.isAuthLoaded);

  // Edit states
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editForm, setEditForm] = useState({
    fullName: "",
    username: "",
    mobile: "",
  });

  // Address states
  const [isAddressDialogOpen, setIsAddressDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [addressForm, setAddressForm] = useState<Address>({
    type: "home",
    houseNumber: "",
    area: "",
    pincode: "",
    coordinates: { lat: 0, lng: 0 },
    isDefault: false,
  });

  // Delete confirmation
  const [addressToDelete, setAddressToDelete] = useState<Address | null>(null);

  useEffect(() => {
    if (!isAuthLoaded) return;
    if (!user) {
      router.push("/");
      return;
    }

    if (user) {
      setProfile({
        fullName: user.fullName || "",
        username: user.username || "",
        mobile: user.mobile || "",
        email: user.email || "",
        addresses: user.addresses || [],
      });
      setEditForm({
        fullName: user.fullName || "",
        username: user.username || "",
        mobile: user.mobile || "",
      });
    }
  }, [user, router, isAuthLoaded]);

  const handleProfileUpdate = async () => {
    if (!editForm.fullName.trim()) {
      toast.error("Full name is required");
      return;
    }
    if (!editForm.username.trim()) {
      toast.error("Username is required");
      return;
    }

    setLoading(true);
    try {
      const response = await api.put("/auth/update", {
        fullName: editForm.fullName,
        username: editForm.username,
        mobile: editForm.mobile,
      });

      // Update Redux state
      dispatch(updateUser({
        fullName: editForm.fullName,
        username: editForm.username,
        mobile: editForm.mobile,
      }));

      setProfile(prev => ({
        ...prev,
        fullName: editForm.fullName,
        username: editForm.username,
        mobile: editForm.mobile,
      }));

      toast.success("Profile updated successfully");
      setIsEditingProfile(false);
    } catch (error: any) {
      console.error("Update error:", error);
      toast.error(error.response?.data?.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleAddAddress = async () => {
    if (!addressForm.houseNumber.trim()) {
      toast.error("House number is required");
      return;
    }
    if (!addressForm.area.trim()) {
      toast.error("Area is required");
      return;
    }
    if (!addressForm.pincode.trim() || addressForm.pincode.length !== 6) {
      toast.error("Valid pincode is required");
      return;
    }

    setLoading(true);
    try {
      const addresses = [...profile.addresses];

      // If this is default, remove default from others
      if (addressForm.isDefault) {
        addresses.forEach(addr => { addr.isDefault = false; });
      }

      if (editingAddress) {
        // Update existing address
        const index = addresses.findIndex(a => a.type === editingAddress.type);
        if (index !== -1) {
          addresses[index] = { ...addressForm };
        }
        toast.success("Address updated successfully");
      } else {
        // Add new address
        addresses.push({ ...addressForm });
        toast.success("Address added successfully");
      }

      // Update backend
      const response = await api.put("/auth/update", { addresses });

      // Update Redux state
      dispatch(updateUser({ addresses }));

      setProfile(prev => ({ ...prev, addresses }));
      setIsAddressDialogOpen(false);
      resetAddressForm();
    } catch (error: any) {
      console.error("Address error:", error);
      toast.error(error.response?.data?.message || "Failed to save address");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAddress = async () => {
    if (!addressToDelete) return;

    setLoading(true);
    try {
      const addresses = profile.addresses.filter(
        addr => addr.type !== addressToDelete.type
      );

      // Update backend
      const response = await api.put("/auth/update", { addresses });

      // Update Redux state
      dispatch(updateUser({ addresses }));

      setProfile(prev => ({ ...prev, addresses }));
      toast.success("Address deleted successfully");
      setAddressToDelete(null);
    } catch (error: any) {
      console.error("Delete error:", error);
      toast.error(error.response?.data?.message || "Failed to delete address");
    } finally {
      setLoading(false);
    }
  };

  const setDefaultAddress = async (address: Address) => {
    if (address.isDefault) return;

    setLoading(true);
    try {
      const addresses = profile.addresses.map(addr => ({
        ...addr,
        isDefault: addr.type === address.type,
      }));

      // Update backend
      const response = await api.put("/auth/update", { addresses });

      // Update Redux state
      dispatch(updateUser({ addresses }));

      setProfile(prev => ({ ...prev, addresses }));
      toast.success("Default address updated");
    } catch (error: any) {
      console.error("Set default error:", error);
      toast.error(error.response?.data?.message || "Failed to set default address");
    } finally {
      setLoading(false);
    }
  };

  const resetAddressForm = () => {
    setAddressForm({
      type: "home",
      houseNumber: "",
      area: "",
      pincode: "",
      coordinates: { lat: 0, lng: 0 },
      isDefault: false,
    });
    setEditingAddress(null);
  };

  const openEditAddress = (address: Address) => {
    setEditingAddress(address);
    setAddressForm({ ...address });
    setIsAddressDialogOpen(true);
  };

  const getAddressIcon = (type: string) => {
    return type === "home" ? <Home size={18} /> : <Briefcase size={18} />;
  };

  if (!isAuthLoaded) {
    return (
      <div className="min-h-screen pt-24 pb-16 px-4 max-w-4xl mx-auto">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 size={40} className="animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 bg-soft">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-textdark mb-8">My Profile</h1>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="profile">Profile Info</TabsTrigger>
            <TabsTrigger value="addresses">Addresses</TabsTrigger>
          </TabsList>

          {/* Profile Info Tab */}
          <TabsContent value="profile">
            <Card className="rounded-2xl">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Personal Information</CardTitle>
                {!isEditingProfile && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditingProfile(true)}
                    className="rounded-full"
                  >
                    <Edit size={16} className="mr-2" />
                    Edit
                  </Button>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditingProfile ? (
                  // Edit Mode
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input
                        id="fullName"
                        value={editForm.fullName}
                        onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        value={editForm.username}
                        onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="mobile">Mobile Number</Label>
                      <Input
                        id="mobile"
                        value={editForm.mobile}
                        onChange={(e) => setEditForm({ ...editForm, mobile: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                    <div className="flex gap-3 pt-2">
                      <Button
                        onClick={handleProfileUpdate}
                        disabled={loading}
                        className="bg-primary hover:bg-accent rounded-full"
                      >
                        {loading ? (
                          <Loader2 size={16} className="animate-spin mr-2" />
                        ) : (
                          <Save size={16} className="mr-2" />
                        )}
                        Save Changes
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsEditingProfile(false);
                          setEditForm({
                            fullName: profile.fullName,
                            username: profile.username,
                            mobile: profile.mobile,
                          });
                        }}
                        className="rounded-full"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  // View Mode
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <User size={20} className="text-primary" />
                      <div>
                        <p className="text-sm text-black">Full Name</p>
                        <p className="font-medium">{profile.fullName || "Not set"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <User size={20} className="text-primary" />
                      <div>
                        <p className="text-sm text-black">Username</p>
                        <p className="font-medium">@{profile.username || "Not set"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Mail size={20} className="text-primary" />
                      <div>
                        <p className="text-sm text-black">Email</p>
                        <p className="font-medium">{profile.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Phone size={20} className="text-primary" />
                      <div>
                        <p className="text-sm text-black">Mobile Number</p>
                        <p className="font-medium">{profile.mobile || "Not set"}</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Addresses Tab */}
          <TabsContent value="addresses">
            <Card className="rounded-2xl">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Saved Addresses</CardTitle>
                <Dialog open={isAddressDialogOpen} onOpenChange={setIsAddressDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        resetAddressForm();
                        setIsAddressDialogOpen(true);
                      }}
                      className="rounded-full"
                    >
                      <Plus size={16} className="mr-2" />
                      Add Address
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>
                        {editingAddress ? "Edit Address" : "Add New Address"}
                      </DialogTitle>
                      <DialogDescription>
                        {editingAddress
                          ? "Update your address details"
                          : "Add a new delivery address"}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div>
                        <Label>Address Type</Label>
                        <div className="flex gap-4 mt-2">
                          <button
                            type="button"
                            onClick={() => setAddressForm({ ...addressForm, type: "home" })}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all ${addressForm.type === "home"
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-gray-200 hover:border-gray-300"
                              }`}
                          >
                            <Home size={16} />
                            Home
                          </button>
                          <button
                            type="button"
                            onClick={() => setAddressForm({ ...addressForm, type: "office" })}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all ${addressForm.type === "office"
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-gray-200 hover:border-gray-300"
                              }`}
                          >
                            <Briefcase size={16} />
                            Office
                          </button>
                           <button
                            type="button"
                            onClick={() => setAddressForm({ ...addressForm, type: "other" })}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all ${addressForm.type === "other"
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-gray-200 hover:border-gray-300"
                              }`}
                          >
                            <Other size={16} />
                            Other
                          </button>
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="houseNumber">House/Flat/Building Number</Label>
                        <Input
                          id="houseNumber"
                          value={addressForm.houseNumber}
                          onChange={(e) =>
                            setAddressForm({ ...addressForm, houseNumber: e.target.value })
                          }
                          placeholder="e.g., H-24, 3rd Floor"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="area">Area / Locality / Street</Label>
                        <Input
                          id="area"
                          value={addressForm.area}
                          onChange={(e) =>
                            setAddressForm({ ...addressForm, area: e.target.value })
                          }
                          placeholder="e.g., Vaishali Nagar"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="pincode">Pincode</Label>
                        <Input
                          id="pincode"
                          value={addressForm.pincode}
                          onChange={(e) =>
                            setAddressForm({ ...addressForm, pincode: e.target.value })
                          }
                          placeholder="6 digit pincode"
                          maxLength={6}
                          className="mt-1"
                        />
                      </div>

                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsAddressDialogOpen(false);
                          resetAddressForm();
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleAddAddress}
                        disabled={loading}
                        className="bg-primary hover:bg-accent"
                      >
                        {loading ? (
                          <Loader2 size={16} className="animate-spin mr-2" />
                        ) : (
                          <Save size={16} className="mr-2" />
                        )}
                        {editingAddress ? "Update Address" : "Add Address"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {profile.addresses.length === 0 ? (
                  <div className="text-center py-8">
                    <MapPin size={48} className="mx-auto text-black mb-4" />
                    <p className="text-black">No addresses saved</p>
                    <p className="text-sm text-black mt-1">
                      Add an address for delivery
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {profile.addresses.map((address, index) => (
                      <div
                        key={index}
                        className={`p-4 rounded-xl border ${address.isDefault
                            ? "border-primary bg-primary/5"
                            : "border-gray-200"
                          }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div className="mt-1">
                              {getAddressIcon(address.type)}
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <Badge
                                  variant={address.isDefault ? "default" : "outline"}
                                  className={address.isDefault ? "bg-primary" : ""}
                                >
                                  {address.type === "home" ? "Home" : address.type === "office" ? "Office" : "Other"}
                                </Badge>
                                {address.isDefault && (
                                  <Badge variant="outline" className="text-primary border-primary">
                                    Default
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm">
                                {address.houseNumber}, {address.area}
                              </p>
                              <p className="text-sm text-black">Pincode: {address.pincode}</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {!address.isDefault && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDefaultAddress(address)}
                                className="h-8 px-2 text-primary"
                              >
                                <Star size={14} className="mr-1" />
                                Set Default
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditAddress(address)}
                              className="h-8 w-8 rounded-full"
                            >
                              <Edit size={14} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setAddressToDelete(address)}
                              className="h-8 w-8 rounded-full text-error hover:text-error"
                            >
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Delete Address Confirmation Dialog */}
      <AlertDialog open={!!addressToDelete} onOpenChange={() => setAddressToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Address</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this address? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAddress}
              className="bg-error hover:bg-error/90"
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin mr-2" />
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}