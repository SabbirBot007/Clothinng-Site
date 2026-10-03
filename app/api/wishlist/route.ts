import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import db from "@/lib/db"
import { rateLimit } from "@/lib/rateLimit"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json([])

    const wishlist = await db.wishlist.findMany({
      where: { userId: session.user.id },
      include: {
        product: {
          include: {
            images: { orderBy: { position: "asc" }, take: 1 },
            category: true,
            variants: { select: { stock: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(wishlist)
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Rate limit: max 30 wishlist toggles per minute
    if (rateLimit(`wishlist:${session.user.id}`, 30, 60_000)) {
      return NextResponse.json({ error: "Too many requests. Please slow down." }, { status: 429 })
    }

    const { productId } = await req.json()
    if (!productId || typeof productId !== "string") {
      return NextResponse.json({ error: "Missing productId" }, { status: 400 })
    }

    // Verify product exists (avoid creating wishlist rows for garbage IDs)
    const product = await db.product.findUnique({ where: { id: productId }, select: { id: true } })
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    const existing = await db.wishlist.findUnique({
      where: { userId_productId: { userId: session.user.id, productId } },
    })

    if (existing) {
      await db.wishlist.delete({ where: { id: existing.id } })
      return NextResponse.json({ action: "removed" })
    } else {
      await db.wishlist.create({ data: { userId: session.user.id, productId } })
      return NextResponse.json({ action: "added" })
    }
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}
