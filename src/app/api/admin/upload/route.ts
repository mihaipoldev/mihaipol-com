import { NextRequest, NextResponse } from "next/server"
import { uploadToBunny } from "@/lib/bunny"

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
]

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const folderPath = formData.get("folderPath") as string | null
    const imageUrl = formData.get("imageUrl") as string | null

    if (!folderPath) {
      return NextResponse.json(
        { error: "No folderPath provided" },
        { status: 400 }
      )
    }

    let fileBuffer: Buffer

    // Handle file upload
    if (file) {
      // Validate file type
      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        return NextResponse.json(
          { error: `Invalid file type. Allowed types: ${ALLOWED_MIME_TYPES.join(", ")}` },
          { status: 400 }
        )
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `File size exceeds maximum of ${MAX_FILE_SIZE / 1024 / 1024}MB` },
          { status: 400 }
        )
      }

      // Convert file to buffer
      const arrayBuffer = await file.arrayBuffer()
      fileBuffer = Buffer.from(arrayBuffer)
    } 
    // Handle URL upload
    else if (imageUrl) {
      try {
        // Download the image from the URL
        const response = await fetch(imageUrl)
        if (!response.ok) {
          return NextResponse.json(
            { error: `Failed to download image from URL: ${response.statusText}` },
            { status: 400 }
          )
        }

        // Check content type
        const contentType = response.headers.get("content-type")?.toLowerCase() || ""
        const isValidContentType = ALLOWED_MIME_TYPES.some(type => {
          const typePart = type.split("/")[1] // e.g., "jpeg", "png"
          return contentType.includes(typePart) || contentType.includes(type)
        })
        
        if (!isValidContentType) {
          return NextResponse.json(
            { error: `Invalid image type from URL. Content-Type: ${contentType}. Allowed types: ${ALLOWED_MIME_TYPES.join(", ")}` },
            { status: 400 }
          )
        }

        // Get content length
        const contentLength = response.headers.get("content-length")
        if (contentLength && parseInt(contentLength) > MAX_FILE_SIZE) {
          return NextResponse.json(
            { error: `Image size exceeds maximum of ${MAX_FILE_SIZE / 1024 / 1024}MB` },
            { status: 400 }
          )
        }

        // Convert to buffer
        const arrayBuffer = await response.arrayBuffer()
        fileBuffer = Buffer.from(arrayBuffer)

        // Validate buffer size
        if (fileBuffer.length > MAX_FILE_SIZE) {
          return NextResponse.json(
            { error: `Image size exceeds maximum of ${MAX_FILE_SIZE / 1024 / 1024}MB` },
            { status: 400 }
          )
        }
      } catch (error: any) {
        return NextResponse.json(
          { error: `Failed to fetch image from URL: ${error.message}` },
          { status: 400 }
        )
      }
    } else {
      return NextResponse.json(
        { error: "No file or imageUrl provided" },
        { status: 400 }
      )
    }

    // Generate filename with timestamp
    // Always use .jpg extension as per requirements
    const timestamp = Date.now()
    const filename = `image_${timestamp}.jpg`
    const storagePath = `${folderPath}/${filename}`

    // Upload to Bunny Storage
    try {
      const cdnUrl = await uploadToBunny(fileBuffer, storagePath)
      return NextResponse.json({ url: cdnUrl }, { status: 200 })
    } catch (uploadError: any) {
      console.error("Error uploading to Bunny:", uploadError)
      return NextResponse.json(
        { error: uploadError.message || "Failed to upload file to Bunny Storage" },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error("Error in upload route:", error)
    // Make sure we always return JSON, not HTML
    return NextResponse.json(
      { error: error.message || "Failed to upload file" },
      { status: 500 }
    )
  }
}

