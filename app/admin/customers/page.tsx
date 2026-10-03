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

  function getCustomerRevenue(orders: { total: any; status: string }[]): number {
    return orders
      .filter((o) => o.status !== "CANCELLED" && o.status !== "PENDING")
      .reduce((sum: number, o) => sum + Number(o.total), 0)
  }

  const customerRevenues = customers.map((c) => getCustomerRevenue(c.orders))
  const totalRevenue = customerRevenues.reduce((sum: number, val: number) => sum + val, 0)

  return (
    <div>
      <div style={{ marginBottom: "40px" }}>
        <p className="section-label">Admin</p>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "36px", fontWeight: 300 }}>
          Customers
        </h1>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "16px", marginBottom: "32px" }}>
        {[
          { label: "Total Customers", value: customers.length,                                                    color: "var(--text-primary)" },
          { label: "With Orders",     value: customers.filter((c) => c._count.orders > 0).length,                color: "var(--gold)" },
          { label: "Total Revenue",   value: `৳${totalRevenue.toLocaleString()}`,                                color: "#22c55e" },
        ].map((stat) => (
          <div key={stat.label} style={{ background: "var(--black-card)", border: "1px solid var(--border)", padding: "20px" }}>
            <p style={{ fontSize: "10px", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "8px" }}>
              {stat.label}
            </p>
            <p style={{ fontSize: "24px", fontWeight: 600, color: stat.color }}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Customers list */}
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
          <>
            {/* ── Desktop table ── */}
            <div className="customers-desktop">
              {/* Header */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "1fr 80px 120px 130px 110px",
                padding: "12px 24px",
                borderBottom: "1px solid var(--border)",
                gap: "12px",
              }}>
                {["Customer", "Orders", "Spent", "Last Order", "Joined"].map((h) => (
                  <p key={h} style={{ fontSize: "9px", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 500 }}>
                    {h}
                  </p>
                ))}
              </div>

              {customers.map((customer, i) => {
                const totalSpent = getCustomerRevenue(customer.orders)
                const lastOrder = customer.orders[0]
                return (
                  <div key={customer.id} style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 80px 120px 130px 110px",
                    padding: "16px 24px",
                    borderBottom: i < customers.length - 1 ? "1px solid var(--border-soft)" : "none",
                    alignItems: "center",
                    gap: "12px",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "var(--black-soft)", border: "1px solid var(--border)", overflow: "hidden", flexShrink: 0 }}>
                        {customer.image
                          ? <img src={customer.image} alt="" style={{ width: "100%", height: "100%" }} />
                          : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", color: "var(--text-muted)" }}>
                              {customer.name?.[0] || "?"}
                            </div>
                        }
                      </div>
                      <div>
                        <p style={{ fontSize: "13px", color: "var(--text-primary)", fontWeight: 500, marginBottom: "2px" }}>{customer.name || "—"}</p>
                        <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>{customer.email}</p>
                      </div>
                    </div>
                    <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>{customer._count.orders}</p>
                    <p style={{ fontSize: "13px", color: totalSpent > 0 ? "var(--gold)" : "var(--text-muted)", fontWeight: totalSpent > 0 ? 500 : 300 }}>
                      {totalSpent > 0 ? `৳${totalSpent.toLocaleString()}` : "—"}
                    </p>
                    <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                      {lastOrder ? new Date(lastOrder.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                    </p>
                    <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                      {new Date(customer.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                )
              })}
            </div>

            {/* ── Mobile cards ── */}
            <div className="customers-mobile">
              {customers.map((customer, i) => {
                const totalSpent = getCustomerRevenue(customer.orders)
                const lastOrder = customer.orders[0]
                return (
                  <div key={customer.id} style={{
                    padding: "20px",
                    borderBottom: i < customers.length - 1 ? "1px solid var(--border-soft)" : "none",
                  }}>
                    {/* Customer info */}
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                      <div style={{ width: "44px", height: "44px", borderRadius: "50%", background: "var(--black-soft)", border: "1px solid var(--border)", overflow: "hidden", flexShrink: 0 }}>
                        {customer.image
                          ? <img src={customer.image} alt="" style={{ width: "100%", height: "100%" }} />
                          : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", color: "var(--text-muted)" }}>
                              {customer.name?.[0] || "?"}
                            </div>
                        }
                      </div>
                      <div>
                        <p style={{ fontSize: "14px", color: "var(--text-primary)", fontWeight: 500, marginBottom: "2px" }}>
                          {customer.name || "—"}
                        </p>
                        <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>{customer.email}</p>
                      </div>
                    </div>

                    {/* Stats grid */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                      <div style={{ background: "var(--black-soft)", padding: "12px" }}>
                        <p style={{ fontSize: "9px", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "4px" }}>Orders</p>
                        <p style={{ fontSize: "16px", color: "var(--text-primary)", fontWeight: 600 }}>{customer._count.orders}</p>
                      </div>
                      <div style={{ background: "var(--black-soft)", padding: "12px" }}>
                        <p style={{ fontSize: "9px", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "4px" }}>Total Spent</p>
                        <p style={{ fontSize: "16px", color: totalSpent > 0 ? "var(--gold)" : "var(--text-muted)", fontWeight: 600 }}>
                          {totalSpent > 0 ? `৳${totalSpent.toLocaleString()}` : "—"}
                        </p>
                      </div>
                      <div style={{ background: "var(--black-soft)", padding: "12px" }}>
                        <p style={{ fontSize: "9px", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "4px" }}>Last Order</p>
                        <p style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                          {lastOrder ? new Date(lastOrder.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                        </p>
                      </div>
                      <div style={{ background: "var(--black-soft)", padding: "12px" }}>
                        <p style={{ fontSize: "9px", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "4px" }}>Joined</p>
                        <p style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                          {new Date(customer.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>

      <style>{`
        .customers-desktop { display: block; }
        .customers-mobile  { display: none; }
        @media (max-width: 768px) {
          .customers-desktop { display: none; }
          .customers-mobile  { display: block; }
        }
      `}</style>
    </div>
  )
}
