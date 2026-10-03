"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, XCircle } from "lucide-react"
import toast from "react-hot-toast"

export default function CancelOrderButton({ orderId }: { orderId: string }) {
  const [loading, setLoading] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const router = useRouter()

  async function handleCancel() {
    setLoading(true)
    try {
      const res = await fetch(`/api/orders/${orderId}/cancel`, {
        method: "PATCH",
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to cancel")
      toast.success("Order cancelled successfully")
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || "Failed to cancel order")
    } finally {
      setLoading(false)
      setShowConfirm(false)
    }
  }

  if (showConfirm) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <p style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
          Are you sure?
        </p>
        <button
          onClick={handleCancel}
          disabled={loading}
          style={{
            background: "#ef4444", border: "none", color: "white",
            fontSize: "11px", letterSpacing: "0.08em", textTransform: "uppercase",
            fontWeight: 600, padding: "8px 16px", cursor: "pointer",
            fontFamily: "var(--font-body)", display: "flex", alignItems: "center", gap: "6px",
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading
            ? <><Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} /> Cancelling...</>
            : "Yes, Cancel"
          }
        </button>
        <button
          onClick={() => setShowConfirm(false)}
          disabled={loading}
          style={{
            background: "none", border: "1px solid var(--border)", color: "var(--text-secondary)",
            fontSize: "11px", letterSpacing: "0.08em", textTransform: "uppercase",
            fontWeight: 500, padding: "8px 16px", cursor: "pointer",
            fontFamily: "var(--font-body)",
          }}
        >
          Keep Order
        </button>
        <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      </div>
    )
  }

  return (
    <button
      onClick={() => setShowConfirm(true)}
      style={{
        background: "none",
        border: "1px solid rgba(239,68,68,0.4)",
        color: "#ef4444",
        fontSize: "11px", letterSpacing: "0.08em", textTransform: "uppercase",
        fontWeight: 500, padding: "8px 16px", cursor: "pointer",
        fontFamily: "var(--font-body)", display: "flex", alignItems: "center", gap: "6px",
        transition: "all 0.2s",
      }}
      onMouseEnter={(e) => e.currentTarget.style.background = "rgba(239,68,68,0.1)"}
      onMouseLeave={(e) => e.currentTarget.style.background = "none"}
    >
      <XCircle size={13} /> Cancel Order
    </button>
  )
}
