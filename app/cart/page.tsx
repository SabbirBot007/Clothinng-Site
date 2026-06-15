"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Trash2, Plus, Minus, ShoppingBag, Loader2 } from "lucide-react"
import toast from "react-hot-toast"

interface CartItem {
  id: string
  quantity: number
  product: {
    id: string
    name: string
    price: number
    slug: string
    images: { url: string; altText: string | null }[]
    category: { name: string }
  }
  variant: {
    id: string
    size: string
    color: string
    colorHex: string | null
    stock: number
  }
}

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)

  async function fetchCart() {
    try {
      const res = await fetch("/api/cart")
      const data = await res.json()
      setItems(data)
    } catch {
      toast.error("Failed to load cart")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchCart() }, [])

  async function updateQuantity(itemId: string, newQty: number) {
    if (newQty < 1) return
    setUpdating(itemId)
    try {
      const res = await fetch(`/api/cart/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: newQty }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed")
      }
      setItems((prev) => prev.map((item) =>
        item.id === itemId ? { ...item, quantity: newQty } : item
      ))
    } catch (err: any) {
      toast.error(err.message || "Failed to update quantity")
    } finally {
      setUpdating(null)
    }
  }

  async function removeItem(itemId: string) {
    setUpdating(itemId)
    try {
      const res = await fetch(`/api/cart/${itemId}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed")
      setItems((prev) => prev.filter((item) => item.id !== itemId))
      toast.success("Removed from cart")
    } catch {
      toast.error("Failed to remove item")
    } finally {
      setUpdating(null)
    }
  }

  const subtotal = items.reduce((sum, item) => sum + Number(item.product.price) * item.quantity, 0)
  const shipping = subtotal >= 5000 ? 0 : 120
  const total = subtotal + shipping

  if (loading) {
    return (
      <main style={{ paddingTop: "var(--nav-height)", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Loader2 size={32} style={{ color: "var(--gold)", animation: "spin 1s linear infinite" }} />
        <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
      </main>
    )
  }

  return (
    <main style={{ paddingTop: "var(--nav-height)", minHeight: "100vh" }}>
      <div style={{ padding: "32px 0 64px" }}>
        <div className="container">

          {/* Header */}
          <div style={{ marginBottom: "32px" }}>
            <p className="section-label">Your Selection</p>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px, 4vw, 48px)", fontWeight: 300 }}>
              Shopping Cart
            </h1>
          </div>

          {items.length === 0 ? (
            <div style={{ textAlign: "center", padding: "80px 0" }}>
              <ShoppingBag size={48} style={{ color: "var(--text-muted)", margin: "0 auto 20px" }} />
              <p style={{ fontFamily: "var(--font-display)", fontSize: "28px", color: "var(--text-secondary)", marginBottom: "12px" }}>
                Your cart is empty
              </p>
              <p style={{ color: "var(--text-muted)", fontSize: "13px", marginBottom: "32px" }}>
                Discover our curated collection of premium menswear
              </p>
              <Link href="/shop" className="btn-primary">Explore Collection</Link>
            </div>
          ) : (
            <div className="cart-layout">

              {/* Cart items */}
              <div style={{ flex: 1, minWidth: 0 }}>

                {/* Header row — desktop only */}
                <div className="cart-header-row">
                  {["Product", "Size / Color", "Qty", "Price"].map((h) => (
                    <p key={h} style={{ fontSize: "9px", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 500 }}>{h}</p>
                  ))}
                </div>

                {items.map((item) => (
                  <div key={item.id} className="cart-item-row" style={{
                    opacity: updating === item.id ? 0.5 : 1,
                    transition: "opacity 0.2s",
                  }}>

                    {/* Product info */}
                    <div className="cart-item-product">
                      <Link href={`/shop/${item.product.slug}`} style={{ flexShrink: 0 }}>
                        <div style={{ width: "80px", height: "106px", background: "var(--black-soft)", border: "1px solid var(--border)", overflow: "hidden" }}>
                          {item.product.images[0] && (
                            <img src={item.product.images[0].url} alt={item.product.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          )}
                        </div>
                      </Link>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <Link href={`/shop/${item.product.slug}`} style={{ textDecoration: "none" }}>
                          <p style={{ fontFamily: "var(--font-display)", fontSize: "18px", fontWeight: 400, color: "var(--text-primary)", marginBottom: "4px" }}>
                            {item.product.name}
                          </p>
                        </Link>
                        <p style={{ fontSize: "11px", color: "var(--text-muted)", letterSpacing: "0.05em", marginBottom: "8px" }}>
                          {item.product.category.name}
                        </p>

                        {/* Size/Color — mobile shows here */}
                        <div className="cart-item-meta-mobile">
                          <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{item.variant.size}</span>
                          {item.variant.colorHex && (
                            <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: item.variant.colorHex, border: "1px solid var(--border)" }} />
                          )}
                          <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>{item.variant.color}</span>
                        </div>

                        {/* Price — mobile shows here */}
                        <p className="cart-item-price-mobile">
                          ৳{(Number(item.product.price) * item.quantity).toLocaleString()}
                        </p>

                        <button onClick={() => removeItem(item.id)} style={{
                          background: "none", border: "none", cursor: "pointer",
                          color: "var(--text-muted)", fontSize: "11px",
                          letterSpacing: "0.08em", textTransform: "uppercase",
                          padding: "6px 0", marginTop: "4px",
                          fontFamily: "var(--font-body)", fontWeight: 500,
                          display: "flex", alignItems: "center", gap: "6px",
                          transition: "color 0.2s",
                        }}
                          onMouseEnter={(e) => e.currentTarget.style.color = "#ef4444"}
                          onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-muted)"}
                        >
                          <Trash2 size={12} /> Remove
                        </button>
                      </div>
                    </div>

                    {/* Size / Color — desktop only */}
                    <div className="cart-item-meta-desktop">
                      <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "4px" }}>{item.variant.size}</p>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", justifyContent: "center" }}>
                        {item.variant.colorHex && (
                          <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: item.variant.colorHex, border: "1px solid var(--border)" }} />
                        )}
                        <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>{item.variant.color}</p>
                      </div>
                    </div>

                    {/* Quantity */}
                    <div className="cart-item-qty">
                      <div style={{ display: "flex", alignItems: "center", border: "1px solid var(--border)" }}>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1 || updating === item.id}
                          style={{ width: "32px", height: "32px", background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)", display: "flex", alignItems: "center", justifyContent: "center" }}
                        >
                          <Minus size={12} />
                        </button>
                        <span style={{ width: "32px", textAlign: "center", fontSize: "13px", color: "var(--text-primary)" }}>
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          disabled={item.quantity >= item.variant.stock || updating === item.id}
                          style={{ width: "32px", height: "32px", background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)", display: "flex", alignItems: "center", justifyContent: "center" }}
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    </div>

                    {/* Price — desktop only */}
                    <p className="cart-item-price-desktop">
                      ৳{(Number(item.product.price) * item.quantity).toLocaleString()}
                    </p>
                  </div>
                ))}

                <div style={{ marginTop: "24px" }}>
                  <Link href="/shop" className="gold-link">← Continue Shopping</Link>
                </div>
              </div>

              {/* Order summary */}
              <div className="cart-summary">
                <div style={{ background: "var(--black-card)", border: "1px solid var(--border)", padding: "28px" }}>
                  <h2 style={{ fontFamily: "var(--font-display)", fontSize: "22px", fontWeight: 300, marginBottom: "24px" }}>
                    Order Summary
                  </h2>

                  <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>Subtotal ({items.reduce((s, i) => s + i.quantity, 0)} items)</span>
                      <span style={{ fontSize: "13px", color: "var(--text-primary)" }}>৳{subtotal.toLocaleString()}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>Shipping</span>
                      <span style={{ fontSize: "13px", color: shipping === 0 ? "#22c55e" : "var(--text-primary)" }}>
                        {shipping === 0 ? "Free" : `৳${shipping}`}
                      </span>
                    </div>
                    {shipping > 0 && (
                      <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                        Add ৳{(5000 - subtotal).toLocaleString()} more for free shipping
                      </p>
                    )}
                  </div>

                  <div style={{ height: "1px", background: "var(--border)", marginBottom: "20px" }} />

                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "28px" }}>
                    <span style={{ fontSize: "15px", color: "var(--text-primary)", fontWeight: 500 }}>Total</span>
                    <span style={{ fontSize: "20px", color: "var(--gold)", fontWeight: 500 }}>৳{total.toLocaleString()}</span>
                  </div>

                  <Link href="/checkout" className="btn-primary" style={{ width: "100%", justifyContent: "center", display: "flex" }}>
                    Proceed to Checkout
                  </Link>

                  <p style={{ fontSize: "11px", color: "var(--text-muted)", textAlign: "center", marginTop: "16px", lineHeight: 1.6 }}>
                    Pay with Cash on Delivery
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }

        .cart-layout { display: flex; gap: 48px; align-items: flex-start; }

        /* Desktop header row */
        .cart-header-row {
          display: grid;
          grid-template-columns: 1fr auto auto auto;
          gap: 16px;
          padding: 0 0 12px;
          border-bottom: 1px solid var(--border);
          margin-bottom: 4px;
        }

        /* Each cart item row */
        .cart-item-row {
          display: grid;
          grid-template-columns: 1fr auto auto auto;
          gap: 16px;
          padding: 20px 0;
          border-bottom: 1px solid var(--border-soft);
          align-items: center;
        }

        .cart-item-product {
          display: flex;
          gap: 16px;
          align-items: center;
        }

        .cart-item-meta-desktop { text-align: center; }
        .cart-item-meta-mobile { display: none; }
        .cart-item-price-desktop {
          font-size: 15px; color: var(--gold); font-weight: 500;
          text-align: right; white-space: nowrap;
        }
        .cart-item-price-mobile { display: none; }

        .cart-summary { width: 320px; flex-shrink: 0; }
        .cart-summary > div { position: sticky; top: calc(var(--nav-height) + 24px); }

        /* ── Mobile layout ── */
        @media (max-width: 768px) {
          .cart-layout { flex-direction: column; }

          .cart-header-row { display: none; }

          .cart-item-row {
            grid-template-columns: 1fr;
            gap: 0;
          }

          .cart-item-product {
            align-items: flex-start;
          }

          /* Hide desktop-only columns */
          .cart-item-meta-desktop,
          .cart-item-price-desktop {
            display: none;
          }

          /* Show mobile meta + price inline with product info */
          .cart-item-meta-mobile {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 8px;
          }
          .cart-item-price-mobile {
            display: block;
            font-size: 16px;
            color: var(--gold);
            font-weight: 500;
            margin-bottom: 10px;
          }

          /* Quantity selector — full width row below product on mobile */
          .cart-item-qty {
            margin-top: 12px;
            grid-column: 1;
          }

          .cart-summary { width: 100%; }
          .cart-summary > div { position: static; }
        }
      `}</style>
    </main>
  )
}
