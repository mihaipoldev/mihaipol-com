# FFmpeg API Client Testing Guide

## Overview
This guide explains how to test the FFmpeg API client implementation, including task creation, status polling, and webhook callbacks.

## Prerequisites

1. **Environment Variables** - Ensure these are set in your `.env.local`:
   ```bash
   FFMPEG_API_KEY=your-api-key-from-ffmpeg-api-com
   NEXT_PUBLIC_APP_URL=https://your-app.com  # or http://localhost:3000 for local dev
   FFMPEG_WEBHOOK_SECRET=optional-secret-for-webhook-security
   ```

2. **Public URLs** - For testing, you need publicly accessible image and audio URLs that FFmpeg API can download.

## Testing Methods

### Method 1: Admin Test Page (Recommended)

Navigate to `/admin/test-ffmpeg` in your admin panel.

#### Test Task Creation:
1. Enter a valid image URL (e.g., `https://example.com/image.jpg`)
2. Enter a valid audio URL (e.g., `https://example.com/audio.mp3`)
3. Set duration in seconds (e.g., `30`)
4. Click "Create Task"
5. Note the `task_id` returned
6. Optionally click "Check Status" to poll the task status

#### Test Webhook Handler:
1. First, create a workflow run (via Static Video Renderer workflow) that includes a `task_id` in `execution_metadata.ffmpeg_tasks`
2. Paste a JSON payload like:
   ```json
   {
     "task_id": "your-task-id-here",
     "status": "completed",
     "output_url": "https://example.com/video.mp4"
   }
   ```
3. Click "Send Webhook" to simulate the callback
4. Check the workflow run in the database to verify `output_files.videos` was updated

### Method 2: API Endpoints Directly

#### Create a Task:
```bash
curl -X POST http://localhost:3000/api/dev/ffmpeg/test-create-task \
  -H "Content-Type: application/json" \
  -d '{
    "imageUrl": "https://example.com/image.jpg",
    "audioUrl": "https://example.com/audio.mp3",
    "duration": 30
  }'
```

#### Check Task Status:
```bash
curl http://localhost:3000/api/dev/ffmpeg/test-status?taskId=YOUR_TASK_ID
```

#### Simulate Webhook:
```bash
curl -X POST http://localhost:3000/api/webhooks/ffmpeg \
  -H "Content-Type: application/json" \
  -d '{
    "task_id": "your-task-id",
    "status": "completed",
    "output_url": "https://example.com/video.mp4"
  }'
```

### Method 3: Full Integration Test

1. **Create a Workflow Run:**
   - Go to admin panel → Workflows
   - Run a Static Video Renderer workflow with valid inputs
   - Note the workflow run ID

2. **Check Execution Metadata:**
   - Query the `workflow_runs` table
   - Verify `execution_metadata.ffmpeg_tasks` contains an array of task IDs
   - Verify `output_files.videos` initially has `video_url: null` and `status: "pending"`

3. **Wait for Webhooks or Simulate:**
   - Either wait for real webhook callbacks from FFmpeg API
   - Or manually trigger webhooks using the test page/API

4. **Verify Completion:**
   - Check that `output_files.videos` array has `video_url` populated
   - Check that `status` changed from "pending" to "completed"
   - If all tasks complete, verify run status changed to "completed"

## Testing Scenarios

### Scenario 1: Successful Task Creation
- ✅ Task is created successfully
- ✅ Task ID is returned
- ✅ Task ID is stored in `execution_metadata.ffmpeg_tasks`
- ✅ Workflow run status is "running"

### Scenario 2: Webhook Success
- ✅ Webhook receives callback with `status: "completed"` and `output_url`
- ✅ Workflow run is found by task_id
- ✅ Video URL is added to `output_files.videos` array
- ✅ Video entry status changes to "completed"
- ✅ When all tasks complete, run status changes to "completed"

### Scenario 3: Webhook Failure
- ✅ Webhook receives callback with `status: "failed"` and `error`
- ✅ Error is stored in `execution_metadata.ffmpeg_errors`
- ✅ Video entry status changes to "failed"
- ✅ Workflow run remains in "running" state (other tasks may still be pending)

### Scenario 4: Multiple Tasks
- ✅ Multiple tasks are created for multiple tracks
- ✅ All task IDs are stored in `execution_metadata.ffmpeg_tasks`
- ✅ Each webhook callback updates the correct video entry
- ✅ Run status changes to "completed" only when ALL tasks finish

## Debugging Tips

1. **Check Logs:**
   - Look for `[FFmpeg Client]` logs in console
   - Look for `[FFmpeg Webhook]` logs in server logs
   - Look for `[Static Video Renderer]` logs in executor

2. **Database Queries:**
   ```sql
   -- Find runs with FFmpeg tasks
   SELECT id, status, execution_metadata, output_files
   FROM workflow_runs
   WHERE execution_metadata->>'ffmpeg_tasks' IS NOT NULL
   ORDER BY started_at DESC
   LIMIT 10;
   
   -- Find specific task
   SELECT id, status, execution_metadata, output_files
   FROM workflow_runs
   WHERE execution_metadata->'ffmpeg_tasks' @> '["your-task-id"]'::jsonb;
   ```

3. **Common Issues:**
   - **Task not found in webhook:** Check that task_id exists in `execution_metadata.ffmpeg_tasks` array
   - **Webhook not receiving callbacks:** Verify `NEXT_PUBLIC_APP_URL` is correct and publicly accessible
   - **Tasks not completing:** Check FFmpeg API dashboard for task status
   - **Video URLs not updating:** Verify webhook payload format matches expected structure

## Environment-Specific Notes

### Local Development
- Use `http://localhost:3000` for `NEXT_PUBLIC_APP_URL` (but webhooks won't work unless using ngrok/tunneling)
- Consider using ngrok or similar to expose localhost for webhook testing
- Or manually trigger webhooks using the test page

### Production
- Ensure `NEXT_PUBLIC_APP_URL` points to your production domain
- Verify webhook endpoint is publicly accessible: `https://your-domain.com/api/webhooks/ffmpeg`
- Check that FFmpeg API can reach your webhook URL

## Next Steps

After testing:
1. Monitor workflow runs in production
2. Set up alerts for failed tasks
3. Consider adding retry logic for failed webhooks
4. Add monitoring/metrics for task completion times
