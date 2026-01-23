"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Plug, Save, Loader2, CheckCircle2, XCircle, Folder, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField } from "@/components/admin/forms/FormField";
import { ShadowInput } from "@/components/admin/forms/ShadowInput";
import { ShadowButton } from "@/components/admin/forms/ShadowButton";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import type { SitePreference } from "@/features/settings/types";

async function fetchPreferences(): Promise<SitePreference[]> {
  const response = await fetch("/api/admin/settings/preferences");
  if (!response.ok) {
    throw new Error("Failed to fetch preferences");
  }
  return response.json();
}

async function updatePreference(key: string, value: any): Promise<void> {
  const response = await fetch("/api/admin/settings/preferences", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ key, value }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update preference");
  }
}

async function validateFolderId(folderId: string): Promise<{ valid: boolean; folderName?: string; error?: string }> {
  if (!folderId.trim()) {
    return { valid: false, error: "Folder ID is required" };
  }

  // Validate format (alphanumeric, dashes, underscores)
  const folderIdRegex = /^[a-zA-Z0-9_-]+$/;
  if (!folderIdRegex.test(folderId.trim())) {
    return { valid: false, error: "Invalid folder ID format" };
  }

  try {
    const response = await fetch(
      `/api/admin/settings/validate-drive-folder?folderId=${encodeURIComponent(folderId.trim())}`
    );
    if (!response.ok) {
      const error = await response.json();
      return { valid: false, error: error.error || "Failed to validate folder" };
    }
    const data = await response.json();
    if (data.valid) {
      return { valid: true, folderName: data.folderName };
    } else {
      return { valid: false, error: data.error || "Invalid folder" };
    }
  } catch (error: any) {
    return { valid: false, error: error.message || "Failed to validate folder" };
  }
}

