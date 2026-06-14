import { notFound } from "next/navigation"
import db from "@/lib/db"
import ProductActions from "@/components/ProductActions"
import ProductImageGallery from "@/components/ProductImageGallery"
import Link from "next/link"

interface Props {
  params: Promise<{ slug: string }>
}

async function getProduct(slug: string) {
  return await db.product.findUnique({
    where: { slug, isActive: true },
    include: {
      images: { orderBy: { position: "asc" } },
      variants: { orderBy: [{ color: "asc" }, { size: "asc" }] },
      category: true,
      reviews: {
        where: { isVisible: true },
        include: { user: { select: { name: true, image: true } } },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  })
}

async function getRelatedProducts(categoryId: string, excludeId: string) {
  return await db.product.findMany({
    where: { categoryId, isActive: true, id: { not: excludeId } },
    include: {
      images: { orderBy: { position: "asc" }, take: 1 },
      category: true,
    },
    take: 4,
  })
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params
  const product = await getProduct(slug)
  if (!product) notFound()

  const related = await getRelatedProducts(product.categoryId, product.id)

  const colors = [
    ...new Map(
      product.variants.map((v) => [v.color, { color: v.color, colorHex: v.colorHex }])
    ).values(),
  ]
  const sizes = [...new Set(product.variants.map((v) => v.size))]

  const avgRating =
    product.reviews.length > 0
      ? product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length
      : 0

  return (
    <main style={{ paddingTop: "var(--nav-height)", minHeight: "100vh" }}>
      <section style={{ padding: "48px 0" }}>
        <div className="container">

          {/* Breadcrumb */}
          <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "32px", flexWrap: "wrap" }}>
            <Link href="/shop" style={{ fontSize: "11px", color: "var(--text-muted)", textDecoration: "none", letterSpacing: "0.1em", textTransform: "uppercase" }}>Shop</Link>
            <span style={{ color: "var(--text-muted)" }}>›</span>
            <Link href={`/shop?category=${product.category.slug}`} style={{ fontSize: "11px", color: "var(--text-muted)", textDecoration: "none", letterSpacing: "0.1em", textTransform: "uppercase" }}>{product.category.name}</Link>
            <span style={{ color: "var(--text-muted)" }}>›</span>
            <span style={{ fontSize: "11px", color: "var(--text-secondary)", letterSpacing: "0.1em", textTransform: "uppercase" }}>{product.name}</span>
          </div>

          {/* Main grid */}
          <div className="product-detail-grid">

            {/* Images — client component */}
            <div className="product-images-section">
              <ProductImageGallery
                images={product.images}
                productName={product.name}
                isFeatured={product.isFeatured}
              />
            </div>

            {/* Info */}
            <div className="product-info-section">
              <p style={{ fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--gold)", marginBottom: "8px", fontWeight: 500 }}>
                {product.category.name}
              </p>

              <h1 style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(28px, 4vw, 48px)",
                fontWeight: 300, lineHeight: 1.1,
                marginBottom: "16px", color: "var(--text-primary)",
              }}>
                {product.name}
              </h1>

              {product.reviews.length > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
                  <div style={{ display: "flex", gap: "2px" }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span key={star} style={{ color: star <= Math.round(avgRating) ? "var(--gold)" : "var(--border)", fontSize: "14px" }}>★</span>
                    ))}
                  </div>
                  <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                    {avgRating.toFixed(1)} ({product.reviews.length} {product.reviews.length === 1 ? "review" : "reviews"})
                  </span>
                </div>
              )}

              <p style={{ fontSize: "28px", fontWeight: 500, color: "var(--gold)", marginBottom: "24px" }}>
                ৳{Number(product.price).toLocaleString()}
              </p>

              <div style={{ width: "40px", height: "1px", background: "var(--border)", marginBottom: "24px" }} />

              <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.9, marginBottom: "28px", fontWeight: 300 }}>
                {product.description}
              </p>

              {(product.brand || product.material) && (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "28px" }}>
                  {product.brand && (
                    <div style={{ display: "flex", gap: "16px" }}>
                      <span style={{ fontSize: "10px", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 500, minWidth: "70px" }}>Brand</span>
                      <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>{product.brand}</span>
                    </div>
                  )}
                  {product.material && (
                    <div style={{ display: "flex", gap: "16px" }}>
                      <span style={{ fontSize: "10px", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 500, minWidth: "70px" }}>Material</span>
                      <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>{product.material}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Interactive actions — client component */}
              <ProductActions
                productId={product.id}
                variants={product.variants.map((v) => ({
                  id: v.id,
                  size: v.size,
                  color: v.color,
                  colorHex: v.colorHex,
                  stock: v.stock,
                }))}
                colors={colors}
                sizes={sizes}
              />

              {/* Shipping info */}
              <div style={{
                marginTop: "24px", padding: "16px",
                border: "1px solid var(--border-soft)",
                background: "var(--black-card)",
              }}>
                <p style={{ fontSize: "11px", color: "var(--text-muted)", lineHeight: 1.8, letterSpacing: "0.03em" }}>
                  🚚 Free shipping on orders over ৳5,000<br />
                  📦 Ships within 1–3 business days<br />
                  ↩️ Easy returns within 7 days
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Reviews */}
      {product.reviews.length > 0 && (
        <section style={{ padding: "64px 0", borderTop: "1px solid var(--border)", background: "var(--black-soft)" }}>
          <div className="container">
            <p className="section-label">Feedback</p>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(24px, 3vw, 36px)", fontWeight: 300, marginBottom: "40px" }}>
              Customer Reviews
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
              {product.reviews.map((review) => (
                <div key={review.id} style={{ background: "var(--black-card)", border: "1px solid var(--border)", padding: "24px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      {review.user.image && (
                        <img src={review.user.image} alt="" style={{ width: 32, height: 32, borderRadius: "50%" }} />
                      )}
                      <div>
                        <p style={{ fontSize: "13px", color: "var(--text-primary)", fontWeight: 500 }}>{review.user.name}</p>
                        <p style={{ fontSize: "10px", color: "var(--text-muted)" }}>
                          {new Date(review.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "2px" }}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span key={star} style={{ color: star <= review.rating ? "var(--gold)" : "var(--border)", fontSize: "12px" }}>★</span>
                      ))}
                    </div>
                  </div>
                  {review.title && <p style={{ fontSize: "14px", color: "var(--text-primary)", fontWeight: 500, marginBottom: "6px" }}>{review.title}</p>}
                  {review.body && <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.7 }}>{review.body}</p>}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Related products */}
      {related.length > 0 && (
        <section style={{ padding: "64px 0", borderTop: "1px solid var(--border)" }}>
          <div className="container">
            <p className="section-label">You May Also Like</p>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(24px, 3vw, 36px)", fontWeight: 300, marginBottom: "32px" }}>
              Related Pieces
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "1px", background: "var(--border)" }}>
              {related.map((p) => (
                <Link key={p.id} href={`/shop/${p.slug}`} className="product-card">
                  <div className="product-card-image">
                    {p.images[0]
                      ? <img src={p.images[0].url} alt={p.name} />
                      : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: "10px" }}>NO IMAGE</div>
                    }
                    <div className="product-card-overlay">
                      <span className="btn-primary" style={{ fontSize: "10px", padding: "10px 20px" }}>View</span>
                    </div>
                  </div>
                  <div className="product-card-info">
                    <p className="product-card-category">{p.category.name}</p>
                    <h3 className="product-card-name">{p.name}</h3>
                    <p className="product-card-price">৳{Number(p.price).toLocaleString()}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <style>{`
        .product-detail-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 64px;
          align-items: start;
        }
        .product-images-section {
          position: sticky;
          top: calc(var(--nav-height) + 24px);
        }
        @media (max-width: 900px) {
          .product-detail-grid {
            grid-template-columns: 1fr;
            gap: 32px;
          }
          .product-images-section { position: static; }
        }
      `}</style>
    </main>
  )
}
