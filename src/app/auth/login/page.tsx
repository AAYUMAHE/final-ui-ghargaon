"use client"

import { useState } from "react"
import axios from "axios"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Mail, Lock, Utensils, ArrowLeft, Loader2 } from "lucide-react"

import { useAppDispatch } from "@/store/hooks"
import { setUser } from "@/store/slices/userSlice"

export default function LoginPage() {
  const router = useRouter()
  const dispatch = useAppDispatch()

  const [step, setStep] = useState<"email" | "otp">("email")
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("")

    const sendOtp = async () => {
    if (!email) return toast.error("Please enter your email")

    setLoading(true)
    try {
      const promise = axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/send-otp`,
        { email },
        { withCredentials: true }
      )

      // 1. Register the toast handler synchronously (does not block execution)
      toast.promise(promise, {
        loading: "Sending your magic code...",
        success: "OTP sent to your email!",
        error: (error) => {
          if (axios.isAxiosError(error)) {
            return error.response?.data?.message || "Failed to send OTP"
          }
          return "Failed to send OTP"
        }
      })

      // 2. Explicitly block execution by awaiting the actual Axios API call
      await promise

      // 3. Only transition to the OTP step if the API call was successful (200 OK)
      setStep("otp")
    } catch (error) {
      // 4. Log the error; duplicate toast.error alerts are removed since 
      //    toast.promise has already handled displaying the backend message.
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const verifyOtp = async () => {
    if (!otp) return toast.error("Please enter the OTP")

    setLoading(true)
    try {
      const promise = axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/verify-otp`,
        { email, otp },
        { withCredentials: true }
      )

      await toast.promise(promise, {
        loading: "Verifying...",
        success: "Welcome back!",
        error: "Invalid OTP. Please check again."
      })

      const res = await promise
      const user = res.data.user

      dispatch(setUser(user))

      if (user.role === "admin") {
        router.push("/admin")
        return
      }

      if (!user.fullName || !user.username) {
        router.push("/auth/complete-profile")
      } else {
        router.push("/")
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-soft px-6 py-12">
      {/* Background Decorative Circles */}
      <div className="fixed top-0 left-0 w-64 h-64 bg-accent/10 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl" />
      <div className="fixed bottom-0 right-0 w-96 h-96 bg-primary/10 rounded-full translate-x-1/3 translate-y-1/3 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative bg-white shadow-xl rounded-2xl w-full max-w-md p-8 md:p-10 border border-orange-100"
      >
        {/* Logo & Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="bg-primary p-3 rounded-full mb-4 shadow-lg shadow-primary/20">
            <Utensils className="text-white w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-black" >Ghar Gaon</h1>
          <p className=" text-center mt-2">
            {step === "email"
              ? "Fresh homemade meals are just a login away."
              : "Enter the code sent to your email."}
          </p>
        </div>

        <AnimatePresence mode="wait">
          {step === "email" ? (
            <motion.div
              key="email-step"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-5"
            >
              <div className="space-y-2">
                <label className="text-sm font-semibold text-black ml-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 text-black  -translate-y-1/2  w-5 h-5" />
                  <input
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-12 py-3 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-black/60"
                  />
                </div>
              </div>

              <button
                onClick={sendOtp}
                disabled={loading}
                className="w-full bg-primary text-white py-4 rounded-full font-semibold shadow-lg shadow-primary/20 hover:bg-accent transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Continue"}
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="otp-step"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-5"
            >
              <button
                onClick={() => setStep("email")}
                className="flex items-center gap-1 text-primary text-sm font-medium hover:underline mb-2"
              >
                <ArrowLeft className="w-4 h-4" /> Change email
              </button>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-textdark ml-1">Verification Code</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-black w-5 h-5" />
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="Enter 6-digit OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-12 py-3 tracking-[0.5em] font-bold text-center focus:ring-2 focus:ring-primary outline-none transition-all"
                  />
                </div>
              </div>

              <button
                onClick={verifyOtp}
                disabled={loading}
                className="w-full bg-primary text-white py-4 rounded-full font-semibold shadow-lg shadow-primary/20 hover:bg-accent transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verify & Login"}
              </button>

              <p className="text-center text-sm text-black">
                Didn't receive code? <button onClick={sendOtp} className="text-primary font-semibold">Resend</button>
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer Info */}
        <div className="mt-10 pt-6 border-t border-gray-100">
          <p className="text-xs text-center text-black leading-relaxed">
            By continuing, you agree to Ghar Gaon's <br />
            <span className="text-textdark font-medium underline cursor-pointer">Terms of Service</span> and <span className="text-textdark font-medium underline cursor-pointer">Privacy Policy</span>
          </p>
        </div>
      </motion.div>
    </div>
  )
}