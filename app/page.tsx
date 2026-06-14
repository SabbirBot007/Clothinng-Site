import Link from "next/link"
import db from "@/lib/db"

async function getFeaturedProducts() {
  return await db.product.findMany({
    where: { isActive: true, isFeatured: true },
    include: {
      images: { orderBy: { position: "asc" }, take: 1 },
      category: true,
    },
    take: 4,
  })
}

async function getCategories() {
  return await db.category.findMany({
    where: { isActive: true },
    take: 6,
  })
}

export default async function HomePage() {
  const [featuredProducts, categories] = await Promise.all([
    getFeaturedProducts(),
    getCategories(),
  ])

  return (
    <main style={{ paddingTop: "var(--nav-height)", width: "100%", overflowX: "hidden" }}>

      {/* ── HERO ── */}
      <section style={{
        minHeight: "72vh",
        display: "flex",
        alignItems: "center",
        position: "relative",
        overflow: "hidden",
        background: "var(--black)",
        padding: "48px 0",
      }}>
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: `radial-gradient(ellipse at 60% 50%, rgba(201,168,76,0.06) 0%, transparent 60%)`,
          pointerEvents: "none",
        }} />

        <div className="container" style={{ width: "100%", position: "relative", zIndex: 1 }}>
          <div style={{ maxWidth: "600px" }}>
            <p className="section-label fade-up">Menswear Collection</p>

            <h1 className="fade-up fade-up-delay-1" style={{
              fontSize: "clamp(30px, 6.5vw, 86px)",
              fontFamily: "var(--font-display)",
              fontWeight: 300,
              lineHeight: 1.08,
              letterSpacing: "0.02em",
              color: "var(--text-primary)",
              marginBottom: "20px",
              wordBreak: "keep-all",
              overflowWrap: "break-word",
            }}>
              Dressed for
              <br />
              <em style={{ color: "var(--gold)", fontStyle: "italic" }}>
                the Discerning
              </em>
              <br />
              Man.
            </h1>

            <p className="fade-up fade-up-delay-2" style={{
              fontSize: "13px",
              color: "var(--text-secondary)",
              lineHeight: 1.8,
              marginBottom: "32px",
              maxWidth: "400px",
              fontWeight: 300,
            }}>
              Curated essentials and statement pieces for the modern gentleman.
              Crafted with intention. Worn with confidence.
            </p>

            <div className="fade-up fade-up-delay-3" style={{
              display: "flex", gap: "12px", flexWrap: "wrap",
            }}>
              <Link href="/shop" className="btn-primary">
                Explore Collection
              </Link>
              <Link href="/shop?sort=newest" className="btn-ghost">
                New Arrivals
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── MARQUEE ── */}
      <div style={{
        background: "var(--gold)", padding: "11px 0",
        overflow: "hidden", whiteSpace: "nowrap",
      }}>
        <div style={{
          display: "inline-block",
          animation: "marquee 22s linear infinite",
          fontSize: "10px", fontWeight: 600,
          letterSpacing: "0.2em", textTransform: "uppercase",
          color: "var(--black)",
        }}>
          {Array(6).fill(
            "Free Shipping on Orders Over ৳5000  ·  New Collection Available  ·  Premium Quality Guaranteed  ·  "
          ).join("")}
        </div>
      </div>

      {/* ── FEATURED PRODUCTS ── */}
      <section style={{
        padding: "64px 0",
        background: "var(--black-soft)",
        borderTop: "1px solid var(--border)",
        borderBottom: "1px solid var(--border)",
      }}>
        <div className="container">
          <div style={{
            display: "flex", alignItems: "baseline",
            justifyContent: "space-between", marginBottom: "32px",
          }}>
            <div>
              <p className="section-label">Handpicked</p>
              <h2 style={{
                fontSize: "clamp(24px, 4vw, 40px)",
                fontFamily: "var(--font-display)", fontWeight: 300,
              }}>Featured Pieces</h2>
            </div>
            <Link href="/shop" className="gold-link">View All →</Link>
          </div>

          {featuredProducts.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-muted)" }}>
              <p style={{ fontFamily: "var(--font-display)", fontSize: "22px", marginBottom: "8px" }}>
                No featured products yet
              </p>
              <p style={{ fontSize: "13px" }}>Add products from the admin panel</p>
            </div>
          ) : (
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
              gap: "1px", background: "var(--border)",
            }}>
              {featuredProducts.map((product) => (
                <Link key={product.id} href={`/shop/${product.slug}`} className="product-card">
                  <div className="product-card-image">
                    {product.images[0]
                      ? <img src={product.images[0].url} alt={product.images[0].altText || product.name} />
                      : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: "11px" }}>NO IMAGE</div>
                    }
                    <div className="product-card-overlay">
                      <span className="btn-primary" style={{ fontSize: "10px", padding: "10px 20px" }}>
                        Quick View
                      </span>
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
      </section>

      {/* ── CATEGORIES ── */}
      {categories.length > 0 && (
        <section style={{ padding: "64px 0" }}>
          <div className="container">
            <div style={{
              display: "flex", alignItems: "baseline",
              justifyContent: "space-between", marginBottom: "32px",
            }}>
              <div>
                <p className="section-label">Browse</p>
                <h2 style={{
                  fontSize: "clamp(24px, 4vw, 40px)",
                  fontFamily: "var(--font-display)", fontWeight: 300,
                }}>Shop by Category</h2>
              </div>
              <Link href="/shop" className="gold-link">View All →</Link>
            </div>

            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
              gap: "1px", background: "var(--border)",
            }}>
              {categories.map((cat) => (
                <Link key={cat.id} href={`/shop?category=${cat.slug}`} className="category-card">
                  <div style={{
                    fontSize: "10px", letterSpacing: "0.15em",
                    textTransform: "uppercase", color: "var(--gold)",
                    marginBottom: "10px", fontWeight: 500,
                  }}>Category</div>
                  <h3 style={{
                    fontFamily: "var(--font-display)", fontSize: "22px",
                    fontWeight: 300, color: "var(--text-primary)", marginBottom: "6px",
                  }}>{cat.name}</h3>
                  {cat.description && (
                    <p style={{ fontSize: "12px", color: "var(--text-muted)", lineHeight: 1.6 }}>
                      {cat.description}
                    </p>
                  )}
                  <div style={{
                    position: "absolute", bottom: "20px", right: "20px",
                    fontSize: "16px", color: "var(--text-muted)",
                  }}>→</div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── BRAND STATEMENT ── */}
      <section style={{ padding: "80px 0", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: `radial-gradient(ellipse at center, rgba(201,168,76,0.05) 0%, transparent 70%)`,
          pointerEvents: "none",
        }} />
        <div className="container">
          <p className="section-label" style={{ textAlign: "center" }}>Our Philosophy</p>
          <h2 style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(20px, 4vw, 52px)",
            fontWeight: 300, fontStyle: "italic",
            lineHeight: 1.4, maxWidth: "800px",
            margin: "0 auto 24px",
            color: "var(--text-primary)",
          }}>
            "Style is not about being noticed,
            <br />
            it's about being remembered."
          </h2>
          <div style={{ width: "40px", height: "1px", background: "var(--gold)", margin: "0 auto 20px" }} />
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{
        background: "var(--black-soft)",
        borderTop: "1px solid var(--border)",
        padding: "48px 0 28px",
      }}>
        <div className="container">
          <div className="footer-grid">
            <div>
              <div style={{
                fontFamily: "var(--font-display)", fontSize: "20px", fontWeight: 300,
                letterSpacing: "0.2em", color: "var(--text-primary)",
                marginBottom: "14px", textTransform: "uppercase",
              }}>
                Maison<span style={{ color: "var(--gold)" }}>.</span>
              </div>
              <p style={{ fontSize: "12px", color: "var(--text-muted)", lineHeight: 1.8, maxWidth: "220px" }}>
                Premium menswear for the modern gentleman. Crafted with precision, designed to endure.
              </p>
            </div>
            <div>
              <p style={{ fontSize: "9px", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--gold)", fontWeight: 500, marginBottom: "14px" }}>Shop</p>
              {["New Arrivals", "All Products", "Collections", "Sale"].map((item) => (
                <Link key={item} href="/shop" className="footer-link">{item}</Link>
              ))}
            </div>
            <div>
              <p style={{ fontSize: "9px", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--gold)", fontWeight: 500, marginBottom: "14px" }}>Help</p>
              {["Shipping Info", "Returns", "Size Guide", "Contact Us"].map((item) => (
                <Link key={item} href="#" className="footer-link">{item}</Link>
              ))}
            </div>
            <div>
              <p style={{ fontSize: "9px", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--gold)", fontWeight: 500, marginBottom: "14px" }}>Contact</p>
              <p style={{ fontSize: "12px", color: "var(--text-muted)", lineHeight: 1.8 }}>
                contact@maison.com<br />
                +880 1XXX-XXXXXX<br />
                Dhaka, Bangladesh
              </p>
            </div>
          </div>

          <div className="divider" style={{ marginBottom: "20px" }} />

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
            <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>© 2025 Maison. All rights reserved.</p>
            <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>Made in Bangladesh</p>
          </div>
        </div>
      </footer>
    </main>
  )
}
