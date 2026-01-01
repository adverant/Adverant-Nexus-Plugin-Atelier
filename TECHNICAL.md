# Atelier Technical Documentation

This document provides comprehensive technical specifications for developers integrating with Nexus Atelier - AI Creative Design Studio. It covers API endpoints, authentication, data models, SDK integration, error handling, and deployment requirements.

## Overview

Nexus Atelier is a containerized MCP (Model Context Protocol) plugin within the Nexus ecosystem that provides AI-powered creative asset generation. The plugin operates as an Express.js application with WebSocket support for real-time progress updates, backed by PostgreSQL for persistence and Redis/BullMQ for job queue management.

**Core Capabilities:**
- Text-to-image generation
- Image-to-video generation
- Text-to-video generation
- Video-to-video transformations (style transfer, object manipulation)
- Audio generation (soundtrack, voiceover, sound effects)
- Book cover design
- Character illustration

**Technical Stack:**
- Runtime: Node.js with TypeScript
- Framework: Express.js with Socket.IO
- Queue: BullMQ with Redis
- Database: PostgreSQL
- Storage: MinIO (S3-compatible)
- AI Services: MageAgent, VideoAgent

## API Reference

All API endpoints are prefixed with `/api/v1`. The base URL depends on your deployment:

- **Via Nexus Proxy**: `https://api.adverant.ai/proxy/nexus-atelier/api/v1`
- **Direct**: `http://localhost:9130/api/v1`

### Video Generation

#### POST `/video/generate/text`

Generate video from a text prompt.

**Request:**
```json
{
  "prompt": "string (required)",
  "style": "cinematic | animated | photorealistic | anime | surreal",
  "duration_seconds": "number (default: 10)",
  "resolution": "string (default: 1920x1080)",
  "quality": "draft | standard | hd | premium",
  "fps": "number (optional)",
  "aspect_ratio": "string (optional)",
  "project_id": "string (optional)",
  "camera_controls": {
    "lens_type": "string (optional)",
    "movement": "string (optional)",
    "depth_of_field": "string (optional)",
    "angle": "string (optional)"
  },
  "reference_images": ["string[] (optional)"]
}
```

**Response (202 Accepted):**
```json
{
  "success": true,
  "data": {
    "job_id": "uuid",
    "status": "queued"
  },
  "metadata": {
    "request_id": "string",
    "timestamp": "ISO8601",
    "latency_ms": 0
  }
}
```

#### POST `/video/generate/image`

Generate video from a source image (image-to-video).

**Request:**
```json
{
  "image_url": "string (required)",
  "prompt": "string (optional)",
  "duration_seconds": "number (default: 5)",
  "motion_intensity": "number 1-10 (default: 5)",
  "project_id": "string (optional)",
  "keyframes": [
    {
      "time_seconds": "number",
      "properties": "object"
    }
  ],
  "camera_movement": {
    "type": "pan | zoom | dolly | orbit | track",
    "intensity": "number",
    "direction": "string (optional)"
  }
}
```

**Response (202 Accepted):** Same format as text-to-video.

### Image Generation

#### POST `/image/generate/text`

Generate image from a text prompt.

**Request:**
```json
{
  "prompt": "string (required)",
  "style": "photorealistic | oil_painting | anime | sketch | watercolor",
  "resolution": "string (default: 1024x1024)",
  "quality": "draft | standard | hd | premium",
  "aspect_ratio": "string (optional)",
  "variations": "number (optional)",
  "seed": "number (optional)",
  "negative_prompt": "string (optional)",
  "project_id": "string (optional)"
}
```

**Response (202 Accepted):**
```json
{
  "success": true,
  "data": {
    "job_id": "uuid",
    "status": "queued"
  },
  "metadata": {
    "request_id": "string",
    "timestamp": "ISO8601",
    "latency_ms": 0
  }
}
```

### Book Cover Generation

#### POST `/book-covers`

Generate professional book cover designs. See manifest endpoint: `/api/v1/atelier/book-covers`

**Request:**
```json
{
  "title": "string (required)",
  "subtitle": "string (optional)",
  "authorName": "string (required)",
  "genre": "string (required)",
  "style": "string (optional)",
  "colorScheme": {
    "primary": "#hexcolor",
    "secondary": "#hexcolor",
    "accent": "#hexcolor"
  },
  "dimensions": {
    "width": "number (default: 1600)",
    "height": "number (default: 2560)"
  },
  "variations": "number (default: 1)"
}
```

