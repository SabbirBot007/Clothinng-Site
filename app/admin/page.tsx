import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { redirect } from "next/navigation"
import db from "@/lib/db"
import Link from "next/link"
import {
  Users, Package, ShoppingBag, TrendingUp,
  AlertTriangle, Clock, CheckCircle, XCircle,
  Star, Eye,
} from "lucide-react"

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isAdmin) redirect("/")

  // ── Fetch all data in parallel ──
  const [
    userCount,
    productCount,
    activeProductCount,
    orders,
    lowStockVariants,
    recentReviews,
    topCategories,
  ] = await Promise.all([
    db.user.count({ where: { isAdmin: false } }),
    db.product.count(),
    db.product.count({ where: { isActive: true } }),
    db.order.findMany({
      include: {
        user: { select: { name: true, email: true, image: true } },
        items: { include: { product: { include: { images: { orderBy: { position: "asc" }, take: 1 } } } } },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.productVariant.findMany({
      where: { stock: { lte: 5 } },
      include: { product: { select: { name: true, slug: true, isActive: true } } },
      orderBy: { stock: "asc" },
      take: 8,
    }),
    db.review.findMany({
      include: { user: { select: { name: true, image: true } }, product: { select: { name: true, slug: true } } },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    db.category.findMany({
      include: { _count: { select: { products: true } } },
      orderBy: { products: { _count: "desc" } },
      take: 5,
    }),
  ])

  // ── Calculate stats ──
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)
  const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  const deliveredOrders = orders.filter((o: any) => o.status === "DELIVERED")
  const activeOrders = orders.filter((o: any) => !["CANCELLED", "DELIVERED"].includes(o.status))
  const cancelledOrders = orders.filter((o: any) => o.status === "CANCELLED")

  const totalRevenue = deliveredOrders.reduce((sum: number, o: any) => sum + Number(o.total), 0)

  const thisMonthRevenue = deliveredOrders
    .filter((o: any) => o.createdAt >= startOfMonth)
    .reduce((sum: number, o: any) => sum + Number(o.total), 0)

  const lastMonthRevenue = deliveredOrders
    .filter((o: any) => o.createdAt >= startOfLastMonth && o.createdAt <= endOfLastMonth)
    .reduce((sum: number, o: any) => sum + Number(o.total), 0)

  const revenueChange = lastMonthRevenue > 0
    ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
    : thisMonthRevenue > 0 ? 100 : 0

  const ordersThisWeek = orders.filter((o: any) => o.createdAt >= last7Days).length

  const avgOrderValue = deliveredOrders.length > 0
    ? totalRevenue / deliveredOrders.length
    : 0

  // Status breakdown
  const statusCounts = {
    PENDING: orders.filter((o: any) => o.status === "PENDING").length,
    PROCESSING: orders.filter((o: any) => o.status === "PROCESSING").length,
    SHIPPED: orders.filter((o: any) => o.status === "SHIPPED").length,
    DELIVERED: orders.filter((o: any) => o.status === "DELIVERED").length,
    CANCELLED: orders.filter((o: any) => o.status === "CANCELLED").length,
  }

  // Last 7 days revenue chart data
  const chartData: { day: string; revenue: number }[] = []
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
    date.setHours(0, 0, 0, 0)
    const nextDate = new Date(date.getTime() + 24 * 60 * 60 * 1000)
    const dayRevenue = deliveredOrders
      .filter((o: any) => o.createdAt >= date && o.createdAt < nextDate)
      .reduce((sum: number, o: any) => sum + Number(o.total), 0)
    chartData.push({
      day: date.toLocaleDateString("en-GB", { weekday: "short" }),
      revenue: dayRevenue,
    })
  }
  const maxRevenue = Math.max(...chartData.map((d) => d.revenue), 1)

  const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    PENDING:    { label: "Pending",    color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
    PROCESSING: { label: "Processing", color: "#3b82f6", bg: "rgba(59,130,246,0.1)" },
    SHIPPED:    { label: "Shipped",    color: "#8b5cf6", bg: "rgba(139,92,246,0.1)" },
    DELIVERED:  { label: "Delivered",  color: "#22c55e", bg: "rgba(34,197,94,0.1)" },
    CANCELLED:  { label: "Cancelled",  color: "#ef4444", bg: "rgba(239,68,68,0.1)" },
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "32px" }}>
        <p className="section-label">Overview</p>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "36px", fontWeight: 300 }}>
          Dashboard
        </h1>
        <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>
          Welcome back, {session.user.name?.split(" ")[0] || "Admin"}
        </p>
      </div>

      {/* ── Top stat cards ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "24px" }}>

        {/* Total Revenue */}
        <div style={{ background: "var(--black-card)", border: "1px solid var(--border)", padding: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
            <div style={{ width: "40px", height: "40px", background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <TrendingUp size={18} style={{ color: "var(--gold)" }} />
            </div>
            {lastMonthRevenue > 0 && (
              <span style={{ fontSize: "11px", color: revenueChange >= 0 ? "#22c55e" : "#ef4444", fontWeight: 600 }}>
                {revenueChange >= 0 ? "+" : ""}{revenueChange.toFixed(0)}%
              </span>
            )}
          </div>
          <p style={{ fontSize: "10px", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "6px" }}>
            Total Revenue
          </p>
          <p style={{ fontSize: "26px", fontWeight: 600, color: "var(--gold)" }}>
            ৳{totalRevenue.toLocaleString()}
          </p>
          <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>
            from {deliveredOrders.length} delivered orders
          </p>
        </div>

        {/* This month revenue */}
        <div style={{ background: "var(--black-card)", border: "1px solid var(--border)", padding: "24px" }}>
          <div style={{ width: "40px", height: "40px", background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px" }}>
            <ShoppingBag size={18} style={{ color: "#22c55e" }} />
          </div>
          <p style={{ fontSize: "10px", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "6px" }}>
            This Month
          </p>
          <p style={{ fontSize: "26px", fontWeight: 600, color: "var(--text-primary)" }}>
            ৳{thisMonthRevenue.toLocaleString()}
          </p>
          <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>
            {now.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
          </p>
        </div>

        {/* Avg order value */}
        <div style={{ background: "var(--black-card)", border: "1px solid var(--border)", padding: "24px" }}>
          <div style={{ width: "40px", height: "40px", background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.3)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px" }}>
            <Package size={18} style={{ color: "#3b82f6" }} />
          </div>
          <p style={{ fontSize: "10px", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "6px" }}>
            Avg Order Value
          </p>
          <p style={{ fontSize: "26px", fontWeight: 600, color: "var(--text-primary)" }}>
            ৳{avgOrderValue.toFixed(0)}
          </p>
          <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>
            per delivered order
          </p>
        </div>

        {/* Customers */}
        <div style={{ background: "var(--black-card)", border: "1px solid var(--border)", padding: "24px" }}>
          <div style={{ width: "40px", height: "40px", background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.3)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px" }}>
            <Users size={18} style={{ color: "#8b5cf6" }} />
          </div>
          <p style={{ fontSize: "10px", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "6px" }}>
            Total Customers
          </p>
          <p style={{ fontSize: "26px", fontWeight: 600, color: "var(--text-primary)" }}>
            {userCount}
          </p>
          <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>
            {ordersThisWeek} orders this week
          </p>
        </div>
      </div>

      <div className="dashboard-grid">

        {/* ── Left column ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

          {/* Revenue chart */}
          <div style={{ background: "var(--black-card)", border: "1px solid var(--border)", padding: "24px" }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "18px", fontWeight: 300, marginBottom: "4px" }}>
              Revenue — Last 7 Days
            </h2>
            <p style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "24px" }}>
              From delivered orders
            </p>

            <div style={{ display: "flex", alignItems: "flex-end", gap: "12px", height: "160px" }}>
              {chartData.map((d, i) => (
                <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", height: "100%", justifyContent: "flex-end" }}>
                  {d.revenue > 0 && (
                    <p style={{ fontSize: "10px", color: "var(--text-muted)" }}>৳{d.revenue >= 1000 ? `${(d.revenue/1000).toFixed(1)}k` : d.revenue}</p>
                  )}
                  <div style={{
                    width: "100%",
                    height: d.revenue > 0 ? `${Math.max((d.revenue / maxRevenue) * 100, 4)}%` : "2px",
                    background: d.revenue > 0
                      ? "linear-gradient(to top, var(--gold-dim), var(--gold))"
                      : "var(--border)",
                    transition: "height 0.3s ease",
                    minHeight: "2px",
                  }} />
                  <p style={{ fontSize: "10px", color: "var(--text-muted)", letterSpacing: "0.05em" }}>{d.day}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Order status breakdown */}
          <div style={{ background: "var(--black-card)", border: "1px solid var(--border)", padding: "24px" }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "18px", fontWeight: 300, marginBottom: "20px" }}>
              Order Status Breakdown
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {Object.entries(statusCounts).map(([status, count]) => {
                const cfg = statusConfig[status]
                const percentage = orders.length > 0 ? (count / orders.length) * 100 : 0
                return (
                  <div key={status}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                      <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{cfg.label}</span>
                      <span style={{ fontSize: "12px", color: cfg.color, fontWeight: 600 }}>{count}</span>
                    </div>
                    <div style={{ height: "6px", background: "var(--black-soft)", borderRadius: "3px", overflow: "hidden" }}>
                      <div style={{
                        height: "100%", width: `${percentage}%`,
                        background: cfg.color, transition: "width 0.3s ease",
                        borderRadius: "3px",
                      }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Recent orders */}
          <div style={{ background: "var(--black-card)", border: "1px solid var(--border)" }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: "18px", fontWeight: 300 }}>Recent Orders</h2>
              <Link href="/admin/orders" className="gold-link">View All →</Link>
            </div>
            {orders.length === 0 ? (
              <div style={{ padding: "40px", textAlign: "center" }}>
                <p style={{ color: "var(--text-muted)", fontSize: "13px" }}>No orders yet</p>
              </div>
            ) : (
              orders.slice(0, 5).map((order: any, i: number) => {
                const cfg = statusConfig[order.status] || statusConfig.PENDING
                return (
                  <Link key={order.id} href={`/admin/orders`} style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "14px 24px",
                    borderBottom: i < 4 ? "1px solid var(--border-soft)" : "none",
                    textDecoration: "none", transition: "background 0.2s",
                  }} className="admin-product-row">
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "var(--black-soft)", border: "1px solid var(--border)", overflow: "hidden", flexShrink: 0 }}>
                        {order.user.image
                          ? <img src={order.user.image} alt="" style={{ width: "100%", height: "100%" }} />
                          : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", color: "var(--text-muted)" }}>{order.user.name?.[0] || "?"}</div>
                        }
                      </div>
                      <div>
                        <p style={{ fontSize: "12px", color: "var(--text-primary)", marginBottom: "2px" }}>{order.user.name || "Unknown"}</p>
                        <p style={{ fontSize: "10px", color: "var(--text-muted)", fontFamily: "monospace" }}>#{order.id.slice(-8).toUpperCase()}</p>
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p style={{ fontSize: "13px", color: "var(--gold)", fontWeight: 500, marginBottom: "4px" }}>৳{Number(order.total).toLocaleString()}</p>
                      <span style={{ fontSize: "9px", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600, padding: "2px 8px", color: cfg.color, background: cfg.bg }}>
                        {cfg.label}
                      </span>
                    </div>
                  </Link>
                )
              })
            )}
          </div>
        </div>

        {/* ── Right column ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

          {/* Quick stats */}
          <div style={{ background: "var(--black-card)", border: "1px solid var(--border)", padding: "24px" }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "18px", fontWeight: 300, marginBottom: "16px" }}>
              Store Overview
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <Package size={14} style={{ color: "var(--text-muted)" }} />
                  <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Total Products</span>
                </div>
                <span style={{ fontSize: "14px", color: "var(--text-primary)", fontWeight: 600 }}>{productCount}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <Eye size={14} style={{ color: "var(--text-muted)" }} />
                  <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Active Products</span>
                </div>
                <span style={{ fontSize: "14px", color: "#22c55e", fontWeight: 600 }}>{activeProductCount}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <Clock size={14} style={{ color: "var(--text-muted)" }} />
                  <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Active Orders</span>
                </div>
                <span style={{ fontSize: "14px", color: "#3b82f6", fontWeight: 600 }}>{activeOrders.length}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <XCircle size={14} style={{ color: "var(--text-muted)" }} />
                  <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Cancelled Orders</span>
                </div>
                <span style={{ fontSize: "14px", color: "#ef4444", fontWeight: 600 }}>{cancelledOrders.length}</span>
              </div>
            </div>
          </div>

          {/* Low stock alert */}
          <div style={{ background: "var(--black-card)", border: "1px solid var(--border)" }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "10px" }}>
              <AlertTriangle size={16} style={{ color: "#f59e0b" }} />
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: "18px", fontWeight: 300 }}>Low Stock Alert</h2>
            </div>
            {lowStockVariants.length === 0 ? (
              <div style={{ padding: "32px", textAlign: "center" }}>
                <CheckCircle size={24} style={{ color: "#22c55e", margin: "0 auto 8px" }} />
                <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>All stock levels healthy</p>
              </div>
            ) : (
              lowStockVariants.map((v: any, i: number) => (
                <Link key={v.id} href={`/admin/products`} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "12px 24px",
                  borderBottom: i < lowStockVariants.length - 1 ? "1px solid var(--border-soft)" : "none",
                  textDecoration: "none", transition: "background 0.2s",
                }} className="admin-product-row">
                  <div>
                    <p style={{ fontSize: "12px", color: "var(--text-primary)", marginBottom: "2px" }}>{v.product.name}</p>
                    <p style={{ fontSize: "10px", color: "var(--text-muted)" }}>{v.size} / {v.color}</p>
                  </div>
                  <span style={{
                    fontSize: "11px", fontWeight: 600,
                    color: v.stock === 0 ? "#ef4444" : "#f59e0b",
                  }}>
                    {v.stock === 0 ? "Out of stock" : `${v.stock} left`}
                  </span>
                </Link>
              ))
            )}
          </div>

          {/* Top categories */}
          <div style={{ background: "var(--black-card)", border: "1px solid var(--border)", padding: "24px" }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "18px", fontWeight: 300, marginBottom: "16px" }}>
              Categories
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {topCategories.map((cat: any) => (
                <div key={cat.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{cat.name}</span>
                  <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>{cat._count.products} products</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent reviews */}
          {recentReviews.length > 0 && (
            <div style={{ background: "var(--black-card)", border: "1px solid var(--border)" }}>
              <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)" }}>
                <h2 style={{ fontFamily: "var(--font-display)", fontSize: "18px", fontWeight: 300 }}>Recent Reviews</h2>
              </div>
              {recentReviews.map((review: any, i: number) => (
                <div key={review.id} style={{
                  padding: "14px 24px",
                  borderBottom: i < recentReviews.length - 1 ? "1px solid var(--border-soft)" : "none",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                    <p style={{ fontSize: "12px", color: "var(--text-primary)" }}>{review.user.name}</p>
                    <div style={{ display: "flex", gap: "1px" }}>
                      {[1,2,3,4,5].map((s) => (
                        <Star key={s} size={10} fill={s <= review.rating ? "var(--gold)" : "none"} style={{ color: s <= review.rating ? "var(--gold)" : "var(--border)" }} />
                      ))}
                    </div>
                  </div>
                  <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>on {review.product.name}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        .dashboard-grid {
          display: grid;
          grid-template-columns: 1.6fr 1fr;
          gap: 20px;
          align-items: start;
        }
        @media (max-width: 1024px) {
          .dashboard-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  )
}
