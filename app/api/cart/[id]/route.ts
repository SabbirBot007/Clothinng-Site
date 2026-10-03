import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import db from "@/lib/db"
import { rateLimit } from "@/lib/rateLimit"

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    if (rateLimit(`cart-update:${session.user.id}`, 40, 60_000)) {
      return NextResponse.json({ error: "Too many requests. Please slow down." }, { status: 429 })
    }

    const { id } = await params
    const { quantity } = await req.json()

    const qty = parseInt(quantity)
    if (!Number.isInteger(qty) || qty < 1 || qty > 50) {
      return NextResponse.json({ error: "Invalid quantity" }, { status: 400 })
    }

    const item = await db.cartItem.findFirst({
      where: { id, userId: session.user.id },
      include: { variant: true },
    })

    if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 })
    if (qty > item.variant.stock) {
      return NextResponse.json({ error: "Not enough stock" }, { status: 400 })
    }

    const updated = await db.cartItem.update({
      where: { id },
      data: { quantity: qty },
    })

    return NextResponse.json(updated)
  } catch {
    return NextResponse.json({ error: "Failed to update" }, { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    if (rateLimit(`cart-delete:${session.user.id}`, 40, 60_000)) {
      return NextResponse.json({ error: "Too many requests. Please slow down." }, { status: 429 })
    }

    const { id } = await params

    await db.cartItem.deleteMany({
      where: { id, userId: session.user.id },
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 })
  }
}
