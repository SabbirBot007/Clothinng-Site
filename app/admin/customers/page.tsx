import db from "@/lib/db"
import { Users } from "lucide-react"

export default async function AdminCustomersPage() {
  const customers = await db.user.findMany({
    where: { isAdmin: false },
    include: {
      orders: {
        select: { total: true, status: true, createdAt: true },
        orderBy: { createdAt: "desc" },
      },
      _count: { select: { orders: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  const totalRevenue = customers.reduce((sum, c) => {
    // 1. Calculate the valid revenue for just this specific customer
    const customerValidOrders = c.orders.filter(
      (o) => o.status !== "CANCELLED" && o.status !== "PENDING"
    );
    const customerTotal = customerValidOrders.reduce((s, o) => s + Number(o.total), 0);

    // 2. Add it to the running grand total
    return sum + customerTotal;
  }, 0); // <-- The 0 here tells TypeScript 'sum' is a number!

  return (
    <div>
      <div style={{ marginBottom: "40px" }}>
        <p className="section-label">Admin</p>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "36px", fontWeight: 300 }}>Customers</h1>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "16px", marginBottom: "32px" }}>
        {[
          { label: "Total Customers", value: customers.length, color: "var(--text-primary)" },
          { label: "With Orders", value: customers.filter((c) => c._count.orders > 0).length, color: "var(--gold)" },
          { label: "Total Revenue", value: `৳${totalRevenue.toLocaleString()}`, color: "#22c55e" },
        ].map((stat) => (
          <div key={stat.label} style={{ background: "var(--black-card)", border: "1px solid var(--border)", padding: "20px" }}>
            <p style={{ fontSize: "10px", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "8px" }}>
              {stat.label}
            </p>
            <p style={{ fontSize: "24px", fontWeight: 600, color: stat.color }}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Customers table */}
      <div style={{ background: "var(--black-card)", border: "1px solid var(--border)" }}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)" }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "20px", fontWeight: 300 }}>
            All Customers
          </h2>
        </div>

        {customers.length === 0 ? (
          <div style={{ padding: "60px", textAlign: "center" }}>
            <Users size={32} style={{ color: "var(--text-muted)", margin: "0 auto 16px" }} />
            <p style={{ color: "var(--text-muted)", fontFamily: "var(--font-display)", fontSize: "20px" }}>
              No customers yet
            </p>
          </div>
        ) : (
          <div>
            {/* Table header */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 120px 100px 140px 120px",
              padding: "12px 24px",
              borderBottom: "1px solid var(--border)",
              gap: "16px",
            }}>
              {["Customer", "Orders", "Spent", "Last Order", "Joined"].map((h) => (
                <p key={h} style={{ fontSize: "9px", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 500 }}>
                  {h}
                </p>
              ))}
            </div>

            {customers.map((customer, i) => {
              const totalSpent = customer.orders
                .filter((o) => o.status !== "CANCELLED" && o.status !== "PENDING")
                .reduce((sum, o) => sum + Number(o.total), 0)
              const lastOrder = customer.orders[0]

              return (
                <div key={customer.id} style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 120px 100px 140px 120px",
                  padding: "16px 24px",
                  borderBottom: i < customers.length - 1 ? "1px solid var(--border-soft)" : "none",
                  alignItems: "center",
                  gap: "16px",
                  transition: "background 0.2s",
                }} className="admin-product-row">
                  {/* Customer */}
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{
                      width: "36px", height: "36px", borderRadius: "50%",
                      background: "var(--black-soft)", border: "1px solid var(--border)",
                      overflow: "hidden", flexShrink: 0,
                    }}>
                      {customer.image
                        ? <img src={customer.image} alt="" style={{ width: "100%", height: "100%" }} />
                        : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", color: "var(--text-muted)" }}>
                            {customer.name?.[0] || "?"}
                          </div>
                      }
                    </div>
                    <div>
                      <p style={{ fontSize: "13px", color: "var(--text-primary)", fontWeight: 500, marginBottom: "2px" }}>
                        {customer.name || "—"}
                      </p>
                      <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>{customer.email}</p>
                    </div>
                  </div>

                  {/* Orders count */}
                  <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
                    {customer._count.orders}
                  </p>

                  {/* Total spent */}
                  <p style={{ fontSize: "13px", color: totalSpent > 0 ? "var(--gold)" : "var(--text-muted)", fontWeight: totalSpent > 0 ? 500 : 300 }}>
                    {totalSpent > 0 ? `৳${totalSpent.toLocaleString()}` : "—"}
                  </p>

                  {/* Last order */}
                  <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                    {lastOrder
                      ? new Date(lastOrder.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
                      : "—"}
                  </p>

                  {/* Joined */}
                  <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                    {new Date(customer.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
