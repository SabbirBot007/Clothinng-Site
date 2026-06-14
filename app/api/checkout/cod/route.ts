import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import db from "@/lib/db"
import { rateLimit } from "@/lib/rateLimit"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Rate limit: max 5 order placements per 10 minutes per user
    if (rateLimit(`checkout:${session.user.id}`, 5, 10 * 60_000)) {
      return NextResponse.json(
        { error: "Too many orders placed. Please wait a few minutes and try again." },
        { status: 429 }
      )
    }

    const { name, phone, address, city, zip, shipping } = await req.json()

    if (!name || !phone || !address || !city || !zip) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Basic input sanitation — trim and cap lengths
    const cleanName = String(name).trim().slice(0, 100)
    const cleanPhone = String(phone).trim().slice(0, 20)
    const cleanAddress = String(address).trim().slice(0, 300)
    const cleanCity = String(city).trim().slice(0, 100)
    const cleanZip = String(zip).trim().slice(0, 20)

    if (!cleanName || !cleanPhone || !cleanAddress || !cleanCity || !cleanZip) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 })
    }

    // ── Atomic transaction: check stock + create order + decrement stock ──
    const result = await db.$transaction(async (tx) => {
      const cartItems = await tx.cartItem.findMany({
        where: { userId: session.user.id },
        include: { product: true, variant: true },
      })

      if (cartItems.length === 0) {
        throw new Error("CART_EMPTY")
      }

      // Re-check stock for every item INSIDE the transaction
      // (prevents race conditions when multiple orders happen at once)
      for (const item of cartItems) {
        const currentVariant = await tx.productVariant.findUnique({
          where: { id: item.variantId },
        })

        if (!currentVariant) {
          throw new Error(`VARIANT_NOT_FOUND:${item.product.name}`)
        }

        if (currentVariant.stock < item.quantity) {
          throw new Error(`OUT_OF_STOCK:${item.product.name}:${item.variant.size}:${item.variant.color}`)
        }
      }

      const subtotal = cartItems.reduce(
        (sum, item) => sum + Number(item.product.price) * item.quantity, 0
      )
      const shippingCost = subtotal >= 5000 ? 0 : 120
      const total = subtotal + shippingCost

      // Create order
      const order = await tx.order.create({
        data: {
          userId: session.user.id,
          status: "PENDING",
          subtotal,
          shippingCost,
          total,
          shippingName: cleanName,
          shippingPhone: cleanPhone,
          shippingAddress: cleanAddress,
          shippingCity: cleanCity,
          shippingZip: cleanZip,
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

      // Decrement stock — now safe because we checked above, inside the same transaction
      for (const item of cartItems) {
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { stock: { decrement: item.quantity } },
        })
      }

      // Clear cart
      await tx.cartItem.deleteMany({ where: { userId: session.user.id } })

      return order
    })

    return NextResponse.json({ orderId: result.id })
  } catch (error: any) {
    console.error("COD checkout error:", error?.message || error)

    const message = error?.message || ""

    if (message === "CART_EMPTY") {
      return NextResponse.json({ error: "Your cart is empty" }, { status: 400 })
    }

    if (message.startsWith("OUT_OF_STOCK:")) {
      const [, productName, size, color] = message.split(":")
      return NextResponse.json(
        { error: `"${productName}" (${size} / ${color}) no longer has enough stock. Please update your cart.` },
        { status: 409 }
      )
    }

    if (message.startsWith("VARIANT_NOT_FOUND:")) {
      return NextResponse.json(
        { error: "One of your cart items is no longer available. Please update your cart." },
        { status: 409 }
      )
    }

    return NextResponse.json({ error: "Failed to place order. Please try again." }, { status: 500 })
  }
}
