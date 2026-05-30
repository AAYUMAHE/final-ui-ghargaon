"use client"

import { useEffect, useState } from "react"
import {
  Plus,
  Search,
  Edit,
  Trash2,
  MoreVertical,
  Utensils,
  Image as ImageIcon,
  RefreshCw,
  Copy,
  Eye
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

interface Dish {
  _id: string
  name: string
  image: string
  price: number
  type: "veg" | "nonveg"
  createdAt: string
  updatedAt: string
}

interface DishFormData {
  name: string
  image: string
  price: number
  type: "veg" | "nonveg"
}

// Cloudinary configuration
const CLOUD_NAME = "dd36u8rxp"
const UPLOAD_PRESET = "ghargaon"

export default function DishesPage() {
  const [dishes, setDishes] = useState<Dish[]>([])
  const [filteredDishes, setFilteredDishes] = useState<Dish[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedDish, setSelectedDish] = useState<Dish | null>(null)
  const [formData, setFormData] = useState<DishFormData>({
    name: "",
    image: "",
    price: 0,
    type: "veg"
  })
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [imagePreview, setImagePreview] = useState("")

  useEffect(() => {
    fetchDishes()
  }, [])

  useEffect(() => {
    filterDishes()
  }, [search, typeFilter, dishes])

  const fetchDishes = async () => {
    try {
      setLoading(true)
      const response = await api.get("/dishes")
      setDishes(response.data)
      setFilteredDishes(response.data)
    } catch (error) {
      toast.error("Failed to fetch dishes")
    } finally {
      setLoading(false)
    }
  }

  const filterDishes = () => {
    let filtered = [...dishes]

    // Search filter
    if (search) {
      filtered = filtered.filter(dish =>
        dish.name.toLowerCase().includes(search.toLowerCase()) ||
        dish.price.toString().includes(search)
      )
    }

    // Type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter(dish => dish.type === typeFilter)
    }

    setFilteredDishes(filtered)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error("Please upload an image file")
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size should be less than 5MB")
      return
    }

    try {
      setUploading(true)
      
      const formDataCloud = new FormData()
      formDataCloud.append("file", file)
      formDataCloud.append("upload_preset", UPLOAD_PRESET)

      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
        method: "POST",
        body: formDataCloud,
      })

      if (!res.ok) {
        throw new Error('Upload failed')
      }

      const data = await res.json()
      
      if (data.secure_url) {
        setImagePreview(data.secure_url)
        setFormData(prev => ({ ...prev, image: data.secure_url }))
        toast.success("Image uploaded successfully!")
      }
    } catch (err) {
      console.error("Upload error:", err)
      toast.error("Failed to upload image")
    } finally {
      setUploading(false)
      // Clear the input
      e.target.value = ''
    }
  }

  const handleRemoveImage = () => {
    setImagePreview("")
    setFormData(prev => ({ ...prev, image: "" }))
  }

  const handleCreateDish = async () => {
    // Validation
    if (!formData.name.trim()) {
      toast.error("Please enter a dish name")
      return
    }
    if (formData.price < 1) {
      toast.error("Price must be greater than 0")
      return
    }

    setSubmitting(true)
    try {
      const response = await api.post("/dishes", formData)
      
      setDishes([...dishes, response.data])
      toast.success("Dish created successfully")
      setIsCreateDialogOpen(false)
      resetForm()
    } catch (error) {
      toast.error("Failed to create dish")
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdateDish = async () => {
    if (!selectedDish) return

    // Validation
    if (!formData.name.trim()) {
      toast.error("Please enter a dish name")
      return
    }
    if (formData.price < 1) {
      toast.error("Price must be greater than 0")
      return
    }

    setSubmitting(true)
    try {
      const response = await api.put(`/dishes/${selectedDish._id}`, formData)
      
      setDishes(dishes.map(dish =>
        dish._id === selectedDish._id ? response.data : dish
      ))
      
      toast.success("Dish updated successfully")
      setIsEditDialogOpen(false)
      resetForm()
    } catch (error) {
      toast.error("Failed to update dish")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteDish = async () => {
    if (!selectedDish) return

    try {
      await api.delete(`/dishes/${selectedDish._id}`)
      
      setDishes(dishes.filter(dish => dish._id !== selectedDish._id))
      toast.success("Dish deleted successfully")
      setIsDeleteDialogOpen(false)
      setSelectedDish(null)
    } catch (error) {
      toast.error("Failed to delete dish")
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      image: "",
      price: 0,
      type: "veg"
    })
    setImagePreview("")
    setSelectedDish(null)
  }

  const openEditDialog = (dish: Dish) => {
    setSelectedDish(dish)
    setFormData({
      name: dish.name,
      image: dish.image,
      price: dish.price,
      type: dish.type
    })
    setImagePreview(dish.image)
    setIsEditDialogOpen(true)
  }

  const openViewDialog = (dish: Dish) => {
    setSelectedDish(dish)
    setIsViewDialogOpen(true)
  }

  const getTypeColor = (type: string) => {
    return type === "veg" 
      ? "bg-success text-white" 
      : "bg-error text-white"
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  // Calculate stats
  const totalDishes = dishes.length
  const vegCount = dishes.filter(d => d.type === "veg").length
  const nonVegCount = dishes.filter(d => d.type === "nonveg").length
  const averagePrice = dishes.length > 0
    ? Math.round(dishes.reduce((sum, dish) => sum + dish.price, 0) / dishes.length)
    : 0

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex justify-between items-center mb-8">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-textdark">Dishes Management</h1>
          <p className="text-black mt-1">Create and manage your menu items</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={fetchDishes}
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
            Add New Dish
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-black mb-1">Total Dishes</p>
                <p className="text-3xl font-bold text-primary">{totalDishes}</p>
              </div>
              <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                <Utensils className="text-primary" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl bg-gradient-to-br from-success/10 to-success/5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-black mb-1">Veg Items</p>
                <p className="text-3xl font-bold text-success">{vegCount}</p>
              </div>
              <div className="w-12 h-12 bg-success/20 rounded-full flex items-center justify-center">
                <span className="text-success text-2xl">🟢</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl bg-gradient-to-br from-error/10 to-error/5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-black mb-1">Non-Veg Items</p>
                <p className="text-3xl font-bold text-error">{nonVegCount}</p>
              </div>
              <div className="w-12 h-12 bg-error/20 rounded-full flex items-center justify-center">
                <span className="text-error text-2xl">🔴</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl bg-gradient-to-br from-blue-500/10 to-blue-500/5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-black mb-1">Average Price</p>
                <p className="text-3xl font-bold text-blue-600">₹{averagePrice}</p>
              </div>
              <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
                <span className="text-blue-600 text-2xl">₹</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="rounded-2xl mb-6">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black" size={18} />
              <Input
                placeholder="Search by name or price..."
                className="pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <select
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="all">All Types</option>
              <option value="veg">Veg Only</option>
              <option value="nonveg">Non-Veg Only</option>
            </select>

            <Button 
              variant="outline" 
              onClick={() => {
                setSearch("")
                setTypeFilter("all")
              }}
              className="rounded-full"
            >
              Reset Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Dishes Table */}
      <Card className="rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Image</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDishes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    <div className="flex flex-col items-center">
                      <Utensils size={48} className="text-black mb-4" />
                      <p className="text-black text-lg">No dishes found</p>
                      <p className="text-sm text-black mb-4">Try adjusting your filters or add a new dish</p>
                      <Button 
                        onClick={() => {
                          resetForm()
                          setIsCreateDialogOpen(true)
                        }}
                        className="bg-primary hover:bg-accent rounded-full"
                      >
                        <Plus size={16} className="mr-2" />
                        Add Your First Dish
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredDishes.map((dish) => (
                  <TableRow key={dish._id}>
                    <TableCell>
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
                            <ImageIcon size={20} className="text-black" />
                          </div>
                        )}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div>
                        <p className="font-medium">{dish.name}</p>
                        <p className="text-xs text-black">ID: {dish._id.slice(-6)}</p>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <span className="font-semibold text-primary">₹{dish.price}</span>
                    </TableCell>
                    
                    <TableCell>
                      <Badge className={getTypeColor(dish.type)}>
                        {dish.type === "veg" ? "🟢 Veg" : "🔴 Non-veg"}
                      </Badge>
                    </TableCell>
                    
                    <TableCell>
                      <div className="text-xs text-black">
                        {format(parseISO(dish.createdAt), "dd MMM yyyy")}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="text-xs text-black">
                        {format(parseISO(dish.updatedAt), "dd MMM yyyy")}
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
                          <DropdownMenuItem onClick={() => openViewDialog(dish)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          
                          <DropdownMenuItem onClick={() => openEditDialog(dish)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Dish
                          </DropdownMenuItem>
                          
                          <DropdownMenuItem 
                            onClick={() => {
                              navigator.clipboard.writeText(dish._id)
                              toast.success("Dish ID copied to clipboard")
                            }}
                          >
                            <Copy className="mr-2 h-4 w-4" />
                            Copy ID
                          </DropdownMenuItem>
                          
                          <DropdownMenuSeparator />
                          
                          <DropdownMenuItem 
                            onClick={() => {
                              setSelectedDish(dish)
                              setIsDeleteDialogOpen(true)
                            }}
                            className="text-error"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Dish
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Create Dish Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Dish</DialogTitle>
            <DialogDescription>
              Create a new dish for your menu
            </DialogDescription>
          </DialogHeader>
          
          <DishForm
            formData={formData}
            setFormData={setFormData}
            imagePreview={imagePreview}
            uploading={uploading}
            onFileUpload={handleFileUpload}
            onRemoveImage={handleRemoveImage}
          />
          
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsCreateDialogOpen(false)
              resetForm()
            }}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateDish}
              disabled={submitting || uploading}
              className="bg-primary hover:bg-accent"
            >
              {submitting ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                "Create Dish"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dish Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Dish</DialogTitle>
            <DialogDescription>
              Update the dish details
            </DialogDescription>
          </DialogHeader>
          
          <DishForm
            formData={formData}
            setFormData={setFormData}
            imagePreview={imagePreview}
            uploading={uploading}
            onFileUpload={handleFileUpload}
            onRemoveImage={handleRemoveImage}
          />
          
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsEditDialogOpen(false)
              resetForm()
            }}>
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateDish}
              disabled={submitting || uploading}
              className="bg-primary hover:bg-accent"
            >
              {submitting ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                "Update Dish"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dish Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Dish Details</DialogTitle>
            <DialogDescription>
              Complete information about the dish
            </DialogDescription>
          </DialogHeader>
          
          {selectedDish && (
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="w-48 h-48 rounded-2xl overflow-hidden bg-gray-100">
                  {selectedDish.image ? (
                    <Image
                      src={selectedDish.image}
                      alt={selectedDish.name}
                      width={192}
                      height={192}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon size={48} className="text-black" />
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-black">Name</p>
                  <p className="font-medium">{selectedDish.name}</p>
                </div>
                <div>
                  <p className="text-sm text-black">Price</p>
                  <p className="font-semibold text-primary">₹{selectedDish.price}</p>
                </div>
                <div>
                  <p className="text-sm text-black">Type</p>
                  <Badge className={getTypeColor(selectedDish.type)}>
                    {selectedDish.type === "veg" ? "Veg" : "Non-veg"}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-black">Dish ID</p>
                  <p className="text-xs font-mono">{selectedDish._id}</p>
                </div>
                <div>
                  <p className="text-sm text-black">Created</p>
                  <p className="text-sm">{format(parseISO(selectedDish.createdAt), "PPP")}</p>
                </div>
                <div>
                  <p className="text-sm text-black">Last Updated</p>
                  <p className="text-sm">{format(parseISO(selectedDish.updatedAt), "PPP")}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete
              <span className="font-semibold"> {selectedDish?.name} </span>
              from your menu.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedDish(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteDish}
              className="bg-error hover:bg-error/90"
            >
              Delete Dish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// Dish Form Component
function DishForm({ 
  formData, 
  setFormData, 
  imagePreview, 
  uploading, 
  onFileUpload, 
  onRemoveImage 
}: { 
  formData: DishFormData
  setFormData: (data: DishFormData) => void
  imagePreview: string
  uploading: boolean
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  onRemoveImage: () => void
}) {
  return (
    <div className="space-y-4 py-4">
      {/* Image Upload */}
      <div>
        <Label>Dish Image</Label>
        <div className="mt-2">
          {imagePreview ? (
            <div className="relative w-32 h-32 mx-auto group">
              <Image
                src={imagePreview}
                alt="Preview"
                width={128}
                height={128}
                className="object-cover rounded-lg w-full h-full"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute -top-2 -right-2 rounded-full w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={onRemoveImage}
              >
                <Trash2 size={12} />
              </Button>
            </div>
          ) : (
            <div className="flex justify-center">
              <label className="relative cursor-pointer">
                <div className={`w-32 h-32 rounded-lg border-2 border-dashed flex flex-col items-center justify-center transition-colors
                  ${uploading ? 'bg-gray-100' : 'hover:border-primary hover:bg-primary/5'}`}
                >
                  {uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2"></div>
                      <p className="text-xs text-black">Uploading...</p>
                    </>
                  ) : (
                    <>
                      <ImageIcon size={24} className="text-black mb-2" />
                      <p className="text-xs text-black">Click to upload</p>
                    </>
                  )}
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={onFileUpload}
                  disabled={uploading}
                />
              </label>
            </div>
          )}
        </div>
      </div>

      {/* Name */}
      <div className="space-y-2">
        <Label htmlFor="name">Dish Name *</Label>
        <Input
          id="name"
          placeholder="e.g., Paneer Butter Masala"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />
      </div>

      {/* Price */}
      <div className="space-y-2">
        <Label htmlFor="price">Price (₹) *</Label>
        <Input
          id="price"
          type="number"
          min="1"
          step="1"
          placeholder="299"
          value={formData.price || ''}
          onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
        />
      </div>

      {/* Type */}
      <div className="space-y-2">
        <Label>Dish Type *</Label>
        <RadioGroup
          value={formData.type}
          onValueChange={(value: "veg" | "nonveg") => setFormData({ ...formData, type: value })}
          className="flex gap-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="veg" id="veg" />
            <Label htmlFor="veg" className="text-success font-medium">Veg</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="nonveg" id="nonveg" />
            <Label htmlFor="nonveg" className="text-error font-medium">Non-veg</Label>
          </div>
        </RadioGroup>
      </div>
    </div>
  )
}