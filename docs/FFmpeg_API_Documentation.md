# FFmpeg API - Complete Documentation

**Base URL:** `https://api.ffmpeg-api.com`

---

## Table of Contents

1. [Overview](#1-overview)
2. [Quick Start](#2-quick-start)
3. [Authentication](#3-authentication)
4. [File Management](#4-file-management)
5. [Processing](#5-processing)
6. [Code Examples](#6-code-examples)
7. [FFprobe Analysis](#7-ffprobe-analysis)
8. [API Reference](#8-api-reference)
9. [Advanced Usage](#9-advanced-usage)
10. [Migration Guide](#10-migration-guide)
11. [GB-Seconds Pricing](#11-gb-seconds-pricing)

---

## 1. Overview

### Transform Any Media File in Seconds

FFmpeg API turns complex video and audio processing into simple HTTP requests. Convert formats, resize videos, extract audio, add watermarks, create GIFs, and run any FFmpeg operation without managing servers, installing software, or learning complex command-line syntax.

### Key Features

- **Instant Processing** - Upload, process, download. Get results in seconds.
- **No Infrastructure** - Skip server setup, FFmpeg installation, and scaling headaches.
- **Developer-First** - RESTful API designed for modern applications and workflows.

### Quick Example: Convert GIF to MP4

```javascript
// 1. Get upload URL
const fileRes = await fetch('https://api.ffmpeg-api.com/file', {
  method: 'POST',
  headers: {
    'Authorization': 'Basic YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ file_name: 'input.gif' })
});
const { file, upload } = await fileRes.json();

// 2. Upload your GIF
await fetch(upload.url, {
  method: 'PUT',
  body: gifFile
});

// 3. Convert to MP4
const processRes = await fetch('https://api.ffmpeg-api.com/ffmpeg/process', {
  method: 'POST',
  headers: {
    'Authorization': 'Basic YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    task: {
      inputs: [{ file_path: file.file_path }],
      outputs: [{ file: 'output.mp4' }]
    }
  })
});

const result = await processRes.json();
// Download your MP4 from result[0].download_url
```

### How It Works

1. **Upload Files** - Get secure upload URLs for your media files
2. **Process** - Send processing tasks with FFmpeg options
3. **Download** - Get download URLs for processed files
4. **Integrate** - Build powerful media features in your app

### What You Can Build

**Video Processing:**
- Convert between formats (MP4, WebM, AVI, MOV)
- Resize and crop videos
- Add watermarks and overlays
- Create thumbnails and previews
- Adjust bitrate and quality

**Audio Processing:**
- Extract audio from videos
- Convert audio formats (MP3, WAV, AAC)
- Normalize audio levels
- Trim and split audio files
- Mix multiple audio tracks

### Core Endpoints Overview

- `POST /file` - Get secure upload URL for your files
- `POST /ffmpeg/process` - Process files with FFmpeg commands
- `POST /ffmpeg/process/async` - Submit long-running tasks for background processing
- `POST /directory` - Create workspace for organizing files (optional)

> **Authentication Required**: All endpoints use Basic Auth with your API key.

---

## 2. Quick Start

### Get Started in 5 Minutes

Transform your first video file with FFmpeg API. This guide walks through the complete workflow: upload → process → download.

### Complete JavaScript Example

```javascript
import fs from 'fs'

const API_BASE = 'https://api.ffmpeg-api.com'
const API_KEY = 'Basic YOUR_API_KEY_HERE' // Get from dashboard

async function convertGifToMp4(gifPath) {
  try {
    // Step 1: Get upload URL
    const fileRes = await fetch(`${API_BASE}/file`, {
      method: 'POST',
      headers: {
        'Authorization': API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        file_name: 'input.gif'
      })
    })
    
    const fileData = await fileRes.json()
    console.log('✅ Got upload URL')
    
    // Step 2: Upload the GIF
    const gifBuffer = fs.readFileSync(gifPath)
    await fetch(fileData.upload.url, {
      method: 'PUT',
      body: gifBuffer,
      headers: {
        'Content-Type': 'image/gif'
      }
    })
    console.log('✅ File uploaded')
    
    // Optional: Verify uploaded file info (type, size)
    const infoRes = await fetch(`${API_BASE}/file/${fileData.file.file_path}`, {
      headers: { 'Authorization': API_KEY },
    })
    const info = await infoRes.json()
    console.log('ℹ️ File info:', info.file_info)
    
    // Step 3: Process with FFmpeg
    const processRes = await fetch(`${API_BASE}/ffmpeg/process`, {
      method: 'POST',
      headers: {
        'Authorization': API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        task: {
          inputs: [{
            file_path: fileData.file.file_path
          }],
          outputs: [{
            file: 'output.mp4',
            options: ['-crf', '23'] // Good quality
          }]
        }
      })
    })
    
    const result = await processRes.json()
    console.log('✅ Processing complete')
    console.log(`📊 Usage: ${result.usage.gb_sec} GB-seconds`)
    
    // Step 4: Download the result
    const downloadUrl = result.result[0].download_url
    const mp4Response = await fetch(downloadUrl)
    const mp4Buffer = Buffer.from(await mp4Response.arrayBuffer())
    
    fs.writeFileSync('output.mp4', mp4Buffer)
    console.log('✅ MP4 saved to output.mp4')
    
    return {
      downloadUrl,
      usage: result.usage,
      fileSize: result.result[0].size_bytes
    }
  } catch (error) {
    console.error('❌ Error:', error.message)
    throw error
  }
}

// Usage
convertGifToMp4('./my-animation.gif')
  .then(result => console.log('🎉 Conversion complete!', result))
  .catch(err => console.error('Failed:', err))
```

### Complete Python Example

```python
import requests
import os

API_BASE = 'https://api.ffmpeg-api.com'
API_KEY = 'Basic YOUR_API_KEY_HERE'  # Get from dashboard

def convert_gif_to_mp4(gif_path):
    """Convert a GIF file to MP4 using FFmpeg API"""
    
    headers = {
        'Authorization': API_KEY,
        'Content-Type': 'application/json'
    }
    
    try:
        # Step 1: Get upload URL
        file_response = requests.post(f'{API_BASE}/file',
            headers=headers,
            json={'file_name': 'input.gif'}
        )
        file_response.raise_for_status()
        file_data = file_response.json()
        print('✅ Got upload URL')
        
        # Step 2: Upload the GIF
        with open(gif_path, 'rb') as gif_file:
            upload_response = requests.put(
                file_data['upload']['url'],
                data=gif_file,
                headers={'Content-Type': 'image/gif'}
            )
            upload_response.raise_for_status()
        print('✅ File uploaded')
        
        # Step 3: Process with FFmpeg
        process_response = requests.post(f'{API_BASE}/ffmpeg/process',
            headers=headers,
            json={
                'task': {
                    'inputs': [{
                        'file_path': file_data['file']['file_path']
                    }],
                    'outputs': [{
                        'file': 'output.mp4',
                        'options': ['-crf', '23']  # Good quality
                    }]
                }
            }
        )
        process_response.raise_for_status()
        result = process_response.json()
        print('✅ Processing complete')
        print(f'📊 Usage: {result["usage"]["gb_sec"]} GB-seconds')
        
        # Step 4: Download the result
        download_url = result['result'][0]['download_url']
        mp4_response = requests.get(download_url)
        mp4_response.raise_for_status()
        
        with open('output.mp4', 'wb') as output_file:
            output_file.write(mp4_response.content)
        print('✅ MP4 saved to output.mp4')
        
        return {
            'download_url': download_url,
            'usage': result['usage'],
            'file_size': result['result'][0]['size_bytes']
        }
    
    except requests.exceptions.RequestException as e:
        print(f'❌ Error: {e}')
        raise
```

### Step-by-Step cURL Commands

#### 1. Get Upload URL

```bash
curl -sS -X POST https://api.ffmpeg-api.com/file \
  -H 'Authorization: Basic YOUR_API_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"file_name":"input.gif"}'
```

**Response:**
```json
{
  "ok": true,
  "file": {
    "file_path": "dir_abc123/input.gif",
    "file_name": "input.gif"
  },
  "upload": {
    "url": "https://storage.url/abc123...",
    "method": "PUT"
  }
}
```

#### 2. Upload Your GIF

```bash
curl -X PUT "$UPLOAD_URL" \
  --data-binary @./input.gif \
  -H "Content-Type: image/gif"
```

#### 3. Process with FFmpeg

```bash
curl -sS -X POST https://api.ffmpeg-api.com/ffmpeg/process \
  -H 'Authorization: Basic YOUR_API_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"task":{"inputs":[{"file_path":"dir_abc123/input.gif"}],"outputs":[{"file":"output.mp4","options":["-crf","23"]}]}}'
```

#### 4. Download Result

```bash
curl -o output.mp4 "$DOWNLOAD_URL"
```

### Understanding the Response

**Response Breakdown:**
- `result[0].download_url` → Direct link to your processed file
- `result[0].size_bytes` → Output file size in bytes
- `usage.gb_sec` → Billing units consumed (see pricing)
- `usage.time_sec` → Processing time in seconds

### Common Variations

#### Resize Video

```json
{
  "task": {
    "outputs": [{
      "file": "resized.mp4",
      "options": ["-vf", "scale=1280:720", "-crf", "23"]
    }]
  }
}
```

#### Extract Audio

```json
{
  "task": {
    "outputs": [{
      "file": "audio.mp3",
      "options": ["-vn", "-acodec", "mp3"]
    }]
  }
}
```

#### Trim Video

```json
{
  "task": {
    "inputs": [{
      "file_path": "your-file-path",
      "options": ["-ss", "30", "-t", "60"]
    }]
  }
}
```

### Troubleshooting

**"Invalid API key" (401 error)**
- Check that your API key starts with "Basic " (note the space)
- Copy exactly from the Dashboard
- Ensure it's in the Authorization header, not the body

**"File not found" during processing**
- Use the exact `file_path` from the upload response
- Verify successful upload to the `upload.url` first
- Don't modify the file path string

**Upload fails with 403 error**
- Upload URLs expire after ~5 minutes
- Get a fresh upload URL from `/file`
- Upload immediately after getting the URL

---

## 3. Authentication

### Basic Authentication

FFmpeg API uses **Basic Authentication** for secure API access. Every request requires an `Authorization` header with your unique API key.

### Get Your API Key

Your header value is a pre-formatted string that looks like this:

```
Basic dGVzdF91c2VyX2tleV9hYmNkZWZnaGlqa2xtbm9w
```

> **Note:** Your dashboard displays the complete `Authorization` header value. Just copy and paste it into your code.

### How to Use Your API Key

**JavaScript:**
```javascript
const headers = {
  'Authorization': 'Basic YOUR_API_KEY_HERE',
  'Content-Type': 'application/json'
}

const response = await fetch('https://api.ffmpeg-api.com/file', {
  method: 'POST',
  headers,
  body: JSON.stringify({ file_name: 'video.mp4' })
})
```

**Python:**
```python
import requests

headers = {
    'Authorization': 'Basic YOUR_API_KEY_HERE',
    'Content-Type': 'application/json'
}

response = requests.post('https://api.ffmpeg-api.com/file',
    headers=headers,
    json={'file_name': 'video.mp4'}
)
```

**cURL:**
```bash
curl -X POST https://api.ffmpeg-api.com/file \
  -H 'Authorization: Basic YOUR_API_KEY_HERE' \
  -H 'Content-Type: application/json' \
  -d '{"file_name":"video.mp4"}'
```

### Security Best Practices

**❌ Don't Do This:**
- Expose API keys in client-side JavaScript
- Commit API keys to version control
- Share API keys in public forums or docs
- Use API keys in URLs or GET parameters
- Store keys in plain text files

**✅ Best Practices:**
- Use environment variables
- Make API calls from your backend/server
- Regularly rotate your API keys
- Monitor usage in your dashboard
- Use HTTPS for all API requests

> **Critical:** Your API key grants full access to your account. Treat it like a password and never expose it in client-side code.

### Environment Variables

**JavaScript (.env file):**
```bash
FFMPEG_API_KEY=Basic dGVzdF91c2VyX2tleV9hYmNkZWZnaGlqa2xtbm9w
```

**In your code:**
```javascript
const API_KEY = process.env.FFMPEG_API_KEY
```

**Python (.env file):**
```bash
FFMPEG_API_KEY=Basic dGVzdF91c2VyX2tleV9hYmNkZWZnaGlqa2xtbm9w
```

**In your code:**
```python
import os
API_KEY = os.environ['FFMPEG_API_KEY']
```

### Troubleshooting Authentication

**Error 401: "Invalid API key"**

Check:
- Format must start with "Basic " (note the space)
- Copy the entire string from your dashboard
- No extra spaces or line breaks
- Header name is "Authorization", not "Auth" or "Bearer"

**Error 403: "Quota exceeded"**

Solutions:
- Check your current usage in the Dashboard
- Wait for your quota to reset (monthly cycle)
- Upgrade your plan for higher limits
- Optimize your usage patterns

**Error 400: "Missing Authorization header"**

Ensure:
- Header is named exactly "Authorization"
- Header is included in your request headers object
- Not accidentally putting it in the request body
- Using the correct HTTP client method for headers

---

## 4. File Management

### Why Directories Matter for FFmpeg

FFmpeg's true power lies in its ability to work with file patterns and multiple inputs. Many advanced operations require directories:

- **Image Sequences** - Create videos from frame001.jpg, frame002.jpg, etc.
- **Batch Processing** - Apply same transformations to multiple files
- **Complex Workflows** - Mix audio tracks, overlay multiple videos

> **Key insight:** For single-file operations, directories are optional. For multi-file operations (sequences, batches, complex workflows), directories are essential.

### Choose Your Workflow

#### Multi-File Processing

For image sequences, batch operations, and complex workflows:

1. Create directory explicitly
2. Upload all related files
3. Use patterns like `*.jpg` or `frame%03d.png`
4. Process collections with FFmpeg patterns

**Examples:** Video from 100 images, slideshow creation, audio mixing

#### Single-File Processing

For simple conversions and one-file operations:

1. Register file (auto-creates directory)
2. Upload single file
3. Process immediately

**Examples:** MP4 to GIF, resize video, extract audio

### Step 1: Create a Directory

```javascript
const response = await fetch("https://api.ffmpeg-api.com/directory", {
  method: "POST",
  headers: {
    Authorization: "Basic YOUR_API_KEY",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({}),
})

const { directory } = await response.json()
console.log(`Created directory: ${directory.id}`)
// Output: Created directory: dir_abc123
```

**Response:**
```json
{
  "ok": true,
  "directory": {
    "id": "dir_abc123",
    "ttl": 86400
  }
}
```

> **TTL (Time To Live):** Directories auto-delete after 24 hours (86400 seconds) by default. All files inside are cleaned up automatically.

### Step 2: Register Files & Get Upload URLs

**With a specific directory:**

```javascript
const fileResponse = await fetch("https://api.ffmpeg-api.com/file", {
  method: "POST",
  headers: {
    Authorization: "Basic YOUR_API_KEY",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    file_name: "video.mp4",
    dir_id: "dir_abc123", // Use your directory ID
  }),
})
```

**Without a directory (auto-create):**

```javascript
const fileResponse = await fetch("https://api.ffmpeg-api.com/file", {
  method: "POST",
  headers: {
    Authorization: "Basic YOUR_API_KEY",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    file_name: "video.mp4",
    // dir_id omitted - creates temporary directory
  }),
})
```

**Response breakdown:**

```json
{
  "ok": true,
  "file": {
    "dir_id": "dir_abc123",
    "file_path": "dir_abc123/video.mp4",
    "file_name": "video.mp4",
    "added_on": "2024-01-01T00:00:00Z"
  },
  "upload": {
    "url": "https://presigned-upload-url...",
    "method": "PUT",
    "expiresInSeconds": 300,
    "headers": {
      "Content-Type": "video/mp4"
    }
  }
}
```

**Response Fields:**
- `file.file_path` → Use this in processing requests
- `upload.url` → Upload your file bytes to this URL
- `upload.headers` → Use these exact headers when uploading (if present)
- `upload.expiresInSeconds` → Upload URL expires in ~5 minutes

### Step 3: Upload Your Files

```javascript
// For Node.js with file system
const fs = require("fs")
const fileBuffer = fs.readFileSync("./video.mp4")

// Use the headers from the /file response (if provided)
const uploadHeaders = uploadData.headers || {}

await fetch(uploadUrl, {
  method: "PUT",
  body: fileBuffer,
  headers: uploadHeaders,
})
console.log("✅ Upload complete!")

// For browser with File input
const fileInput = document.getElementById("fileInput")
const file = fileInput.files[0]

await fetch(uploadUrl, {
  method: "PUT",
  body: file,
  headers: uploadData.headers || {},
})
```

**Python:**
```python
import requests

# Use the headers from the /file response (if provided)
upload_headers = upload_data.get('headers', {})

# Upload file
with open('video.mp4', 'rb') as file:
    response = requests.put(upload_url,
        data=file,
        headers=upload_headers
    )
    response.raise_for_status()
    print('✅ Upload complete!')
```

> **Important:** If the `/file` response includes a `headers` property, use only those headers when uploading. Do not add any additional headers beyond what's provided.

### Managing Your Files

#### List All Directories

```javascript
const response = await fetch("https://api.ffmpeg-api.com/directory", {
  headers: { Authorization: "Basic YOUR_API_KEY" },
})

const { directories } = await response.json()
console.log("Your directories:", directories)
```

**Response:**
```json
{
  "ok": true,
  "directories": [
    {
      "id": "dir_abc123",
      "ttl": 86400,
      "added_on": "2024-01-01T10:30:00Z"
    }
  ]
}
```

#### List Files in a Directory

```javascript
const response = await fetch(
  "https://api.ffmpeg-api.com/directory/dir_abc123",
  {
    headers: { Authorization: "Basic YOUR_API_KEY" },
  }
)

const { files } = await response.json()
console.log("Files in directory:", files)
```

**Response:**
```json
{
  "ok": true,
  "files": [
    {
      "file_name": "video.mp4",
      "added_on": "2024-01-01T10:35:00Z"
    },
    {
      "file_name": "audio.wav",
      "added_on": "2024-01-01T10:40:00Z"
    }
  ]
}
```

#### Get File Info (type, size)

```javascript
const response = await fetch(
  `https://api.ffmpeg-api.com/file/dir_abc123/video.mp4`,
  { headers: { Authorization: 'Basic YOUR_API_KEY' } }
)
const { file_info } = await response.json()
console.log(file_info.file_type, file_info.file_size)
```

### Pro Tips & Best Practices

**Directory Organization:**
- One directory per project - Keep related files together
- Descriptive file names - Use clear, consistent naming
- Group by workflow - Inputs and outputs in same directory
- Clean as you go - Let TTL handle automatic cleanup

**Performance Tips:**
- Upload immediately - Don't delay after getting URL
- Reuse files - Same file, multiple processing tasks
- Batch uploads - Register multiple files at once
- Upload relevant files only - Only media files you'll process
- Check file sizes - Max 5GB per file (plan dependent)

### Multi-File FFmpeg Examples

#### Image Sequence to Video

Create smooth video from numbered image files:

**FFmpeg pattern:**
```bash
ffmpeg -i frame%03d.jpg -c:v libx264 -pix_fmt yuv420p output.mp4
```

**Setup with FFmpeg API:**
1. Create directory and upload: `frame001.jpg`, `frame002.jpg`, `frame003.jpg`…
2. Process with input pattern: `{"task":{"inputs": [{"file_path": "dir_123/frame%03d.jpg"}]}}`

> Support for glob/image-sequence patterns like `frame%03d.png` is coming soon.

#### Batch Audio Processing

Apply the same transformation to multiple audio files:

```bash
# Process all WAV files in a directory
for file in *.wav; do
  ffmpeg -i "$file" -c:a libmp3lame "processed_$file.mp3"
done
```

**Setup with FFmpeg API:**
1. Upload multiple WAV files to same directory
2. Use wildcard processing: `{"task":{"inputs": [{"file_path": "dir_123/*.wav"}]}}`

#### Multi-Track Audio Mixing

Combine multiple audio sources:

```bash
# Mix background music with narration
ffmpeg -i music.mp3 -i narration.wav -filter_complex amix=inputs=2 final.mp3
```

**Setup with FFmpeg API:**
1. Upload all audio files to same directory
2. Reference multiple inputs:
```json
{
  "task": {
    "inputs": [
      {"file_path": "dir_123/music.mp3"}, 
      {"file_path": "dir_123/narration.wav"}
    ]
  }
}
```

### File Upload Troubleshooting

**Upload fails with 403 Forbidden**

Solutions:
- Upload URL has expired (5-minute limit)
- Get a fresh upload URL by calling `/file` again
- Upload immediately after getting the URL
- Don't store upload URLs for later use
- Implement retry logic with new URL generation

**"File name already exists" error**

Options:
- Use different file names (add timestamps, versions, etc.)
- Create separate directories for different versions
- Check existing files with `GET /directory/{id}`
- Use descriptive naming patterns: `project-v1-final.mp4`

**Large file upload times out**

For large files, optimize your approach (max file size: 5GB depending on plan):
- Compress files before uploading when possible
- Use appropriate HTTP client timeout settings
- Consider breaking large operations into smaller parts
- Monitor network stability during uploads
- Check your plan's file size limits in the dashboard

---

## 5. Processing

### Media Processing

Transform your uploaded files using the full power of FFmpeg through simple HTTP requests. Whether you're converting formats, resizing videos, extracting audio, or creating complex multi-media workflows.

### The Processing Request

All processing happens through `POST /ffmpeg/process` with a JSON task definition:

```javascript
const response = await fetch('https://api.ffmpeg-api.com/ffmpeg/process', {
  method: 'POST',
  headers: {
    'Authorization': 'Basic YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    task: {
      inputs: [{ file_path: 'dir_123/input.mp4' }],
      outputs: [{ file: 'output.mp4' }]
    }
  })
})

const result = await response.json()
```

### Task Structure Overview

**Required Fields:**
- `inputs[]` - Array of input files with their `file_path`
- `outputs[]` - Array of output specifications with `file` names

**Optional Fields:**
- `inputs[].options[]` - FFmpeg options applied before input
- `outputs[].options[]` - FFmpeg options for output
- `outputs[].maps[]` - Stream mapping for complex workflows
- `filter_complex` - Advanced filter graphs for multi-input processing

> **Important Constraints:** All input files must be in the same directory. Output filenames cannot conflict with existing input filenames.

### Understanding the Response

```json
{
  "ok": true,
  "result": [
    {
      "file_name": "output.mp4",
      "size_bytes": 1234567,
      "download_url": "https://storage.example.com/result.mp4"
    }
  ],
  "usage": {
    "time_sec": 12.5,
    "input_size_gb": 0.098,
    "output_size_gb": 0.015,
    "gb_sec": 1.4125
  }
}
```

**Result Files:**
- `file_name` → Output filename
- `size_bytes` → File size in bytes
- `download_url` → Direct download link

**Usage Stats:**
- `time_sec` → Processing time
- `gb_sec` → Billing units consumed
- `input_size_gb` → Input file sizes
- `output_size_gb` → Output file sizes

### Level 1: Basic Operations

#### Format Conversion

Convert a GIF to MP4:

```json
{
  "inputs": [
    { "file_path": "dir_123/animation.gif" }
  ],
  "outputs": [
    { "file": "animation.mp4" }
  ]
}
```

#### Quality Control

Compress a video with specific quality settings:

```json
{
  "inputs": [
    { "file_path": "dir_123/large-video.mp4" }
  ],
  "outputs": [
    {
      "file": "compressed.mp4",
      "options": ["-crf", "28", "-preset", "medium"]
    }
  ]
}
```

#### Extract Audio

Pull audio track from a video:

```json
{
  "inputs": [
    { "file_path": "dir_123/movie.mp4" }
  ],
  "outputs": [
    {
      "file": "soundtrack.mp3",
      "options": ["-vn", "-acodec", "mp3", "-ab", "192k"]
    }
  ]
}
```

**Quick Reference: Common Output Options**

**Video Quality:**
- `-crf 18` → High quality
- `-crf 23` → Good quality (default)
- `-crf 28` → Compressed

**Audio Extraction:**
- `-vn` → No video
- `-acodec mp3` → MP3 format
- `-ab 192k` → Audio bitrate

### Level 2: Intermediate Processing

#### Resize and Crop Videos

Resize to specific dimensions:

```json
{
  "inputs": [
    { "file_path": "dir_123/fullhd-video.mp4" }
  ],
  "outputs": [
    {
      "file": "mobile-video.mp4",
      "options": [
        "-vf", "scale=640:360",
        "-crf", "25"
      ]
    }
  ]
}
```

#### Trim Video Segments

Extract a 30-second clip starting at 1 minute:

```json
{
  "inputs": [
    {
      "file_path": "dir_123/long-video.mp4",
      "options": ["-ss", "60", "-t", "30"]
    }
  ],
  "outputs": [
    {
      "file": "highlight.mp4",
      "options": ["-c:v", "libx264", "-crf", "23"]
    }
  ]
}
```

#### Multiple Output Files

Generate different versions from one input:

```json
{
  "inputs": [
    { "file_path": "dir_123/source.mp4" }
  ],
  "outputs": [
    {
      "file": "web-version.mp4",
      "options": ["-vf", "scale=1280:720", "-crf", "25"]
    },
    {
      "file": "mobile-version.mp4",
      "options": ["-vf", "scale=640:360", "-crf", "28"]
    },
    {
      "file": "audio-only.mp3",
      "options": ["-vn", "-acodec", "mp3"]
    }
  ]
}
```

### Level 3: Advanced Workflows

#### Multi-Input Processing

Combine separate video and audio:

```json
{
  "inputs": [
    { "file_path": "dir_123/video.mp4" },
    { "file_path": "dir_123/audio.wav" }
  ],
  "outputs": [
    {
      "file": "final.mp4",
      "options": ["-c:v", "copy", "-c:a", "aac"]
    }
  ]
}
```

#### Side-by-Side Video Comparison

Create split-screen view of two videos:

```json
{
  "inputs": [
    { "file_path": "dir_123/before.mp4" },
    { "file_path": "dir_123/after.mp4" }
  ],
  "filter_complex": "[0:v]scale=640:360[left];[1:v]scale=640:360[right];[left][right]hstack[out]",
  "outputs": [
    {
      "file": "comparison.mp4",
      "options": ["-c:v", "libx264", "-crf", "23"],
      "maps": ["[out]"]
    }
  ]
}
```

#### Picture-in-Picture Overlay

Overlay a small video on top of a larger one:

```json
{
  "inputs": [
    { "file_path": "dir_123/main-video.mp4" },
    { "file_path": "dir_123/overlay.mp4" }
  ],
  "filter_complex": "[1:v]scale=320:180[overlay];[0:v][overlay]overlay=W-w-10:H-h-10[out]",
  "outputs": [
    {
      "file": "picture-in-picture.mp4",
      "options": ["-c:v", "libx264", "-crf", "23"],
      "maps": ["[out]", "0:a"]
    }
  ]
}
```

#### Watermark Application

Add a logo watermark to a video:

```json
{
  "inputs": [
    { "file_path": "dir_123/video.mp4" },
    { "file_path": "dir_123/logo.png" }
  ],
  "filter_complex": "[0:v][1:v]overlay=W-w-10:10[out]",
  "outputs": [
    {
      "file": "branded-video.mp4",
      "options": ["-c:v", "libx264", "-crf", "23"],
      "maps": ["[out]", "0:a"]
    }
  ]
}
```

### Understanding Filter Complex

For advanced operations, `filter_complex` lets you create sophisticated processing pipelines:

```
[0:v]scale=640:360[scaled];
 │     │            │
Input Filter    Output Label
```

**Input References:**
- `[0:v]` → Video from first input
- `[1:a]` → Audio from second input
- `[2:v:0]` → First video track from third input

**Common Filters:**
- `scale=W:H` → Resize video
- `hstack` → Side-by-side layout
- `overlay=X:Y` → Position overlay

### Error Handling & Troubleshooting

**Error 400: "Invalid task format"**

Check your task structure:
- Ensure `inputs` and `outputs` are arrays
- Verify all `file_path` values are strings
- Options arrays should contain strings only
- Output filenames must not conflict with inputs

**Error 500: "FFmpeg processing failed"**

FFmpeg couldn't process your command. Common causes:
- Invalid FFmpeg options or syntax
- Incompatible input/output formats
- Complex filter syntax errors
- Insufficient processing resources for large files

**Error 403: "File size exceeds plan limit"**

One or more files exceed your plan's maximum file size:
- Free & Starter plans: 500 MB per file
- Pro plan: 1 GB per file
- Growth plan: 5 GB per file
- Consider compressing large files or upgrading your plan

**Error 404: "File not found"**

Referenced files don't exist:
- Verify `file_path` matches upload response exactly
- Ensure all files are in the same directory
- Check that files were successfully uploaded
- List directory contents to confirm file presence

---

## 6. Code Examples

### Production-Ready Implementations

Complete, tested implementations you can copy into your projects.

### Basic Upload and Process Functions

```javascript
import fs from "fs"
import fetch from "node-fetch"

// Upload a file to FFmpeg API
async function uploadFile(apiKey, filePath) {
  const response = await fetch("https://api.ffmpeg-api.com/file", {
    method: "POST",
    headers: {
      Authorization: apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      file_name: filePath.split("/").pop(),
    }),
  })

  const { file, upload } = await response.json()

  // Upload file bytes
  const fileBuffer = fs.readFileSync(filePath)
  await fetch(upload.url, {
    method: "PUT",
    body: fileBuffer,
  })

  return file.file_path
}

// Process video with FFmpeg
async function processVideo(
  apiKey,
  inputFilePath,
  outputFileName,
  options = ["-crf", "23"]
) {
  const response = await fetch("https://api.ffmpeg-api.com/ffmpeg/process", {
    method: "POST",
    headers: {
      Authorization: apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      task: {
        inputs: [{ file_path: inputFilePath }],
        outputs: [{ file: outputFileName, options }],
      },
    }),
  })

  const result = await response.json()

  if (!result.ok) {
    throw new Error(result.error)
  }

  return result
}

// Download processed file
async function downloadFile(downloadUrl, outputPath) {
  const response = await fetch(downloadUrl)
  const buffer = Buffer.from(await response.arrayBuffer())
  fs.writeFileSync(outputPath, buffer)
}

// Get stored file info (type and size)
async function getFileInfo(apiKey, dirId, fileName) {
  const response = await fetch(
    `https://api.ffmpeg-api.com/file/${dirId}/${fileName}`,
    {
      headers: { Authorization: apiKey },
    }
  )
  const data = await response.json()
  if (!data.ok) throw new Error(data.error)
  return data.file_info // { file_path, file_type, file_size }
}

// Complete conversion workflow
async function convertVideo(
  apiKey,
  inputPath,
  outputPath,
  options = ["-crf", "23"]
) {
  try {
    // 1. Upload
    const filePath = await uploadFile(apiKey, inputPath)

    // 2. Process
    const result = await processVideo(
      apiKey,
      filePath,
      outputPath.split("/").pop(),
      options
    )

    // 3. Download
    await downloadFile(result.result[0].download_url, outputPath)

    console.log(`✅ Converted ${inputPath} → ${outputPath}`)
    console.log(`📊 Usage: ${result.usage.gb_sec} GB-seconds`)

    return result
  } catch (error) {
    console.error("❌ Conversion failed:", error.message)
    throw error
  }
}

// Usage examples
const apiKey = process.env.FFMPEG_API_KEY

// Convert GIF to MP4
await convertVideo(apiKey, "./animation.gif", "./output.mp4")

// Compress video
await convertVideo(apiKey, "./large.mp4", "./compressed.mp4", ["-crf", "28"])

// Extract audio
await convertVideo(apiKey, "./video.mp4", "./audio.mp3", [
  "-vn",
  "-acodec",
  "mp3",
])
```

### Python Implementation

```python
import os
import requests
from pathlib import Path

def upload_file(api_key, file_path):
    """Upload a file to FFmpeg API"""
    response = requests.post('https://api.ffmpeg-api.com/file',
        json={'file_name': Path(file_path).name},
        headers={'Authorization': api_key, 'Content-Type': 'application/json'})
    response.raise_for_status()
    
    file_data = response.json()
    
    # Upload file bytes
    with open(file_path, 'rb') as f:
        upload_response = requests.put(file_data['upload']['url'], data=f)
        upload_response.raise_for_status()
    
    return file_data['file']['file_path']

def process_video(api_key, input_file_path, output_file_name, options=['-crf', '23']):
    """Process video with FFmpeg"""
    task = {
        'task': {
            'inputs': [{'file_path': input_file_path}],
            'outputs': [{'file': output_file_name, 'options': options}]
        }
    }
    
    response = requests.post('https://api.ffmpeg-api.com/ffmpeg/process',
        json=task,
        headers={'Authorization': api_key, 'Content-Type': 'application/json'})
    response.raise_for_status()
    
    result = response.json()
    
    if not result.get('ok'):
        raise Exception(result.get('error', 'Processing failed'))
    
    return result

def download_file(download_url, output_path):
    """Download processed file"""
    response = requests.get(download_url)
    response.raise_for_status()
    
    with open(output_path, 'wb') as f:
        f.write(response.content)

def convert_video(api_key, input_path, output_path, options=['-crf', '23']):
    """Complete conversion workflow"""
    try:
        # 1. Upload
        file_path = upload_file(api_key, input_path)
        
        # 2. Process
        result = process_video(api_key, file_path, Path(output_path).name, options)
        
        # 3. Download
        download_file(result['result'][0]['download_url'], output_path)
        
        print(f"✅ Converted {input_path} → {output_path}")
        print(f"📊 Usage: {result['usage']['gb_sec']} GB-seconds")
        
        return result
    except Exception as e:
        print(f"❌ Conversion failed: {e}")
        raise

# Usage examples
api_key = os.environ['FFMPEG_API_KEY']

# Convert GIF to MP4
convert_video(api_key, './animation.gif', './output.mp4')

# Compress video
convert_video(api_key, './large.mp4', './compressed.mp4', ['-crf', '28'])

# Extract audio
convert_video(api_key, './video.mp4', './audio.mp3', ['-vn', '-acodec', 'mp3'])
```

### Subtitles and Watermarks

#### Burned-in Subtitles

```javascript
const apiKey = process.env.FFMPEG_API_KEY

// Assume both files were uploaded and you have their file_paths
const videoPath = "dir_123/video.mp4"
const subsPath = "dir_123/subs.srt"

const response = await fetch("https://api.ffmpeg-api.com/ffmpeg/process", {
  method: "POST",
  headers: {
    Authorization: apiKey,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    task: {
      inputs: [{ file_path: videoPath }, { file_path: subsPath }],
      outputs: [
        {
          file: "output-subs.mp4",
          options: ["-vf", "subtitles=@{subs.srt}", "-c:a", "copy"],
        },
      ],
    },
  }),
})

const result = await response.json()
```

#### Image Watermark

```javascript
const videoPath = "dir_123/video.mp4"
const logoPath = "dir_123/logo.png"

const response = await fetch("https://api.ffmpeg-api.com/ffmpeg/process", {
  method: "POST",
  headers: {
    Authorization: apiKey,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    task: {
      inputs: [{ file_path: videoPath }, { file_path: logoPath }],
      filter_complex: "[0:v][1:v]overlay=W-w-20:H-h-20[out]",
      outputs: [
        {
          file: "branded.mp4",
          options: ["-c:v", "libx264", "-crf", "23"],
          maps: ["[out]", "0:a"],
        },
      ],
    },
  }),
})
```

> **Note:** Placeholders like `@{file.ext}` resolve only for files included in `task.inputs[]`.

### Batch Processing

```javascript
import fs from 'fs/promises'
import path from 'path'

// Process multiple files in directory with batching
async function processDirectory(apiKey, inputDir, outputDir, options = {}) {
  const files = await fs.readdir(inputDir)
  const videoFiles = files.filter(f => /\.(mp4|mov|avi|gif)$/i.test(f))
  
  console.log(`📁 Processing ${videoFiles.length} files...`)
  
  // Process in batches of 3 to avoid rate limiting
  const batchSize = 3
  const results = []
  
  for (let i = 0; i < videoFiles.length; i += batchSize) {
    const batch = videoFiles.slice(i, i + batchSize)
    
    const batchPromises = batch.map(async (file) => {
      const inputPath = path.join(inputDir, file)
      const outputPath = path.join(outputDir, file.replace(/\.[^.]+$/, '.mp4'))
      
      try {
        return await convertVideo(apiKey, inputPath, outputPath,
          options.ffmpegOptions || ['-crf', '25'])
      } catch (error) {
        console.error(`Failed ${file}: ${error.message}`)
        return { error: error.message, file }
      }
    })
    
    const batchResults = await Promise.all(batchPromises)
    results.push(...batchResults)
    
    console.log(`✅ Batch ${Math.floor(i/batchSize) + 1} complete`)
  }
  
  return results
}

// Usage
const apiKey = process.env.FFMPEG_API_KEY
const results = await processDirectory(apiKey, './input', './output')
console.log(`✅ Processed ${results.length} files`)
```

### Social Media Automation

```javascript
// Generate social media variants automatically
async function createSocialVariants(apiKey, inputPath) {
  const formats = {
    instagram_square: ['-vf', 'scale=1080:1080:force_original_aspect_ratio=increase,crop=1080:1080'],
    instagram_story: ['-vf', 'scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920'],
    youtube_short: ['-vf', 'scale=1080:1920', '-t', '60'],
    twitter: ['-vf', 'scale=1280:720', '-b:v', '1M']
  }
  
  const results = {}
  for (const [platform, options] of Object.entries(formats)) {
    try {
      const outputPath = `${inputPath.split('.')[0]}_${platform}.mp4`
      results[platform] = await convertVideo(apiKey, inputPath, outputPath, options)
      console.log(`✅ Created ${platform} version`)
    } catch (error) {
      console.error(`❌ Failed ${platform}:`, error.message)
      results[platform] = { error: error.message }
    }
  }
  
  return results
}

// Usage
const results = await createSocialVariants(apiKey, './content.mp4')
console.log('Generated formats:', Object.keys(results))
```

### Retry Logic for Uploads

```javascript
async function uploadWithRetry(apiKey, filePath, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await uploadFile(apiKey, filePath)
    } catch (error) {
      if (error.message.includes("403") && attempt < maxRetries) {
        console.log(`Upload attempt ${attempt} failed, retrying...`)
        await new Promise((resolve) => setTimeout(resolve, 1000))
        continue
      }
      throw error
    }
  }
}
```

---

## 7. FFprobe Analysis

### Extract Media Metadata

Extract detailed technical metadata from your media files using FFprobe. Analyze format properties, stream details, and frame-level data.

### What is FFprobe?

FFprobe is a powerful media analysis tool that extracts technical information from audio and video files. Perfect for:

- **Quality Control** - Verify codecs, bitrates, and dimensions
- **Content Analysis** - Extract metadata for cataloging and search
- **Debugging** - Identify issues with media files
- **Automation** - Build workflows that depend on media properties

### Quick Start

#### Analyze with FFprobe

```bash
curl -X POST https://api.ffmpeg-api.com/ffprobe/analyze \
  -H "Authorization: Basic YOUR_API_KEY" \
  -d '{
    "file_path": "dir_abc123/video.mp4",
    "probe": {
      "format": ["duration", "size"],
      "streams": ["codec_name", "width", "height"]
    }
  }'
```

### API Reference

**Endpoint:** `POST /ffprobe/analyze`

#### Example Request

```json
{
  "file_path": "dir_id/filename.ext",
  "probe": {
    "format": ["duration", "size", "bit_rate"],
    "streams": ["codec_name", "width", "height"],
    "select_streams": "v:0"
  }
}
```

#### Example Response

```json
{
  "ok": true,
  "result": {
    "format": {
      "duration": "120.5",
      "size": "15728640",
      "bit_rate": "1048576"
    },
    "streams": [
      {
        "codec_name": "h264",
        "width": 1920,
        "height": 1080
      }
    ]
  },
  "usage": {
    "time_sec": 2.1,
    "input_size_gb": 0.015,
    "output_size_gb": 0.0001,
    "gb_sec": 0.0315
  }
}
```

### Probe Options

The `probe` object controls what information FFprobe extracts. All fields are optional.

#### Section Arrays

| Section | Description | Common Fields |
|---------|-------------|---------------|
| `format[]` | File format information | `duration`, `size`, `bit_rate`, `format_name` |
| `streams[]` | Stream properties | `codec_name`, `width`, `height`, `sample_rate` |
| `chapters[]` | Chapter information | `id`, `start_time`, `end_time`, `title` |
| `programs[]` | Program data (MPEG-TS) | `program_id`, `nb_streams`, `streams` |
| `frames[]` | Frame-level data | `pkt_pts_time`, `key_frame`, `pict_type` |
| `packets[]` | Packet-level data | `pts_time`, `dts_time`, `size`, `flags` |

#### Control Options

| Option | Type | Description | Example |
|--------|------|-------------|---------|
| `select_streams` | String | Select specific streams | `"v:0"`, `"a"`, `"s:1"` |
| `read_intervals` | String | Limit analysis to time/frame ranges | `"0%+10"`, `"#500"` |
| `count_frames` | Boolean | Count frames without dumping data | `true` |
| `analyzeduration` | String | Analysis time limit | `"10s"` |
| `probesize` | String | Probe size limit | `"10M"` |

### Common Use Cases

#### Basic File Information

```json
{
  "file_path": "dir_123/video.mp4",
  "probe": {
    "format": ["duration", "size", "bit_rate", "format_name"]
  }
}
```

#### Video Stream Analysis

```json
{
  "file_path": "dir_123/video.mp4",
  "probe": {
    "streams": ["codec_name", "width", "height", "bit_rate", "r_frame_rate"],
    "select_streams": "v:0"
  }
}
```

#### Audio Stream Analysis

```json
{
  "file_path": "dir_123/audio.mp3",
  "probe": {
    "streams": ["codec_name", "sample_rate", "channels", "bit_rate"],
    "select_streams": "a"
  }
}
```

#### Frame Counting

```json
{
  "file_path": "dir_123/video.mp4",
  "probe": {
    "streams": ["nb_frames", "nb_read_frames"],
    "select_streams": "v:0",
    "count_frames": true,
    "read_intervals": "0%+10"
  }
}
```

#### Keyframe Analysis

```json
{
  "file_path": "dir_123/video.mp4",
  "probe": {
    "frames": ["pkt_pts_time", "key_frame", "pict_type"],
    "select_streams": "v:0",
    "skip_frame": "nokey",
    "read_intervals": "0%+30"
  }
}
```

### Advanced Features

#### Stream Selection

Use `select_streams` to target specific streams:

- `"v:0"` - First video stream
- `"a"` - All audio streams
- `"s:1"` - Second subtitle stream
- `"v:0,a:0"` - First video and audio streams

#### Read Intervals

Limit analysis to specific time ranges:

- `"0%+10"` - First 10 seconds
- `"30%+5"` - 5 seconds starting at 30%
- `"#500"` - First 500 frames
- `"10%+#100"` - 100 frames starting at 10%

#### Resource Limits

- **Analysis Duration**: Maximum 60 seconds
- **Probe Size**: Maximum 50MB
- **Frame/Packet Limits**: 30 seconds or 3000 frames when requesting frame/packet data

### Integration Examples

#### Quality Control Workflow

```javascript
async function validateVideo(filePath) {
  const response = await fetch('/ffprobe/analyze', {
    method: 'POST',
    headers: { 'Authorization': 'Basic YOUR_API_KEY' },
    body: JSON.stringify({
      file_path: filePath,
      probe: {
        format: ['duration', 'bit_rate'],
        streams: ['codec_name', 'width', 'height', 'bit_rate'],
        select_streams: 'v:0'
      }
    })
  });
  
  const data = await response.json();
  
  if (!data.ok) {
    throw new Error(`Analysis failed: ${data.error}`);
  }
  
  const video = data.result.streams[0];
  
  // Validate requirements
  if (video.width < 1280) {
    throw new Error('Video too small: minimum 1280px width required');
  }
  
  if (video.codec_name !== 'h264') {
    throw new Error('Invalid codec: H.264 required');
  }
  
  return {
    duration: parseFloat(data.result.format.duration),
    resolution: `${video.width}x${video.height}`,
    codec: video.codec_name,
    bitrate: parseInt(video.bit_rate)
  };
}
```

#### Thumbnail Generation

```javascript
async function getKeyframes(filePath) {
  const response = await fetch('/ffprobe/analyze', {
    method: 'POST',
    headers: { 'Authorization': 'Basic YOUR_API_KEY' },
    body: JSON.stringify({
      file_path: filePath,
      probe: {
        frames: ['pkt_pts_time', 'key_frame'],
        select_streams: 'v:0',
        skip_frame: 'nokey',
        read_intervals: '0%+60' // First minute
      }
    })
  });
  
  const data = await response.json();
  
  if (!data.ok) {
    throw new Error(`Keyframe analysis failed: ${data.error}`);
  }
  
  return data.result.frames
    .filter(frame => frame.key_frame === 1)
    .map(frame => parseFloat(frame.pkt_pts_time));
}
```

### Troubleshooting

**"File size exceeds plan limit" (Error 403)**

Your file exceeds the maximum size allowed by your plan:
- Free & Starter: 500 MB max
- Pro: 1 GB max
- Growth: 5 GB max

**"select_streams is required when requesting frames or packets"**

Add `select_streams` when using `frames[]` or `packets[]`:
```json
{"select_streams": "v:0"}
```

**"read_intervals duration cannot exceed 30s"**

Reduce the time range in `read_intervals` or use frame-based limits:
```json
{"read_intervals": "#1000"}
```

---

## 8. API Reference

### Complete Endpoint Documentation

**Base URL:** `https://api.ffmpeg-api.com`

**Authentication:** All endpoints require Basic Auth header:
```
Authorization: Basic YOUR_API_KEY
```

### Processing Endpoints

#### POST /ffmpeg/process

Transform media files using FFmpeg commands.

**Request Body:**
```json
{
  "task": {
    "inputs": [
      {
        "file_path": "dir_abc123/input.mp4",
        "options": ["-ss", "10", "-t", "30"]
      }
    ],
    "outputs": [
      {
        "file": "output.mp4",
        "options": ["-crf", "23", "-preset", "medium"],
        "maps": ["0:v", "0:a"]
      }
    ],
    "filter_complex": "[0:v]scale=1280:720[out]"
  }
}
```

**Required Fields:**
- `task.inputs[]` - Input files array
- `task.outputs[]` - Output specifications
- `inputs[].file_path` - File path from upload
- `outputs[].file` - Output filename

**Optional Fields:**
- `inputs[].options[]` - Input FFmpeg options
- `outputs[].options[]` - Output FFmpeg options
- `outputs[].maps[]` - Stream mappings
- `filter_complex` - Filter graph string

**Response:**
```json
{
  "ok": true,
  "result": [
    {
      "file_name": "output.mp4",
      "size_bytes": 1234567,
      "download_url": "https://storage.example.com/result.mp4"
    }
  ],
  "usage": {
    "time_sec": 12.5,
    "input_size_gb": 0.098,
    "output_size_gb": 0.015,
    "gb_sec": 1.4125
  }
}
```

#### POST /ffmpeg/process/async

Submit an FFmpeg task for asynchronous processing. Returns immediately with a job ID.

**Request Body:**
```json
{
  "task": {
    "inputs": [{ "file_path": "dir_abc123/input.mp4" }],
    "outputs": [{ "file": "output.mp4", "options": ["-crf", "23"] }]
  },
  "webhook_url": "https://yoursite.com/callback"
}
```

**Response (202 Accepted):**
```json
{
  "ok": true,
  "job_id": "job_abc123xyz"
}
```

**Webhook Payload - Success:**
```json
{
  "job_id": "job_abc123xyz",
  "status": "completed",
  "result": [...],
  "usage": {...}
}
```

**Webhook Payload - Failure:**
```json
{
  "job_id": "job_abc123xyz",
  "status": "failed",
  "error": "FFmpeg processing error: Invalid input format"
}
```

### Job Management Endpoints

#### GET /job/{jobId}

Check the status of an async processing job.

**Response - Pending/Processing:**
```json
{
  "ok": true,
  "job_id": "job_abc123xyz",
  "status": "pending"  // or "processing"
}
```

**Response - Completed:**
```json
{
  "ok": true,
  "job_id": "job_abc123xyz",
  "status": "completed",
  "result": [...],
  "usage": {...}
}
```

**Job Statuses:** `pending`, `processing`, `completed`, `failed`

#### DELETE /job/{jobId}

Cancel a pending job. Only jobs in `pending` status can be cancelled.

**Response:**
```json
{
  "ok": true,
  "message": "Job cancelled successfully"
}
```

### Analysis Endpoints

#### POST /ffprobe/analyze

Analyze media metadata using FFprobe.

**Request Body:**
```json
{
  "file_path": "dir_abc123/video.mp4",
  "probe": {
    "format": ["duration", "size", "bit_rate"],
    "streams": ["codec_name", "width", "height"],
    "select_streams": "v:0"
  }
}
```

**Response:**
```json
{
  "ok": true,
  "result": {
    "format": {
      "duration": "120.5",
      "size": "15728640",
      "bit_rate": "1048576"
    },
    "streams": [{
      "codec_name": "h264",
      "width": 1920,
      "height": 1080
    }]
  },
  "usage": {...}
}
```

### File Management Endpoints

#### POST /file

Register a file and get a secure upload URL.

**Request Body:**
```json
{
  "file_name": "video.mp4",
  "dir_id": "dir_abc123"  // optional
}
```

**Response:**
```json
{
  "ok": true,
  "file": {
    "dir_id": "dir_abc123",
    "file_name": "video.mp4",
    "file_path": "dir_abc123/video.mp4",
    "added_on": "2024-01-01T00:00:00Z"
  },
  "upload": {
    "url": "https://presigned-upload-url...",
    "method": "PUT",
    "headers": {},
    "expiresInSeconds": 300
  }
}
```

#### GET /file/{dirId}/{fileName}

Get file metadata (type and size) for a stored file.

**Response:**
```json
{
  "ok": true,
  "file_info": {
    "file_path": "dir_abc123/video.mp4",
    "file_type": "video/mp4",
    "file_size": 1048576
  }
}
```

#### GET /file/download/{dirId}/{fileName}

Get a presigned download URL for a stored file (valid for 5 minutes).

**Response:**
```json
{
  "ok": true,
  "download": {
    "url": "https://presigned-download-url...",
    "method": "GET",
    "expiresInSeconds": 300,
    "file_path": "dir_abc123/video.mp4",
    "file_size": 1048576,
    "file_type": "video/mp4"
  }
}
```

#### DELETE /file/{dirId}/{fileName}

Delete a file from storage (irreversible).

**Response:**
```json
{
  "ok": true,
  "deleted": {
    "file_path": "dir_abc123/video.mp4"
  }
}
```

#### POST /directory

Create a temporary working directory.

**Request Body:**
```json
{
  "ttl": 86400  // optional, seconds (default: 24 hours)
}
```

**Response:**
```json
{
  "ok": true,
  "directory": {
    "id": "dir_abc123",
    "ttl": 86400
  }
}
```

#### GET /directory

List all your directories.

**Response:**
```json
{
  "ok": true,
  "directories": [
    {
      "id": "dir_abc123",
      "ttl": 86400,
      "added_on": "2024-01-01T10:00:00Z"
    }
  ]
}
```

#### GET /directory/{dirId}

List files in a specific directory.

**Response:**
```json
{
  "ok": true,
  "files": [
    {
      "file_name": "video.mp4",
      "added_on": "2024-01-01T10:30:00Z"
    }
  ]
}
```

### Error Responses

All error responses follow the same format:

```json
{
  "ok": false,
  "error": "Descriptive error message"
}
```

**HTTP Status Codes:**
- `400` Bad Request - Invalid JSON, missing fields
- `401` Unauthorized - Invalid API key
- `403` Forbidden - Quota exceeded, expired URL
- `404` Not Found - File/directory doesn't exist
- `500` Internal Error - FFmpeg processing failed
- `502` Bad Gateway - Upstream service issue
- `503` Service Unavailable - Temporary outage

---

## 9. Advanced Usage

### Request Structure Overview

Most operations use JSON requests and Basic Auth. The typical flow is:

1. Create a file to obtain an upload URL
2. Upload the file bytes
3. Submit a processing task referencing `file_path`

### Input Object

**options:** Array of FFmpeg input options applied before the input file
- Format: `["-option", "value", "-another_option", "value"]`
- Examples: `["-ss", "00:00:10"]` (seek to 10 seconds), `["-t", "30"]` (duration of 30 seconds)

**file:** Filename that exactly matches the uploaded file parameter name

### Output Object

**options:** Array of FFmpeg output options applied to the output file
- Format: `["-option", "value", "-another_option", "value"]`
- Examples: `["-c:v", "libx264", "-crf", "23"]` (H.264 codec with quality 23)

**file:** Desired output filename (will be available for download)

**maps:** (Optional) Array of stream mapping specifiers
- Format: `["input_index:stream_type:stream_index"]`
- Examples: `["0:v"]` (video from first input), `["1:a:2"]` (third audio track from second input)
- Can also reference filter outputs: `["[filter_label]"]`

### Filter Complex

**filter_complex:** (Optional) FFmpeg filter graph for advanced processing
- Used for operations like scaling, overlay, concatenation, side-by-side videos
- Filter outputs can be referenced in output `maps` using labels like `[out]`
- Example: `"[0:v]scale=1920:1080[v1];[1:v]scale=1920:1080[v2];[v1][v2]hstack[out]"`

### Advanced Examples

#### Stream Mapping with Maps

Extract specific streams from inputs into separate output files:

```json
{
  "task": {
    "inputs": [{"file": "movie.mkv", "options": []}],
    "outputs": [
      {
        "options": ["-c:v", "libx264", "-crf", "23"],
        "file": "video_only.mp4",
        "maps": ["0:v:0"]
      },
      {
        "options": ["-c:a", "aac", "-b:a", "128k"],
        "file": "audio_track2.m4a",
        "maps": ["0:a:1"]
      }
    ]
  }
}
```

#### Filter Complex for Side-by-Side Video

```json
{
  "task": {
    "inputs": [
      {"file_path": "dir_123/left_video.mp4", "options": []},
      {"file_path": "dir_123/right_video.mp4", "options": []}
    ],
    "filter_complex": "[0:v]scale=960:540[left];[1:v]scale=960:540[right];[left][right]hstack[out]",
    "outputs": [
      {
        "file": "side_by_side.mp4",
        "options": ["-c:v", "libx264", "-preset", "medium"],
        "maps": ["[out]"]
      }
    ]
  }
}
```

#### Trimming and Quality Control

```json
{
  "task": {
    "inputs": [
      {
        "file": "input.mp4",
        "options": ["-ss", "00:01:30", "-t", "00:02:00"]
      }
    ],
    "outputs": [
      {
        "file": "trimmed_high_quality.mp4",
        "options": [
          "-c:v", "libx264",
          "-crf", "18",
          "-preset", "slow",
          "-c:a", "aac",
          "-b:a", "192k"
        ]
      }
    ]
  }
}
```

#### Multiple Output Formats

```json
{
  "task": {
    "inputs": [{"file": "source.mp4", "options": []}],
    "outputs": [
      {
        "file": "compressed.mp4",
        "options": ["-c:v", "libx264", "-crf", "28", "-c:a", "aac"]
      },
      {
        "file": "thumbnail.jpg",
        "options": ["-vf", "scale=320:240", "-vframes", "1", "-ss", "00:00:05"]
      }
    ]
  }
}
```

### File Upload Guidelines

> File parameter names in the request must exactly match the `file` field in your command's inputs.

**File Upload Requirements:**
1. Parameter names must match the `file` field in your command inputs
2. File paths: Any accessible file path (implementation depends on your tool/language)
3. Multiple files: Upload all files referenced in your command's inputs

**File Size Limits:**
- Maximum file size varies by plan (500MB to 5GB)

### Response Format

**Success Response:**
```json
{
  "ok": true,
  "result": [
    {
      "file_name": "output.mp4",
      "size_bytes": 104897,
      "download_url": "https://.../output.mp4?..."
    }
  ],
  "usage": {
    "time_sec": 12.5,
    "input_size_gb": 0.098,
    "output_size_gb": 0.015,
    "gb_sec": 1.4125
  }
}
```

**Error Response:**
```json
{
  "ok": false,
  "error": "Error message describing what went wrong"
}
```

### Best Practices

> Always validate your FFmpeg command locally before sending it to the API to avoid unnecessary usage charges.

**Error Prevention:**
1. Check file formats - Ensure input files are in supported formats
2. Validate paths - Use absolute paths for file uploads
3. Test commands - Validate FFmpeg syntax before API calls
4. Handle timeouts - Implement retry logic for large file processing

---

## 10. Migration Guide

### From /ffmpeg/run to /ffmpeg/process

> **Warning:** The legacy `POST /ffmpeg/run` is deprecated and will be removed by Feb 28th, 2026.

### Migrate to the New Workflow

1. `POST /file` → get an upload URL
2. `PUT <upload.url>` → upload the file
3. `POST /ffmpeg/process` → reference inputs by `file_path`

### Key Differences

| Aspect | Legacy | New |
|--------|--------|-----|
| Endpoint | POST /ffmpeg/run | POST /ffmpeg/process |
| Body | multipart/form-data | application/json |
| File ref | `file` | `file_path` (`<dir_id>/<file_name>`) |
| Organization | none | directory based |
| Usage stats | none | detailed `usage` returned |

### Before → After

**Legacy (multipart):**

```bash
curl -F "input.mp4=@./input.mp4" \
  -F 'command={"inputs":[{"file":"input.mp4"}],"outputs":[{"file":"output.mp4"}]}' \
  -H 'Authorization: Basic <KEY>' \
  https://api.ffmpeg-api.com/ffmpeg/run
```

**New (file-path):**

```bash
# 1) Get an upload URL
curl -sS -X POST https://api.ffmpeg-api.com/file \
  -H 'Authorization: Basic <KEY>' -H 'Content-Type: application/json' \
  -d '{"file_name":"input.mp4"}'

# 2) Upload
curl -X PUT "$UPLOAD_URL" --data-binary @./input.mp4

# 3) Process
curl -sS -X POST https://api.ffmpeg-api.com/ffmpeg/process \
  -H 'Authorization: Basic <KEY>' -H 'Content-Type: application/json' \
  -d '{"task":{"inputs":[{"file_path":"<dir_id>/input.mp4"}],"outputs":[{"file":"output.mp4"}]}}'
```

> **Note:** Use one directory per workflow. All inputs in a task must be from the same directory.

---

## 11. GB-Seconds Pricing

### Understanding GB-Seconds

GB-Seconds is the unit of measurement used to calculate your usage and billing for the FFmpeg API. It combines both the size of your media files and the time it takes to process them into a single metric.

**Formula:**

```
GB-Seconds = (Input Size + Output Size in GB) × Processing Time in Seconds
```

> Think of GB-Seconds as a way to measure both the "weight" of your files and how long they take to process.

### How GB-Seconds are Calculated

#### Example 1: Simple Video Conversion

- Input file: 2 GB MP4 video
- Output file: 1.5 GB MP4 video (compressed)
- Processing time: 30 seconds

**Calculation:** `(2 + 1.5) × 30 = 105 GB-Seconds`

#### Example 2: Audio Extraction

- Input file: 500 MB video file (0.5 GB)
- Output file: 50 MB audio file (0.05 GB)
- Processing time: 10 seconds

**Calculation:** `(0.5 + 0.05) × 10 = 5.5 GB-Seconds`

#### Example 3: Multiple Output Files

- Input file: 1 GB video
- Output files: 800 MB + 600 MB + 400 MB = 1.8 GB total
- Processing time: 45 seconds

**Calculation:** `(1 + 1.8) × 45 = 126 GB-Seconds`

### Factors That Affect GB-Second Usage

#### File Size Factors

- **Input file size** - Larger source files increase GB-Second usage
- **Output file size** - Multiple outputs or high-quality outputs add to the total
- **Compression efficiency** - Better compression reduces output size

#### Processing Time Factors

- **Video complexity** - High-resolution videos take longer to process
- **Audio channels** - Multi-channel audio increases processing time
- **Encoding settings** - Higher quality settings require more processing time
- **Filter complexity** - Advanced filters and effects extend processing duration

> Processing time can vary based on system load and file complexity. The same operation might take different amounts of time on different occasions.

### Optimizing Your GB-Second Usage

#### 1. Optimize Input Files

- Pre-compress large files when possible
- Remove unnecessary audio tracks or streams
- Trim videos to only include needed segments

#### 2. Choose Efficient Output Settings

- Use appropriate quality settings - higher isn't always better
- Select efficient codecs like H.264 or H.265
- Avoid unnecessary high resolutions for your use case

#### 3. Batch Process Efficiently

- Combine multiple operations in a single API call when possible
- Process similar files together to benefit from optimizations

### Common Questions

**Why GB-Seconds Instead of Just Processing Time?**

GB-Seconds provide a more accurate measure of computational resources. A 10-second process on a 100 MB file consumes far fewer resources than a 10-second process on a 10 GB file.

**Are Failed Requests Charged?**

No, only successful processing operations that produce output files are charged. Failed requests due to invalid input or API errors are not billed.

**How Are Partial Seconds Handled?**

Processing time is measured precisely and can include fractions of seconds. For example, a 2.3-second process is billed as 2.3 seconds, not rounded up to 3 seconds.

---

## Additional Resources

- **Dashboard:** Access your API key and monitor usage
- **Support:** help@ffmpeg-api.com
- **Documentation:** https://ffmpeg-api.com/docs
- **OpenAPI Spec:** https://api.ffmpeg-api.com/openapi.json

---

*Last Updated: January 2026*
*FFmpeg API Documentation - All rights reserved*
