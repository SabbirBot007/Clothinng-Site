"use client"

import { useState, useEffect } from "react"
import { Trash2, Plus, Loader2 } from "lucide-react"
import toast from "react-hot-toast"

interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  isActive: boolean
  _count?: { products: number }
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: "", description: "" })

  async function fetchCategories() {
    const res = await fetch("/api/admin/categories")
    const data = await res.json()
    setCategories(data)
    setLoading(false)
  }

  useEffect(() => { fetchCategories() }, [])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return
    setSaving(true)
    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error("Failed")
      toast.success("Category added!")
      setForm({ name: "", description: "" })
      fetchCategories()
    } catch {
      toast.error("Failed to add category")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"? Products in this category will be affected.`)) return
    try {
      const res = await fetch(`/api/admin/categories/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed")
      toast.success("Category deleted")
      fetchCategories()
    } catch {
      toast.error("Failed to delete category")
    }
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "40px" }}>
        <p className="section-label">Admin</p>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "36px", fontWeight: 300 }}>
          Categories
        </h1>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: "32px", alignItems: "start" }}>

        {/* ── Add Category Form ── */}
        <div style={{
          background: "var(--black-card)",
          border: "1px solid var(--border)",
          padding: "32px",
        }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "22px", fontWeight: 300, marginBottom: "24px" }}>
            Add New Category
          </h2>

          <form onSubmit={handleAdd} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label style={{ fontSize: "10px", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-muted)", display: "block", marginBottom: "8px" }}>
                Category Name *
              </label>
              <input
                className="input-luxury"
                placeholder="e.g. Jackets"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>

            <div>
              <label style={{ fontSize: "10px", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-muted)", display: "block", marginBottom: "8px" }}>
                Description
              </label>
              <textarea
                className="input-luxury"
                placeholder="Short description (optional)"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                style={{ resize: "vertical" }}
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="btn-primary"
              style={{ justifyContent: "center", marginTop: "8px" }}
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              {saving ? "Adding..." : "Add Category"}
            </button>
          </form>
        </div>

        {/* ── Categories List ── */}
        <div style={{
          background: "var(--black-card)",
          border: "1px solid var(--border)",
        }}>
          <div style={{ padding: "24px 32px", borderBottom: "1px solid var(--border)" }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "22px", fontWeight: 300 }}>
              All Categories
            </h2>
          </div>

          {loading ? (
            <div style={{ padding: "48px", textAlign: "center", color: "var(--text-muted)" }}>
              <Loader2 size={24} style={{ margin: "0 auto", animation: "spin 1s linear infinite" }} />
            </div>
          ) : categories.length === 0 ? (
            <div style={{ padding: "48px", textAlign: "center" }}>
              <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>No categories yet</p>
            </div>
          ) : (
            <div>
              {categories.map((cat, i) => (
                <div
                  key={cat.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "16px 32px",
                    borderBottom: i < categories.length - 1 ? "1px solid var(--border-soft)" : "none",
                  }}
                >
                  <div>
                    <p style={{ fontSize: "14px", color: "var(--text-primary)", fontWeight: 500, marginBottom: "2px" }}>
                      {cat.name}
                    </p>
                    <p style={{ fontSize: "11px", color: "var(--text-muted)", letterSpacing: "0.05em" }}>
                      /{cat.slug} · {cat._count?.products ?? 0} products
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(cat.id, cat.name)}
                    style={{
                      background: "none",
                      border: "1px solid var(--border)",
                      color: "var(--text-muted)",
                      padding: "8px",
                      cursor: "pointer",
                      transition: "all 0.2s",
                      display: "flex",
                      alignItems: "center",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "#ef4444"
                      e.currentTarget.style.color = "#ef4444"
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "var(--border)"
                      e.currentTarget.style.color = "var(--text-muted)"
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
