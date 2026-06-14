import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import db from "@/lib/db"

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    // Find order and verify it belongs to this user
    const order = await db.order.findUnique({
      where: { id },
      include: { items: true },
    })

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    if (order.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only allow cancel if status is PENDING
    if (order.status !== "PENDING") {
      return NextResponse.json(
        { error: "Order cannot be cancelled. It is already being processed." },
        { status: 400 }
      )
    }

    // Restore stock
    for (const item of order.items) {
      await db.productVariant.update({
        where: { id: item.variantId },
        data: { stock: { increment: item.quantity } },
      }).catch(() => {})
    }

    // Cancel the order
    const updated = await db.order.update({
      where: { id },
      data: { status: "CANCELLED" },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Cancel order error:", error)
    return NextResponse.json({ error: "Failed to cancel order" }, { status: 500 })
  }
}
