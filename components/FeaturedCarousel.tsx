"use client"

import { useEffect, useRef } from "react"
import Link from "next/link"

interface FeaturedCarouselProps {
  products: any[]
}

export default function FeaturedCarousel({ products }: FeaturedCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-slide logic
  useEffect(() => {
    const interval = setInterval(() => {
      if (scrollRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
        // If reached the end, smoothly loop back to start
        if (scrollLeft + clientWidth >= scrollWidth - 10) {
          scrollRef.current.scrollTo({ left: 0, behavior: "smooth" })
        } else {
          // Scroll forward by one card width (~240px)
          scrollRef.current.scrollBy({ left: 240, behavior: "smooth" })
        }
      }
    }, 2000) // 2-second delay

    return () => clearInterval(interval)
  }, [])

  // Manual scroll for desktop buttons
  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const amount = direction === "left" ? -240 : 240
      scrollRef.current.scrollBy({ left: amount, behavior: "smooth" })
    }
  }

  if (!products || products.length === 0) return null

  return (
    <div style={{ position: "relative" }}>
      {/* Carousel Track */}
      <div
        ref={scrollRef}
        className="carousel-track"
        style={{
          display: "flex",
          overflowX: "auto",
          scrollSnapType: "x mandatory",
          gap: "1px",
          background: "var(--border)",
          paddingBottom: "10px", // Prevent scrollbar clipping
        }}
      >
        {products.map((product: any) => (
          <div
            key={product.id}
            style={{
              flex: "0 0 auto",
              width: "100%",
              maxWidth: "280px", // Fits multiple on desktop, 1 on small mobile
              scrollSnapAlign: "start",
              background: "var(--black-soft)",
            }}
          >
            <Link href={`/shop/${product.slug}`} className="product-card" style={{ display: "block", height: "100%" }}>
              <div className="product-card-image">
                {product.images[0] ? (
                  <img src={product.images[0].url} alt={product.images[0].altText || product.name} />
                ) : (
                  <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: "11px" }}>NO IMAGE</div>
                )}
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
          </div>
        ))}
      </div>

      {/* Desktop Navigation Buttons */}
      <button className="desktop-only carousel-btn prev" onClick={() => scroll("left")}>
        &#10094;
      </button>
      <button className="desktop-only carousel-btn next" onClick={() => scroll("right")}>
        &#10095;
      </button>

      <style>{`
        /* Hide native scrollbar for cleaner look */
        .carousel-track::-webkit-scrollbar {
          display: none;
        }
        .carousel-track {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        .carousel-btn {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          background: rgba(0, 0, 0, 0.7);
          color: white;
          border: 1px solid var(--border);
          cursor: pointer;
          z-index: 10;
          border-radius: 50%;
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s;
        }
        .carousel-btn:hover {
          background: var(--gold, #d4af37);
        }
        .carousel-btn.prev {
          left: -22px;
        }
        .carousel-btn.next {
          right: -22px;
        }
      `}</style>
    </div>
  )
}