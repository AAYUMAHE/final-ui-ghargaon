"use client"

import { useEffect, useState } from "react"
import {
  Search,
  Filter,
  Eye,
  MoreVertical,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Shield,
  Star,
  Copy,
  RefreshCw,
  Download,
  CheckCircle,
  XCircle,
  Home,
  Briefcase,
  Award
} from "lucide-react"
import Link from "next/link"
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
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"

interface Address {
  _id?: string
  type: "home" | "office" | "other"
  houseNumber: string
  area: string
  pincode: string
  coordinates?: {
    lat: number
    lng: number
  }
}

interface User {
  _id: string
  email: string
  username?: string
  fullName?: string
  mobile?: string
  role: "user" | "admin"
  isVerified: boolean
  referralCode?: string
  addresses: Address[]
  createdAt: string
  updatedAt: string
  subscription?: {
    plan: string
    startDate: string
    endDate: string
    active: boolean
  }
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [verifiedFilter, setVerifiedFilter] = useState<string>("all")
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isAddressDialogOpen, setIsAddressDialogOpen] = useState(false)
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null)

  useEffect(() => {
    fetchUsers()
  }, [])

  useEffect(() => {
    filterUsers()
  }, [search, roleFilter, verifiedFilter, users])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await api.get("/auth/all")
      
      // Add mock subscription data for demo (remove in production)
      const usersWithMockData = response.data.map((user: User) => ({
        ...user,
        subscription: Math.random() > 0.7 ? {
          plan: ["Monthly", "Quarterly", "Yearly"][Math.floor(Math.random() * 3)],
          startDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
          active: Math.random() > 0.3
        } : undefined
      }))
      
      setUsers(usersWithMockData)
      setFilteredUsers(usersWithMockData)
    } catch (error) {
      toast.error("Failed to fetch users")
    } finally {
      setLoading(false)
    }
  }

  const filterUsers = () => {
    let filtered = [...users]

    // Search filter
    if (search) {
      filtered = filtered.filter(user =>
        user.email.toLowerCase().includes(search.toLowerCase()) ||
        user.fullName?.toLowerCase().includes(search.toLowerCase()) ||
        user.username?.toLowerCase().includes(search.toLowerCase()) ||
        user.mobile?.includes(search) ||
        user._id.toLowerCase().includes(search.toLowerCase())
      )
    }

    // Role filter
    if (roleFilter !== "all") {
      filtered = filtered.filter(user => user.role === roleFilter)
    }

    // Verified filter
    if (verifiedFilter !== "all") {
      filtered = filtered.filter(user => 
        verifiedFilter === "verified" ? user.isVerified : !user.isVerified
      )
    }

    setFilteredUsers(filtered)
  }

  const toggleUserRole = async (userId: string, currentRole: string) => {
    try {
      const newRole = currentRole === "admin" ? "user" : "admin"
      // Note: You'll need to create this endpoint
      await api.patch(`/auth/${userId}/role`, { role: newRole })
      
      setUsers(users.map(user =>
        user._id === userId ? { ...user, role: newRole as "user" | "admin" } : user
      ))
      
      toast.success(`User role updated to ${newRole}`)
    } catch (error) {
      toast.error("Failed to update user role")
    }
  }

  const toggleUserVerification = async (userId: string, currentStatus: boolean) => {
    try {
      // Note: You'll need to create this endpoint
      await api.patch(`/auth/${userId}/verify`, { isVerified: !currentStatus })
      
      setUsers(users.map(user =>
        user._id === userId ? { ...user, isVerified: !currentStatus } : user
      ))
      
      toast.success(`User ${!currentStatus ? 'verified' : 'unverified'} successfully`)
    } catch (error) {
      toast.error("Failed to update verification status")
    }
  }

  const getInitials = (name?: string, email?: string) => {
    if (name) {
      return name
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }
    return email?.slice(0, 2).toUpperCase() || 'U'
  }

  const getAddressIcon = (type: string) => {
    switch(type) {
      case 'home': return <Home size={16} className="text-primary" />
      case 'office': return <Briefcase size={16} className="text-blue-600" />
      default: return <MapPin size={16} className="text-black" />
    }
  }

  const openGoogleMaps = (address: Address) => {
    if (address.coordinates?.lat && address.coordinates?.lng) {
      window.open(`https://www.google.com/maps?q=${address.coordinates.lat},${address.coordinates.lng}`, '_blank')
    } else {
      const query = encodeURIComponent(`${address.houseNumber} ${address.area} ${address.pincode}`)
      window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank')
    }
  }

  // Calculate stats
  const totalUsers = users.length
  const adminCount = users.filter(u => u.role === "admin").length
  const verifiedCount = users.filter(u => u.isVerified).length
  const usersWithAddress = users.filter(u => u.addresses.length > 0).length

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
          <h1 className="text-3xl font-bold text-textdark">Users Management</h1>
          <p className="text-black mt-1">View and manage all registered users</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={fetchUsers}
            className="rounded-full"
          >
            <RefreshCw size={16} className="mr-2" />
            Refresh
          </Button>
          <Button 
            variant="outline"
            className="rounded-full"
          >
            <Download size={16} className="mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-black mb-1">Total Users</p>
                <p className="text-3xl font-bold text-primary">{totalUsers}</p>
              </div>
              <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                <User className="text-primary" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl bg-gradient-to-br from-purple-500/10 to-purple-500/5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-black mb-1">Admins</p>
                <p className="text-3xl font-bold text-purple-600">{adminCount}</p>
              </div>
              <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center">
                <Shield className="text-purple-600" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl bg-gradient-to-br from-success/10 to-success/5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-black mb-1">Verified</p>
                <p className="text-3xl font-bold text-success">{verifiedCount}</p>
              </div>
              <div className="w-12 h-12 bg-success/20 rounded-full flex items-center justify-center">
                <CheckCircle className="text-success" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl bg-gradient-to-br from-blue-500/10 to-blue-500/5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-black mb-1">With Addresses</p>
                <p className="text-3xl font-bold text-blue-600">{usersWithAddress}</p>
              </div>
              <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
                <MapPin className="text-blue-600" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="rounded-2xl mb-6">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black" size={18} />
              <Input
                placeholder="Search by name, email, phone..."
                className="pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Role Filter */}
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger>
                <SelectValue placeholder="User Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="user">Users</SelectItem>
                <SelectItem value="admin">Admins</SelectItem>
              </SelectContent>
            </Select>

            {/* Verified Filter */}
            <Select value={verifiedFilter} onValueChange={setVerifiedFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Verification Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="unverified">Unverified</SelectItem>
              </SelectContent>
            </Select>

            {/* Reset Filters */}
            <Button 
              variant="outline" 
              onClick={() => {
                setSearch("")
                setRoleFilter("all")
                setVerifiedFilter("all")
              }}
              className="rounded-full"
            >
              Reset Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Addresses</TableHead>
                <TableHead>Subscription</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12">
                    <div className="flex flex-col items-center">
                      <User size={48} className="text-black mb-4" />
                      <p className="text-black text-lg">No users found</p>
                      <p className="text-sm text-black">Try adjusting your filters</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user._id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {getInitials(user.fullName, user.email)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{user.fullName || 'N/A'}</p>
                          <p className="text-xs text-black">@{user.username || 'username'}</p>
                          <p className="text-xs text-black">ID: {user._id.slice(-6)}</p>
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                          <Mail size={14} className="text-black" />
                          <span className="text-sm">{user.email}</span>
                        </div>
                        {user.mobile && (
                          <div className="flex items-center gap-2 text-sm">
                            <Phone size={14} className="text-black" />
                            <span>{user.mobile}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <Badge className={user.role === "admin" ? "bg-purple-600" : "bg-gray-600"}>
                        <Shield size={12} className="mr-1" />
                        {user.role}
                      </Badge>
                    </TableCell>
                    
                    <TableCell>
                      {user.isVerified ? (
                        <Badge className="bg-success">
                          <CheckCircle size={12} className="mr-1" />
                          Verified
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-black">
                          <XCircle size={12} className="mr-1" />
                          Unverified
                        </Badge>
                      )}
                    </TableCell>
                    
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="rounded-full"
                        onClick={() => {
                          setSelectedUser(user)
                          setIsAddressDialogOpen(true)
                        }}
                      >
                        <MapPin size={14} className="mr-1" />
                        {user.addresses.length} {user.addresses.length === 1 ? 'address' : 'addresses'}
                      </Button>
                    </TableCell>
                    
                    <TableCell>
                      {user.subscription?.active ? (
                        <Badge className="bg-primary">
                          <Award size={12} className="mr-1" />
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="outline">No Plan</Badge>
                      )}
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar size={14} className="text-black" />
                        {format(parseISO(user.createdAt), "dd MMM yyyy")}
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
                          <DropdownMenuItem onClick={() => {
                            setSelectedUser(user)
                            setIsViewDialogOpen(true)
                          }}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                  
                          
                          <DropdownMenuSeparator />
                          
                          <DropdownMenuItem 
                            onClick={() => {
                              navigator.clipboard.writeText(user._id)
                              toast.success("User ID copied to clipboard")
                            }}
                          >
                            <Copy className="mr-2 h-4 w-4" />
                            Copy User ID
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

      {/* View User Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedUser && (
            <>
              <DialogHeader>
                <DialogTitle>User Details</DialogTitle>
                <DialogDescription>
                  Complete information about the user
                </DialogDescription>
              </DialogHeader>

              <Tabs defaultValue="profile" className="mt-4">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="profile">Profile</TabsTrigger>
                  <TabsTrigger value="addresses">Addresses</TabsTrigger>
                  <TabsTrigger value="subscription">Subscription</TabsTrigger>
                </TabsList>

                <TabsContent value="profile" className="space-y-4">
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4 mb-6">
                        <Avatar className="h-16 w-16">
                          <AvatarFallback className="bg-primary/10 text-primary text-xl">
                            {getInitials(selectedUser.fullName, selectedUser.email)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="text-xl font-semibold">{selectedUser.fullName || 'N/A'}</h3>
                          <p className="text-black">@{selectedUser.username || 'username'}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-black">Email</p>
                          <p className="font-medium">{selectedUser.email}</p>
                        </div>
                        <div>
                          <p className="text-sm text-black">Mobile</p>
                          <p className="font-medium">{selectedUser.mobile || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-black">Role</p>
                          <Badge className={selectedUser.role === "admin" ? "bg-purple-600" : "bg-gray-600"}>
                            {selectedUser.role}
                          </Badge>
                        </div>
                        <div>
                          <p className="text-sm text-black">Verification</p>
                          {selectedUser.isVerified ? (
                            <Badge className="bg-success">Verified</Badge>
                          ) : (
                            <Badge variant="outline">Unverified</Badge>
                          )}
                        </div>
                        <div>
                          <p className="text-sm text-black">Referral Code</p>
                          <p className="font-mono text-sm">{selectedUser.referralCode || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-black">User ID</p>
                          <p className="font-mono text-sm">{selectedUser._id}</p>
                        </div>
                        <div>
                          <p className="text-sm text-black">Joined</p>
                          <p>{format(parseISO(selectedUser.createdAt), "PPP")}</p>
                        </div>
                        <div>
                          <p className="text-sm text-black">Last Updated</p>
                          <p>{format(parseISO(selectedUser.updatedAt), "PPP")}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="addresses">
                  <Card>
                    <CardContent className="p-6">
                      {selectedUser.addresses.length > 0 ? (
                        <div className="space-y-4">
                          {selectedUser.addresses.map((address, index) => (
                            <div key={index} className="border rounded-lg p-4">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  {getAddressIcon(address.type)}
                                  <Badge variant="outline" className="capitalize">
                                    {address.type}
                                  </Badge>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openGoogleMaps(address)}
                                  className="rounded-full"
                                >
                                  <MapPin size={14} className="mr-1" />
                                  View Map
                                </Button>
                              </div>
                              <p className="text-sm">
                                {address.houseNumber}, {address.area}
                              </p>
                              <p className="text-sm text-black">Pincode: {address.pincode}</p>
                              {address.coordinates && (
                                <p className="text-xs text-black mt-1">
                                  Coordinates: {address.coordinates.lat}, {address.coordinates.lng}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <MapPin size={48} className="mx-auto text-black mb-4" />
                          <p className="text-black">No addresses saved</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="subscription">
                  <Card>
                    <CardContent className="p-6">
                      {selectedUser.subscription?.active ? (
                        <div className="space-y-4">
                          <div className="flex items-center gap-2">
                            <Award className="text-primary" size={24} />
                            <h3 className="text-lg font-semibold">Active Subscription</h3>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-black">Plan</p>
                              <p className="font-medium">{selectedUser.subscription.plan}</p>
                            </div>
                            <div>
                              <p className="text-sm text-black">Status</p>
                              <Badge className="bg-success">Active</Badge>
                            </div>
                            <div>
                              <p className="text-sm text-black">Start Date</p>
                              <p>{format(parseISO(selectedUser.subscription.startDate), "dd MMM yyyy")}</p>
                            </div>
                            <div>
                              <p className="text-sm text-black">End Date</p>
                              <p>{format(parseISO(selectedUser.subscription.endDate), "dd MMM yyyy")}</p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Award size={48} className="mx-auto text-black mb-4" />
                          <p className="text-black">No active subscription</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Addresses Dialog */}
      <Dialog open={isAddressDialogOpen} onOpenChange={setIsAddressDialogOpen}>
        <DialogContent className="max-w-2xl">
          {selectedUser && (
            <>
              <DialogHeader>
                <DialogTitle>User Addresses</DialogTitle>
                <DialogDescription>
                  {selectedUser.fullName || selectedUser.email} has {selectedUser.addresses.length} saved {selectedUser.addresses.length === 1 ? 'address' : 'addresses'}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 max-h-96 overflow-y-auto">
                {selectedUser.addresses.length > 0 ? (
                  selectedUser.addresses.map((address, index) => (
                    <Card key={index}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            {getAddressIcon(address.type)}
                            <Badge variant="outline" className="capitalize">
                              {address.type}
                            </Badge>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openGoogleMaps(address)}
                            className="rounded-full"
                          >
                            <MapPin size={14} className="mr-1" />
                            Open in Maps
                          </Button>
                        </div>
                        
                        <div className="space-y-1">
                          <p className="text-sm">
                            <span className="text-black">Address:</span> {address.houseNumber}, {address.area}
                          </p>
                          <p className="text-sm">
                            <span className="text-black">Pincode:</span> {address.pincode}
                          </p>
                          {address.coordinates && (
                            <p className="text-xs text-black">
                              Coordinates: {address.coordinates.lat}, {address.coordinates.lng}
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <MapPin size={48} className="mx-auto text-black mb-4" />
                    <p className="text-black text-lg">No addresses found</p>
                    <p className="text-sm text-black">This user hasn't added any addresses yet</p>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}