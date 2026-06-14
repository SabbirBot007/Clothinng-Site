import Link from "next/link"
import db from "@/lib/db"
import ShopFilters from "@/components/ShopFilters"

interface ShopPageProps {
  searchParams: Promise<{ category?: string; sort?: string; search?: string }>
}

async function getProducts(params: { category?: string; sort?: string; search?: string }) {
  const orderBy =
    params.sort === "price-asc" ? { price: "asc" as const }
    : params.sort === "price-desc" ? { price: "desc" as const }
    : { createdAt: "desc" as const }

  return await db.product.findMany({
    where: {
      isActive: true,
      ...(params.category && { category: { slug: params.category } }),
      ...(params.search && { name: { contains: params.search, mode: "insensitive" } }),
    },
    include: {
      images: { orderBy: { position: "asc" }, take: 1 },
      category: true,
    },
    orderBy,
  })
}

async function getCategories() {
  return await db.category.findMany({ where: { isActive: true } })
}

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const params = await searchParams
  const [products, categories] = await Promise.all([getProducts(params), getCategories()])

  const sortOptions = [
    { value: "newest", label: "Newest" },
    { value: "price-asc", label: "Price ↑" },
    { value: "price-desc", label: "Price ↓" },
  ]

  function buildUrl(cat?: string, sort?: string) {
    const p = new URLSearchParams()
    if (cat) p.set("category", cat)
    if (sort) p.set("sort", sort)
    const qs = p.toString()
    return `/shop${qs ? `?${qs}` : ""}`
  }

  const activeCategory = categories.find((c) => c.slug === params.category)

  return (
    <main style={{ paddingTop: "var(--nav-height)", minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ padding: "48px 0 28px", borderBottom: "1px solid var(--border)" }}>
        <div className="container">
          <p className="section-label">Explore</p>
          <h1 style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(28px, 5vw, 52px)",
            fontWeight: 300, marginBottom: "6px",
          }}>
            {activeCategory ? activeCategory.name : "All Products"}
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "12px" }}>
            {products.length} {products.length === 1 ? "piece" : "pieces"} available
          </p>
        </div>
      </div>

      <div className="container" style={{ padding: "32px 1rem 64px" }}>

        {/* ── Mobile filters (dropdowns) ── */}
        <div style={{ marginBottom: "24px" }} className="mobile-only">
          <ShopFilters
            categories={categories}
            currentCategory={params.category}
            currentSort={params.sort}
          />
        </div>

        <div style={{ display: "flex", gap: "40px", alignItems: "flex-start" }}>

          {/* ── Desktop sidebar filters ── */}
          <aside style={{ width: "160px", flexShrink: 0 }} className="desktop-only">
            {/* Categories */}
            <div style={{ marginBottom: "32px" }}>
              <p style={{
                fontSize: "9px", letterSpacing: "0.2em", textTransform: "uppercase",
                color: "var(--gold)", fontWeight: 500, marginBottom: "14px",
              }}>Category</p>

              <Link href="/shop" style={{
                display: "block", fontSize: "12px", marginBottom: "10px",
                color: !params.category ? "var(--text-primary)" : "var(--text-muted)",
                textDecoration: "none",
                borderLeft: !params.category ? "2px solid var(--gold)" : "2px solid transparent",
                paddingLeft: "10px", transition: "all 0.2s",
              }}>All</Link>

              {categories.map((cat) => (
                <Link key={cat.id} href={buildUrl(cat.slug, params.sort)} style={{
                  display: "block", fontSize: "12px", marginBottom: "10px",
                  color: params.category === cat.slug ? "var(--text-primary)" : "var(--text-muted)",
                  textDecoration: "none",
                  borderLeft: params.category === cat.slug ? "2px solid var(--gold)" : "2px solid transparent",
                  paddingLeft: "10px", transition: "all 0.2s",
                }}>{cat.name}</Link>
              ))}
            </div>

            {/* Sort */}
            <div>
              <p style={{
                fontSize: "9px", letterSpacing: "0.2em", textTransform: "uppercase",
                color: "var(--gold)", fontWeight: 500, marginBottom: "14px",
              }}>Sort By</p>

              {sortOptions.map((opt) => (
                <Link key={opt.value} href={buildUrl(params.category, opt.value)} style={{
                  display: "block", fontSize: "12px", marginBottom: "10px",
                  color: params.sort === opt.value ? "var(--text-primary)" : "var(--text-muted)",
                  textDecoration: "none",
                  borderLeft: params.sort === opt.value ? "2px solid var(--gold)" : "2px solid transparent",
                  paddingLeft: "10px", transition: "all 0.2s",
                }}>{opt.label}</Link>
              ))}
            </div>
          </aside>

          {/* ── Product grid ── */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {products.length === 0 ? (
              <div style={{ textAlign: "center", padding: "80px 0", color: "var(--text-muted)" }}>
                <p style={{
                  fontFamily: "var(--font-display)", fontSize: "24px",
                  marginBottom: "12px", color: "var(--text-secondary)",
                }}>No products found</p>
                <p style={{ fontSize: "13px", marginBottom: "24px" }}>
                  Try a different category or check back soon
                </p>
                <Link href="/shop" className="btn-ghost">View All Products</Link>
              </div>
            ) : (
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                gap: "1px",
                background: "var(--border)",
              }}>
                {products.map((product) => (
                  <Link key={product.id} href={`/shop/${product.slug}`} className="product-card">
                    <div className="product-card-image">
                      {product.images[0]
                        ? <img src={product.images[0].url} alt={product.images[0].altText || product.name} />
                        : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: "10px" }}>NO IMAGE</div>
                      }
                      <div className="product-card-overlay">
                        <span className="btn-primary" style={{ fontSize: "10px", padding: "10px 20px" }}>View Details</span>
                      </div>
                    </div>
                    <div className="product-card-info">
                      <p className="product-card-category">{product.category.name}</p>
                      <h3 className="product-card-name">{product.name}</h3>
                      <p className="product-card-price">৳{Number(product.price).toLocaleString()}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .desktop-only { display: flex !important; }
        .mobile-only  { display: none !important; }
        @media (max-width: 768px) {
          .desktop-only { display: none !important; }
          .mobile-only  { display: block !important; }
        }
      `}</style>
    </main>
  )
}
