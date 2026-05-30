"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { ArrowLeft, Save, Upload, Loader2 } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import api from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "sonner"

export default function EditDishPage() {
  const router = useRouter()
  const params = useParams()
  const dishId = params.id

  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [imagePreview, setImagePreview] = useState("")
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    type: "veg",
    image: ""
  })

  useEffect(() => {
    fetchDish()
  }, [dishId])

  const fetchDish = async () => {
    try {
      const response = await api.get(`/dishes/${dishId}`)
      const dish = response.data
      setFormData({
        name: dish.name,
        price: dish.price.toString(),
        type: dish.type,
        image: dish.image || ""
      })
      setImagePreview(dish.image || "")
    } catch (error) {
      toast.error("Failed to fetch dish")
      router.push("/admin/dishes")
    } finally {
      setFetching(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error("Please upload an image file")
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size should be less than 5MB")
      return
    }

    try {
      setUploading(true)
      const cloudName = "dd36u8rxp"
      const uploadPreset = "ghargaon"
      const formDataCloud = new FormData()
      formDataCloud.append("file", file)
      formDataCloud.append("upload_preset", uploadPreset)

      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: "POST",
        body: formDataCloud,
      })

      const data = await res.json()
      
      if (data.secure_url) {
        setImagePreview(data.secure_url)
        setFormData(prev => ({ ...prev, image: data.secure_url }))
        toast.success("Image uploaded successfully!")
      }
    } catch (err) {
      toast.error("Failed to upload image")
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const handleRemoveImage = () => {
    setImagePreview("")
    setFormData(prev => ({ ...prev, image: "" }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const payload = {
        ...formData,
        price: parseFloat(formData.price)
      }

      await api.put(`/dishes/${dishId}`, payload)
      toast.success("Dish updated successfully")
      router.push("/admin/dishes")
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update dish")
    } finally {
      setLoading(false)
    }
  }

  if (fetching) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/dishes">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft size={20} />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-textdark">Edit Dish</h1>
          <p className="text-black mt-1">Update dish details</p>
        </div>
      </div>

      <Card className="max-w-2xl mx-auto rounded-2xl">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Image Upload */}
            <div>
              <Label>Dish Image</Label>
              <div className="mt-2">
                {imagePreview ? (
                  <div className="relative w-48 h-48 mx-auto group">
                    <Image
                      src={imagePreview}
                      alt="Preview"
                      width={192}
                      height={192}
                      className="object-cover rounded-2xl w-full h-full"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 rounded-full w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={handleRemoveImage}
                    >
                      <Upload size={16} className="rotate-45" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex justify-center">
                    <label className="relative cursor-pointer">
                      <div className={`w-48 h-48 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center transition-colors
                        ${uploading ? 'bg-gray-100' : 'hover:border-primary hover:bg-primary/5'}`}
                      >
                        {uploading ? (
                          <>
                            <Loader2 size={32} className="animate-spin text-primary mb-2" />
                            <p className="text-sm text-black">Uploading...</p>
                          </>
                        ) : (
                          <>
                            <Upload size={32} className="text-black mb-2" />
                            <p className="text-sm text-black">Click to upload</p>
                            <p className="text-xs text-black mt-1">PNG, JPG up to 5MB</p>
                          </>
                        )}
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleFileUpload}
                        disabled={uploading}
                      />
                    </label>
                  </div>
                )}
              </div>
            </div>

            {/* Name */}
            <div>
              <Label htmlFor="name">Dish Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="mt-1"
              />
            </div>

            {/* Price */}
            <div>
              <Label htmlFor="price">Price (₹)</Label>
              <Input
                id="price"
                type="number"
                min="0"
                step="1"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                required
                className="mt-1"
              />
            </div>

            {/* Type */}
            <div>
              <Label>Dish Type</Label>
              <RadioGroup
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value })}
                className="flex gap-4 mt-2"
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

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full bg-primary hover:bg-accent rounded-full h-12"
              disabled={loading || uploading}
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Save size={18} className="mr-2" />
                  Update Dish
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}