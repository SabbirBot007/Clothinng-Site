import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import db from "@/lib/db"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name, phone, address, city, zip, shipping } = await req.json()

    if (!name || !phone || !address || !city || !zip) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Fetch cart items
    const cartItems = await db.cartItem.findMany({
      where: { userId: session.user.id },
      include: { product: true, variant: true },
    })

    if (cartItems.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 })
    }

    const subtotal = cartItems.reduce(
      (sum, item) => sum + Number(item.product.price) * item.quantity, 0
    )
    const shippingCost = subtotal >= 5000 ? 0 : 120
    const total = subtotal + shippingCost

    // Create order
    const order = await db.order.create({
      data: {
        userId: session.user.id,
        status: "PENDING",
        subtotal,
        shippingCost,
        total,
        shippingName: name,
        shippingPhone: phone,
        shippingAddress: address,
        shippingCity: city,
        shippingZip: zip,
        items: {
          create: cartItems.map((item) => ({
            productId: item.productId,
            variantId: item.variantId,
            productName: item.product.name,
            size: item.variant.size,
            color: item.variant.color,
            price: item.product.price,
            quantity: item.quantity,
          })),
        },
      },
    })

    // Deduct stock
    for (const item of cartItems) {
      await db.productVariant.update({
        where: { id: item.variantId },
        data: { stock: { decrement: item.quantity } },
      }).catch(() => {})
    }

    // Clear cart
    await db.cartItem.deleteMany({ where: { userId: session.user.id } })

    return NextResponse.json({ orderId: order.id })
  } catch (error) {
    console.error("COD checkout error:", error)
    return NextResponse.json({ error: "Failed to place order" }, { status: 500 })
  }
}
