"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import { toast } from "sonner";

export default function PaymentSuccess() {
  const params = useSearchParams();
  const router = useRouter();
    const [status , setStatus] = useState("Verifying payment...");
  useEffect(() => {
    const verify = async () => {
      const orderId = params.get("order_id");

      if (!orderId) return;

      try {
        const res = await api.post("/payments/verify", { orderId });

        if (res.data.status === "success") {
          toast.success("Payment successful 🎉");
          router.push("/orders");
          setStatus("Payment successful! Redirecting to orders...");
        } else {
          toast.error("Payment failed");
            setStatus("Payment failed. Please try again.");
        }

      } catch {
        toast.error("Verification failed");
      }
    };

    verify();
  }, []);

  return (
    <div className="h-screen flex items-center justify-center">
      <p className="text-lg font-semibold">{status}</p>
    </div>
  );
}