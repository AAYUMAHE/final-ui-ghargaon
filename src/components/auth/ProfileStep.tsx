"use client"

import { useState } from "react"
import axios from "axios"
import debounce from "lodash.debounce"
import { CheckCircle2, XCircle, User, AtSign, Phone, Loader2 } from "lucide-react"

export default function ProfileStep({ form, setForm, next }: any) {
  const [checking, setChecking] = useState(false)
  const[usernameStatus, setUsernameStatus] = useState<{
    available?: boolean
    message?: string
  }>({})

  const checkUsername = debounce(async (value: string) => {
    if (!value || value.length < 3) {
      setUsernameStatus({})
      setChecking(false)
      return
    }

    setChecking(true)
    try {
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/username-available`,
        { params: { username: value } }
      )
      setUsernameStatus(res.data)
    } catch (err: any) {
      if (err.response?.data) setUsernameStatus(err.response.data)
    } finally {
      setChecking(false)
    }
  }, 600)

  const handleUsernameChange = (value: string) => {
    setForm({ ...form, username: value.toLowerCase().trim() })
    setChecking(true)
    checkUsername(value)
  }

  // Basic validation to enable next button
  const isValid = form.fullName.length > 2 && form.mobile.length >= 10 && usernameStatus.available

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-textdark">Let's get to know you</h2>
        <p className="text-black text-sm mt-1">Just a few details to personalize your experience.</p>
      </div>

      <div className="space-y-5">
        {/* FULL NAME */}
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-textdark ml-1">Full Name</label>
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-black w-5 h-5" />
            <input
              placeholder="e.g. Rahul Sharma"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-12 py-3 focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-black/50"
            />
          </div>
        </div>

        {/* USERNAME */}
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-textdark ml-1">Choose a Username</label>
          <div className="relative">
            <AtSign className="absolute left-4 top-1/2 -translate-y-1/2 text-black w-5 h-5" />
            <input
              placeholder="e.g. rahul_eats"
              value={form.username}
              onChange={(e) => handleUsernameChange(e.target.value)}
              className={`w-full border rounded-xl px-12 py-3 focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-black/50 ${
                usernameStatus.available === false ? "border-red-300 focus:ring-red-400" : "border-gray-200"
              }`}
            />
            {/* Status Icons */}
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              {checking && <Loader2 className="w-5 h-5 text-black animate-spin" />}
              {!checking && usernameStatus.available === true && <CheckCircle2 className="w-5 h-5 text-green-500" />}
              {!checking && usernameStatus.available === false && <XCircle className="w-5 h-5 text-red-500" />}
            </div>
          </div>
          
          {/* Status Message */}
          {usernameStatus.message && !checking && (
            <p className={`text-xs ml-1 font-medium ${usernameStatus.available ? "text-green-600" : "text-red-500"}`}>
              {usernameStatus.message}
            </p>
          )}
        </div>

        {/* MOBILE */}
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-textdark ml-1">Mobile Number</label>
          <div className="relative">
            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-black w-5 h-5" />
            <input
              type="tel"
              placeholder="10-digit mobile number"
              value={form.mobile}
              onChange={(e) => setForm({ ...form, mobile: e.target.value.replace(/\D/g, '').slice(0,10) })}
              className="w-full border border-gray-200 rounded-xl px-12 py-3 focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-black/50"
            />
          </div>
        </div>
      </div>

      <button
        disabled={!isValid}
        onClick={next}
        className="w-full bg-primary text-white py-4 mt-4 rounded-full font-semibold shadow-lg shadow-primary/20 hover:bg-accent transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 disabled:shadow-none"
      >
        Continue
      </button>
    </div>
  )
}