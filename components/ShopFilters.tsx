"use client"

import { useRouter } from "next/navigation"

interface Props {
  categories: { id: string; name: string; slug: string }[]
  currentCategory?: string
  currentSort?: string
}

export default function ShopFilters({ categories, currentCategory, currentSort }: Props) {
  const router = useRouter()

  return (
    <div style={{ display: "flex", gap: "12px", width: "100%" }}>
      <select
        className="input-luxury"
        value={currentCategory ? `/shop?category=${currentCategory}` : "/shop"}
        onChange={(e) => router.push(e.target.value)}
      >
        <option value="/shop">All Categories</option>
        {categories.map((cat) => (
          <option key={cat.id} value={`/shop?category=${cat.slug}`}>
            {cat.name}
          </option>
        ))}
      </select>

      <select
        className="input-luxury"
        value={currentSort || ""}
        onChange={(e) => router.push(
          `/shop?${currentCategory ? `category=${currentCategory}&` : ""}sort=${e.target.value}`
        )}
      >
        <option value="">Newest</option>
        <option value="price-asc">Price ↑</option>
        <option value="price-desc">Price ↓</option>
      </select>
    </div>
  )
}