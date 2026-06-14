import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import db from "@/lib/db"

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

    const { productId } = await req.json()
    if (!productId) return NextResponse.json({ error: "Missing productId" }, { status: 400 })

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
