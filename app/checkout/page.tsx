"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Truck, CheckCircle } from "lucide-react"
import toast from "react-hot-toast"
import { useSession } from "next-auth/react"

interface CartItem {
  id: string
  quantity: number
  product: {
    name: string
    price: number
    images: { url: string }[]
  }
  variant: { size: string; color: string }
}

export default function CheckoutPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [items, setItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    city: "",
    zip: "",
  })

  useEffect(() => {
    if (session?.user?.name) {
      setForm((f) => ({ ...f, name: session.user!.name || "" }))
    }
  }, [session])

  useEffect(() => {
    fetch("/api/cart")
      .then((r) => r.json())
      .then((data) => { setItems(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const subtotal = items.reduce((sum, item) => sum + Number(item.product.price) * item.quantity, 0)
  const shippingCost = subtotal >= 5000 ? 0 : 120
  const total = subtotal + shippingCost

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (items.length === 0) { toast.error("Your cart is empty"); return }
    if (!form.name || !form.phone || !form.address || !form.city || !form.zip) {
      toast.error("Please fill in all fields")
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch("/api/checkout/cod", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, shipping: shippingCost }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to place order")
      router.push(`/orders?status=success&orderId=${data.orderId}`)
    } catch (err: any) {
      toast.error(err.message || "Something went wrong")
      setSubmitting(false)
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

  if (!loading && items.length === 0) {
    router.push("/cart")
    return null
  }

  return (
    <main style={{ paddingTop: "var(--nav-height)", minHeight: "100vh" }}>
      <div style={{ padding: "48px 0 64px" }}>
        <div className="container">
          <div style={{ marginBottom: "40px" }}>
            <p className="section-label">Final Step</p>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px, 4vw, 48px)", fontWeight: 300 }}>
              Checkout
            </h1>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="checkout-layout">

              {/* ── Left: Shipping form ── */}
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "24px" }}>

                {/* Shipping info */}
                <div style={{ background: "var(--black-card)", border: "1px solid var(--border)", padding: "28px" }}>
                  <h2 style={{
                    fontFamily: "var(--font-display)", fontSize: "22px",
                    fontWeight: 300, marginBottom: "24px",
                    display: "flex", alignItems: "center", gap: "10px",
                  }}>
                    <Truck size={18} style={{ color: "var(--gold)" }} />
                    Shipping Information
                  </h2>

                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    <div className="admin-form-2col">
                      <div>
                        <label className="admin-label">Full Name *</label>
                        <input
                          className="input-luxury" name="name"
                          placeholder="Your full name"
                          value={form.name} onChange={handleChange} required
                        />
                      </div>
                      <div>
                        <label className="admin-label">Phone Number *</label>
                        <input
                          className="input-luxury" name="phone"
                          placeholder="01XXXXXXXXX"
                          value={form.phone} onChange={handleChange} required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="admin-label">Street Address *</label>
                      <input
                        className="input-luxury" name="address"
                        placeholder="House / Road / Area"
                        value={form.address} onChange={handleChange} required
                      />
                    </div>

                    <div className="admin-form-2col">
                      <div>
                        <label className="admin-label">City *</label>
                        <input
                          className="input-luxury" name="city"
                          placeholder="e.g. Dhaka"
                          value={form.city} onChange={handleChange} required
                        />
                      </div>
                      <div>
                        <label className="admin-label">ZIP / Post Code *</label>
                        <input
                          className="input-luxury" name="zip"
                          placeholder="e.g. 1200"
                          value={form.zip} onChange={handleChange} required
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* COD notice */}
                <div style={{
                  background: "rgba(201,168,76,0.05)",
                  border: "1px solid rgba(201,168,76,0.3)",
                  padding: "20px 24px",
                  display: "flex", alignItems: "flex-start", gap: "14px",
                }}>
                  <CheckCircle size={20} style={{ color: "var(--gold)", flexShrink: 0, marginTop: "1px" }} />
                  <div>
                    <p style={{ fontSize: "14px", color: "var(--text-primary)", fontWeight: 500, marginBottom: "6px" }}>
                      Cash on Delivery
                    </p>
                    <p style={{ fontSize: "12px", color: "var(--text-muted)", lineHeight: 1.7 }}>
                      Your order will be confirmed immediately. Pay in cash when your order arrives at your doorstep. No online payment needed.
                    </p>
                  </div>
                </div>
              </div>

              {/* ── Right: Order summary ── */}
              <div style={{ width: "320px", flexShrink: 0 }}>
                <div style={{
                  background: "var(--black-card)", border: "1px solid var(--border)",
                  padding: "28px", position: "sticky",
                  top: "calc(var(--nav-height) + 24px)",
                }}>
                  <h2 style={{ fontFamily: "var(--font-display)", fontSize: "20px", fontWeight: 300, marginBottom: "20px" }}>
                    Order Summary
                  </h2>

                  {/* Items */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px", maxHeight: "220px", overflowY: "auto" }}>
                    {items.map((item) => (
                      <div key={item.id} style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                        <div style={{ width: "48px", height: "64px", background: "var(--black-soft)", flexShrink: 0, overflow: "hidden" }}>
                          {item.product.images[0] && (
                            <img src={item.product.images[0].url} alt={item.product.name}
                              style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          )}
                        </div>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontSize: "12px", color: "var(--text-primary)", marginBottom: "2px" }}>
                            {item.product.name}
                          </p>
                          <p style={{ fontSize: "10px", color: "var(--text-muted)" }}>
                            {item.variant.size} / {item.variant.color} × {item.quantity}
                          </p>
                        </div>
                        <p style={{ fontSize: "13px", color: "var(--gold)", fontWeight: 500, whiteSpace: "nowrap" }}>
                          ৳{(Number(item.product.price) * item.quantity).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div style={{ height: "1px", background: "var(--border)", marginBottom: "16px" }} />

                  <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Subtotal</span>
                      <span style={{ fontSize: "12px", color: "var(--text-primary)" }}>৳{subtotal.toLocaleString()}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Shipping</span>
                      <span style={{ fontSize: "12px", color: shippingCost === 0 ? "#22c55e" : "var(--text-primary)" }}>
                        {shippingCost === 0 ? "Free" : `৳${shippingCost}`}
                      </span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Payment</span>
                      <span style={{ fontSize: "12px", color: "var(--gold)" }}>Cash on Delivery</span>
                    </div>
                  </div>

                  <div style={{ height: "1px", background: "var(--border)", marginBottom: "16px" }} />

                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "24px" }}>
                    <span style={{ fontSize: "15px", color: "var(--text-primary)", fontWeight: 500 }}>Total</span>
                    <span style={{ fontSize: "20px", color: "var(--gold)", fontWeight: 500 }}>৳{total.toLocaleString()}</span>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-primary"
                    style={{ width: "100%", justifyContent: "center", padding: "16px" }}
                  >
                    {submitting ? (
                      <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Placing Order...</>
                    ) : (
                      <><CheckCircle size={16} /> Place Order</>
                    )}
                  </button>

                  <p style={{ fontSize: "11px", color: "var(--text-muted)", textAlign: "center", marginTop: "12px", lineHeight: 1.6 }}>
                    Pay in cash when your order arrives
                  </p>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>

      <style>{`
        .checkout-layout { display: flex; gap: 40px; align-items: flex-start; }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @media (max-width: 900px) {
          .checkout-layout { flex-direction: column; }
          .checkout-layout > div:last-child { width: 100% !important; position: static !important; }
        }
      `}</style>
    </main>
  )
}
