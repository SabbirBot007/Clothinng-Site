import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { v2 as cloudinary } from "cloudinary"
import { rateLimit } from "@/lib/rateLimit"

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

// Magic bytes for allowed image formats — checks the ACTUAL file content,
// not just the filename extension or declared Content-Type (which can be faked)
const FILE_SIGNATURES: { mime: string; bytes: number[] }[] = [
  { mime: "image/jpeg", bytes: [0xff, 0xd8, 0xff] },
  { mime: "image/png",  bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  { mime: "image/webp", bytes: [0x52, 0x49, 0x46, 0x46] }, // "RIFF" header (WebP container)
  { mime: "image/gif",  bytes: [0x47, 0x49, 0x46, 0x38] },
]

function isValidImageSignature(buffer: Buffer): boolean {
  return FILE_SIGNATURES.some(({ bytes }) =>
    bytes.every((byte, i) => buffer[i] === byte)
  )
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Rate limit: max 20 uploads per minute (admin only, but still good practice)
    if (rateLimit(`upload:${session.user.id}`, 20, 60_000)) {
      return NextResponse.json({ error: "Too many uploads. Please slow down." }, { status: 429 })
    }

    const formData = await req.formData()
    const file = formData.get("file") as File
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Check declared type (first line of defense)
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "File must be an image" }, { status: 400 })
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "Image must be under 5MB" }, { status: 400 })
    }

    // Convert to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Validate ACTUAL file content matches a known image format
    // (prevents uploading a renamed .exe/.html/.svg-with-script as "photo.jpg")
    if (!isValidImageSignature(buffer)) {
      return NextResponse.json(
        { error: "Invalid image file. The file content does not match a supported image format." },
        { status: 400 }
      )
    }

    // Upload to Cloudinary
    const result = await new Promise<any>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: "clothing-store/products",
          resource_type: "image",
          transformation: [
            { width: 1200, height: 1600, crop: "limit" },
            { quality: "auto:good" },
            { fetch_format: "auto" },
          ],
        },
        (error, result) => {
          if (error) reject(error)
          else resolve(result)
        }
      ).end(buffer)
    })

    return NextResponse.json({
      url: result.secure_url,
      publicId: result.public_id,
    })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
