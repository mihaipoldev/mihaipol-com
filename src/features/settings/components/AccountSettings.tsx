"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Camera, Crown, Save, User, AlertCircle, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField } from "@/components/admin/forms/FormField";
import { ShadowInput } from "@/components/admin/forms/ShadowInput";
import { ShadowButton } from "@/components/admin/forms/ShadowButton";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function AccountSettings() {
  const [displayName, setDisplayName] = useState("Mihai Pol");
  const [email, setEmail] = useState("mihaipolbrasov@gmail.com");
  const [phone, setPhone] = useState("+40773768874");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Track if there are any changes (simplified for now)
  const hasChanges = currentPassword !== "" || newPassword !== "" || confirmPassword !== "";

  const handleSave = () => {
    setIsSaving(true);
    // Placeholder - will be implemented when auth system is in place
    toast.info("Account settings will be saved when authentication system is implemented");
    setTimeout(() => setIsSaving(false), 1000);
  };

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
            <User className="h-6 w-6 text-primary" />
            Account Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 relative">
          <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
            <div className="relative flex-shrink-0">
              <Avatar className="h-20 w-20">
                <AvatarImage src="" alt="Profile" />
                <AvatarFallback className="text-lg bg-muted">MP</AvatarFallback>
              </Avatar>
              <Button
                variant="outline"
                size="icon"
                className="absolute bottom-0 right-0 h-8 w-8 rounded-full"
                onClick={() => toast.info("Avatar upload will be available soon")}
              >
                <Camera className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex-1 space-y-4 w-full">
              <FormField label="Display Name">
                <ShadowInput
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your display name"
                />
              </FormField>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                <Badge variant="destructive" className="gap-1">
                  <Crown className="h-3 w-3" />
                  Super Admin
                </Badge>
                <p className="text-sm text-muted-foreground">
                  Your current role in the organization
                </p>
              </div>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Email">
              <ShadowInput
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
                disabled
                className="bg-muted"
              />
            </FormField>

            <FormField label="Phone">
              <ShadowInput
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1234567890"
              />
            </FormField>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Change Password</h3>
            <FormField label="Current Password">
              <ShadowInput
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
              />
            </FormField>

            <FormField label="New Password">
              <ShadowInput
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
              />
            </FormField>

            <FormField label="Confirm New Password">
              <ShadowInput
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
              />
            </FormField>
          </div>
        </CardContent>
      </Card>

      {/* Sticky Bottom Bar - Only shows when there are changes */}
      <AnimatePresence>
        {hasChanges && (
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
                    Password change pending
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      setCurrentPassword("");
                      setNewPassword("");
                      setConfirmPassword("");
                    }}
                    disabled={isSaving}
                  >
                    Clear
                  </Button>
                  <Button onClick={handleSave} disabled={isSaving} size="sm">
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
