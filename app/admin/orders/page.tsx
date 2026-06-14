import db from "@/lib/db"
import AdminOrderStatus from "@/components/admin/AdminOrderStatus"
import { Package } from "lucide-react"

export default async function AdminOrdersPage() {
  const orders = await db.order.findMany({
    include: {
      user: { select: { name: true, email: true, image: true } },
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

  const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    PENDING:    { label: "Pending",    color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
    PROCESSING: { label: "Processing", color: "#3b82f6", bg: "rgba(59,130,246,0.1)" },
    SHIPPED:    { label: "Shipped",    color: "#8b5cf6", bg: "rgba(139,92,246,0.1)" },
    DELIVERED:  { label: "Delivered",  color: "#22c55e", bg: "rgba(34,197,94,0.1)" },
    CANCELLED:  { label: "Cancelled",  color: "#ef4444", bg: "rgba(239,68,68,0.1)" },
    REFUNDED:   { label: "Refunded",   color: "#9ca3af", bg: "rgba(156,163,175,0.1)" },
  }

  const stats = {
    total: orders.length,
    pending: orders.filter((o) => o.status === "PENDING").length,
    processing: orders.filter((o) => o.status === "PROCESSING").length,
    shipped: orders.filter((o) => o.status === "SHIPPED").length,
    delivered: orders.filter((o) => o.status === "DELIVERED").length,
    revenue: orders
      .filter((o) => o.status === "DELIVERED")
      .reduce((sum, o) => sum + Number(o.total), 0),
  }

  return (
    <div>
      <div style={{ marginBottom: "40px" }}>
        <p className="section-label">Admin</p>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "36px", fontWeight: 300 }}>
          Orders
        </h1>
      </div>

      {/* Stats */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
        gap: "16px", marginBottom: "32px",
      }}>
        {[
          { label: "Total Orders",  value: stats.total,      color: "var(--text-primary)" },
          { label: "Pending",       value: stats.pending,    color: "#f59e0b" },
          { label: "Processing",    value: stats.processing, color: "#3b82f6" },
          { label: "Shipped",       value: stats.shipped,    color: "#8b5cf6" },
          { label: "Delivered",     value: stats.delivered,  color: "#22c55e" },
          { label: "COD Revenue",   value: `৳${stats.revenue.toLocaleString()}`, color: "var(--gold)" },
        ].map((stat) => (
          <div key={stat.label} style={{
            background: "var(--black-card)", border: "1px solid var(--border)", padding: "20px",
          }}>
            <p style={{ fontSize: "10px", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "8px" }}>
              {stat.label}
            </p>
            <p style={{ fontSize: "24px", fontWeight: 600, color: stat.color }}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Orders list */}
      <div style={{ background: "var(--black-card)", border: "1px solid var(--border)" }}>
        <div style={{
          padding: "20px 24px", borderBottom: "1px solid var(--border)",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "20px", fontWeight: 300 }}>
            All Orders
          </h2>
          <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>{orders.length} orders</p>
        </div>

        {orders.length === 0 ? (
          <div style={{ padding: "60px", textAlign: "center" }}>
            <Package size={32} style={{ color: "var(--text-muted)", margin: "0 auto 16px" }} />
            <p style={{ color: "var(--text-muted)", fontFamily: "var(--font-display)", fontSize: "20px" }}>
              No orders yet
            </p>
          </div>
        ) : (
          <div>
            {orders.map((order, i) => {
              const cfg = statusConfig[order.status] || statusConfig.PENDING
              return (
                <div key={order.id} style={{
                  padding: "20px 24px",
                  borderBottom: i < orders.length - 1 ? "1px solid var(--border-soft)" : "none",
                }}>
                  <div style={{
                    display: "flex", justifyContent: "space-between",
                    alignItems: "flex-start", flexWrap: "wrap", gap: "16px",
                  }}>

                    {/* Customer info */}
                    <div style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
                      <div style={{
                        width: "40px", height: "40px", borderRadius: "50%",
                        background: "var(--black-soft)", border: "1px solid var(--border)",
                        overflow: "hidden", flexShrink: 0,
                      }}>
                        {order.user.image
                          ? <img src={order.user.image} alt="" style={{ width: "100%", height: "100%" }} />
                          : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", color: "var(--text-muted)" }}>
                              {order.user.name?.[0] || "?"}
                            </div>
                        }
                      </div>
                      <div>
                        <p style={{ fontSize: "13px", color: "var(--text-primary)", fontWeight: 500, marginBottom: "2px" }}>
                          {order.user.name || "Unknown"}
                        </p>
                        <p style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "4px" }}>
                          {order.user.email}
                        </p>
                        <p style={{ fontSize: "10px", color: "var(--text-muted)", fontFamily: "monospace" }}>
                          #{order.id.slice(-8).toUpperCase()}
                        </p>
                        <p style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "2px" }}>
                          {new Date(order.createdAt).toLocaleDateString("en-GB", {
                            day: "numeric", month: "short", year: "numeric",
                            hour: "2-digit", minute: "2-digit",
                          })}
                        </p>
                        {/* Shipping address */}
                        <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "6px", lineHeight: 1.5 }}>
                          📍 {order.shippingAddress}, {order.shippingCity}<br />
                          📞 {order.shippingPhone}
                        </p>
                      </div>
                    </div>

                    {/* Items preview */}
                    <div style={{ display: "flex", gap: "8px" }}>
                      {order.items.slice(0, 3).map((item) => (
                        <div key={item.id} style={{
                          width: "48px", height: "64px",
                          background: "var(--black-soft)",
                          border: "1px solid var(--border)",
                          overflow: "hidden", flexShrink: 0,
                        }}>
                          {item.product.images[0] && (
                            <img src={item.product.images[0].url} alt=""
                              style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          )}
                        </div>
                      ))}
                      {order.items.length > 3 && (
                        <div style={{
                          width: "48px", height: "64px",
                          background: "var(--black-soft)", border: "1px solid var(--border)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                          <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                            +{order.items.length - 3}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Price + status */}
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "12px" }}>
                      <p style={{ fontSize: "20px", color: "var(--gold)", fontWeight: 500 }}>
                        ৳{Number(order.total).toLocaleString()}
                      </p>
                      <span style={{
                        fontSize: "9px", letterSpacing: "0.12em",
                        textTransform: "uppercase", fontWeight: 600,
                        padding: "4px 10px",
                        color: "#f59e0b",
                        background: "rgba(201,168,76,0.1)",
                        border: "1px solid rgba(201,168,76,0.2)",
                      }}>
                        Cash on Delivery
                      </span>
                      <AdminOrderStatus orderId={order.id} currentStatus={order.status} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