### Character Generation

#### POST `/characters`

Generate character illustrations. See manifest endpoint: `/api/v1/atelier/characters`

**Request:**
```json
{
  "characterDescription": "string (required)",
  "style": "string (required)",
  "poses": ["portrait", "full-body", "action"],
  "backgroundStyle": "transparent | solid | scene",
  "consistency": {
    "maintainFeatures": "boolean",
    "referenceImages": ["string[]"]
  }
}
```

### Audio Generation

#### POST `/audio/generate`

Generate audio content (soundtrack, voiceover, sound effects).

**Request:**
```json
{
  "audio_type": "soundtrack | voiceover | sound_effect (required)",
  "prompt": "string (required)",
  "duration_seconds": "number (default: 30)",
  "voice_id": "string (optional, for voiceover)",
  "style": "string (optional)",
  "project_id": "string (optional)"
}
```

**Response (202 Accepted):** Same format as other generation endpoints.

### Job Management

#### GET `/jobs/:jobId`

Retrieve job status and details.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "user_id": "string",
    "project_id": "string | null",
    "type": "video | image | audio | workflow",
    "status": "queued | processing | completed | failed | cancelled",
    "priority": "number",
    "params": "object",
    "result": "object | null",
    "error": "object | null",
    "created_at": "ISO8601",
    "started_at": "ISO8601 | null",
    "completed_at": "ISO8601 | null",
    "model_used": "string | null",
    "cost_usd": "number | null",
    "duration_ms": "number | null",
    "credits_used": "number"
  }
}
```

#### GET `/jobs/:jobId/result`

Retrieve completed job result.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "asset_id": "uuid",
    "url": "string",
    "thumbnail_url": "string | null",
    "metadata": "object",
    "quality_score": "number | null",
    "model_used": "string"
  }
}
```

**Error Response (400):** Returned if job is not completed.

### Asset Management

#### GET `/assets`

List user's generated assets.

**Query Parameters:**
- `type`: `video | image | audio` (optional)
- `limit`: number (default: 50)
- `offset`: number (default: 0)

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "user_id": "string",
      "project_id": "string | null",
      "job_id": "string | null",
      "type": "video | image | audio",
      "url": "string",
      "thumbnail_url": "string | null",
      "metadata": {
        "width": "number",
        "height": "number",
        "fps": "number | null",
        "codec": "string | null",
        "bitrate": "number | null",
        "channels": "number | null",
        "sample_rate": "number | null",
        "tags": ["string[]"],
        "custom": "object"
      },
      "file_size": "number | null",
      "duration_seconds": "number | null",
      "resolution": "string | null",
      "format": "string | null",
      "created_at": "ISO8601"
    }
  ]
}
```

#### GET `/assets/:assetId`

Retrieve a specific asset.

### Queue Statistics

#### GET `/queue/stats`

Get job queue statistics.

**Query Parameters:**
- `type`: `video | image | audio` (optional, omit for all queues)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "video": {
      "waiting": "number",
      "active": "number",
      "completed": "number",
      "failed": "number"
    },
    "image": { ... },
    "audio": { ... }
  }
}
```

### Health Checks

#### GET `/health`

Basic health check.

**Response (200 OK):**
```json
{
  "status": "healthy",
  "timestamp": "ISO8601"
}
```

#### GET `/health/ready`

Readiness probe (checks database connectivity).

**Response (200 OK):**
```json
{
  "status": "ready",
  "timestamp": "ISO8601"
}
```

**Response (503 Service Unavailable):**
```json
{
  "status": "not_ready",
  "reason": "database_unavailable"
}
```

## Authentication

Atelier supports multiple authentication methods through the Nexus platform.

### API Key Authentication

Include your API key in the `Authorization` header:

```
Authorization: Bearer nxs_live_YOUR_API_KEY
```

### User Context Headers

For multi-tenant scenarios, the following headers propagate user context:

