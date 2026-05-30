"use client"

import { useState } from "react"
import axios from "axios"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"

import { useAppDispatch } from "@/store/hooks"
import { updateUser } from "@/store/slices/userSlice"

import ProfileStep from "@/components/auth/ProfileStep"
import AddressStep from "@/components/auth/AddressStep"

export default function CompleteProfilePage() {
  const router = useRouter()
  const dispatch = useAppDispatch()

  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)

  const[form, setForm] = useState({
    fullName: "",
    username: "",
    mobile: "",
    homeAddress: {
      type: "home",
      houseNumber: "",
      area: "",
      pincode: "",
      coordinates: { lat: 0, lng: 0 }
    }
  })

  const submitProfile = async () => {
    // Basic validation
    if (!form.homeAddress.area || !form.homeAddress.houseNumber) {
      return toast.error("Please fill in your complete address")
    }

    setLoading(true)
    try {
      const payload = {
        fullName: form.fullName,
        username: form.username,
        mobile: form.mobile,
        addresses: [form.homeAddress]
      }

      const promise = axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/update`,
        payload,
        { withCredentials: true }
      )

      await toast.promise(promise, {
        loading: "Setting up your kitchen...",
        success: "Profile completed successfully!",
        error: "Failed to update profile."
      })

      const res = await promise
      dispatch(updateUser(res.data))
      router.push("/")
      
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-soft px-6 py-12 relative overflow-hidden">
      {/* Warm Background Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-accent/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

      {/* Progress Indicator */}
      <div className="w-full max-w-lg mb-6 flex items-center justify-between px-2 relative z-10">
        <div className="flex gap-2 w-full">
          <div className="h-2 flex-1 bg-primary rounded-full transition-all duration-500" />
          <div className={`h-2 flex-1 rounded-full transition-all duration-500 ${step === 2 ? 'bg-primary' : 'bg-gray-200'}`} />
        </div>
      </div>

      <div className="bg-white shadow-xl shadow-primary/5 rounded-2xl w-full max-w-lg p-8 md:p-10 relative z-10 border border-orange-50/50">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <ProfileStep
                form={form}
                setForm={setForm}
                next={() => setStep(2)}
              />
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <AddressStep
                form={form}
                setForm={setForm}
                next={submitProfile}
                back={() => setStep(1)}
                loading={loading}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}