export function IntegrationsSettings() {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const [folderId, setFolderId] = useState("");
  const [validationState, setValidationState] = useState<{
    status: "idle" | "validating" | "valid" | "invalid";
    folderName?: string;
    error?: string;
  }>({ status: "idle" });
  const [savedFolderId, setSavedFolderId] = useState<string | null>(null);
  const [savedFolderName, setSavedFolderName] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [authStatus, setAuthStatus] = useState<{
    authenticated: boolean;
    loading: boolean;
  }>({ authenticated: false, loading: true });

  const { data: preferences, isLoading } = useQuery({
    queryKey: ["site-preferences"],
    queryFn: fetchPreferences,
  });

  // Check Google Drive auth status
  useEffect(() => {
    async function checkAuthStatus() {
      try {
        const response = await fetch("/api/auth/google/status");
        const data = await response.json();
        setAuthStatus({ authenticated: data.authenticated || false, loading: false });
      } catch (error) {
        console.error("Error checking auth status:", error);
        setAuthStatus({ authenticated: false, loading: false });
      }
    }
    checkAuthStatus();
  }, []);

  // Show success toast if redirected from OAuth callback
  useEffect(() => {
    const success = searchParams.get("success");
    if (success === "google_drive_connected") {
      toast.success("Google Drive connected successfully!");
      // Refresh auth status
      fetch("/api/auth/google/status")
        .then((res) => res.json())
        .then((data) => {
          setAuthStatus({ authenticated: data.authenticated || false, loading: false });
        })
        .catch((error) => {
          console.error("Error refreshing auth status:", error);
        });
      // Remove query param from URL
      const url = new URL(window.location.href);
      url.searchParams.delete("success");
      window.history.replaceState({}, "", url.toString());
    }
  }, [searchParams]);

  const updateMutation = useMutation({
    mutationFn: (updates: { key: string; value: any }[]) => {
      return Promise.all(updates.map(({ key, value }) => updatePreference(key, value)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site-preferences"] });
      toast.success("Settings saved successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to save settings");
    },
  });

  const handleValidateFolderId = async (id: string, isLoad = false) => {
    if (!id.trim()) {
      setValidationState({ status: "idle" });
      return;
    }

    setValidationState({ status: "validating" });
    const result = await validateFolderId(id);
    
    if (result.valid) {
      setValidationState({ status: "valid", folderName: result.folderName });
      // Only update saved folder name if this is a load (already saved) or if it matches saved ID
      if (isLoad || id === savedFolderId) {
        setSavedFolderName(result.folderName || null);
      }
    } else {
      setValidationState({ status: "invalid", error: result.error });
    }
  };

  // Load current value when preferences are fetched
  useEffect(() => {
    if (preferences) {
      const driveFolderPref = preferences.find((p) => p.key === "drive_releases_folder_id");
      if (driveFolderPref?.value) {
        const value = typeof driveFolderPref.value === "string" 
          ? JSON.parse(driveFolderPref.value) 
          : driveFolderPref.value;
        const currentFolderId = value?.folderId || "";
        setFolderId(currentFolderId);
        setSavedFolderId(currentFolderId || null);
        // Validate on load if folder ID exists to get the folder name
        if (currentFolderId) {
          handleValidateFolderId(currentFolderId, true).catch(console.error);
        }
      } else {
        // No folder ID saved
        setFolderId("");
        setSavedFolderId(null);
        setSavedFolderName(null);
      }
    }
  }, [preferences]);

  const handleFolderIdBlur = () => {
    // Only validate on blur, don't show as "connected" unless it's saved
    handleValidateFolderId(folderId, false);
  };

  const handleConnectGoogleDrive = () => {
    window.location.href = "/api/auth/google/login";
  };

  const handleDisconnect = async () => {
    if (!confirm("Are you sure you want to disconnect Google Drive? You'll need to reconnect to use Drive features.")) {
      return;
    }

    try {
      const response = await fetch("/api/auth/google/disconnect", {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to disconnect");
      }

      toast.success("Google Drive disconnected successfully");
      setAuthStatus({ authenticated: false, loading: false });
    } catch (error: any) {
      console.error("Error disconnecting:", error);
      toast.error(error.message || "Failed to disconnect Google Drive");
    }
  };

  const handleSave = async () => {
    // Validate before saving
    if (folderId.trim()) {
      setValidationState({ status: "validating" });
      const result = await validateFolderId(folderId);
      
      if (!result.valid) {
        setValidationState({ status: "invalid", error: result.error });
        toast.error(result.error || "Please fix validation errors before saving");
        return;
      }
      
      setValidationState({ status: "valid", folderName: result.folderName });
    }

    setIsSaving(true);
    try {
      // Ensure we always send a proper JSONB value
      const valueToSave = folderId.trim() 
        ? { folderId: folderId.trim() } 
        : { folderId: null };
      
      const response = await fetch("/api/admin/settings/preferences", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          key: "drive_releases_folder_id",
          value: valueToSave 
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save preference");
      }

      // Update saved state
      setSavedFolderId(folderId.trim() || null);
      if (validationState.status === "valid" && validationState.folderName) {
        setSavedFolderName(validationState.folderName);
      }
      
      // Refresh the preferences to get the updated value
      queryClient.invalidateQueries({ queryKey: ["site-preferences"] });
      toast.success("Settings saved successfully");
    } catch (error: any) {
      console.error("Error saving folder ID:", error);
      toast.error(error.message || "Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card className="relative overflow-hidden shadow-lg">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] via-transparent to-transparent pointer-events-none" />
          <CardHeader className="relative">
            <Skeleton className="h-8 w-48" />
          </CardHeader>
          <CardContent className="space-y-6 relative">
            <div className="space-y-4">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const canSave = validationState.status === "valid" || validationState.status === "idle" || !folderId.trim();

  return (
    <div className="space-y-6">
      <Card className="relative overflow-hidden shadow-lg">
        {/* Decorative gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] via-transparent to-transparent pointer-events-none" />

        {/* Sparkle decorations */}
        <div className="absolute top-4 right-4 w-2 h-2 bg-primary/20 rounded-full blur-sm animate-pulse" />
        <div
          className="absolute top-12 right-12 w-1.5 h-1.5 bg-primary/30 rounded-full blur-sm animate-pulse"
          style={{ animationDelay: "300ms" }}
        />

        <CardHeader className="relative">
          <CardTitle className="text-2xl flex items-center gap-2">
            <Plug className="h-6 w-6 text-primary" />
            Integrations Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 relative">
          {/* Google Drive Section */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Folder className="h-5 w-5 text-primary" />
                Google Drive Integration
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Configure Google Drive folder settings for album releases
              </p>
            </div>

            <Separator />

            {/* Google Drive Authentication Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold">Google Drive Connection</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Connect your Google account to enable Drive folder management
                  </p>
                </div>
                {authStatus.loading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                ) : authStatus.authenticated ? (
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <span className="text-sm text-green-600 dark:text-green-400">Connected</span>
                    <ShadowButton onClick={handleDisconnect} size="sm" variant="outline">
                      Disconnect
                    </ShadowButton>
                  </div>
                ) : (
                  <ShadowButton onClick={handleConnectGoogleDrive} size="sm">
                    Connect Google Drive
                  </ShadowButton>
                )}
              </div>
              
              {!authStatus.authenticated && !authStatus.loading && (
                <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 p-3 rounded-md">
                  <AlertCircle className="h-4 w-4" />
                  <span>You must connect Google Drive before configuring folder settings.</span>
                </div>
              )}
            </div>

            <Separator />

            <FormField
              label="Releases Folder ID"
              error={validationState.status === "invalid" ? validationState.error : undefined}
            >
              <ShadowInput
                value={folderId}
                onChange={(e) => {
                  setFolderId(e.target.value);
                  // Reset validation state when user types
                  if (validationState.status !== "idle") {
                    setValidationState({ status: "idle" });
                  }
                }}
                onBlur={handleFolderIdBlur}
                placeholder="1a2b3c4d5e6f7g8h9i0..."
                disabled={isSaving || !authStatus.authenticated}
              />
              <p className="text-xs text-muted-foreground mt-2">
                The Google Drive folder ID where all release year folders will be created. Get this from your Drive
                folder URL: drive.google.com/drive/folders/[FOLDER_ID]
              </p>

              {/* Validation State Indicator */}
              {validationState.status !== "idle" && (
                <div className="mt-3 flex items-center gap-2">
                  {validationState.status === "validating" && (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Validating folder...</span>
                    </>
                  )}
                  {validationState.status === "valid" && validationState.folderName && (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                      <span className="text-sm text-green-600 dark:text-green-400">
                        ✓ Valid folder: {validationState.folderName}
                        {folderId.trim() !== savedFolderId && (
                          <span className="text-xs text-muted-foreground ml-2">
                            (Click "Save Changes" to save)
                          </span>
                        )}
                      </span>
                    </>
                  )}
                  {validationState.status === "invalid" && validationState.error && (
                    <>
                      <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                      <span className="text-sm text-red-600 dark:text-red-400">
                        ✗ {validationState.error}
                      </span>
                    </>
                  )}
                </div>
              )}
              
              {/* Saved State Indicator - Only show when actually saved */}
              {savedFolderId && savedFolderName && folderId.trim() === savedFolderId && (
                <div className="mt-2 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <span className="text-sm text-green-600 dark:text-green-400">
                    ✓ Connected to: {savedFolderName}
                  </span>
                </div>
              )}
            </FormField>
          </div>
        </CardContent>
      </Card>

      {/* Sticky Bottom Bar - Only shows when there are changes */}
      <AnimatePresence>
        {folderId.trim() !== savedFolderId && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur-sm shadow-lg"
          >
            <div className="max-w-[1400px] mx-auto px-4 lg:pl-64 py-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-sm">
                    <AlertCircle className="h-4 w-4 text-amber-500" />
                    <span className="font-medium">Unsaved changes</span>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    Google Drive folder ID changed
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setFolderId(savedFolderId || "")}
                    disabled={isSaving}
                  >
                    Discard
                  </Button>
                  <Button onClick={handleSave} disabled={isSaving || !canSave} size="sm">
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