| Header | Description |
|--------|-------------|
| `X-User-Id` | Primary user identifier |
| `X-API-Key-Id` | API key UUID (for usage tracking) |
| `X-App-User-Id` | Application-level user ID |
| `X-External-User-Id` | External system user ID |
| `X-Organization-Id` | Organization/company ID |
| `X-Department-Id` | Department identifier |
| `X-Request-Id` | Unique request correlation ID |
| `X-Session-Id` | Session identifier |

### Service-to-Service Authentication

Internal services use mTLS and service tokens:

| Service | Protocol | Authentication |
|---------|----------|----------------|
| MageAgent | gRPC | mTLS |
| GraphRAG | REST | Service Token |
| FileProcess | REST | Service Token |
| Auth Service | REST | Service Token |

## Rate Limits

Rate limits are enforced per API endpoint and vary by subscription tier.

| Endpoint | Rate Limit |
|----------|------------|
| `/api/v1/atelier/generate` | 10/min |
| `/api/v1/atelier/book-covers` | 5/min |
| `/api/v1/atelier/characters` | 5/min |
| `/api/v1/atelier/projects/:id` | 60/min |

### Tier-Based Throughput

| Tier | Concurrent Jobs | Jobs/Hour | Peak Burst |
|------|-----------------|-----------|------------|
| Starter | 2 | 20 | 5 |
| Professional | 5 | 100 | 15 |
| Studio | 20 | Unlimited | 50 |

### Rate Limit Response

When rate limited, the API returns HTTP 429:

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMITED",
    "message": "Rate limit exceeded",
    "details": {
      "retry_after_seconds": 60
    }
  }
}
```

## Data Models

### Job

```typescript
interface Job {
  id: string;                    // UUID
  user_id: string;
  project_id?: string;
  type: 'video' | 'image' | 'audio' | 'workflow';
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';
  priority: number;              // 1-10, higher = more priority
  params: JobParams;             // Type-specific parameters
  result?: JobResult;
  error?: JobError;
  created_at: Date;
  started_at?: Date;
  completed_at?: Date;
  model_used?: string;
  cost_usd?: number;
  duration_ms?: number;
  credits_used: number;
}
```

### JobResult

```typescript
interface JobResult {
  asset_id: string;
  url: string;
  thumbnail_url?: string;
  metadata: Record<string, any>;
  quality_score?: number;
  model_used: string;
}
```

### JobError

```typescript
interface JobError {
  code: string;
  message: string;
  details?: Record<string, any>;
  retryable: boolean;
  suggestion?: string;
}
```

### Asset

```typescript
interface Asset {
  id: string;
  user_id: string;
  project_id?: string;
  job_id?: string;
  type: 'video' | 'image' | 'audio';
  url: string;
  thumbnail_url?: string;
  metadata: AssetMetadata;
  file_size?: number;
  duration_seconds?: number;
  resolution?: string;
  format?: string;
  created_at: Date;
}

interface AssetMetadata {
  width?: number;
  height?: number;
  fps?: number;
  codec?: string;
  bitrate?: number;
  channels?: number;
  sample_rate?: number;
  tags?: string[];
  custom?: Record<string, any>;
}
```

### Quality Tiers

```typescript
type QualityTier = 'draft' | 'standard' | 'hd' | 'premium';
```

### Style Options

```typescript
type VideoStyle = 'cinematic' | 'animated' | 'photorealistic' | 'anime' | 'surreal';
type ImageStyle = 'photorealistic' | 'oil_painting' | 'anime' | 'sketch' | 'watercolor';
```

## SDK Integration

### TypeScript/JavaScript

```typescript
import { NexusClient } from '@adverant/nexus-sdk';

// Initialize client
const nexus = new NexusClient({
  apiKey: process.env.NEXUS_API_KEY,
  workspaceId: process.env.NEXUS_WORKSPACE_ID
});

// Get Atelier plugin instance
const atelier = nexus.plugin('nexus-atelier');

// Generate an image
const generation = await atelier.generate({
  prompt: 'Futuristic cityscape at sunset, cyberpunk aesthetic',
  style: 'digital-art',
  dimensions: { width: 1920, height: 1080 }
});

// Poll for completion
const result = await generation.waitForCompletion();
console.log('Generated images:', result.images);

// Or use webhooks
const webhookGeneration = await atelier.generate({
  prompt: 'Abstract geometric pattern',
  webhook: {
    url: 'https://your-app.com/webhooks/atelier',
    secret: 'your_webhook_secret',
    events: ['generation.completed', 'generation.failed']
  }
});
```

### Python

```python
from nexus_sdk import NexusClient

