"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"

export default function CartCount() {
  const { data: session } = useSession()
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!session?.user) { setCount(0); return }
    fetch("/api/cart")
      .then((r) => r.json())
      .then((items) => {
        if (Array.isArray(items)) {
          setCount(items.reduce((sum: number, item: any) => sum + item.quantity, 0))
        }
      })
      .catch(() => {})
  }, [session])

  if (count === 0) return null

  return (
    <div style={{
      position: "absolute",
      top: "-6px", right: "-6px",
      background: "var(--gold)",
      color: "var(--black)",
      borderRadius: "50%",
      width: "16px", height: "16px",
      fontSize: "9px", fontWeight: 700,
      display: "flex", alignItems: "center", justifyContent: "center",
      letterSpacing: 0,
    }}>
      {count > 9 ? "9+" : count}
    </div>
  )
}
