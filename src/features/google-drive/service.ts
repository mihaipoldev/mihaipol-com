import { google } from "googleapis";
import { getOAuthToken, getAlbumWithDriveInfo } from "./data";
import { storeOAuthToken } from "./mutations";
import type { FolderSearchResult, DriveFolderInfo } from "./types";
import type { Album } from "@/features/albums/types";

// Using drive scope - allows read/write access to all files/folders user has access to
// This is needed to:
// 1. Access existing folders in the user's Drive (for validation and linking)
// 2. Create new folders and files (for album folder management)
// drive.file scope is too restrictive (only allows access to files created by the app)
const SCOPES = ["https://www.googleapis.com/auth/drive"];

/**
 * Gets a valid access token, refreshing if expired
 */
export async function getValidAccessToken(userId: string): Promise<string> {
  const token = await getOAuthToken(userId);
  if (!token) {
    throw new Error("No OAuth token found. Please authenticate with Google Drive.");
  }

  // Check if token is expired (with 5 minute buffer)
  const expiresAt = new Date(token.expires_at);
  const now = new Date();
  const buffer = 5 * 60 * 1000; // 5 minutes in milliseconds
  const timeUntilExpiry = expiresAt.getTime() - now.getTime();

  if (timeUntilExpiry < buffer) {
    // Token is expired or about to expire, refresh it
    console.log("Access token expired or expiring soon, refreshing...", {
      expiresAt: token.expires_at,
      now: now.toISOString(),
      timeUntilExpiry: `${Math.round(timeUntilExpiry / 1000)}s`,
    });
    
    try {
      const newToken = await refreshAccessToken(userId, token.refresh_token);
      console.log("Token refreshed successfully", {
        newExpiresAt: newToken.expires_at,
      });
      return newToken.access_token;
    } catch (refreshError: any) {
      console.error("Token refresh failed:", refreshError);
      throw refreshError;
    }
  }

  return token.access_token;
}

/**
 * Refreshes an expired access token using direct HTTP call to Google's token endpoint
 */
export async function refreshAccessToken(
  userId: string,
  refreshToken: string
): Promise<{ access_token: string; refresh_token: string; expires_at: string }> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Google OAuth credentials not configured");
  }

  try {
    // Get existing token to preserve refresh_token if not returned
    const token = await getOAuthToken(userId);
    const existingRefreshToken = token?.refresh_token || refreshToken;

    // Use direct HTTP call to Google's token endpoint for more reliable token refresh
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error("Token refresh HTTP error:", {
        status: tokenResponse.status,
        statusText: tokenResponse.statusText,
        body: errorData,
      });
      
      if (tokenResponse.status === 400) {
        throw new Error("Refresh token is invalid or expired. Please re-authenticate with Google Drive.");
      }
      
      throw new Error(`Failed to refresh token: ${tokenResponse.statusText}`);
    }

    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token || !tokenData.expires_in) {
      console.error("Invalid token response:", {
        hasAccessToken: !!tokenData.access_token,
        hasRefreshToken: !!tokenData.refresh_token,
        hasExpiresIn: !!tokenData.expires_in,
        response: tokenData,
      });
      throw new Error("Failed to refresh token: invalid response from Google");
    }

    // Google may not return a new refresh_token on every refresh
    // Only update refresh_token if a new one is provided, otherwise keep the existing one
    const newRefreshToken = tokenData.refresh_token || existingRefreshToken;

    if (!newRefreshToken) {
      throw new Error("No refresh token available. Please re-authenticate.");
    }

    // Calculate expiration time
    const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000).toISOString();

    const updatedTokenData = {
      access_token: tokenData.access_token,
      refresh_token: newRefreshToken,
      expires_at: expiresAt,
    };

    await storeOAuthToken(userId, updatedTokenData);
    return updatedTokenData;
  } catch (error: any) {
    console.error("Error refreshing access token:", {
      message: error.message,
      code: error.code,
      stack: error.stack,
    });
    
    // Re-throw with more context if it's not already a user-friendly error
    if (error.message?.includes("re-authenticate")) {
      throw error;
    }
    
    throw new Error(`Failed to refresh access token: ${error.message || "Please re-authenticate."}`);
  }
}

