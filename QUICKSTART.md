# Atelier Quick Start Guide

Get up and running with Atelier - AI Creative Design Studio in under 10 minutes. This guide walks you through installation, configuration, and generating your first AI-powered creative assets.

## Prerequisites

Before you begin, ensure you have:

- An active Nexus platform account with API access
- A valid API key from the [Nexus Dashboard](https://dashboard.adverant.ai/settings/api-keys)
- An active subscription tier (Starter, Professional, or Studio)

## Installation

### Via Nexus Marketplace (Recommended)

The simplest way to install Atelier is through the Nexus CLI:

```bash
nexus plugin install nexus-atelier
```

### Via API

Alternatively, install programmatically:

```bash
curl -X POST "https://api.adverant.ai/v1/plugins/install" \
  -H "Authorization: Bearer nxs_live_7f8a9b2c3d4e5f6a7b8c9d0e1f2a3b4c" \
  -H "Content-Type: application/json" \
  -d '{
    "pluginId": "nexus-atelier",
    "tier": "professional"
  }'
```

### Verify Installation

Confirm Atelier is installed and ready:

```bash
nexus plugin status nexus-atelier
```

Expected output:
```
Plugin: nexus-atelier
Status: active
Version: 1.0.0
Tier: professional
Images remaining: 500/500
```

## Configuration

### Environment Setup

Configure your API credentials. Create or update your `.env` file:

```bash
NEXUS_API_KEY=nxs_live_7f8a9b2c3d4e5f6a7b8c9d0e1f2a3b4c
NEXUS_WORKSPACE_ID=ws_abc123def456
ATELIER_DEFAULT_QUALITY=high
ATELIER_OUTPUT_FORMAT=png
```

### SDK Initialization

Initialize the Atelier client in your application:

```typescript
import { NexusClient } from '@adverant/nexus-sdk';

const nexus = new NexusClient({
  apiKey: process.env.NEXUS_API_KEY,
  workspaceId: process.env.NEXUS_WORKSPACE_ID
});

const atelier = nexus.plugin('nexus-atelier');
```

## Your First Image Generation

Let us generate a professional marketing image to verify everything is working correctly.

### Basic Image Generation

```bash
curl -X POST "https://api.adverant.ai/proxy/nexus-atelier/api/v1/atelier/generate" \
  -H "Authorization: Bearer nxs_live_7f8a9b2c3d4e5f6a7b8c9d0e1f2a3b4c" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Professional business team collaborating in modern office space, natural lighting, photorealistic style, 4K quality",
    "negativePrompt": "blurry, low quality, distorted faces",
    "style": "photorealistic",
    "dimensions": {
      "width": 1920,
      "height": 1080
    },
    "quality": "high",
    "count": 1
  }'
```

**Response:**
```json
{
  "generationId": "gen_8f7a6b5c4d3e2f1a",
  "status": "processing",
  "estimatedTimeSeconds": 25,
  "creditsUsed": 1,
  "webhookUrl": null
}
```

### Check Generation Status

Poll for completion or use webhooks:

```bash
curl "https://api.adverant.ai/proxy/nexus-atelier/api/v1/atelier/projects/gen_8f7a6b5c4d3e2f1a" \
  -H "Authorization: Bearer nxs_live_7f8a9b2c3d4e5f6a7b8c9d0e1f2a3b4c"
```

**Completed Response:**
```json
{
  "generationId": "gen_8f7a6b5c4d3e2f1a",
  "status": "completed",
  "createdAt": "2025-01-15T10:30:00Z",
  "completedAt": "2025-01-15T10:30:28Z",
  "images": [
    {
      "id": "img_1a2b3c4d5e6f",
      "url": "https://cdn.adverant.ai/atelier/gen_8f7a6b5c4d3e2f1a/output_001.png",
      "width": 1920,
      "height": 1080,
      "format": "png",
      "sizeBytes": 2847593
    }
  ],
  "metadata": {
    "model": "atelier-v2-photorealistic",
    "seed": 847293651,
    "inferenceSteps": 50
  }
}
```

## Generate a Book Cover

Atelier excels at creating professional book cover designs:

```bash
curl -X POST "https://api.adverant.ai/proxy/nexus-atelier/api/v1/atelier/book-covers" \
  -H "Authorization: Bearer nxs_live_7f8a9b2c3d4e5f6a7b8c9d0e1f2a3b4c" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "The Future of Innovation",
    "subtitle": "How AI is Reshaping Business Strategy",
    "authorName": "Dr. Sarah Mitchell",
    "genre": "business",
    "style": "modern-corporate",
    "colorScheme": {
      "primary": "#1E3A5F",
      "secondary": "#E8B849",
      "accent": "#FFFFFF"
    },
    "dimensions": {
      "width": 1600,
      "height": 2560
    },
    "variations": 4
  }'
```

**Response:**
```json
{
  "generationId": "gen_bc9d8e7f6a5b4c3d",
  "status": "processing",
  "estimatedTimeSeconds": 45,
  "variations": 4,
  "creditsUsed": 4
}
```

## Create Character Illustrations

Generate consistent character artwork for games, books, or marketing:

```bash
curl -X POST "https://api.adverant.ai/proxy/nexus-atelier/api/v1/atelier/characters" \
  -H "Authorization: Bearer nxs_live_7f8a9b2c3d4e5f6a7b8c9d0e1f2a3b4c" \
  -H "Content-Type: application/json" \
  -d '{
    "characterDescription": "A confident female cybersecurity expert in her 30s, short dark hair with blue highlights, wearing a sleek tech jacket, determined expression",
    "style": "digital-illustration",
    "poses": ["portrait", "full-body", "action"],
    "backgroundStyle": "transparent",
    "consistency": {
      "maintainFeatures": true,
      "referenceImages": []
    }
  }'
```

## Using Webhooks

For production applications, configure webhooks to receive completion notifications:

```bash
curl -X POST "https://api.adverant.ai/proxy/nexus-atelier/api/v1/atelier/generate" \
  -H "Authorization: Bearer nxs_live_7f8a9b2c3d4e5f6a7b8c9d0e1f2a3b4c" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Abstract geometric pattern for brand identity, blue and gold colors",
    "style": "vector-art",
    "webhook": {
      "url": "https://your-app.com/webhooks/atelier",
      "secret": "whsec_your_webhook_secret",
      "events": ["generation.completed", "generation.failed"]
    }
  }'
```

## SDK Usage Examples

### TypeScript/JavaScript

```typescript
import { NexusClient } from '@adverant/nexus-sdk';

const nexus = new NexusClient({
  apiKey: 'nxs_live_7f8a9b2c3d4e5f6a7b8c9d0e1f2a3b4c'
});

const atelier = nexus.plugin('nexus-atelier');

// Generate an image
const generation = await atelier.generate({
  prompt: 'Futuristic cityscape at sunset, cyberpunk aesthetic',
  style: 'digital-art',
  dimensions: { width: 1920, height: 1080 }
});

// Wait for completion
const result = await generation.waitForCompletion();
console.log('Generated images:', result.images);
```

### Python

```python
from nexus_sdk import NexusClient

nexus = NexusClient(api_key="nxs_live_7f8a9b2c3d4e5f6a7b8c9d0e1f2a3b4c")
atelier = nexus.plugin("nexus-atelier")

# Generate an image
generation = atelier.generate(
    prompt="Minimalist logo design for tech startup, clean lines",
    style="vector-art",
    dimensions={"width": 1024, "height": 1024}
)

# Wait for completion
result = generation.wait_for_completion()
print(f"Generated {len(result.images)} images")
```

## Pricing Tiers Reference

| Tier | Monthly Price | Images/Month | Features |
|------|---------------|--------------|----------|
| **Starter** | $19 | 100 | Basic generation, standard quality |
| **Professional** | $49 | 500 | All models, high quality, batch generation |
| **Studio** | $149 | Unlimited | Priority processing, API access, custom models |

## Next Steps

Now that you have Atelier running, explore these resources:

- **[Use Cases Guide](USE-CASES.md)** - Detailed workflows for marketing, publishing, and product design
- **[Architecture Overview](ARCHITECTURE.md)** - Understanding the technical architecture
- **[API Reference](docs/api-reference/endpoints.md)** - Complete endpoint documentation
- **[Style Guide](docs/guides/style-reference.md)** - Available styles and customization options

## Troubleshooting

### Common Issues

**Generation taking too long?**
- Check your tier's queue priority
- Reduce image dimensions or count
- Use the `quality: "standard"` option for faster results

**Rate limited?**
- Professional and Studio tiers have higher rate limits
- Implement exponential backoff in your application
- Consider batch generation for multiple images

**Image quality not as expected?**
- Use more descriptive prompts with specific details
- Add negative prompts to exclude unwanted elements
- Try different style presets for your use case

### Support Channels

- **Documentation**: [docs.adverant.ai/plugins/atelier](https://docs.adverant.ai/plugins/atelier)
- **Discord Community**: [discord.gg/adverant](https://discord.gg/adverant)
- **Email Support**: support@adverant.ai
- **GitHub Issues**: [Report bugs](https://github.com/adverant/Adverant-Nexus-Plugin-Atelier/issues)
