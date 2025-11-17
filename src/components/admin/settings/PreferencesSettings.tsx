"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function PreferencesSettings() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Preferences</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            This section will include options for language, date format, notifications, and other
            app preferences.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
