"use client"

import { useState } from "react"

interface Image {
  id: string
  url: string
  altText: string | null
  position: number
}

interface Props {
  images: Image[]
  productName: string
  isFeatured: boolean
}

export default function ProductImageGallery({ images, productName, isFeatured }: Props) {
  const [activeIndex, setActiveIndex] = useState(0)
  const activeImage = images[activeIndex]

  return (
    <div>
      {/* Main image */}
      <div style={{
        aspectRatio: "3/4",
        background: "var(--black-soft)",
        border: "1px solid var(--border)",
        overflow: "hidden",
        marginBottom: "12px",
        position: "relative",
      }}>
        {activeImage ? (
          <img
            src={activeImage.url}
            alt={activeImage.altText || productName}
            style={{ width: "100%", height: "100%", objectFit: "cover", transition: "opacity 0.2s ease" }}
          />
        ) : (
          <div style={{
            width: "100%", height: "100%",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "var(--text-muted)", fontSize: "12px", letterSpacing: "0.1em",
          }}>
            NO IMAGE
          </div>
        )}

        {isFeatured && (
          <div style={{
            position: "absolute", top: "16px", left: "16px",
            background: "var(--gold)", color: "var(--black)",
            fontSize: "9px", letterSpacing: "0.15em",
            textTransform: "uppercase", fontWeight: 600,
            padding: "4px 10px",
          }}>Featured</div>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "4px" }}>
          {images.map((img, i) => (
            <button
              key={img.id}
              onClick={() => setActiveIndex(i)}
              style={{
                width: "72px", height: "96px", flexShrink: 0,
                border: activeIndex === i ? "2px solid var(--gold)" : "1px solid var(--border)",
                background: "var(--black-soft)",
                padding: 0, cursor: "pointer", overflow: "hidden",
                transition: "border-color 0.2s",
              }}
            >
              <img
                src={img.url}
                alt={img.altText || ""}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
