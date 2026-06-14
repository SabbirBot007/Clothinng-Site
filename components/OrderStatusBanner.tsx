"use client"

import { useEffect } from "react"
import toast from "react-hot-toast"
import { CheckCircle, XCircle } from "lucide-react"

interface Props {
  status?: string
  orderId?: string
}

export default function OrderStatusBanner({ status, orderId }: Props) {
  useEffect(() => {
    if (status === "success") {
      toast.custom(
        (t) => (
          <div style={{
            background: "var(--black-card)",
            border: "1px solid #22c55e",
            padding: "16px 20px",
            display: "flex",
            alignItems: "flex-start",
            gap: "12px",
            maxWidth: "360px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
            opacity: t.visible ? 1 : 0,
            transition: "opacity 0.3s ease",
          }}>
            <CheckCircle size={20} style={{ color: "#22c55e", flexShrink: 0, marginTop: "1px" }} />
            <div>
              <p style={{ fontSize: "14px", color: "#22c55e", fontWeight: 600, marginBottom: "4px", fontFamily: "var(--font-body)" }}>
                Order Successful!
              </p>
              <p style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.5, fontFamily: "var(--font-body)" }}>
                Your order has been placed. We'll start processing it right away.
              </p>
            </div>
          </div>
        ),
        { duration: 6000, position: "top-center" }
      )
    }

    if (status === "failed") {
      toast.custom(
        (t) => (
          <div style={{
            background: "var(--black-card)",
            border: "1px solid #ef4444",
            padding: "16px 20px",
            display: "flex",
            alignItems: "flex-start",
            gap: "12px",
            maxWidth: "360px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
            opacity: t.visible ? 1 : 0,
            transition: "opacity 0.3s ease",
          }}>
            <XCircle size={20} style={{ color: "#ef4444", flexShrink: 0, marginTop: "1px" }} />
            <div>
              <p style={{ fontSize: "14px", color: "#ef4444", fontWeight: 600, marginBottom: "4px", fontFamily: "var(--font-body)" }}>
                Order Failed
              </p>
              <p style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.5, fontFamily: "var(--font-body)" }}>
                Your order was not placed. Please try again or contact support.
              </p>
            </div>
          </div>
        ),
        { duration: 6000, position: "top-center" }
      )
    }
  }, [status])

  return null
}
