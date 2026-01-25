"use client";

import { useState } from "react";
import { AdminPageTitle } from "@/components/admin/ui/AdminPageTitle";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function TestFFmpegPage() {
  const [testImageUrl, setTestImageUrl] = useState("https://mihaipol-com.b-cdn.net/albums/57756903-8bec-4b6d-a4da-f3a9b57eb1e9/image_1769192303954.png");
  const [testAudioUrl, setTestAudioUrl] = useState("https://mihaipol-com.b-cdn.net/albums/57756903-8bec-4b6d-a4da-f3a9b57eb1e9/audio_1769306457374.wav");
  const [duration, setDuration] = useState("30");
  const [taskId, setTaskId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [webhookPayload, setWebhookPayload] = useState("");

  const testCreateTask = async () => {
    setLoading(true);
    setError(null);
    setTaskId(null);
    setStatus(null);

    try {
      const response = await fetch("/api/dev/ffmpeg/test-create-task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl: testImageUrl,
          audioUrl: testAudioUrl,
          duration: parseInt(duration),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to create task");
      }

      setTaskId(data.task_id);
      setStatus(data.status);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const testGetStatus = async () => {
    if (!taskId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/dev/ffmpeg/test-status?taskId=${taskId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to get status");
      }

      setStatus(data.status);
      if (data.output_url) {
        setError(null);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const testWebhook = async () => {
    setLoading(true);
    setError(null);

    try {
      const payload = JSON.parse(webhookPayload || "{}");
      const response = await fetch("/api/webhooks/ffmpeg", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Webhook failed");
      }

      setError(null);
      alert("Webhook test successful! Check the workflow run in the database.");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <AdminPageTitle
        title="FFmpeg API Testing"
        description="Test the FFmpeg API client and webhook handler"
      />

      <div className="mt-6 space-y-6">
        {/* Create Task Test */}
        <Card>
          <CardHeader>
            <CardTitle>Test Task Creation</CardTitle>
            <CardDescription>
              Create a video generation task using the FFmpeg API client
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="imageUrl">Image URL</Label>
              <Input
                id="imageUrl"
                value={testImageUrl}
                onChange={(e) => setTestImageUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="audioUrl">Audio URL</Label>
              <Input
                id="audioUrl"
                value={testAudioUrl}
                onChange={(e) => setTestAudioUrl(e.target.value)}
                placeholder="https://example.com/audio.mp3"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration">Duration (seconds)</Label>
              <Input
                id="duration"
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="30"
              />
            </div>
            <Button onClick={testCreateTask} disabled={loading || !testImageUrl || !testAudioUrl}>
              {loading ? "Creating..." : "Create Task"}
            </Button>

            {taskId && (
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <p className="font-semibold">Task Created:</p>
                <p className="text-sm text-muted-foreground">Task ID: {taskId}</p>
                <p className="text-sm text-muted-foreground">Status: {status}</p>
                <Button onClick={testGetStatus} className="mt-2" variant="outline" size="sm">
                  Check Status
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Webhook Test */}
        <Card>
          <CardHeader>
            <CardTitle>Test Webhook Handler</CardTitle>
            <CardDescription>
              Simulate a webhook callback from FFmpeg API. Make sure you have a workflow run with
              the task_id in execution_metadata.ffmpeg_tasks first.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="webhookPayload">Webhook Payload (JSON)</Label>
              <Textarea
                id="webhookPayload"
                value={webhookPayload}
                onChange={(e) => setWebhookPayload(e.target.value)}
                placeholder={`{\n  "task_id": "your-task-id",\n  "status": "completed",\n  "output_url": "https://example.com/video.mp4"\n}`}
                rows={8}
                className="font-mono text-sm"
              />
            </div>
            <Button onClick={testWebhook} disabled={loading || !webhookPayload}>
              {loading ? "Sending..." : "Send Webhook"}
            </Button>
          </CardContent>
        </Card>

        {/* Error Display */}
        {error && (
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <p className="text-destructive font-semibold">Error:</p>
              <p className="text-sm text-muted-foreground">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Testing Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              <strong>1. Test Task Creation:</strong>
            </p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Enter a valid image URL (must be publicly accessible)</li>
              <li>Enter a valid audio URL (must be publicly accessible)</li>
              <li>Set duration in seconds</li>
              <li>Click "Create Task" - this will create a task via FFmpeg API</li>
              <li>Note the task_id returned</li>
            </ul>
            <p className="mt-4">
              <strong>2. Test Webhook Handler:</strong>
            </p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>First, create a workflow run that includes the task_id in execution_metadata</li>
              <li>Paste a JSON payload with task_id, status, and output_url</li>
              <li>Click "Send Webhook" to simulate the callback</li>
              <li>Check the workflow run in the database to verify it was updated</li>
            </ul>
            <p className="mt-4">
              <strong>3. Full Integration Test:</strong>
            </p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Run a Static Video Renderer workflow from the admin panel</li>
              <li>Check the workflow run execution_metadata for ffmpeg_tasks array</li>
              <li>Wait for webhook callbacks or manually trigger them using the webhook test above</li>
              <li>Verify output_files.videos array gets populated with video URLs</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
