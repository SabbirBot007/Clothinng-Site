import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import db from "@/lib/db"

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export async function GET() {
  try {
    const products = await db.product.findMany({
      where: { isActive: true },
      include: {
        category: true,
        images: { orderBy: { position: "asc" } },
        variants: true,
      },
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json(products)
  } catch {
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { name, description, price, categoryId, brand, material, isActive, isFeatured, images, variants } = body

    if (!name || !description || !price || !categoryId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Generate unique slug
    let slug = slugify(name)
    const existing = await db.product.findUnique({ where: { slug } })
    if (existing) slug = `${slug}-${Date.now()}`

    const product = await db.product.create({
      data: {
        name: name.trim(),
        slug,
        description: description.trim(),
        price,
        categoryId,
        brand: brand?.trim() || null,
        material: material?.trim() || null,
        isActive: isActive ?? true,
        isFeatured: isFeatured ?? false,

        // Create images
        images: {
          create: images.map((img: any, index: number) => ({
            url: img.url,
            publicId: img.publicId,
            altText: img.altText || name,
            position: index,
          })),
        },

        // Create variants
        variants: {
          create: variants.map((v: any) => ({
            size: v.size,
            color: v.color.trim(),
            colorHex: v.colorHex || null,
            stock: parseInt(v.stock) || 0,
          })),
        },
      },
      include: { images: true, variants: true },
    })

    return NextResponse.json(product, { status: 201 })
  } catch (error: any) {
    console.error("Product create error:", error)
    if (error.code === "P2002") {
      return NextResponse.json({ error: "A product with this name already exists" }, { status: 400 })
    }
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 })
  }
}
