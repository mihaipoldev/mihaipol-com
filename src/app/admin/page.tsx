"use client"

import { AdminPageTitle } from "@/components/admin/AdminPageTitle"

export default function AdminDashboardPage() {
  return (
    <div className="w-full">
      <AdminPageTitle title="Admin Dashboard" />
      <div className="text-muted-foreground mt-6">
        <p>Welcome to the admin dashboard. Select an item from the sidebar to get started.</p>
      </div>
    </div>
  )
}