# Initialize client
nexus = NexusClient(api_key="nxs_live_YOUR_API_KEY")
atelier = nexus.plugin("nexus-atelier")

# Generate an image
generation = atelier.generate(
    prompt="Minimalist logo design for tech startup",
    style="vector-art",
    dimensions={"width": 1024, "height": 1024}
)

# Wait for completion
result = generation.wait_for_completion()
print(f"Generated {len(result.images)} images")

# Download the result
for image in result.images:
    image.download(f"output_{image.id}.png")
```

### Direct API Usage (cURL)

```bash
# Generate an image
curl -X POST "https://api.adverant.ai/proxy/nexus-atelier/api/v1/image/generate/text" \
  -H "Authorization: Bearer nxs_live_YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Professional business team in modern office",
    "style": "photorealistic",
    "resolution": "1920x1080",
    "quality": "hd"
  }'

# Check job status
curl "https://api.adverant.ai/proxy/nexus-atelier/api/v1/jobs/JOB_ID" \
  -H "Authorization: Bearer nxs_live_YOUR_API_KEY"
```

### WebSocket Real-Time Updates

Connect to WebSocket for job progress updates:

```typescript
import { io } from 'socket.io-client';

const socket = io('wss://api.adverant.ai/proxy/nexus-atelier', {
  auth: { token: 'nxs_live_YOUR_API_KEY' }
});

// Subscribe to job updates
socket.emit('subscribe', { jobId: 'your-job-id' });

// Listen for progress
socket.on('job:progress', (data) => {
  console.log(`Job ${data.job_id}: ${data.progress}% - ${data.stage}`);
});

socket.on('job:completed', (data) => {
  console.log('Job completed:', data.result);
});

socket.on('job:failed', (data) => {
  console.error('Job failed:', data.error);
});

// Unsubscribe when done
socket.emit('unsubscribe', { jobId: 'your-job-id' });
```

## Error Handling

### Error Response Format

All errors follow a consistent format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      "field": "Additional context"
    }
  }
}
```

### Error Codes

| Code | HTTP Status | Description | Retryable |
|------|-------------|-------------|-----------|
| `MISSING_PROMPT` | 400 | Prompt is required | No |
| `MISSING_IMAGE` | 400 | Image URL is required | No |
| `MISSING_PARAMS` | 400 | Required parameters missing | No |
| `INVALID_PARAMS` | 400 | Invalid parameter values | No |
| `JOB_NOT_FOUND` | 404 | Job ID does not exist | No |
| `ASSET_NOT_FOUND` | 404 | Asset ID does not exist | No |
| `JOB_NOT_COMPLETED` | 400 | Job is still processing | Yes |
| `RATE_LIMITED` | 429 | Too many requests | Yes |
| `INSUFFICIENT_CREDITS` | 402 | Not enough credits | No |
| `GENERATION_FAILED` | 500 | Generation process failed | Yes |
| `INTERNAL_ERROR` | 500 | Unexpected server error | Yes |

### Handling Errors

```typescript
try {
  const result = await atelier.generate({ prompt: 'test' });
} catch (error) {
  if (error.code === 'RATE_LIMITED') {
    // Wait and retry
    await sleep(error.details.retry_after_seconds * 1000);
    return retry();
  }

  if (error.code === 'INSUFFICIENT_CREDITS') {
    // Redirect to billing
    window.location.href = '/billing/upgrade';
    return;
  }

  if (error.retryable) {
    // Implement exponential backoff
    return retryWithBackoff();
  }

  // Non-retryable error
  console.error('Permanent error:', error.message);
}
```

### Job-Level Errors

Jobs that fail during processing include error details:

```json
{
  "id": "job_abc123",
  "status": "failed",
  "error": {
    "code": "GENERATION_FAILED",
    "message": "Model inference timeout",
    "retryable": true,
    "suggestion": "Try reducing resolution or duration"
  }
}
```

## Webhooks

Atelier supports webhook notifications for asynchronous job completion.

### Configuring Webhooks

Include webhook configuration in generation requests:

