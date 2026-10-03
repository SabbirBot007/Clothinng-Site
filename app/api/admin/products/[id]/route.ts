import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import db from "@/lib/db"

// GET — load single product for edit form
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const product = await db.product.findUnique({
      where: { id },
      include: {
        images: { orderBy: { position: "asc" } },
        variants: { orderBy: [{ color: "asc" }, { size: "asc" }] },
        category: true,
      },
    })

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    return NextResponse.json(product)
  } catch {
    return NextResponse.json({ error: "Failed to fetch product" }, { status: 500 })
  }
}

// PATCH — update existing product
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
    const body = await req.json()

    const {
      name, description, price, categoryId,
      brand, material, isActive, isFeatured,
      images, variants,
      deletedVariantIds = [],
      deletedImageIds = [],
    } = body

    if (!name || !description || !price || !categoryId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const existing = await db.product.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    // Generate new slug if name changed
    let slug = existing.slug
    if (name.trim() !== existing.name) {
      slug = name.toLowerCase().trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_-]+/g, "-")
        .replace(/^-+|-+$/g, "")
      const slugExists = await db.product.findFirst({ where: { slug, id: { not: id } } })
      if (slugExists) slug = `${slug}-${Date.now()}`
    }

    // Delete removed variants
    if (deletedVariantIds.length > 0) {
      await db.productVariant.deleteMany({ where: { id: { in: deletedVariantIds } } })
    }

    // Delete removed images
    if (deletedImageIds.length > 0) {
      await db.productImage.deleteMany({ where: { id: { in: deletedImageIds } } })
    }

    // Update product basic info
    await db.product.update({
      where: { id },
      data: {
        name: name.trim(),
        slug,
        description: description.trim(),
        price,
        categoryId,
        brand: brand?.trim() || null,
        material: material?.trim() || null,
        isActive,
        isFeatured,
      },
    })

    // Upsert variants
    for (const variant of variants) {
      if (variant.id && !variant.isNew) {
        await db.productVariant.update({
          where: { id: variant.id },
          data: {
            size: variant.size,
            color: variant.color.trim(),
            colorHex: variant.colorHex || null,
            stock: parseInt(variant.stock) || 0,
          },
        })
      } else {
        await db.productVariant.create({
          data: {
            productId: id,
            size: variant.size,
            color: variant.color.trim(),
            colorHex: variant.colorHex || null,
            stock: parseInt(variant.stock) || 0,
          },
        })
      }
    }

    // Upsert images
    for (let i = 0; i < images.length; i++) {
      const img = images[i]
      if (img.id && !img.isNew) {
        await db.productImage.update({
          where: { id: img.id },
          data: { position: i, altText: img.altText || null },
        })
      } else {
        await db.productImage.create({
          data: {
            productId: id,
            url: img.url,
            publicId: img.publicId,
            altText: img.altText || null,
            position: i,
          },
        })
      }
    }

    const updated = await db.product.findUnique({
      where: { id },
      include: { images: true, variants: true },
    })

    return NextResponse.json(updated)
  } catch (error: any) {
    console.error("Product update error:", error)
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 })
  }
}

// DELETE — remove product
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    await db.product.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 })
  }
}
