import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { redirect, notFound } from "next/navigation"
import db from "@/lib/db"
import Link from "next/link"
import { CheckCircle, Package, Truck, Home, XCircle, Clock } from "lucide-react"
import CancelOrderButton from "@/components/CancelOrderButton"

interface Props {
  params: Promise<{ id: string }>
}

const statusSteps = [
  { key: "PENDING",    label: "Order Placed",  icon: CheckCircle, desc: "Your order has been received" },
  { key: "PROCESSING", label: "Processing",    icon: Package,     desc: "We are preparing your order" },
  { key: "SHIPPED",    label: "Shipped",       icon: Truck,       desc: "Your order is on the way" },
  { key: "DELIVERED",  label: "Delivered",     icon: Home,        desc: "Order delivered successfully" },
]

const statusOrder = ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED"]

export default async function OrderDetailPage({ params }: Props) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect("/auth/signin")

  const { id } = await params

  const order = await db.order.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          product: {
            include: { images: { orderBy: { position: "asc" }, take: 1 } },
          },
        },
      },
    },
  })

  if (!order || order.userId !== session.user.id) notFound()

  const isCancelled = order.status === "CANCELLED"
  const isPending = order.status === "PENDING"
  const currentStepIndex = statusOrder.indexOf(order.status)

  return (
    <main style={{ paddingTop: "var(--nav-height)", minHeight: "100vh" }}>
      <div style={{ padding: "48px 0 64px" }}>
        <div className="container">

          {/* Back */}
          <Link href="/orders" className="gold-link" style={{ display: "inline-flex", alignItems: "center", gap: "6px", marginBottom: "32px" }}>
            ← Back to Orders
          </Link>

          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px", marginBottom: "40px" }}>
            <div>
              <p className="section-label">Order Details</p>
              <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(24px, 4vw, 40px)", fontWeight: 300 }}>
                #{order.id.slice(-8).toUpperCase()}
              </h1>
              <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>
                Placed on {new Date(order.createdAt).toLocaleDateString("en-GB", {
                  day: "numeric", month: "long", year: "numeric",
                  hour: "2-digit", minute: "2-digit",
                })}
              </p>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ fontSize: "28px", color: "var(--gold)", fontWeight: 500 }}>
                ৳{Number(order.total).toLocaleString()}
              </p>
              <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>
                Cash on Delivery
              </p>
            </div>
          </div>

          {/* Status timeline or cancelled notice */}
          {!isCancelled ? (
            <div style={{ background: "var(--black-card)", border: "1px solid var(--border)", padding: "32px", marginBottom: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px", flexWrap: "wrap", gap: "12px" }}>
                <h2 style={{ fontFamily: "var(--font-display)", fontSize: "20px", fontWeight: 300 }}>
                  Order Status
                </h2>
                {/* Cancel button — only if PENDING */}
                {isPending && (
                  <CancelOrderButton orderId={order.id} />
                )}
              </div>

              <div style={{ position: "relative" }}>
                {/* Background line */}
                <div style={{
                  position: "absolute", top: "20px",
                  left: "10%", right: "10%",
                  height: "2px", background: "var(--border)", zIndex: 0,
                }} />
                {/* Progress line */}
                {currentStepIndex > 0 && (
                  <div style={{
                    position: "absolute", top: "20px", left: "10%",
                    height: "2px", background: "var(--gold)", zIndex: 1,
                    width: `${(currentStepIndex / (statusSteps.length - 1)) * 80}%`,
                    transition: "width 0.5s ease",
                  }} />
                )}

                {/* Steps */}
                <div style={{
                  display: "grid",
                  gridTemplateColumns: `repeat(${statusSteps.length}, 1fr)`,
                  position: "relative", zIndex: 2,
                }}>
                  {statusSteps.map((step, i) => {
                    const Icon = step.icon
                    const isCompleted = currentStepIndex >= i
                    const isActive = currentStepIndex === i
                    return (
                      <div key={step.key} style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "0 8px" }}>
                        <div style={{
                          width: "40px", height: "40px", borderRadius: "50%",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          marginBottom: "12px",
                          background: isCompleted ? "var(--gold)" : "var(--black-soft)",
                          border: isCompleted ? "2px solid var(--gold)" : "2px solid var(--border)",
                          transition: "all 0.3s ease",
                          boxShadow: isActive ? "0 0 16px rgba(201,168,76,0.4)" : "none",
                        }}>
                          <Icon size={16} strokeWidth={2} style={{ color: isCompleted ? "var(--black)" : "var(--text-muted)" }} />
                        </div>
                        <p style={{
                          fontSize: "11px", fontWeight: isActive ? 600 : 400,
                          color: isCompleted ? "var(--text-primary)" : "var(--text-muted)",
                          marginBottom: "4px",
                        }}>
                          {step.label}
                        </p>
                        <p style={{ fontSize: "10px", color: "var(--text-muted)", lineHeight: 1.4 }}>
                          {step.desc}
                        </p>
                      </div>
                    )
                  })}
                </div>
              </div>

              {isPending && (
                <p style={{ fontSize: "11px", color: "var(--text-muted)", textAlign: "center", marginTop: "24px" }}>
                  You can cancel this order until we start processing it
                </p>
              )}
            </div>
          ) : (
            <div style={{
              background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)",
              padding: "20px 24px", marginBottom: "24px",
              display: "flex", alignItems: "center", gap: "12px",
            }}>
              <XCircle size={20} style={{ color: "#ef4444", flexShrink: 0 }} />
              <div>
                <p style={{ fontSize: "14px", color: "#ef4444", fontWeight: 500 }}>Order Cancelled</p>
                <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
                  This order has been cancelled. The items have been restocked.
                </p>
              </div>
            </div>
          )}

          <div className="order-detail-grid">

            {/* Items */}
            <div style={{ background: "var(--black-card)", border: "1px solid var(--border)", padding: "24px" }}>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: "20px", fontWeight: 300, marginBottom: "20px" }}>
                Items Ordered
              </h2>

              <div style={{ display: "flex", flexDirection: "column" }}>
                {order.items.map((item, i) => (
                  <div key={item.id} style={{
                    display: "flex", gap: "16px", alignItems: "center",
                    padding: "16px 0",
                    borderBottom: i < order.items.length - 1 ? "1px solid var(--border-soft)" : "none",
                  }}>
                    <div style={{ width: "72px", height: "96px", background: "var(--black-soft)", border: "1px solid var(--border)", overflow: "hidden", flexShrink: 0 }}>
                      {item.product.images[0] && (
                        <img src={item.product.images[0].url} alt={item.productName}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontFamily: "var(--font-display)", fontSize: "16px", color: "var(--text-primary)", marginBottom: "6px" }}>
                        {item.productName}
                      </p>
                      <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "4px" }}>
                        Size: {item.size} · Color: {item.color}
                      </p>
                      <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                        Qty: {item.quantity} × ৳{Number(item.price).toLocaleString()}
                      </p>
                    </div>
                    <p style={{ fontSize: "15px", color: "var(--gold)", fontWeight: 500, whiteSpace: "nowrap" }}>
                      ৳{(Number(item.price) * item.quantity).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div style={{ marginTop: "20px", paddingTop: "16px", borderTop: "1px solid var(--border)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                  <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Subtotal</span>
                  <span style={{ fontSize: "12px", color: "var(--text-primary)" }}>৳{Number(order.subtotal).toLocaleString()}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}>
                  <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Shipping</span>
                  <span style={{ fontSize: "12px", color: Number(order.shippingCost) === 0 ? "#22c55e" : "var(--text-primary)" }}>
                    {Number(order.shippingCost) === 0 ? "Free" : `৳${Number(order.shippingCost).toLocaleString()}`}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "12px", borderTop: "1px solid var(--border)" }}>
                  <span style={{ fontSize: "15px", color: "var(--text-primary)", fontWeight: 500 }}>Total</span>
                  <span style={{ fontSize: "20px", color: "var(--gold)", fontWeight: 500 }}>৳{Number(order.total).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

              {/* Shipping address */}
              <div style={{ background: "var(--black-card)", border: "1px solid var(--border)", padding: "24px" }}>
                <h2 style={{ fontFamily: "var(--font-display)", fontSize: "20px", fontWeight: 300, marginBottom: "20px" }}>
                  Shipping Address
                </h2>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {[
                    { label: "Name",    value: order.shippingName },
                    { label: "Phone",   value: order.shippingPhone },
                    { label: "Address", value: order.shippingAddress },
                    { label: "City",    value: order.shippingCity },
                    { label: "ZIP",     value: order.shippingZip },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ display: "flex", gap: "12px" }}>
                      <span style={{ fontSize: "10px", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 500, minWidth: "60px", paddingTop: "2px" }}>
                        {label}
                      </span>
                      <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment */}
              <div style={{ background: "var(--black-card)", border: "1px solid var(--border)", padding: "24px" }}>
                <h2 style={{ fontFamily: "var(--font-display)", fontSize: "20px", fontWeight: 300, marginBottom: "16px" }}>
                  Payment
                </h2>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{
                    width: "36px", height: "36px",
                    background: "rgba(201,168,76,0.1)",
                    border: "1px solid rgba(201,168,76,0.3)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Clock size={16} style={{ color: "var(--gold)" }} />
                  </div>
                  <div>
                    <p style={{ fontSize: "13px", color: "var(--text-primary)", fontWeight: 500 }}>Cash on Delivery</p>
                    <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>Pay when order arrives</p>
                  </div>
                </div>
              </div>

              <Link href="/shop" className="btn-ghost" style={{ justifyContent: "center" }}>
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .order-detail-grid {
          display: grid;
          grid-template-columns: 1.4fr 1fr;
          gap: 24px;
          align-items: start;
        }
        @media (max-width: 900px) {
          .order-detail-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </main>
  )
}
