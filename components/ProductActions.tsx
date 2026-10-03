"use client"

import { useState } from "react"
import { useSession, signIn } from "next-auth/react"
import { ShoppingBag, Heart, Loader2 } from "lucide-react"
import toast from "react-hot-toast"

interface Variant {
  id: string
  size: string
  color: string
  colorHex: string | null
  stock: number
}

interface Props {
  productId: string
  variants: Variant[]
  colors: { color: string; colorHex: string | null }[]
  sizes: string[]
}

export default function ProductActions({ productId, variants, colors, sizes }: Props) {
  const { data: session } = useSession()
  const [selectedColor, setSelectedColor] = useState<string>(colors[0]?.color || "")
  const [selectedSize, setSelectedSize] = useState<string>("")
  const [quantity, setQuantity] = useState(1)
  const [addingToCart, setAddingToCart] = useState(false)
  const [addingToWishlist, setAddingToWishlist] = useState(false)

  // Get selected variant
  const selectedVariant = variants.find(
    (v) => v.color === selectedColor && v.size === selectedSize
  )

  // Get available sizes for selected color
  const availableSizes = variants
    .filter((v) => v.color === selectedColor && v.stock > 0)
    .map((v) => v.size)

  // Get available colors for selected size
  const availableColors = selectedSize
    ? variants.filter((v) => v.size === selectedSize && v.stock > 0).map((v) => v.color)
    : colors.map((c) => c.color)

  const stock = selectedVariant?.stock ?? 0
  const isOutOfStock = selectedVariant ? stock === 0 : false

  async function handleAddToCart() {
    if (!session) {
      signIn("google")
      return
    }
    if (!selectedSize) {
      toast.error("Please select a size")
      return
    }
    if (!selectedColor) {
      toast.error("Please select a color")
      return
    }
    if (!selectedVariant) {
      toast.error("This combination is unavailable")
      return
    }
    if (isOutOfStock) {
      toast.error("Out of stock")
      return
    }

    setAddingToCart(true)
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          variantId: selectedVariant.id,
          quantity,
        }),
      })
      if (!res.ok) throw new Error("Failed")
      toast.success("Added to cart!")
    } catch {
      toast.error("Failed to add to cart")
    } finally {
      setAddingToCart(false)
    }
  }

  async function handleWishlist() {
    if (!session) {
      signIn("google")
      return
    }
    setAddingToWishlist(true)
    try {
      const res = await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      })
      if (!res.ok) throw new Error("Failed")
      toast.success("Added to wishlist!")
    } catch {
      toast.error("Failed to add to wishlist")
    } finally {
      setAddingToWishlist(false)
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

      {/* Color selector */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
          <p style={{ fontSize: "10px", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 500 }}>
            Color
          </p>
          {selectedColor && (
            <p style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{selectedColor}</p>
          )}
        </div>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          {colors.map(({ color, colorHex }) => {
            const available = availableColors.includes(color)
            const selected = selectedColor === color
            return (
              <button
                key={color}
                onClick={() => {
                  setSelectedColor(color)
                  // Reset size if not available in new color
                  if (selectedSize && !variants.find((v) => v.color === color && v.size === selectedSize && v.stock > 0)) {
                    setSelectedSize("")
                  }
                }}
                disabled={!available}
                title={color}
                style={{
                  width: "36px", height: "36px",
                  borderRadius: "50%",
                  background: colorHex || "#888",
                  border: selected ? "2px solid var(--gold)" : "2px solid transparent",
                  outline: selected ? "2px solid var(--gold)" : "2px solid transparent",
                  outlineOffset: "2px",
                  cursor: available ? "pointer" : "not-allowed",
                  opacity: available ? 1 : 0.3,
                  transition: "all 0.2s",
                  position: "relative",
                }}
              />
            )
          })}
        </div>
      </div>

      {/* Size selector */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
          <p style={{ fontSize: "10px", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 500 }}>
            Size
          </p>
          {selectedSize && stock > 0 && stock <= 5 && (
            <p style={{ fontSize: "11px", color: "#f59e0b" }}>Only {stock} left</p>
          )}
        </div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {sizes.map((size) => {
            const available = availableSizes.includes(size)
            const selected = selectedSize === size
            return (
              <button
                key={size}
                onClick={() => setSelectedSize(size)}
                disabled={!available}
                style={{
                  minWidth: "48px", height: "48px",
                  padding: "0 12px",
                  border: selected ? "1px solid var(--gold)" : "1px solid var(--border)",
                  background: selected ? "var(--gold)" : "transparent",
                  color: selected ? "var(--black)" : available ? "var(--text-primary)" : "var(--text-muted)",
                  fontSize: "12px", fontWeight: selected ? 600 : 400,
                  letterSpacing: "0.05em",
                  cursor: available ? "pointer" : "not-allowed",
                  opacity: available ? 1 : 0.35,
                  transition: "all 0.2s",
                  fontFamily: "var(--font-body)",
                  position: "relative",
                }}
              >
                {size}
                {/* Strikethrough for unavailable */}
                {!available && (
                  <div style={{
                    position: "absolute", top: "50%", left: "4px", right: "4px",
                    height: "1px", background: "var(--text-muted)",
                    transform: "translateY(-50%)",
                  }} />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Quantity */}
      <div>
        <p style={{ fontSize: "10px", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 500, marginBottom: "12px" }}>
          Quantity
        </p>
        <div style={{ display: "flex", alignItems: "center", border: "1px solid var(--border)", width: "fit-content" }}>
          <button
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            style={{
              width: "40px", height: "40px", background: "none", border: "none",
              color: "var(--text-secondary)", cursor: "pointer", fontSize: "18px",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "color 0.2s",
            }}
          >−</button>
          <span style={{
            width: "48px", textAlign: "center", fontSize: "14px",
            color: "var(--text-primary)", fontWeight: 500,
          }}>{quantity}</span>
          <button
            onClick={() => setQuantity((q) => Math.min(stock || 10, q + 1))}
            style={{
              width: "40px", height: "40px", background: "none", border: "none",
              color: "var(--text-secondary)", cursor: "pointer", fontSize: "18px",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "color 0.2s",
            }}
          >+</button>
        </div>
      </div>

      {/* Stock status */}
      {selectedVariant && (
        <p style={{
          fontSize: "12px",
          color: isOutOfStock ? "#ef4444" : stock <= 5 ? "#f59e0b" : "#22c55e",
          letterSpacing: "0.05em",
        }}>
          {isOutOfStock ? "● Out of Stock" : stock <= 5 ? `● Only ${stock} left` : "● In Stock"}
        </p>
      )}

      {/* Action buttons */}
      <div style={{ display: "flex", gap: "12px" }}>
        <button
          onClick={handleAddToCart}
          disabled={addingToCart || isOutOfStock}
          className="btn-primary"
          style={{
            flex: 1, justifyContent: "center", padding: "16px",
            opacity: isOutOfStock ? 0.5 : 1,
          }}
        >
          {addingToCart
            ? <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Adding...</>
            : <><ShoppingBag size={16} /> {session ? "Add to Cart" : "Sign in to Buy"}</>
          }
        </button>

        <button
          onClick={handleWishlist}
          disabled={addingToWishlist}
          className="btn-ghost"
          style={{ padding: "16px 20px" }}
          title="Add to Wishlist"
        >
          {addingToWishlist
            ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
            : <Heart size={16} />
          }
        </button>
      </div>

      <style>{`
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      `}</style>
    </div>
  )
}
