import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import db from "@/lib/db"

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

    const { productId, variantId, quantity = 1 } = await req.json()

    if (!productId || !variantId) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 })
    }

    // Check stock
    const variant = await db.productVariant.findUnique({ where: { id: variantId } })
    if (!variant || variant.stock === 0) {
      return NextResponse.json({ error: "Out of stock" }, { status: 400 })
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
        quantity: { increment: quantity },
      },
      create: {
        userId: session.user.id,
        productId,
        variantId,
        quantity,
      },
    })

    return NextResponse.json(cartItem, { status: 201 })
  } catch (error) {
    console.error("Cart error:", error)
    return NextResponse.json({ error: "Failed to add to cart" }, { status: 500 })
  }
}
