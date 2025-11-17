import { AdminPageTitle } from "@/components/admin/AdminPageTitle"

export default function TestPage() {
  return (
    <div>
      <div className="mb-10 relative">
        <div className="absolute -left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-primary/20 via-primary/10 to-transparent rounded-full" />
      <AdminPageTitle 
        title="Test" 
        description="Test page for development and debugging purposes."
      />
      </div>
      <p>Test Page Works</p>
    </div>
  )
}

