import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import db from "@/lib/db"

const VALID_STATUSES = ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"]

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const { status } = await req.json()

    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    // Get current order with items
    const order = await db.order.findUnique({
      where: { id },
      include: { items: true },
    })

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    // If cancelling — restore stock
    if (status === "CANCELLED" && order.status !== "CANCELLED") {
      for (const item of order.items) {
        await db.productVariant.update({
          where: { id: item.variantId },
          data: { stock: { increment: item.quantity } },
        }).catch(() => {})
      }
    }

    // If un-cancelling (e.g. from CANCELLED back to PENDING) — deduct stock again
    if (order.status === "CANCELLED" && status !== "CANCELLED") {
      for (const item of order.items) {
        await db.productVariant.update({
          where: { id: item.variantId },
          data: { stock: { decrement: item.quantity } },
        }).catch(() => {})
      }
    }

    const updated = await db.order.update({
      where: { id },
      data: { status },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Order status update error:", error)
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 })
  }
}
