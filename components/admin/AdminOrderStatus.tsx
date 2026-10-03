"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"
import toast from "react-hot-toast"
import { useRouter } from "next/navigation"

// No PAID — COD only store
const statuses = [
  { value: "PENDING",    label: "Pending",    color: "#f59e0b" },
  { value: "PROCESSING", label: "Processing", color: "#3b82f6" },
  { value: "SHIPPED",    label: "Shipped",    color: "#8b5cf6" },
  { value: "DELIVERED",  label: "Delivered",  color: "#22c55e" },
  { value: "CANCELLED",  label: "Cancelled",  color: "#ef4444" },
  { value: "REFUNDED",   label: "Refunded",   color: "#9ca3af" },
]

export default function AdminOrderStatus({
  orderId,
  currentStatus,
}: {
  orderId: string
  currentStatus: string
}) {
  const [status, setStatus] = useState(currentStatus)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const current = statuses.find((s) => s.value === status) || statuses[0]

  async function handleChange(newStatus: string) {
    if (newStatus === status) return
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed")
      }

      setStatus(newStatus)
      toast.success(`Order marked as ${newStatus.toLowerCase()}`)
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || "Failed to update status")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      {loading && (
        <Loader2
          size={14}
          style={{ color: "var(--gold)", animation: "spin 1s linear infinite" }}
        />
      )}
      <select
        value={status}
        onChange={(e) => handleChange(e.target.value)}
        disabled={loading}
        style={{
          background: "var(--black-soft)",
          border: `1px solid ${current.color}60`,
          color: current.color,
          fontSize: "10px",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          fontWeight: 600,
          padding: "7px 12px",
          cursor: loading ? "not-allowed" : "pointer",
          fontFamily: "var(--font-body)",
          outline: "none",
          opacity: loading ? 0.5 : 1,
          transition: "all 0.2s",
        }}
      >
        {statuses.map((s) => (
          <option
            key={s.value}
            value={s.value}
            style={{ background: "var(--black-card)", color: s.color }}
          >
            {s.label}
          </option>
        ))}
      </select>
      <style>{`
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      `}</style>
    </div>
  )
}
