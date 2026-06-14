import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { redirect } from "next/navigation"
import db from "@/lib/db"
import Link from "next/link"
import { Package } from "lucide-react"
import OrderStatusBanner from "@/components/OrderStatusBanner"

interface Props {
  searchParams: Promise<{ status?: string; orderId?: string }>
}

const statusConfig: Record<string, { label: string; color: string; bg: string; border: string }> = {
  PENDING:    { label: "Pending",    color: "#f59e0b", bg: "rgba(245,158,11,0.08)",  border: "rgba(245,158,11,0.3)" },
  PROCESSING: { label: "Processing", color: "#3b82f6", bg: "rgba(59,130,246,0.08)",  border: "rgba(59,130,246,0.3)" },
  SHIPPED:    { label: "Shipped",    color: "#8b5cf6", bg: "rgba(139,92,246,0.08)",  border: "rgba(139,92,246,0.3)" },
  DELIVERED:  { label: "Delivered",  color: "#22c55e", bg: "rgba(34,197,94,0.08)",   border: "rgba(34,197,94,0.3)" },
  CANCELLED:  { label: "Cancelled",  color: "#ef4444", bg: "rgba(239,68,68,0.08)",   border: "rgba(239,68,68,0.3)" },
  REFUNDED:   { label: "Refunded",   color: "#9ca3af", bg: "rgba(156,163,175,0.08)", border: "rgba(156,163,175,0.3)" },
}

export default async function OrdersPage({ searchParams }: Props) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect("/auth/signin")

  const { status, orderId } = await searchParams

  const orders = await db.order.findMany({
    where: { userId: session.user.id },
    include: {
      items: {
        include: {
          product: {
            include: { images: { orderBy: { position: "asc" }, take: 1 } },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  return (
    <main style={{ paddingTop: "var(--nav-height)", minHeight: "100vh" }}>
      <OrderStatusBanner status={status} orderId={orderId} />

      <div style={{ padding: "48px 0 64px" }}>
        <div className="container">
          <div style={{ marginBottom: "40px" }}>
            <p className="section-label">Account</p>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px, 4vw, 48px)", fontWeight: 300 }}>
              My Orders
            </h1>
          </div>

          {orders.length === 0 ? (
            <div style={{ textAlign: "center", padding: "80px 0" }}>
              <Package size={48} style={{ color: "var(--text-muted)", margin: "0 auto 20px" }} />
              <p style={{ fontFamily: "var(--font-display)", fontSize: "28px", color: "var(--text-secondary)", marginBottom: "12px" }}>
                No orders yet
              </p>
              <p style={{ color: "var(--text-muted)", fontSize: "13px", marginBottom: "32px" }}>
                Your order history will appear here
              </p>
              <Link href="/shop" className="btn-primary">Start Shopping</Link>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {orders.map((order) => {
                const cfg = statusConfig[order.status] || statusConfig.PENDING
                const isNew = order.id === orderId
                return (
                  <Link
                    key={order.id}
                    href={`/orders/${order.id}`}
                    style={{
                      display: "block", textDecoration: "none",
                      background: "var(--black-card)",
                      border: isNew ? "1px solid var(--gold)" : "1px solid var(--border)",
                      padding: "24px", transition: "border-color 0.2s",
                    }}
                    className="order-card-link"
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>

                      {/* Left */}
                      <div>
                        <p style={{ fontSize: "10px", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "4px" }}>
                          Order ID
                        </p>
                        <p style={{ fontSize: "14px", color: "var(--text-primary)", fontFamily: "monospace", fontWeight: 500, marginBottom: "4px" }}>
                          #{order.id.slice(-8).toUpperCase()}
                        </p>
                        <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                          {new Date(order.createdAt).toLocaleDateString("en-GB", {
                            day: "numeric", month: "long", year: "numeric",
                          })}
                        </p>
                        <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>
                          {order.items.length} {order.items.length === 1 ? "item" : "items"} · Cash on Delivery
                        </p>
                      </div>

                      {/* Right */}
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "8px" }}>
                        <p style={{ fontSize: "20px", color: "var(--gold)", fontWeight: 500 }}>
                          ৳{Number(order.total).toLocaleString()}
                        </p>
                        <span style={{
                          fontSize: "10px", letterSpacing: "0.12em",
                          textTransform: "uppercase", fontWeight: 600,
                          padding: "5px 12px",
                          color: cfg.color,
                          background: cfg.bg,
                          border: `1px solid ${cfg.border}`,
                        }}>
                          {cfg.label}
                        </span>
                        <p style={{ fontSize: "10px", color: "var(--text-muted)", letterSpacing: "0.08em" }}>
                          View Details →
                        </p>
                      </div>
                    </div>

                    {/* Items preview */}
                    <div style={{ display: "flex", gap: "8px", marginTop: "16px", overflowX: "auto" }}>
                      {order.items.slice(0, 5).map((item) => (
                        <div key={item.id} style={{
                          width: "52px", height: "70px", flexShrink: 0,
                          background: "var(--black-soft)", border: "1px solid var(--border)",
                          overflow: "hidden",
                        }}>
                          {item.product.images[0] && (
                            <img src={item.product.images[0].url} alt={item.productName}
                              style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          )}
                        </div>
                      ))}
                      {order.items.length > 5 && (
                        <div style={{
                          width: "52px", height: "70px", flexShrink: 0,
                          background: "var(--black-soft)", border: "1px solid var(--border)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                          <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>+{order.items.length - 5}</p>
                        </div>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <style>{`
        .order-card-link:hover { border-color: var(--border) !important; }
        .order-card-link:hover { background: var(--black-hover) !important; }
      `}</style>
    </main>
  )
}
