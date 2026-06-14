import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import db from "@/lib/db"
import { rateLimit } from "@/lib/rateLimit"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json([])

    const cartItems = await db.cartItem.findMany({
      where: { userId: session.user.id },
      include: {
        product: {
          include: {
            images: { orderBy: { position: "asc" }, take: 1 },
            category: true,
          },
        },
        variant: true,
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(cartItems)
  } catch {
    return NextResponse.json({ error: "Failed to fetch cart" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Rate limit: max 30 cart additions per minute per user
    if (rateLimit(`cart:${session.user.id}`, 30, 60_000)) {
      return NextResponse.json({ error: "Too many requests. Please slow down." }, { status: 429 })
    }

    const { productId, variantId, quantity = 1 } = await req.json()

    if (!productId || !variantId) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 })
    }

    // Validate quantity is a sane positive integer
    const qty = parseInt(quantity)
    if (!Number.isInteger(qty) || qty < 1 || qty > 50) {
      return NextResponse.json({ error: "Invalid quantity" }, { status: 400 })
    }

    // Check stock
    const variant = await db.productVariant.findUnique({ where: { id: variantId } })
    if (!variant || variant.stock === 0) {
      return NextResponse.json({ error: "Out of stock" }, { status: 400 })
    }
    if (qty > variant.stock) {
      return NextResponse.json({ error: `Only ${variant.stock} left in stock` }, { status: 400 })
    }

    // Upsert cart item
    const cartItem = await db.cartItem.upsert({
      where: {
        userId_variantId: {
          userId: session.user.id,
          variantId,
        },
      },
      update: {
        quantity: { increment: qty },
      },
      create: {
        userId: session.user.id,
        productId,
        variantId,
        quantity: qty,
      },
    })

    return NextResponse.json(cartItem, { status: 201 })
  } catch (error) {
    console.error("Cart error:", error)
    return NextResponse.json({ error: "Failed to add to cart" }, { status: 500 })
  }
}
