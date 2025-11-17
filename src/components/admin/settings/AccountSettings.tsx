"use client";

import { useState } from "react";
import { Camera, Crown, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField } from "@/components/admin/forms/FormField";
import { ShadowInput } from "@/components/admin/ShadowInput";
import { ShadowButton } from "@/components/admin/ShadowButton";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function AccountSettings() {
  const [displayName, setDisplayName] = useState("Mihai Pol");
  const [email, setEmail] = useState("mihaipolbrasov@gmail.com");
  const [phone, setPhone] = useState("+40773768874");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSave = () => {
    // Placeholder - will be implemented when auth system is in place
    toast.info("Account settings will be saved when authentication system is implemented");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Account Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-start gap-6">
            <div className="relative">
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

            <div className="flex-1 space-y-4">
              <FormField label="Display Name">
                <ShadowInput
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your display name"
                />
              </FormField>

              <div className="flex items-center gap-2">
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

          <Separator />

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

          <div className="flex justify-end pt-4">
            <ShadowButton onClick={handleSave} size="lg" className="gap-2">
              <Save className="h-4 w-4" />
              Save Changes
            </ShadowButton>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