/**
 * Gets a configured Google Drive client for a user
 */
export async function getOAuthClient(userId: string) {
  const accessToken = await getValidAccessToken(userId);
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );

  oauth2Client.setCredentials({
    access_token: accessToken,
  });

  return google.drive({ version: "v3", auth: oauth2Client });
}

/**
 * Searches for a folder by name in a parent folder
 */
export async function searchForFolder(
  params: { name: string; parentId: string },
  userId: string
): Promise<FolderSearchResult> {
  try {
    const drive = await getOAuthClient(userId);

    const response = await drive.files.list({
      q: `name='${params.name}' and '${params.parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: "files(id, name)",
      spaces: "drive",
    });

    const folders = response.data.files;
    if (folders && folders.length > 0) {
      return {
        id: folders[0].id!,
        name: folders[0].name!,
      };
    }

    return null;
  } catch (error) {
    console.error("Error searching for folder:", error);
    throw error;
  }
}

/**
 * Gets folder metadata by ID
 */
export async function getFolderById(
  folderId: string,
  userId: string
): Promise<DriveFolderInfo> {
  try {
    const drive = await getOAuthClient(userId);

    // First, verify the file exists and get its metadata
    const response = await drive.files.get({
      fileId: folderId,
      fields: "id, name, webViewLink, parents, mimeType",
      supportsAllDrives: true, // Important: allows access to shared drives
    });

    // Verify it's actually a folder
    if (response.data.mimeType !== "application/vnd.google-apps.folder") {
      throw new Error("The provided ID is not a folder. Please provide a folder ID.");
    }

    if (!response.data.id || !response.data.name || !response.data.webViewLink) {
      throw new Error("Invalid folder response from Drive API");
    }

    return {
      folder_id: response.data.id,
      folder_url: response.data.webViewLink,
      folder_name: response.data.name,
    };
  } catch (error: any) {
    console.error("Drive API error details:", {
      code: error.code,
      message: error.message,
      errors: error.errors,
      folderId,
    });

    if (error.code === 404) {
      throw new Error(
        "Folder not found in Google Drive. " +
        "Please verify: 1) The folder ID is correct, 2) The folder exists in your Drive, " +
        "3) You have access to the folder, 4) You've reconnected with the new 'drive' scope."
      );
    }
    
    if (error.code === 403) {
      // Check if it's a permissions issue
      if (error.message?.includes("insufficientFilePermissions") || 
          error.message?.includes("insufficientPermissions")) {
        throw new Error(
          "You don't have permission to access this folder. " +
          "Make sure the folder is in 'My Drive' and you have access to it."
        );
      }
      throw new Error(
        "Access denied. The folder may be in a location you don't have access to. " +
        "Try moving the folder to 'My Drive' or ensure you have proper permissions."
      );
    }

    if (error.code === 400) {
      throw new Error("Invalid folder ID format. Please check the folder ID and try again.");
    }

    // Check if it's not a folder
    if (error.message?.includes("not a folder")) {
      throw error;
    }

    console.error("Error getting folder by ID:", error);
    throw new Error(error.message || "Failed to access folder in Google Drive");
  }
}

/**
 * Extracts folder ID from Google Drive URL
 */
export function extractFolderIdFromUrl(url: string): string | null {
  // Handle various Google Drive URL formats:
  // https://drive.google.com/drive/folders/FOLDER_ID
  // https://drive.google.com/drive/u/0/folders/FOLDER_ID
  // https://drive.google.com/open?id=FOLDER_ID

  const patterns = [
    /\/folders\/([a-zA-Z0-9_-]+)/,
    /[?&]id=([a-zA-Z0-9_-]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * Creates a folder in Google Drive
 */
async function createFolder(
  name: string,
  parentId: string,
  userId: string
): Promise<{ id: string; name: string; webViewLink: string }> {
  try {
    const drive = await getOAuthClient(userId);

    const response = await drive.files.create({
      requestBody: {
        name: name,
        mimeType: "application/vnd.google-apps.folder",
        parents: [parentId],
      },
      fields: "id, name, webViewLink",
    });

    if (!response.data.id || !response.data.name || !response.data.webViewLink) {
      throw new Error("Failed to create folder: invalid response");
    }

    return {
      id: response.data.id,
      name: response.data.name,
      webViewLink: response.data.webViewLink,
    };
  } catch (error) {
    console.error("Error creating folder:", error);
    throw error;
  }
}

/**
 * Gets the configured releases folder ID from settings
 * REQUIRED: No fallback - must be configured in Settings > Integrations
 */
export async function createFolderStructure(userId: string): Promise<{
  musicFolderId: string;
  releasesFolderId: string;
}> {
  // Get configured releases folder ID from settings - REQUIRED
  const { getReleasesFolderId } = await import("./lib/get-releases-folder");
  const configuredFolderId = await getReleasesFolderId();
  
  // Validate that the folder exists and user has access
  const folderInfo = await getFolderById(configuredFolderId, userId);
  
  // Folder exists and is accessible, use it
  return {
    musicFolderId: configuredFolderId, // For backward compatibility
    releasesFolderId: configuredFolderId,
  };
}

/**
 * Creates an album folder with smart year folder detection
 */
export async function createAlbumFolder(
  albumData: { title: string; release_date: string | null },
  userId: string
): Promise<{ folderId: string; folderUrl: string }> {
  // Step 1: Ensure base structure exists
  const { releasesFolderId } = await createFolderStructure(userId);

  // Step 2: Determine year from release_date or use current year
  let year: string;
  if (albumData.release_date) {
    year = new Date(albumData.release_date).getFullYear().toString();
  } else {
    year = new Date().getFullYear().toString();
  }

  // Step 3: Check if year folder exists, create if not
  let yearFolder = await searchForFolder(
    { name: year, parentId: releasesFolderId },
    userId
  );
  if (!yearFolder) {
    const created = await createFolder(year, releasesFolderId, userId);
    yearFolder = { id: created.id, name: created.name };
  }

  // Step 4: Create album folder name in format: MM.DD Title
  let albumFolderName: string;
  if (albumData.release_date) {
    const releaseDate = new Date(albumData.release_date);
    const month = String(releaseDate.getMonth() + 1).padStart(2, "0"); // 1-12 -> 01-12
    const day = String(releaseDate.getDate()).padStart(2, "0"); // 1-31 -> 01-31
    albumFolderName = `${month}.${day} ${albumData.title}`;
  } else {
    // Use current date if no release date
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    albumFolderName = `${month}.${day} ${albumData.title}`;
  }

  // Step 5: Check if album folder already exists
  const existingAlbumFolder = await searchForFolder(
    { name: albumFolderName, parentId: yearFolder.id },
    userId
  );

  if (existingAlbumFolder) {
    throw new Error(
      `A folder with the name "${albumFolderName}" already exists in the ${year} folder. Please link to the existing folder or use a different album name.`
    );
  }

  // Step 6: Create album folder
  const albumFolder = await createFolder(albumFolderName, yearFolder.id, userId);

  return {
    folderId: albumFolder.id,
    folderUrl: albumFolder.webViewLink,
  };
}

/**
 * Updates an album folder: renames if title changed, moves if release_date changed
 */
export async function updateAlbumFolder(
  albumId: string,
  oldData: Album,
  newData: { title?: string; release_date?: string | null },
  userId: string
): Promise<{ folderId: string; folderUrl: string } | null> {
  // Get current album data with Drive info
  const album = await getAlbumWithDriveInfo(albumId);

  if (!album.drive_folder_id) {
    // No folder linked, nothing to update
    return null;
  }

  // Check if folder still exists in Drive
  let folderInfo: DriveFolderInfo;
  try {
    folderInfo = await getFolderById(album.drive_folder_id, userId);
  } catch (error: any) {
    if (error.message === "Folder not found in Google Drive") {
      throw new Error(
        "Folder not found in Google Drive. It may have been deleted. Please recreate or unlink the folder."
      );
    }
    throw error;
  }

  const drive = await getOAuthClient(userId);
  let needsUpdate = false;
  let newFolderId = folderInfo.folder_id;
  let newFolderUrl = folderInfo.folder_url;

  // Check if title changed
  const titleChanged = newData.title && newData.title !== oldData.title;
  const releaseDateChanged =
    newData.release_date !== undefined && newData.release_date !== oldData.release_date;

  // If title changed, rename folder
  if (titleChanged && newData.title) {
    // Create new folder name in format: MM.DD Title
    let newFolderName: string;
    if (newData.release_date) {
      const releaseDate = new Date(newData.release_date);
      const month = String(releaseDate.getMonth() + 1).padStart(2, "0");
      const day = String(releaseDate.getDate()).padStart(2, "0");
      newFolderName = `${month}.${day} ${newData.title}`;
    } else {
      // Use current date if no release date
      const now = new Date();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const day = String(now.getDate()).padStart(2, "0");
      newFolderName = `${month}.${day} ${newData.title}`;
    }

    await drive.files.update({
      fileId: folderInfo.folder_id,
      requestBody: {
        name: newFolderName,
      },
    });

    needsUpdate = true;
  }

  // If release_date changed, update folder name and move to correct year folder if needed
  if (releaseDateChanged) {
    const { releasesFolderId } = await createFolderStructure(userId);

    const oldYear = oldData.release_date
      ? new Date(oldData.release_date).getFullYear().toString()
      : new Date().getFullYear().toString();
    const newYear = newData.release_date
      ? new Date(newData.release_date).getFullYear().toString()
      : new Date().getFullYear().toString();

    // Update folder name with new date format (MM.DD Title)
    const albumTitle = newData.title || oldData.title;
    let newFolderName: string;
    if (newData.release_date) {
      const releaseDate = new Date(newData.release_date);
      const month = String(releaseDate.getMonth() + 1).padStart(2, "0");
      const day = String(releaseDate.getDate()).padStart(2, "0");
      newFolderName = `${month}.${day} ${albumTitle}`;
    } else {
      // Use current date if no release date
      const now = new Date();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const day = String(now.getDate()).padStart(2, "0");
      newFolderName = `${month}.${day} ${albumTitle}`;
    }

    // Rename folder with new date format
    await drive.files.update({
      fileId: folderInfo.folder_id,
      requestBody: {
        name: newFolderName,
      },
    });

    // If year changed, move folder to correct year folder
    if (oldYear !== newYear) {
      // Find or create new year folder
      let newYearFolder = await searchForFolder(
        { name: newYear, parentId: releasesFolderId },
        userId
      );
      if (!newYearFolder) {
        const created = await createFolder(newYear, releasesFolderId, userId);
        newYearFolder = { id: created.id, name: created.name };
      }

      // Get current parents
      const currentFile = await drive.files.get({
        fileId: folderInfo.folder_id,
        fields: "parents",
      });

      const previousParents = currentFile.data.parents?.join(",") || "";

      // Move file to new parent
      await drive.files.update({
        fileId: folderInfo.folder_id,
        addParents: newYearFolder.id,
        removeParents: previousParents,
        fields: "id, webViewLink",
      });
    }

    // Get updated folder info
    const updatedFolder = await getFolderById(folderInfo.folder_id, userId);
    newFolderId = updatedFolder.folder_id;
    newFolderUrl = updatedFolder.folder_url;
    needsUpdate = true;
  }

  if (needsUpdate) {
    return {
      folderId: newFolderId,
      folderUrl: newFolderUrl,
    };
  }

  return null;
}

/**
 * Validates a Drive folder URL and returns folder info
 */
export async function validateFolderUrl(
  url: string,
  userId: string
): Promise<DriveFolderInfo> {
  const folderId = extractFolderIdFromUrl(url);
  if (!folderId) {
    throw new Error("Invalid Google Drive URL. Please provide a valid folder URL.");
  }

  const folderInfo = await getFolderById(folderId, userId);
  return folderInfo;
}
