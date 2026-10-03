"use client"

import { useState } from "react"
import { Trash2, Loader2 } from "lucide-react"
import toast from "react-hot-toast"
import { useRouter } from "next/navigation"

export default function AdminDeleteProduct({
  productId,
  productName,
}: {
  productId: string
  productName: string
}) {
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()

  async function handleDelete() {
    if (!confirm(`Delete "${productName}"? This cannot be undone.`)) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/products/${productId}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed")
      toast.success("Product deleted")
      router.refresh()
    } catch {
      toast.error("Failed to delete product")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={deleting}
      style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        width: "32px", height: "32px",
        border: "1px solid var(--border)",
        color: "var(--text-muted)",
        background: "none", cursor: "pointer",
        transition: "all 0.2s",
      }}
      className="admin-delete-btn"
    >
      {deleting
        ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} />
        : <Trash2 size={13} />
      }
      <style>{`
        .admin-delete-btn:hover { border-color: #ef4444 !important; color: #ef4444 !important; }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      `}</style>
    </button>
  )
}
