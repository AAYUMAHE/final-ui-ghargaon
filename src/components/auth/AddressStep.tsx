"use client"

import { MapPin } from "lucide-react"
import AddressForm from "./AddressForm"

export default function AddressStep({ form, setForm, next, back, loading }: any) {

  const setHome = (value: any) => {
    setForm({
      ...form,
      homeAddress: value
    })
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="bg-orange-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
          <MapPin className="text-primary w-6 h-6" />
        </div>
        <h2 className="text-2xl font-bold text-textdark">Where should we deliver?</h2>
        <p className="text-black text-sm mt-1">Set your primary home address for tiffins.</p>
      </div>

      <AddressForm
        address={form.homeAddress}
        setAddress={setHome}
      />

      <div className="flex gap-4 pt-4">
        <button
          onClick={back}
          disabled={loading}
          className="w-1/3 border-2 border-gray-100 text-textdark font-semibold py-3.5 rounded-full hover:bg-gray-50 transition-colors active:scale-95"
        >
          Back
        </button>

        <button
          onClick={next}
          disabled={loading}
          className="w-2/3 bg-primary text-white font-semibold py-3.5 rounded-full shadow-lg shadow-primary/20 hover:bg-accent transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70"
        >
          {loading ? "Saving..." : "Complete Setup"}
        </button>
      </div>
    </div>
  )
}