"use client"

import { useState } from "react"
import { MapPin, Navigation, Home, Map as MapIcon } from "lucide-react"
import { toast } from "sonner"

export default function AddressForm({ address, setAddress }: any) {
  const[detecting, setDetecting] = useState(false)

  // Function to grab real GPS coordinates
  const detectLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser")
      return
    }

    setDetecting(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setAddress({
          ...address,
          coordinates: { 
            lat: position.coords.latitude, 
            lng: position.coords.longitude 
          }
        })
        setDetecting(false)
        toast.success("Location detected successfully!")
      },
      (error) => {
        setDetecting(false)
        toast.error("Please allow location access in your browser.")
      }
    )
  }

  const hasLocation = address.coordinates.lat !== 0

  return (
    <div className="space-y-4">
      
      {/* Visual Map / GPS Feature */}
      <div className="relative bg-soft border border-orange-200 rounded-xl p-4 overflow-hidden">
        {/* Subtle background map pattern effect */}
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] pointer-events-none" />
        
        <div className="relative z-10 flex flex-col items-center text-center space-y-3">
          {hasLocation ? (
            <>
              <div className="bg-green-100 p-2 rounded-full">
                <MapIcon className="text-green-600 w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-green-700">Location Pinned!</p>
                <p className="text-xs text-black">Ready for accurate delivery</p>
              </div>
            </>
          ) : (
            <>
              <div className="bg-white p-2 rounded-full shadow-sm border border-gray-100">
                <MapPin className="text-primary w-6 h-6" />
              </div>
              <p className="text-sm text-textdark font-medium">Pinpoint your exact location</p>
            </>
          )}

          <button 
            type="button"
            onClick={detectLocation}
            disabled={detecting}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all active:scale-95 ${
              hasLocation 
              ? "bg-white text-textdark border border-gray-200 hover:bg-gray-50" 
              : "bg-primary text-white shadow-md shadow-primary/20 hover:bg-accent"
            }`}
          >
            <Navigation className={`w-4 h-4 ${detecting ? 'animate-spin' : ''}`} />
            {detecting ? "Locating..." : hasLocation ? "Update Location" : "Detect Current Location"}
          </button>
        </div>
      </div>

      {/* Manual Address Inputs */}
      <div className="space-y-3 pt-2">
        <div className="relative">
          <Home className="absolute left-4 top-1/2 -translate-y-1/2 text-black w-5 h-5" />
          <input
            placeholder="House / Flat Number"
            value={address.houseNumber}
            onChange={(e) => setAddress({ ...address, houseNumber: e.target.value })}
            className="w-full border border-gray-200 rounded-xl px-12 py-3 focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-black/50"
          />
        </div>

        <div className="relative">
          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-black w-5 h-5" />
          <input
            placeholder="Area / Landmark / Street"
            value={address.area}
            onChange={(e) => setAddress({ ...address, area: e.target.value })}
            className="w-full border border-gray-200 rounded-xl px-12 py-3 focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-black/50"
          />
        </div>

        <div className="relative">
          <Navigation className="absolute left-4 top-1/2 -translate-y-1/2 text-black w-5 h-5" />
          <input
            type="text"
            maxLength={6}
            placeholder="Pincode"
            value={address.pincode}
            onChange={(e) => setAddress({ ...address, pincode: e.target.value.replace(/\D/g, '') })}
            className="w-full border border-gray-200 rounded-xl px-12 py-3 focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-black/50"
          />
        </div>
      </div>

    </div>
  )
}