"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { getSupabaseBrowser } from "@/lib/supabase-browser"
import { PerformanceMonitor } from "@/components/dev/PerformanceMonitor"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AdminPageTitle } from "@/components/admin/AdminPageTitle"

export default function TestPerformancePage() {
  const [testResults, setTestResults] = useState<{
    albums?: { duration: number; count: number }
    events?: { duration: number; count: number }
    updates?: { duration: number; count: number }
  }>({})

  const albumsQuery = useQuery({
    queryKey: ["albums", "all"],
    queryFn: async () => {
      const supabase = getSupabaseBrowser()
      const start = performance.now()
      
      const { data, error } = await supabase
        .from('albums')
        .select(`
          id, title, slug, catalog_number, cover_image_url, release_date, label_id, publish_status,
          labels (
            id,
            name
          )
        `)
        .order('release_date', { ascending: false, nullsFirst: false })

      const duration = performance.now() - start
      
      if (error) throw error
      console.log(`🔍 [DB] albums query completed in ${duration.toFixed(0)}ms → ${data?.length || 0} records`)
      
      return { data: data || [], duration }
    },
    enabled: false,
  })

  const eventsQuery = useQuery({
    queryKey: ["events", "all"],
    queryFn: async () => {
      const supabase = getSupabaseBrowser()
      const start = performance.now()
      
      const { data, error } = await supabase
        .from('events')
        .select('id, title, slug, date, venue, location, event_status, publish_status, flyer_image_url, description')
        .order('date', { ascending: false })

      const duration = performance.now() - start
      
      if (error) throw error
      console.log(`🔍 [DB] events query completed in ${duration.toFixed(0)}ms → ${data?.length || 0} records`)
      
      return { data: data || [], duration }
    },
    enabled: false,
  })

  const updatesQuery = useQuery({
    queryKey: ["updates", "all"],
    queryFn: async () => {
      const supabase = getSupabaseBrowser()
      const start = performance.now()
      
      const { data, error } = await supabase
        .from('updates')
        .select('id, title, slug, date, publish_status, content, image_url')
        .order('date', { ascending: false, nullsFirst: false })

      const duration = performance.now() - start
      
      if (error) throw error
      console.log(`🔍 [DB] updates query completed in ${duration.toFixed(0)}ms → ${data?.length || 0} records`)
      
      return { data: data || [], duration }
    },
    enabled: false,
  })

  const runTest = async (type: "albums" | "events" | "updates") => {
    let query
    if (type === "albums") query = albumsQuery
    else if (type === "events") query = eventsQuery
    else query = updatesQuery

    await query.refetch()

    if (query.data) {
      setTestResults((prev) => ({
        ...prev,
        [type]: {
          duration: query.data.duration,
          count: query.data.data.length,
        },
      }))
    }
  }

  const runAllTests = async () => {
    setTestResults({})
    await Promise.all([
      runTest("albums"),
      runTest("events"),
      runTest("updates"),
    ])
  }

  return (
    <div className="w-full">
      <AdminPageTitle
        title="Performance Testing"
        description="Test and monitor database query performance"
      />

      <div className="mt-6 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Query Performance Tests</CardTitle>
            <CardDescription>
              Test individual queries or run all tests. Results show query duration and record count.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2 flex-wrap">
              <Button onClick={() => runTest("albums")}>Test Albums Query</Button>
              <Button onClick={() => runTest("events")}>Test Events Query</Button>
              <Button onClick={() => runTest("updates")}>Test Updates Query</Button>
              <Button onClick={runAllTests} variant="default">
                Run All Tests
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Albums</CardTitle>
                </CardHeader>
                <CardContent>
                  {testResults.albums ? (
                    <div>
                      <div className="text-2xl font-bold text-primary">
                        {testResults.albums.duration.toFixed(0)}ms
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {testResults.albums.count} records
                      </div>
                      {testResults.albums.duration > 1000 && (
                        <div className="text-xs text-red-500 mt-1">⚠️ Slow query</div>
                      )}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">Not tested</div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Events</CardTitle>
                </CardHeader>
                <CardContent>
                  {testResults.events ? (
                    <div>
                      <div className="text-2xl font-bold text-primary">
                        {testResults.events.duration.toFixed(0)}ms
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {testResults.events.count} records
                      </div>
                      {testResults.events.duration > 1000 && (
                        <div className="text-xs text-red-500 mt-1">⚠️ Slow query</div>
                      )}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">Not tested</div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Updates</CardTitle>
                </CardHeader>
                <CardContent>
                  {testResults.updates ? (
                    <div>
                      <div className="text-2xl font-bold text-primary">
                        {testResults.updates.duration.toFixed(0)}ms
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {testResults.updates.count} records
                      </div>
                      {testResults.updates.duration > 1000 && (
                        <div className="text-xs text-red-500 mt-1">⚠️ Slow query</div>
                      )}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">Not tested</div>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-lg">Performance Tips</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2 text-muted-foreground">
                <p>• Good: &lt; 100ms</p>
                <p>• Acceptable: 100-500ms</p>
                <p>• Slow: 500-1000ms</p>
                <p>• Very Slow: &gt; 1000ms (needs optimization)</p>
                <p className="mt-4 pt-4 border-t">
                  <strong>Note:</strong> Make sure database indexes are applied. Check the migration
                  file: <code className="bg-muted px-1 rounded">supabase/migrations/20250102120000_add_performance_indexes.sql</code>
                </p>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      </div>

      <PerformanceMonitor />
    </div>
  )
}

