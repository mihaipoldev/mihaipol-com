"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlbumSmartLinksManager } from "@/features/smart-links/components/AlbumSmartLinksManager";
import { PhonePreview } from "@/components/admin/PhonePreview";
import { Button } from "@/components/ui/button";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import type { Album, AlbumLink, Platform } from "@/features/albums/types";

type AlbumLinksTabProps = {
  albumId: string;
  isNew: boolean;
  initialAlbum: Album | null;
  initialLinks: AlbumLink[];
  initialPlatforms: Platform[];
  onPlatformsChange?: (platforms: Platform[]) => void;
};

export function AlbumLinksTab({
  albumId,
  isNew,
  initialAlbum,
  initialLinks,
  initialPlatforms,
  onPlatformsChange,
}: AlbumLinksTabProps) {
  const [links, setLinks] = useState<AlbumLink[]>(initialLinks);
  const [platforms, setPlatforms] = useState<Platform[]>(initialPlatforms);
  const [linkValidationErrors, setLinkValidationErrors] = useState<
    Record<string, { platform?: string; url?: string }>
  >({});
  const [isSaving, setIsSaving] = useState(false);

  // Sync links when initialLinks prop changes
  useEffect(() => {
    setLinks(initialLinks);
  }, [initialLinks]);

  // Sync platforms when initialPlatforms prop changes
  useEffect(() => {
    setPlatforms(initialPlatforms);
  }, [initialPlatforms]);

  const handleLinksChange = (updatedLinks: AlbumLink[]) => {
    setLinks(updatedLinks);
    // Clear validation errors when links change
    setLinkValidationErrors({});
  };

  const handlePlatformsChange = (updatedPlatforms: Platform[]) => {
    setPlatforms(updatedPlatforms);
    // Notify parent if callback provided
    onPlatformsChange?.(updatedPlatforms);
  };

  const validateLinks = (): boolean => {
    if (links.length === 0) {
      setLinkValidationErrors({});
      return true;
    }

    const errors: Record<string, { platform?: string; url?: string }> = {};
    let hasErrors = false;

    links.forEach((link) => {
      const linkErrors: { platform?: string; url?: string } = {};

      if (!link.platform_id) {
        linkErrors.platform = "Platform is required";
        hasErrors = true;
      }

      if (!link.url || link.url.trim() === "") {
        linkErrors.url = "URL is required";
        hasErrors = true;
      }

      if (Object.keys(linkErrors).length > 0) {
        errors[link.id] = linkErrors;
      }
    });

    setLinkValidationErrors(errors);
    return !hasErrors;
  };

  const handleSave = async () => {
    if (!validateLinks()) {
      toast.error("Please fix the errors in the links section before saving");
      return;
    }

    try {
      setIsSaving(true);
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      const linksResponse = await fetch("/api/admin/albums/links", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({
          albumId: albumId,
          links: links.map((link) => ({
            id: link.id.startsWith("temp-") ? undefined : link.id,
            platform_id: link.platform_id,
            url: link.url,
            cta_label: link.cta_label,
            link_type: link.link_type,
            sort_order: link.sort_order,
          })),
        }),
      });

      if (!linksResponse.ok) {
        const error = await linksResponse.json();
        throw new Error(error.error || "Failed to save links");
      }

      toast.success("Links saved successfully");
    } catch (error: any) {
      console.error("Error saving links:", error);
      toast.error(error.message || "Failed to save links");
    } finally {
      setIsSaving(false);
    }
  };

  if (isNew) {
    return (
      <motion.p
        className="text-sm text-muted-foreground"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        Save the album first to add links.
      </motion.p>
    );
  }

  return (
    <motion.div
      className="space-y-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      {/* Main Content Grid */}
      <motion.div
        className="grid grid-cols-1 lg:grid-cols-5 gap-4 md:gap-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        {/* Left column: Header + Links Manager */}
        <motion.div
          className="lg:col-span-3 space-y-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
        >
          {/* Header Section */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.05 }}
          >
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
              <span className="w-1.5 h-8 bg-gradient-to-b from-primary to-primary/50 rounded-full"></span>
              Smart Links
            </h2>
            <p className="text-sm text-muted-foreground mt-2 ml-5">
              Order and configure the services shown on your smart link page
            </p>
          </motion.div>

          <AlbumSmartLinksManager
            links={links}
            platforms={platforms}
            onChange={handleLinksChange}
            onPlatformsChange={handlePlatformsChange}
            validationErrors={linkValidationErrors}
            onSave={handleSave}
            isSaving={isSaving}
          />
        </motion.div>

        {/* Right column: Mobile Preview */}
        <motion.div
          className="lg:col-span-2 flex justify-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <PhonePreview album={initialAlbum} links={links} />
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
