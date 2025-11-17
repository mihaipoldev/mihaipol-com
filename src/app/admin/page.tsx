"use client"

import { AdminPageTitle } from "@/components/admin/AdminPageTitle"

export default function AdminDashboardPage() {
  return (
    <div className="w-full">
      <div className="mb-10 relative">
        <div className="absolute -left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-primary/20 via-primary/10 to-transparent rounded-full" />
      <AdminPageTitle 
        title="Admin Dashboard" 
        description="Welcome to the admin dashboard. Select an item from the sidebar to get started."
      />
      </div>
    </div>
  )
}