```json
{
  "prompt": "Your prompt here",
  "webhook": {
    "url": "https://your-app.com/webhooks/atelier",
    "secret": "whsec_your_webhook_secret",
    "events": ["generation.completed", "generation.failed"]
  }
}
```

### Webhook Events

| Event | Description |
|-------|-------------|
| `generation.completed` | Generation finished successfully |
| `generation.failed` | Generation encountered an error |
| `batch.completed` | Batch job completed |
| `job.failed` | Individual job in batch failed |

### Webhook Payload

```json
{
  "event": "generation.completed",
  "timestamp": "2025-01-15T14:32:18.547Z",
  "data": {
    "generationId": "gen_8f7a6b5c4d3e2f1a",
    "status": "completed",
    "images": [
      {
        "id": "img_1a2b3c4d5e6f",
        "url": "https://cdn.adverant.ai/atelier/gen_8f7a6b5c4d3e2f1a/output_001.png",
        "width": 1920,
        "height": 1080
      }
    ],
    "processingTimeMs": 28450,
    "creditsUsed": 1
  },
  "signature": "sha256=7f8a9b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c"
}
```

### Verifying Webhook Signatures

```typescript
import crypto from 'crypto';

function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(`sha256=${expected}`),
    Buffer.from(signature)
  );
}
```

### Webhook Delivery

- **Retry Policy**: 5 attempts with exponential backoff
- **Timeout**: 30 seconds per attempt
- **Backoff Schedule**: 2s, 4s, 8s, 16s, 32s
- **Dead Letter Queue**: Failed webhooks after 5 attempts are stored for manual inspection

## Deployment

### Resource Requirements

From `nexus.manifest.json`:

```yaml
resources:
  cpuMillicores: 2000
  memoryMB: 4096
  diskGB: 20
  timeoutMs: 600000
  maxConcurrentJobs: 5
```

### Kubernetes Deployment Specifications

```yaml
resources:
  requests:
    cpu: "2000m"
    memory: "4096Mi"
  limits:
    cpu: "4000m"
    memory: "8192Mi"
    nvidia.com/gpu: 1

autoscaling:
  minReplicas: 2
  maxReplicas: 20
  targetCPUUtilization: 70
  targetMemoryUtilization: 80
  scaleUpStabilization: 60s
  scaleDownStabilization: 300s
```

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | 9130 | HTTP server port |
| `WS_PORT` | No | 9131 | WebSocket port |
| `DATABASE_URL` | Yes | - | PostgreSQL connection string |
| `REDIS_URL` | No | redis://localhost:6379 | Redis connection string |
| `MINIO_ENDPOINT` | No | localhost | MinIO endpoint |
| `MINIO_BUCKET` | No | nexus-atelier | Storage bucket name |
| `MAGEAGENT_URL` | No | http://localhost:9080 | MageAgent service URL |
| `GRAPHRAG_URL` | No | http://localhost:9090 | GraphRAG service URL |
| `VIDEOAGENT_URL` | No | http://localhost:9200 | VideoAgent service URL |
| `FILEPROCESS_URL` | No | http://localhost:9096 | FileProcess service URL |
| `SANDBOX_URL` | No | http://localhost:9095 | Sandbox service URL |
| `AUTH_SERVICE_URL` | No | http://localhost:9101 | Auth service URL |
| `QUEUE_CONCURRENCY_VIDEO` | No | 10 | Video queue concurrency |
| `QUEUE_CONCURRENCY_IMAGE` | No | 50 | Image queue concurrency |
| `QUEUE_CONCURRENCY_AUDIO` | No | 20 | Audio queue concurrency |
| `ENABLE_DRAFT_MODE` | No | true | Enable draft quality tier |
| `ENABLE_CONSENSUS_MODE` | No | true | Enable multi-model consensus |
| `ENABLE_PERSONALIZATION` | No | true | Enable user preference learning |
| `MAX_VIDEO_DURATION` | No | 60 | Maximum video duration (seconds) |
| `MAX_IMAGE_RESOLUTION` | No | 4096x4096 | Maximum image resolution |
| `MAX_FILE_SIZE_BYTES` | No | 5368709120 | Maximum file size (5GB) |
| `CORS_ORIGIN` | No | * | CORS allowed origins |

