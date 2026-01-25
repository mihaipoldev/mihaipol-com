import { getServiceSupabaseClient } from "@/lib/supabase/server";
import { moveToTrash } from "@/lib/bunny";

export async function createAlbum(albumData: {
  title: string;
  slug: string;
  catalog_number?: string | null;
  album_type?: string | null;
  format_type?: string | null;
  description?: string | null;
  cover_image_url?: string | null;
  release_date?: string | null;
  label_id?: string | null;
  publish_status: "draft" | "scheduled" | "published" | "archived";
  cover_shape?: "square" | "circle";
}) {
  try {
    const supabase = getServiceSupabaseClient();
    const { data, error } = await supabase.from("albums").insert(albumData).select().single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error creating album:", error);
    throw error;
  }
}

export async function updateAlbum(id: string, updates: any) {
  try {
    const supabase = getServiceSupabaseClient();
    const { data, error } = await supabase
      .from("albums")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error updating album:", error);
    throw error;
  }
}

export async function deleteAlbum(id: string) {
  try {
    const supabase = getServiceSupabaseClient();
    const { error } = await supabase.from("albums").delete().eq("id", id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error deleting album:", error);
    throw error;
  }
}

export async function createAlbumLink(linkData: {
  album_id: string;
  platform_id?: string | null;
  url: string;
  cta_label: string;
  link_type?: string | null;
  sort_order?: number;
}) {
  try {
    const supabase = getServiceSupabaseClient();
    const { data, error } = await supabase.from("album_links").insert(linkData).select().single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error creating album link:", error);
    throw error;
  }
}

export async function updateAlbumLink(id: string, updates: any) {
  try {
    const supabase = getServiceSupabaseClient();
    const { data, error } = await supabase
      .from("album_links")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error updating album link:", error);
    throw error;
  }
}

export async function deleteAlbumLink(id: string) {
  try {
    const supabase = getServiceSupabaseClient();
    const { error } = await supabase.from("album_links").delete().eq("id", id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error deleting album link:", error);
    throw error;
  }
}

export async function batchUpdateAlbumLinks(
  albumId: string,
  links: Array<{
    id?: string; // If id exists, update; if not, create new
    platform_id?: string | null;
    url: string;
    cta_label: string;
    link_type?: string | null;
    sort_order: number;
  }>
) {
  try {
    const supabase = getServiceSupabaseClient();

    // Get existing links for this album
    const { data: existingLinks, error: fetchError } = await supabase
      .from("album_links")
      .select("id")
      .eq("album_id", albumId);

    if (fetchError) throw fetchError;

    const existingLinkIds = new Set(existingLinks?.map((link) => link.id) || []);
    const newLinkIds = new Set(links.filter((link) => link.id).map((link) => link.id!));

    // Find links to delete (exist in DB but not in new list)
    const linksToDelete = existingLinkIds
      ? Array.from(existingLinkIds).filter((id) => !newLinkIds.has(id))
      : [];

    // Delete removed links
    if (linksToDelete.length > 0) {
      const { error: deleteError } = await supabase
        .from("album_links")
        .delete()
        .in("id", linksToDelete);

      if (deleteError) throw deleteError;
    }

    // Process each link: update existing or create new
    const updates: Promise<any>[] = [];
    const creates: any[] = [];

    for (const link of links) {
      if (link.id && existingLinkIds.has(link.id)) {
        // Update existing link
        updates.push(
          Promise.resolve(
            supabase
              .from("album_links")
              .update({
                platform_id: link.platform_id || null,
                url: link.url,
                cta_label: link.cta_label,
                link_type: link.link_type || null,
                sort_order: link.sort_order,
              })
              .eq("id", link.id)
          ).then(({ error }) => {
            if (error) throw error;
            return true;
          })
        );
      } else {
        // Create new link
        creates.push({
          album_id: albumId,
          platform_id: link.platform_id || null,
          url: link.url,
          cta_label: link.cta_label,
          link_type: link.link_type || null,
          sort_order: link.sort_order,
        });
      }
    }

    // Execute all updates
    if (updates.length > 0) {
      await Promise.all(updates);
    }

    // Create new links
    if (creates.length > 0) {
      const { error: createError } = await supabase.from("album_links").insert(creates);

      if (createError) throw createError;
    }

    return true;
  } catch (error) {
    console.error("Error batch updating album links:", error);
    throw error;
  }
}

export async function batchUpdateAlbumArtists(
  albumId: string,
  artists: Array<{
    id?: string; // If id exists, update; if not, create new
    artist_id: string;
    role: "primary" | "featured" | "remixer";
    sort_order: number;
  }>
) {
  try {
    const supabase = getServiceSupabaseClient();

    // Get existing album_artists for this album
    const { data: existingArtists, error: fetchError } = await supabase
      .from("album_artists")
      .select("id")
      .eq("album_id", albumId);

    if (fetchError) throw fetchError;

    const existingArtistIds = new Set(existingArtists?.map((aa) => aa.id) || []);
    const newArtistIds = new Set(artists.filter((aa) => aa.id).map((aa) => aa.id!));

    // Find album_artists to delete (exist in DB but not in new list)
    const artistsToDelete = existingArtistIds
      ? Array.from(existingArtistIds).filter((id) => !newArtistIds.has(id))
      : [];

    // Delete removed album_artists
    if (artistsToDelete.length > 0) {
      const { error: deleteError } = await supabase
        .from("album_artists")
        .delete()
        .in("id", artistsToDelete);

      if (deleteError) throw deleteError;
    }

    // Process each album_artist: update existing or create new
    const updates: Promise<any>[] = [];
    const creates: any[] = [];

    for (const artist of artists) {
      if (artist.id && existingArtistIds.has(artist.id)) {
        // Update existing album_artist
        updates.push(
          Promise.resolve(
            supabase
              .from("album_artists")
              .update({
                artist_id: artist.artist_id,
                role: artist.role,
                sort_order: artist.sort_order,
              })
              .eq("id", artist.id)
          ).then(({ error }) => {
            if (error) throw error;
            return true;
          })
        );
      } else {
        // Create new album_artist
        creates.push({
          album_id: albumId,
          artist_id: artist.artist_id,
          role: artist.role,
          sort_order: artist.sort_order,
        });
      }
    }

    // Execute all updates
    if (updates.length > 0) {
      await Promise.all(updates);
    }

    // Create new album_artists
    if (creates.length > 0) {
      const { error: createError } = await supabase.from("album_artists").insert(creates);

      if (createError) throw createError;
    }

    return true;
  } catch (error) {
    console.error("Error batch updating album artists:", error);
    throw error;
  }
}

export async function createAlbumImage(data: {
  album_id: string;
  title?: string | null;
  image_url: string;
  crop_shape: "circle" | "square";
  content_type?: string | null;
  content_group?: string | null;
  sort_order?: number;
}) {
  try {
    const supabase = getServiceSupabaseClient();
    const { data: result, error } = await supabase
      .from("album_images")
      .insert({
        ...data,
        sort_order: data.sort_order ?? 0,
      })
      .select()
      .single();

    if (error) throw error;
    return result;
  } catch (error) {
    console.error("Error creating album image:", error);
    throw error;
  }
}

export async function updateAlbumImage(id: string, updates: {
  title?: string | null;
  image_url?: string;
  crop_shape?: "circle" | "square";
  content_type?: string | null;
  content_group?: string | null;
  sort_order?: number;
}) {
  try {
    const supabase = getServiceSupabaseClient();
    
    // If image_url is being updated, get the old image URL first
    let oldImageUrl: string | null = null;
    if (updates.image_url !== undefined) {
      const { data: existingImage, error: fetchError } = await supabase
        .from("album_images")
        .select("image_url")
        .eq("id", id)
        .single();

      if (!fetchError && existingImage?.image_url) {
        oldImageUrl = existingImage.image_url;
      }
    }

    const { data, error } = await supabase
      .from("album_images")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    // Move old image to trash if image_url changed and old image is from our CDN
    if (
      oldImageUrl &&
      updates.image_url &&
      oldImageUrl !== updates.image_url &&
      oldImageUrl.includes("mihaipol-com.b-cdn.net")
    ) {
      try {
        await moveToTrash(oldImageUrl);
      } catch (trashError) {
        // Log but don't fail - database record is already updated
        console.error("Failed to move old album image to trash:", trashError);
      }
    }

    return data;
  } catch (error) {
    console.error("Error updating album image:", error);
    throw error;
  }
}

export async function deleteAlbumImage(id: string) {
  try {
    const supabase = getServiceSupabaseClient();
    
    // First, get the image URL before deleting
    const { data: imageData, error: fetchError } = await supabase
      .from("album_images")
      .select("image_url")
      .eq("id", id)
      .single();

    if (fetchError) {
      console.error("Error fetching album image:", fetchError);
      throw fetchError;
    }

    // Delete from database
    const { error } = await supabase.from("album_images").delete().eq("id", id);

    if (error) throw error;

    // Move image to trash in Bunny CDN if it exists and is from our CDN
    if (imageData?.image_url && imageData.image_url.includes("mihaipol-com.b-cdn.net")) {
      try {
        await moveToTrash(imageData.image_url);
      } catch (trashError) {
        // Log but don't fail - database record is already deleted
        console.error("Failed to move album image to trash:", trashError);
      }
    }

    return true;
  } catch (error) {
    console.error("Error deleting album image:", error);
    throw error;
  }
}

export async function batchUpdateAlbumImages(
  albumId: string,
  images: Array<{
    id?: string; // If id exists, update; if not, create new
    title?: string | null;
    image_url: string;
    crop_shape: "circle" | "square";
    content_type?: string | null;
    content_group?: string | null;
    sort_order: number;
  }>
) {
  try {
    const supabase = getServiceSupabaseClient();

    // Get existing images for this album (including image_url for cleanup)
    const { data: existingImages, error: fetchError } = await supabase
      .from("album_images")
      .select("id, image_url")
      .eq("album_id", albumId);

    if (fetchError) throw fetchError;

    const existingImageIds = new Set(existingImages?.map((img) => img.id) || []);
    const newImageIds = new Set(images.filter((img) => img.id).map((img) => img.id!));

    // Find images to delete (exist in DB but not in new list)
    const imagesToDelete = existingImageIds
      ? Array.from(existingImageIds).filter((id) => !newImageIds.has(id))
      : [];

    // Get image URLs for images that will be deleted, then move to trash
    if (imagesToDelete.length > 0) {
      const imagesToDeleteData = existingImages?.filter((img) =>
        imagesToDelete.includes(img.id)
      );

      // Move deleted images to trash before deleting from database
      if (imagesToDeleteData) {
        for (const imageToDelete of imagesToDeleteData) {
          if (
            imageToDelete.image_url &&
            imageToDelete.image_url.includes("mihaipol-com.b-cdn.net")
          ) {
            try {
              await moveToTrash(imageToDelete.image_url);
            } catch (trashError) {
              // Log but don't fail - we'll still delete from DB
              console.error(
                `Failed to move album image to trash (id: ${imageToDelete.id}):`,
                trashError
              );
            }
          }
        }
      }

      // Delete removed images from database
      const { error: deleteError } = await supabase
        .from("album_images")
        .delete()
        .in("id", imagesToDelete);

      if (deleteError) throw deleteError;
    }

    // Process each image: update existing or create new
    const updates: Promise<any>[] = [];
    const creates: any[] = [];

    for (const image of images) {
      if (image.id && existingImageIds.has(image.id)) {
        // Update existing image - check if image_url changed
        const existingImage = existingImages?.find((img) => img.id === image.id);
        const oldImageUrl = existingImage?.image_url;

        // Update the database record
        updates.push(
          Promise.resolve(
            supabase
              .from("album_images")
              .update({
                title: image.title || null,
                image_url: image.image_url,
                crop_shape: image.crop_shape,
                content_type: image.content_type || null,
                content_group: image.content_group || null,
                sort_order: image.sort_order,
                updated_at: new Date().toISOString(),
              })
              .eq("id", image.id)
          )
            .then(({ error }) => {
              if (error) throw error;
              return { id: image.id, oldImageUrl, newImageUrl: image.image_url };
            })
        );
      } else {
        // Create new image
        creates.push({
          album_id: albumId,
          title: image.title || null,
          image_url: image.image_url,
          crop_shape: image.crop_shape,
          content_type: image.content_type || null,
          content_group: image.content_group || null,
          sort_order: image.sort_order,
        });
      }
    }

    // Execute all updates
    if (updates.length > 0) {
      const updateResults = await Promise.all(updates);

      // Move old images to trash for images that were replaced
      for (const result of updateResults) {
        if (
          result.oldImageUrl &&
          result.newImageUrl &&
          result.oldImageUrl !== result.newImageUrl &&
          result.oldImageUrl.includes("mihaipol-com.b-cdn.net")
        ) {
          try {
            await moveToTrash(result.oldImageUrl);
          } catch (trashError) {
            // Log but don't fail - database record is already updated
            console.error(
              `Failed to move old album image to trash (id: ${result.id}):`,
              trashError
            );
          }
        }
      }
    }

    // Create new images
    if (creates.length > 0) {
      const { error: createError } = await supabase.from("album_images").insert(creates);

      if (createError) throw createError;
    }

    return true;
  } catch (error) {
    console.error("Error batch updating album images:", error);
    throw error;
  }
}

export async function createAlbumAudio(data: {
  album_id: string;
  title?: string | null;
  audio_url: string;
  duration?: number | null;
  file_size?: number | null;
  highlight_start_time?: number | null;
  content_group?: string | null;
  sort_order?: number;
}) {
  try {
    const supabase = getServiceSupabaseClient();
    const { data: result, error } = await supabase
      .from("album_audios")
      .insert({
        ...data,
        sort_order: data.sort_order ?? 0,
      })
      .select()
      .single();

    if (error) throw error;
    return result;
  } catch (error) {
    console.error("Error creating album audio:", error);
    throw error;
  }
}

export async function updateAlbumAudio(id: string, updates: {
  title?: string | null;
  audio_url?: string;
  duration?: number | null;
  file_size?: number | null;
  highlight_start_time?: number | null;
  waveform_peaks?: number[] | null;
  content_group?: string | null;
  sort_order?: number;
}) {
  try {
    const supabase = getServiceSupabaseClient();
    
    // If audio_url is being updated, get the old audio URL first
    let oldAudioUrl: string | null = null;
    if (updates.audio_url !== undefined) {
      const { data: existingAudio, error: fetchError } = await supabase
        .from("album_audios")
        .select("audio_url")
        .eq("id", id)
        .single();

      if (!fetchError && existingAudio?.audio_url) {
        oldAudioUrl = existingAudio.audio_url;
      }
    }

    const { data, error } = await supabase
      .from("album_audios")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    // Move old audio to trash if audio_url changed and old audio is from our CDN
    if (
      oldAudioUrl &&
      updates.audio_url &&
      oldAudioUrl !== updates.audio_url &&
      oldAudioUrl.includes("mihaipol-com.b-cdn.net")
    ) {
      try {
        await moveToTrash(oldAudioUrl);
      } catch (trashError) {
        // Log but don't fail - database record is already updated
        console.error("Failed to move old album audio to trash:", trashError);
      }
    }

    return data;
  } catch (error) {
    console.error("Error updating album audio:", error);
    throw error;
  }
}

export async function deleteAlbumAudio(id: string) {
  try {
    const supabase = getServiceSupabaseClient();
    
    // First, get the audio URL before deleting
    const { data: audioData, error: fetchError } = await supabase
      .from("album_audios")
      .select("audio_url")
      .eq("id", id)
      .single();

    if (fetchError) {
      console.error("Error fetching album audio:", fetchError);
      throw fetchError;
    }

    // Delete from database
    const { error } = await supabase.from("album_audios").delete().eq("id", id);

    if (error) throw error;

    // Move audio to trash in Bunny CDN if it exists and is from our CDN
    if (audioData?.audio_url && audioData.audio_url.includes("mihaipol-com.b-cdn.net")) {
      try {
        await moveToTrash(audioData.audio_url);
      } catch (trashError) {
        // Log but don't fail - database record is already deleted
        console.error("Failed to move album audio to trash:", trashError);
      }
    }

    return true;
  } catch (error) {
    console.error("Error deleting album audio:", error);
    throw error;
  }
}

export async function batchUpdateAlbumAudios(
  albumId: string,
  audios: Array<{
    id?: string; // If id exists, update; if not, create new
    title?: string | null;
    audio_url: string;
    duration?: number | null;
    file_size?: number | null;
    highlight_start_time?: number | null;
    content_group?: string | null;
    sort_order: number;
  }>
) {
  try {
    const supabase = getServiceSupabaseClient();

    // Get existing audios for this album (including audio_url for cleanup)
    const { data: existingAudios, error: fetchError } = await supabase
      .from("album_audios")
      .select("id, audio_url")
      .eq("album_id", albumId);

    if (fetchError) throw fetchError;

    const existingAudioIds = new Set(existingAudios?.map((audio) => audio.id) || []);
    const newAudioIds = new Set(audios.filter((audio) => audio.id).map((audio) => audio.id!));

    // Find audios to delete (exist in DB but not in new list)
    const audiosToDelete = existingAudioIds
      ? Array.from(existingAudioIds).filter((id) => !newAudioIds.has(id))
      : [];

    // Get audio URLs for audios that will be deleted, then move to trash
    if (audiosToDelete.length > 0) {
      const audiosToDeleteData = existingAudios?.filter((audio) =>
        audiosToDelete.includes(audio.id)
      );

      // Move deleted audios to trash before deleting from database
      if (audiosToDeleteData) {
        for (const audioToDelete of audiosToDeleteData) {
          if (
            audioToDelete.audio_url &&
            audioToDelete.audio_url.includes("mihaipol-com.b-cdn.net")
          ) {
            try {
              await moveToTrash(audioToDelete.audio_url);
            } catch (trashError) {
              // Log but don't fail - we'll still delete from DB
              console.error(
                `Failed to move album audio to trash (id: ${audioToDelete.id}):`,
                trashError
              );
            }
          }
        }
      }

      // Delete removed audios from database
      const { error: deleteError } = await supabase
        .from("album_audios")
        .delete()
        .in("id", audiosToDelete);

      if (deleteError) throw deleteError;
    }

    // Process each audio: update existing or create new
    const updates: Promise<any>[] = [];
    const creates: any[] = [];

    for (const audio of audios) {
      if (audio.id && existingAudioIds.has(audio.id)) {
        // Update existing audio - check if audio_url changed
        const existingAudio = existingAudios?.find((a) => a.id === audio.id);
        const oldAudioUrl = existingAudio?.audio_url;

        // Update the database record
        updates.push(
          Promise.resolve(
            supabase
              .from("album_audios")
              .update({
                title: audio.title || null,
                audio_url: audio.audio_url,
                duration: audio.duration ?? null,
                file_size: audio.file_size ?? null,
                highlight_start_time: audio.highlight_start_time ?? null,
                content_group: audio.content_group || null,
                sort_order: audio.sort_order,
                updated_at: new Date().toISOString(),
              })
              .eq("id", audio.id)
          )
            .then(({ error }) => {
              if (error) throw error;
              return { id: audio.id, oldAudioUrl, newAudioUrl: audio.audio_url };
            })
        );
      } else {
        // Create new audio
        creates.push({
          album_id: albumId,
          title: audio.title || null,
          audio_url: audio.audio_url,
          duration: audio.duration ?? null,
          file_size: audio.file_size ?? null,
          highlight_start_time: audio.highlight_start_time ?? null,
          content_group: audio.content_group || null,
          sort_order: audio.sort_order,
        });
      }
    }

    // Execute all updates
    if (updates.length > 0) {
      const updateResults = await Promise.all(updates);

      // Move old audios to trash for audios that were replaced
      for (const result of updateResults) {
        if (
          result.oldAudioUrl &&
          result.newAudioUrl &&
          result.oldAudioUrl !== result.newAudioUrl &&
          result.oldAudioUrl.includes("mihaipol-com.b-cdn.net")
        ) {
          try {
            await moveToTrash(result.oldAudioUrl);
          } catch (trashError) {
            // Log but don't fail - database record is already updated
            console.error(
              `Failed to move old album audio to trash (id: ${result.id}):`,
              trashError
            );
          }
        }
      }
    }

    // Create new audios
    if (creates.length > 0) {
      const { error: createError } = await supabase.from("album_audios").insert(creates);

      if (createError) throw createError;
    }

    return true;
  } catch (error) {
    console.error("Error batch updating album audios:", error);
    throw error;
  }
}
