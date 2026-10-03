"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Plus, Trash2, Loader2, Upload, X } from "lucide-react"
import toast from "react-hot-toast"

const SIZES = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"]

interface Category { id: string; name: string }
interface Variant { size: string; color: string; colorHex: string; stock: number }
interface UploadedImage { url: string; publicId: string; altText: string }

export default function NewProductPage() {
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    categoryId: "",
    brand: "",
    material: "",
    isActive: true,
    isFeatured: false,
  })

  const [images, setImages] = useState<UploadedImage[]>([])
  const [variants, setVariants] = useState<Variant[]>([
    { size: "M", color: "", colorHex: "#000000", stock: 0 },
  ])

  useEffect(() => {
    fetch("/api/admin/categories").then((r) => r.json()).then(setCategories)
  }, [])

  // ── Image upload ──
  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || files.length === 0) return
    setUploading(true)

    try {
      for (const file of Array.from(files)) {
        const formData = new FormData()
        formData.append("file", file)
        const res = await fetch("/api/admin/upload", { method: "POST", body: formData })
        if (!res.ok) throw new Error("Upload failed")
        const data = await res.json()
        setImages((prev) => [...prev, { url: data.url, publicId: data.publicId, altText: "" }])
      }
      toast.success("Images uploaded!")
    } catch {
      toast.error("Upload failed")
    } finally {
      setUploading(false)
    }
  }

  function removeImage(index: number) {
    setImages((prev) => prev.filter((_, i) => i !== index))
  }

  // ── Variants ──
  function addVariant() {
    setVariants((prev) => [...prev, { size: "M", color: "", colorHex: "#000000", stock: 0 }])
  }

  function removeVariant(index: number) {
    setVariants((prev) => prev.filter((_, i) => i !== index))
  }

  function updateVariant(index: number, field: keyof Variant, value: string | number) {
    setVariants((prev) => prev.map((v, i) => i === index ? { ...v, [field]: value } : v))
  }

  // ── Submit ──
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.categoryId) { toast.error("Please select a category"); return }
    if (images.length === 0) { toast.error("Please upload at least one image"); return }
    if (variants.some((v) => !v.color.trim())) { toast.error("All variants need a color name"); return }

    setSaving(true)
    try {
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, price: parseFloat(form.price), images, variants }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed")
      }
      toast.success("Product created!")
      router.push("/admin/products")
    } catch (err: any) {
      toast.error(err.message || "Failed to create product")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ maxWidth: "100%", overflowX: "hidden" }}>
      <div style={{ marginBottom: "40px" }}>
        <p className="section-label">Admin › Products</p>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "36px", fontWeight: 300 }}>
          Add New Product
        </h1>
      </div>

      <form onSubmit={handleSubmit} style={{ width: "100%" }}>
        <div className="main-layout-grid">

          {/* ── Left column ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px", minWidth: 0 }}>

            {/* Basic info */}
            <div style={{ background: "var(--black-card)", border: "1px solid var(--border)", padding: "32px", maxWidth: "100%" }} className="mobile-card-padding">
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: "20px", fontWeight: 300, marginBottom: "24px" }}>
                Basic Information
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px", width: "100%" }}>
                <div style={{ width: "100%" }}>
                  <label className="admin-label">Product Name *</label>
                  <input className="input-luxury mobile-safe-input" placeholder="e.g. Classic Oxford Shirt" value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div style={{ width: "100%" }}>
                  <label className="admin-label">Description *</label>
                  <textarea className="input-luxury mobile-safe-input" placeholder="Describe the product..." value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={4} style={{ resize: "vertical" }} required />
                </div>
                <div className="two-col-grid">
                  <div style={{ width: "100%" }}>
                    <label className="admin-label">Price (৳) *</label>
                    <input className="input-luxury mobile-safe-input" type="number" placeholder="2500" min="0" step="0.01"
                      value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
                  </div>
                  <div style={{ width: "100%" }}>
                    <label className="admin-label">Category *</label>
                    <select className="input-luxury mobile-safe-input" value={form.categoryId}
                      onChange={(e) => setForm({ ...form, categoryId: e.target.value })} required>
                      <option value="">Select category</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="two-col-grid">
                  <div style={{ width: "100%" }}>
                    <label className="admin-label">Brand</label>
                    <input className="input-luxury mobile-safe-input" placeholder="e.g. Maison" value={form.brand}
                      onChange={(e) => setForm({ ...form, brand: e.target.value })} />
                  </div>
                  <div style={{ width: "100%" }}>
                    <label className="admin-label">Material</label>
                    <input className="input-luxury mobile-safe-input" placeholder="e.g. 100% Cotton" value={form.material}
                      onChange={(e) => setForm({ ...form, material: e.target.value })} />
                  </div>
                </div>
              </div>
            </div>

            {/* Images */}
            <div style={{ background: "var(--black-card)", border: "1px solid var(--border)", padding: "32px", maxWidth: "100%" }} className="mobile-card-padding">
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: "20px", fontWeight: 300, marginBottom: "24px" }}>
                Product Images
              </h2>

              {/* Upload button */}
              <label style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: "12px",
                border: "1px dashed var(--border)", padding: "32px", cursor: "pointer",
                transition: "border-color 0.2s", marginBottom: "16px",
                color: "var(--text-muted)", fontSize: "13px", textAlign: "center",
                width: "100%", boxSizing: "border-box"
              }}
                className="upload-zone"
              >
                {uploading ? <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} /> : <Upload size={18} />}
                {uploading ? "Uploading..." : "Click to upload images"}
                <input type="file" accept="image/*" multiple onChange={handleImageUpload}
                  style={{ display: "none" }} disabled={uploading} />
              </label>

              {/* Image previews */}
              {images.length > 0 && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: "8px" }}>
                  {images.map((img, i) => (
                    <div key={i} style={{ position: "relative", aspectRatio: "3/4", background: "var(--black-soft)" }}>
                      <img src={img.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      {i === 0 && (
                        <span style={{
                          position: "absolute", top: "4px", left: "4px", fontSize: "8px",
                          background: "var(--gold)", color: "var(--black)", padding: "2px 6px",
                          letterSpacing: "0.1em", fontWeight: 600,
                        }}>COVER</span>
                      )}
                      <button type="button" onClick={() => removeImage(i)} style={{
                        position: "absolute", top: "4px", right: "4px",
                        background: "rgba(0,0,0,0.7)", border: "none", color: "white",
                        width: "20px", height: "20px", cursor: "pointer", display: "flex",
                        alignItems: "center", justifyContent: "center",
                      }}>
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Variants */}
            <div style={{ background: "var(--black-card)", border: "1px solid var(--border)", padding: "32px", maxWidth: "100%" }} className="mobile-card-padding">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
                <h2 style={{ fontFamily: "var(--font-display)", fontSize: "20px", fontWeight: 300 }}>
                  Size & Color Variants
                </h2>
                <button type="button" onClick={addVariant} className="btn-ghost" style={{ padding: "8px 16px", fontSize: "11px" }}>
                  <Plus size={13} /> Add Variant
                </button>
              </div>

              {/* Scrollable Wrapper for the Variants Table */}
              <div style={{ overflowX: "auto", paddingBottom: "8px", width: "100%" }}>
                <div style={{ minWidth: "450px" }}>
                  {/* Header */}
                  <div style={{ display: "grid", gridTemplateColumns: "110px 1fr 90px 80px 36px", gap: "12px", marginBottom: "12px" }}>
                    {["Size", "Color Name", "Color Hex", "Stock", ""].map((h) => (
                      <p key={h} style={{ fontSize: "9px", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-muted)" }}>
                        {h}
                      </p>
                    ))}
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {variants.map((v, i) => (
                      <div key={i} style={{ display: "grid", gridTemplateColumns: "110px 1fr 90px 80px 36px", gap: "12px", alignItems: "center" }}>
                        <select className="input-luxury" style={{ padding: "10px 12px", width: "100%", boxSizing: "border-box" }}
                          value={v.size} onChange={(e) => updateVariant(i, "size", e.target.value)}>
                          {SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <input className="input-luxury" style={{ padding: "10px 12px", width: "100%", boxSizing: "border-box" }}
                          placeholder="e.g. Navy Blue" value={v.color}
                          onChange={(e) => updateVariant(i, "color", e.target.value)} />
                        <input type="color" value={v.colorHex}
                          onChange={(e) => updateVariant(i, "colorHex", e.target.value)}
                          style={{ width: "100%", height: "40px", border: "1px solid var(--border)", background: "var(--black-card)", cursor: "pointer", padding: "2px", boxSizing: "border-box" }} />
                        <input className="input-luxury" style={{ padding: "10px 12px", width: "100%", boxSizing: "border-box" }}
                          type="number" min="0" placeholder="0" value={v.stock}
                          onChange={(e) => updateVariant(i, "stock", parseInt(e.target.value) || 0)} />
                        <button type="button" onClick={() => removeVariant(i)}
                          disabled={variants.length === 1}
                          style={{
                            background: "none", border: "1px solid var(--border)", color: "var(--text-muted)",
                            width: "36px", height: "40px", cursor: "pointer", display: "flex",
                            alignItems: "center", justifyContent: "center", transition: "all 0.2s",
                            opacity: variants.length === 1 ? 0.3 : 1,
                          }}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Right column ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px", minWidth: 0 }}>

            {/* Publish */}
            <div style={{ background: "var(--black-card)", border: "1px solid var(--border)", padding: "28px", maxWidth: "100%" }}>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: "20px", fontWeight: 300, marginBottom: "20px" }}>
                Publish
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}>
                  <div>
                    <p style={{ fontSize: "13px", color: "var(--text-primary)", marginBottom: "2px" }}>Active</p>
                    <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>Visible in store</p>
                  </div>
                  <input type="checkbox" checked={form.isActive}
                    onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                    style={{ width: "18px", height: "18px", accentColor: "var(--gold)", cursor: "pointer" }} />
                </label>
                <div style={{ height: "1px", background: "var(--border)" }} />
                <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}>
                  <div>
                    <p style={{ fontSize: "13px", color: "var(--text-primary)", marginBottom: "2px" }}>Featured</p>
                    <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>Show on homepage</p>
                  </div>
                  <input type="checkbox" checked={form.isFeatured}
                    onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })}
                    style={{ width: "18px", height: "18px", accentColor: "var(--gold)", cursor: "pointer" }} />
                </label>
              </div>
            </div>

            {/* Submit */}
            <button type="submit" disabled={saving} className="btn-primary"
              style={{ justifyContent: "center", width: "100%", padding: "16px", boxSizing: "border-box" }}>
              {saving ? <Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> : <Plus size={15} />}
              {saving ? "Creating Product..." : "Create Product"}
            </button>

            <button type="button" onClick={() => router.push("/admin/products")}
              className="btn-ghost" style={{ justifyContent: "center", width: "100%", padding: "15px", boxSizing: "border-box" }}>
              Cancel
            </button>
          </div>
        </div>
      </form>

      <style>{`
        .admin-label {
          display: block;
          font-size: 10px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: var(--text-muted);
          margin-bottom: 8px;
          font-family: var(--font-body);
        }
        
        .upload-zone:hover { border-color: var(--gold) !important; color: var(--gold) !important; }
        
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        
        select.input-luxury option { background: var(--black-card); }

        /* STRICT BOX SIZING FIX FOR INPUTS */
        .mobile-safe-input {
          width: 100% !important;
          max-width: 100% !important;
          box-sizing: border-box !important;
        }

        /* Responsive Layout Classes */
        .main-layout-grid {
          display: grid;
          grid-template-columns: 1fr 380px;
          gap: 32px;
          align-items: start;
          width: 100%;
        }

        .two-col-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          width: 100%;
        }

        /* Responsive Breakpoints */
        @media (max-width: 900px) {
          .main-layout-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 600px) {
          .two-col-grid {
            grid-template-columns: 1fr;
          }
          .mobile-card-padding {
            padding: 20px !important;
          }
        }
        
        /* Optional: Subtly style the horizontal scrollbar for the variants table */
        div::-webkit-scrollbar { height: 8px; }
        div::-webkit-scrollbar-track { background: var(--black-card); }
        div::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }
        div::-webkit-scrollbar-thumb:hover { background: var(--text-muted); }
      `}</style>
    </div>
  )
}