### Usage Tracking Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `USAGE_TRACKING_URL` | http://nexus-auth:9101/internal/track-usage | Usage reporting endpoint |
| `USAGE_BATCH_SIZE` | 10 | Batch size for usage reports |
| `USAGE_BATCH_FLUSH_MS` | 5000 | Batch flush interval (ms) |
| `USAGE_ENABLE_BATCHING` | false | Enable batched reporting |
| `USAGE_DETAILED_METRICS` | true | Include detailed metadata |
| `USAGE_TRACKING_TIMEOUT_MS` | 5000 | Reporting timeout |
| `USAGE_MAX_RETRIES` | 2 | Max retry attempts |
| `USAGE_RETRY_DELAY_MS` | 1000 | Retry delay |

### Health Check Endpoints

| Endpoint | Purpose |
|----------|---------|
| `/api/v1/health` | Liveness probe |
| `/api/v1/health/ready` | Readiness probe (checks database) |

As defined in `nexus.manifest.json`:
- `healthCheck`: `/health`
- `readinessCheck`: `/ready`
- `livenessCheck`: `/live`

## Security

### Transport Security

- **TLS 1.3**: All external communications encrypted
- **mTLS**: Service-to-service authentication
- **Certificate Management**: HashiCorp Vault integration

### Data Protection

| Layer | Control | Implementation |
|-------|---------|----------------|
| Network | Encryption | TLS 1.3 mandatory |
| Authentication | API Keys | SHA-256 hashed, rotatable |
| Authorization | RBAC | Workspace-scoped permissions |
| Data | Encryption | AES-256-GCM at rest |
| Audit | Logging | Immutable audit trail |
| Compliance | GDPR | Data residency options |

### Content Safety

All generated content passes through multi-stage safety filtering:

1. **Input Validation**: Text safety filter on prompts
2. **Generation**: Model-level content guidelines
3. **Output Validation**: Generated content safety scan
4. **Blocking**: Unsafe content rejected or regenerated

### Network Permissions

From `nexus.manifest.json`:

```json
{
  "permissions": [
    "network:api.openai.com",
    "network:api.stability.ai",
    "filesystem:temp",
    "service:mageagent",
    "service:fileprocess"
  ]
}
```

### Asset Storage Security

- **Hot Storage**: NVMe SSD, <10ms latency, encrypted
- **Warm Storage**: SSD, <100ms latency, encrypted
- **Cold Storage**: Object storage, <1s latency, encrypted
- **Archive**: Glacier-class, encrypted

### Retention Policy by Tier

| Tier | Retention |
|------|-----------|
| Starter | 7 days |
| Professional | 90 days |
| Studio | 1 year |

## Performance Specifications

### Latency Targets

| Operation | P50 | P95 | P99 |
|-----------|-----|-----|-----|
| API Response | 150ms | 300ms | 500ms |
| Standard Generation (1024px) | 15s | 25s | 35s |
| High Quality Generation (2048px) | 30s | 45s | 60s |
| Ultra Quality Generation (4096px) | 60s | 90s | 120s |
| Webhook Delivery | 500ms | 2s | 5s |

### Request Processing Pipeline

| Stage | Function | Timeout |
|-------|----------|---------|
| Schema Validation | JSON schema compliance | 50ms |
| Authentication | JWT/API key verification | 100ms |
| Rate Limiting | Token bucket algorithm | 20ms |
| Credit Check | Real-time balance query | 150ms |
| Job Creation | Queue insertion | 100ms |

### Queue Configuration

```yaml
queues:
  priority:
    maxConcurrent: 10
    maxWaitTime: 30s
    gpuAllocation: dedicated
  standard:
    maxConcurrent: 50
    maxWaitTime: 120s
    gpuAllocation: shared-priority
  basic:
    maxConcurrent: 100
    maxWaitTime: 300s
    gpuAllocation: shared-standard
```

---

## Additional Resources

- [Quick Start Guide](QUICKSTART.md) - Get up and running quickly
- [Architecture Overview](ARCHITECTURE.md) - System design and data flows
- [Use Cases](USE-CASES.md) - Real-world implementation patterns
- [API Reference](docs/api-reference/endpoints.md) - Complete endpoint documentation
- [Discord Community](https://discord.gg/adverant) - Developer support

---

**Version**: 1.0.0
**Last Updated**: January 2025
**License**: Apache 2.0
