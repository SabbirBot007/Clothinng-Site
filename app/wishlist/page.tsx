"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Heart, Trash2, ShoppingBag, Loader2 } from "lucide-react"
import toast from "react-hot-toast"

interface WishlistItem {
  id: string
  product: {
    id: string
    name: string
    slug: string
    price: number
    images: { url: string; altText: string | null }[]
    category: { name: string }
    variants: { stock: number }[]
  }
}

export default function WishlistPage() {
  const [items, setItems] = useState<WishlistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [removing, setRemoving] = useState<string | null>(null)

  async function fetchWishlist() {
    try {
      const res = await fetch("/api/wishlist")
      const data = await res.json()
      setItems(data)
    } catch {
      toast.error("Failed to load wishlist")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchWishlist() }, [])

  async function removeItem(productId: string) {
    setRemoving(productId)
    try {
      const res = await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      })
      if (!res.ok) throw new Error("Failed")
      setItems((prev) => prev.filter((item) => item.product.id !== productId))
      toast.success("Removed from wishlist")
    } catch {
      toast.error("Failed to remove item")
    } finally {
      setRemoving(null)
    }
  }

  if (loading) {
    return (
      <main style={{ paddingTop: "var(--nav-height)", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Loader2 size={32} style={{ color: "var(--gold)", animation: "spin 1s linear infinite" }} />
        <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      </main>
    )
  }

  return (
    <main style={{ paddingTop: "var(--nav-height)", minHeight: "100vh" }}>
      <div style={{ padding: "48px 0 64px" }}>
        <div className="container">
          <div style={{ marginBottom: "40px" }}>
            <p className="section-label">Saved</p>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px, 4vw, 48px)", fontWeight: 300 }}>
              My Wishlist
            </h1>
          </div>

          {items.length === 0 ? (
            <div style={{ textAlign: "center", padding: "80px 0" }}>
              <Heart size={48} style={{ color: "var(--text-muted)", margin: "0 auto 20px" }} />
              <p style={{ fontFamily: "var(--font-display)", fontSize: "28px", color: "var(--text-secondary)", marginBottom: "12px" }}>
                Your wishlist is empty
              </p>
              <p style={{ color: "var(--text-muted)", fontSize: "13px", marginBottom: "32px" }}>
                Save items you love for later
              </p>
              <Link href="/shop" className="btn-primary">Explore Collection</Link>
            </div>
          ) : (
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
              gap: "1px", background: "var(--border)",
            }}>
              {items.map((item) => {
                const totalStock = item.product.variants.reduce((s, v) => s + v.stock, 0)
                return (
                  <div key={item.id} className="product-card" style={{ display: "block", position: "relative" }}>
                    <Link href={`/shop/${item.product.slug}`} style={{ textDecoration: "none", color: "inherit" }}>
                      <div className="product-card-image">
                        {item.product.images[0]
                          ? <img src={item.product.images[0].url} alt={item.product.name} />
                          : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: "10px" }}>NO IMAGE</div>
                        }
                      </div>
                      <div className="product-card-info">
                        <p className="product-card-category">{item.product.category.name}</p>
                        <h3 className="product-card-name">{item.product.name}</h3>
                        <p className="product-card-price">৳{Number(item.product.price).toLocaleString()}</p>
                        {totalStock === 0 && (
                          <p style={{ fontSize: "10px", color: "#ef4444", letterSpacing: "0.1em", marginTop: "4px" }}>OUT OF STOCK</p>
                        )}
                      </div>
                    </Link>

                    {/* Action buttons */}
                    <div style={{ padding: "0 14px 14px", display: "flex", gap: "8px" }}>
                      <Link href={`/shop/${item.product.slug}`} className="btn-primary" style={{ flex: 1, justifyContent: "center", fontSize: "10px", padding: "10px" }}>
                        <ShoppingBag size={12} /> View Product
                      </Link>
                      <button
                        onClick={() => removeItem(item.product.id)}
                        disabled={removing === item.product.id}
                        style={{
                          background: "none", border: "1px solid var(--border)",
                          color: "var(--text-muted)", padding: "10px 12px",
                          cursor: "pointer", display: "flex", alignItems: "center",
                          transition: "all 0.2s",
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#ef4444"; e.currentTarget.style.color = "#ef4444" }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-muted)" }}
                      >
                        {removing === item.product.id
                          ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
                          : <Trash2 size={14} />}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </main>
  )
}
