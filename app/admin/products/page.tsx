import Link from "next/link"
import db from "@/lib/db"
import { Plus, Pencil, Package } from "lucide-react"
import AdminDeleteProduct from "@/components/admin/AdminDeleteProduct"

export default async function AdminProductsPage() {
  const products = await db.product.findMany({
    include: {
      category: true,
      images: { orderBy: { position: "asc" }, take: 1 },
      variants: true,
    },
    orderBy: { createdAt: "desc" },
  })

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: "40px", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <p className="section-label">Admin</p>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "36px", fontWeight: 300 }}>
            Products
          </h1>
        </div>
        <Link href="/admin/products/new" className="btn-primary">
          <Plus size={14} />
          Add Product
        </Link>
      </div>

      {/* Products list - Styled like the Orders page */}
      <div style={{ background: "var(--black-card)", border: "1px solid var(--border)" }}>
        
        {/* List Header */}
        <div style={{
          padding: "20px 24px", borderBottom: "1px solid var(--border)",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "20px", fontWeight: 300 }}>
            All Products
          </h2>
          <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>{products.length} products</p>
        </div>

        {products.length === 0 ? (
          <div style={{ padding: "80px", textAlign: "center" }}>
            <Package size={32} style={{ color: "var(--text-muted)", margin: "0 auto 16px" }} />
            <p style={{ fontFamily: "var(--font-display)", fontSize: "22px", color: "var(--text-secondary)", marginBottom: "8px" }}>
              No products yet
            </p>
            <p style={{ color: "var(--text-muted)", fontSize: "13px", marginBottom: "24px" }}>
              Add your first product to get started
            </p>
            <Link href="/admin/products/new" className="btn-primary">
              <Plus size={14} /> Add First Product
            </Link>
          </div>
        ) : (
          <div>
            {products.map((product: any, i: number) => {
              const totalStock = product.variants.reduce((sum: number, v: any) => sum + v.stock, 0)
              return (
                <div
                  key={product.id}
                  style={{
                    padding: "20px 24px",
                    borderBottom: i < products.length - 1 ? "1px solid var(--border-soft)" : "none",
                    transition: "background 0.2s",
                  }}
                  className="admin-product-row"
                >
                  <div style={{
                    display: "flex", justifyContent: "space-between",
                    alignItems: "flex-start", flexWrap: "wrap", gap: "16px",
                  }}>

                    {/* Product Info (Left Side) */}
                    <div style={{ display: "flex", gap: "16px", alignItems: "flex-start", flex: "1 1 250px" }}>
                      {/* Image */}
                      <div style={{
                        width: "48px",
                        height: "64px",
                        background: "var(--black-soft)",
                        border: "1px solid var(--border)",
                        overflow: "hidden",
                        flexShrink: 0,
                      }}>
                        {product.images[0] && (
                          <img
                            src={product.images[0].url}
                            alt={product.name}
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          />
                        )}
                      </div>

                      {/* Details */}
                      <div>
                        <p style={{ fontSize: "14px", color: "var(--text-primary)", fontWeight: 500, marginBottom: "4px" }}>
                          {product.name}
                        </p>
                        <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "4px" }}>
                          {product.category.name}
                        </p>
                        <p style={{ fontSize: "10px", color: "var(--text-muted)", fontFamily: "monospace", marginBottom: "4px" }}>
                          {product.slug}
                        </p>
                        {product.isFeatured && (
                          <p style={{ fontSize: "10px", color: "var(--gold)", fontWeight: 500 }}>
                            ★ Featured
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Price, Stock, Status & Actions (Right Side) */}
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "12px", minWidth: "160px" }}>
                      <p style={{ fontSize: "18px", color: "var(--gold)", fontWeight: 500 }}>
                        ৳{Number(product.price).toLocaleString()}
                      </p>
                      
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <p style={{
                          fontSize: "11px",
                          color: totalStock === 0 ? "#ef4444" : totalStock < 10 ? "#f59e0b" : "var(--text-secondary)",
                          fontWeight: 500,
                        }}>
                          Stock: {totalStock}
                        </p>
                        <span style={{
                          fontSize: "9px",
                          letterSpacing: "0.1em",
                          textTransform: "uppercase",
                          fontWeight: 600,
                          padding: "4px 10px",
                          background: product.isActive ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
                          color: product.isActive ? "#22c55e" : "#ef4444",
                          border: `1px solid ${product.isActive ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"}`,
                        }}>
                          {product.isActive ? "Active" : "Hidden"}
                        </span>
                      </div>

                      {/* Actions */}
                      <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                        <Link
                          href={`/admin/products/${product.id}/edit`}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: "32px",
                            height: "32px",
                            border: "1px solid var(--border)",
                            color: "var(--text-muted)",
                            textDecoration: "none",
                            transition: "all 0.2s",
                          }}
                          className="admin-action-btn"
                        >
                          <Pencil size={13} />
                        </Link>
                        <AdminDeleteProduct productId={product.id} productName={product.name} />
                      </div>
                    </div>

                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <style>{`
        .admin-product-row:hover { background: var(--black-hover); }
        .admin-action-btn:hover { border-color: var(--gold) !important; color: var(--gold) !important; }
      `}</style>
    </div>
  )
}