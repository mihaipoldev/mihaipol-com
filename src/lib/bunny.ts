// SERVER ONLY - This module should only be imported in server-side code

/**
 * Bunny Storage API utilities
 * Handles file uploads and file management operations
 */

function getBunnyConfig() {
  const BUNNY_STORAGE_ZONE = process.env.BUNNY_STORAGE_ZONE
  const BUNNY_STORAGE_PASSWORD = process.env.BUNNY_STORAGE_PASSWORD
  const BUNNY_STORAGE_HOSTNAME = process.env.BUNNY_STORAGE_HOSTNAME || "storage.bunnycdn.com"
  const BUNNY_PULL_ZONE_URL_RAW = process.env.BUNNY_PULL_ZONE_URL

  if (!BUNNY_STORAGE_ZONE || !BUNNY_STORAGE_PASSWORD || !BUNNY_PULL_ZONE_URL_RAW) {
    throw new Error(
      "Missing Bunny CDN environment variables. Please check BUNNY_STORAGE_ZONE, BUNNY_STORAGE_PASSWORD, and BUNNY_PULL_ZONE_URL in your environment variables."
    )
  }

  // Ensure pull zone URL has protocol
  const BUNNY_PULL_ZONE_URL = BUNNY_PULL_ZONE_URL_RAW.startsWith("http")
    ? BUNNY_PULL_ZONE_URL_RAW
    : `https://${BUNNY_PULL_ZONE_URL_RAW}`

  const BUNNY_STORAGE_BASE_URL = `https://${BUNNY_STORAGE_HOSTNAME}/${BUNNY_STORAGE_ZONE}`

  return {
    BUNNY_STORAGE_ZONE,
    BUNNY_STORAGE_PASSWORD,
    BUNNY_STORAGE_BASE_URL,
    BUNNY_PULL_ZONE_URL,
  }
}

/**
 * Upload a file to Bunny Storage
 * @param fileBuffer - The file buffer to upload
 * @param path - The storage path (e.g., "artists/123/image_1234567890.jpg")
 * @returns The full CDN URL of the uploaded file
 */
export async function uploadToBunny(
  fileBuffer: Buffer,
  path: string
): Promise<string> {
  let config
  try {
    config = getBunnyConfig()
  } catch (configError: any) {
    throw new Error(`Bunny configuration error: ${configError.message}`)
  }
  
  const url = `${config.BUNNY_STORAGE_BASE_URL}/${path}`
  
  // Convert Node Buffer to a Web-compatible BodyInit (Uint8Array)
  const bodyUint8 = new Uint8Array(fileBuffer)

  const response = await fetch(url, {
    method: "PUT",
    headers: {
      AccessKey: config.BUNNY_STORAGE_PASSWORD,
      "Content-Type": "application/octet-stream",
    },
    body: bodyUint8,
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(
      `Failed to upload to Bunny Storage: ${response.status} ${response.statusText} - ${errorText}`
    )
  }

  // Return the full CDN URL
  const cdnUrl = `${config.BUNNY_PULL_ZONE_URL}/${path}`
  return cdnUrl
}

/**
 * Move a file to the trash folder in Bunny Storage
 * This is done by copying the file to trash and then deleting the original
 * @param filePath - The storage path of the file to move (e.g., "artists/123/image_1234567890.jpg")
 */
export async function moveToTrash(filePath: string): Promise<void> {
  const config = getBunnyConfig()
  
  // Extract the path without the pull zone URL if it's a full URL
  let storagePath = filePath
  if (filePath.startsWith(config.BUNNY_PULL_ZONE_URL)) {
    storagePath = filePath.replace(`${config.BUNNY_PULL_ZONE_URL}/`, "")
  }

  // Construct trash path
  const trashPath = `trash/${storagePath}`

  // First, download the file from Bunny Storage
  const downloadUrl = `${config.BUNNY_STORAGE_BASE_URL}/${storagePath}`
  const downloadResponse = await fetch(downloadUrl, {
    headers: {
      AccessKey: config.BUNNY_STORAGE_PASSWORD,
    },
  })

  if (!downloadResponse.ok) {
    // If file doesn't exist, that's okay - it might already be deleted
    if (downloadResponse.status === 404) {
      return
    }
    const errorText = await downloadResponse.text()
    throw new Error(
      `Failed to download file from Bunny Storage: ${downloadResponse.status} ${downloadResponse.statusText} - ${errorText}`
    )
  }

  const fileBuffer = Buffer.from(await downloadResponse.arrayBuffer())

  // Upload to trash folder
  await uploadToBunny(fileBuffer, trashPath)

  // Delete the original file
  await deleteFromBunny(storagePath)
}

/**
 * Move an image from one folder to another (e.g., from temp to actual folder)
 * @param imageUrl - The current CDN URL of the image
 * @param newFolderPath - The new folder path to move the image to (e.g., "artists/123")
 * @returns The new CDN URL of the moved image
 */
export async function moveImageBetweenFolders(
  imageUrl: string,
  newFolderPath: string
): Promise<string> {
  const config = getBunnyConfig()
  
  // Extract the path without the pull zone URL if it's a full URL
  let storagePath = imageUrl
  if (imageUrl.startsWith(config.BUNNY_PULL_ZONE_URL)) {
    storagePath = imageUrl.replace(`${config.BUNNY_PULL_ZONE_URL}/`, "")
  }

  // Extract filename from path
  const filename = storagePath.split("/").pop()
  if (!filename) {
    throw new Error("Invalid image path: cannot extract filename")
  }

  // Download the file
  const downloadUrl = `${config.BUNNY_STORAGE_BASE_URL}/${storagePath}`
  const downloadResponse = await fetch(downloadUrl, {
    headers: {
      AccessKey: config.BUNNY_STORAGE_PASSWORD,
    },
  })

  if (!downloadResponse.ok) {
    const errorText = await downloadResponse.text()
    throw new Error(
      `Failed to download file from Bunny Storage: ${downloadResponse.status} ${downloadResponse.statusText} - ${errorText}`
    )
  }

  const fileBuffer = Buffer.from(await downloadResponse.arrayBuffer())

  // Upload to new location
  const newPath = `${newFolderPath}/${filename}`
  const newUrl = await uploadToBunny(fileBuffer, newPath)

  // Delete the original file
  await deleteFromBunny(storagePath)

  return newUrl
}

/**
 * Delete a file from Bunny Storage
 * @param path - The storage path of the file to delete
 */
export async function deleteFromBunny(path: string): Promise<void> {
  const config = getBunnyConfig()
  
  // Extract the path without the pull zone URL if it's a full URL
  let storagePath = path
  if (path.startsWith(config.BUNNY_PULL_ZONE_URL)) {
    storagePath = path.replace(`${config.BUNNY_PULL_ZONE_URL}/`, "")
  }

  const url = `${config.BUNNY_STORAGE_BASE_URL}/${storagePath}`

  const response = await fetch(url, {
    method: "DELETE",
    headers: {
      AccessKey: config.BUNNY_STORAGE_PASSWORD,
    },
  })

  if (!response.ok && response.status !== 404) {
    // 404 is okay - file might already be deleted
    const errorText = await response.text()
    throw new Error(
      `Failed to delete from Bunny Storage: ${response.status} ${response.statusText} - ${errorText}`
    )
  }
}

