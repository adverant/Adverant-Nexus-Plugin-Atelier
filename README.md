
<h1 align="center">Nexus Atelier</h1>

<p align="center">
  <strong>AI Creative Design Studio</strong>
</p>

<p align="center">
  <a href="https://github.com/adverant/Adverant-Nexus-Plugin-Atelier/actions"><img src="https://github.com/adverant/Adverant-Nexus-Plugin-Atelier/workflows/CI/badge.svg" alt="CI Status"></a>
  <a href="https://github.com/adverant/Adverant-Nexus-Plugin-Atelier/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-Apache%202.0-blue.svg" alt="License"></a>
  <a href="https://marketplace.adverant.ai/plugins/atelier"><img src="https://img.shields.io/badge/Nexus-Marketplace-purple.svg" alt="Nexus Marketplace"></a>
  <a href="https://discord.gg/adverant"><img src="https://img.shields.io/badge/Discord-Community-7289da.svg" alt="Discord"></a>
</p>

<p align="center">
  <a href="#features">Features</a> -
  <a href="#quick-start">Quick Start</a> -
  <a href="#use-cases">Use Cases</a> -
  <a href="#pricing">Pricing</a> -
  <a href="#documentation">Documentation</a>
</p>

---

## Unleash AI-Powered Creative Design

**Nexus Atelier** is your AI creative partner for generating stunning visual assets, managing brand design systems, and producing on-brand content at scale. From generative art to complete brand asset libraries, Atelier transforms creative workflows.

### Why Nexus Atelier?

- **10x Faster Asset Creation**: Generate production-ready designs in minutes, not days
- **Brand Consistency**: AI enforces your design system across all outputs
- **Multi-Format Export**: One design, infinite formats (print, web, social, video)
- **Style Learning**: Train custom models on your brand aesthetics
- **Collaborative Workspace**: Real-time design collaboration with AI assistance

---

## Features

### Generative Art Engine

Create unique visual content with state-of-the-art AI:

| Capability | Description |
|------------|-------------|
| **Text-to-Image** | Generate images from natural language descriptions |
| **Style Transfer** | Apply artistic styles while preserving content |
| **Image Editing** | AI-powered inpainting, outpainting, and enhancement |
| **Variation Generation** | Create multiple variations from a single concept |
| **Resolution Upscaling** | Enhance images up to 8K resolution |

### Brand Asset Management

Maintain perfect brand consistency:

- **Design System Import**: Import from Figma, Sketch, Adobe XD
- **Color Palette Extraction**: AI identifies and enforces brand colors
- **Typography Management**: Automatic font pairing and hierarchy
- **Logo Variations**: Generate contextual logo adaptations
- **Asset Library**: Searchable, tagged asset repository

### Design System Automation

Scale your design operations:

- **Component Generation**: Create UI components from descriptions
- **Layout Templates**: AI-suggested layouts for any content
- **Responsive Adaptation**: Automatic resizing for all platforms
- **Localization Support**: Multi-language design adaptation
- **Version Control**: Track design evolution with Git-like versioning

---

## Quick Start

### Installation

```bash
# Via Nexus Marketplace (Recommended)
nexus plugin install nexus-atelier

# Or via API
curl -X POST "https://api.adverant.ai/plugins/nexus-atelier/install" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

### Generate Your First Asset

```bash
# Create an image
curl -X POST "https://api.adverant.ai/proxy/nexus-atelier/api/v1/generate" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Modern tech startup hero image, abstract geometric shapes, blue and purple gradient, professional",
    "style": "photorealistic",
    "dimensions": {
      "width": 1920,
      "height": 1080
    },
    "count": 4
  }'
```

**Response:**
```json
{
  "generationId": "gen_abc123",
  "status": "processing",
  "estimatedTime": 30,
  "variations": 4
}
```

### Import Brand Guidelines

```bash
curl -X POST "https://api.adverant.ai/proxy/nexus-atelier/api/v1/brands" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Acme Corp",
    "figmaFileId": "abc123xyz",
    "primaryColors": ["#3B82F6", "#1E40AF"],
    "fonts": ["Inter", "Playfair Display"]
  }'
```

---

## Use Cases

### Marketing & Advertising

#### 1. Campaign Asset Generation
Generate complete campaign visual packages including hero images, social media variants, email headers, and display ads - all on-brand and consistent.

#### 2. A/B Test Variations
Create dozens of design variations for testing different visual approaches, colors, layouts, and messaging presentations.

#### 3. Seasonal Adaptations
Automatically adapt your brand assets for holidays, seasons, and special events while maintaining brand consistency.

### Product Design

#### 4. Mockup Generation
Generate photorealistic product mockups in various environments and contexts without expensive photo shoots.

#### 5. Packaging Design
Create packaging concepts and variations with AI-suggested layouts optimized for shelf appeal and brand recognition.

### Content Creation

#### 6. Social Media Content
Produce platform-optimized social content at scale, with proper dimensions and style for each network.

#### 7. Presentation Design
Transform content into visually stunning presentations with consistent branding and professional layouts.

#### 8. Documentation Graphics
Generate technical illustrations, diagrams, and infographics that match your brand style.

---

## Architecture

```
+------------------------------------------------------------------+
|                       Nexus Atelier Plugin                        |
+------------------------------------------------------------------+
|  +---------------+  +----------------+  +---------------------+   |
|  |   Generation  |  |    Brand       |  |   Asset             |   |
|  |    Engine     |  |    Manager     |  |   Library           |   |
|  +-------+-------+  +-------+--------+  +----------+----------+   |
|          |                  |                      |              |
|          v                  v                      v              |
|  +----------------------------------------------------------+    |
|  |                  AI Model Pipeline                        |    |
|  |  +----------+ +----------+ +----------+ +------------+   |    |
|  |  |Diffusion | |Style     | |Image     | |Quality     |   |    |
|  |  |Models    | |Transfer  | |Enhance   | |Control     |   |    |
|  |  +----------+ +----------+ +----------+ +------------+   |    |
|  +----------------------------------------------------------+    |
|          |                                                        |
|          v                                                        |
|  +----------------------------------------------------------+    |
|  |                   Export & Delivery                       |    |
|  |      PNG  |  SVG  |  PDF  |  WebP  |  Video  |  3D       |    |
|  +----------------------------------------------------------+    |
+------------------------------------------------------------------+
                              |
                              v
+------------------------------------------------------------------+
|                    Nexus Core Services                            |
|  +----------+  +----------+  +----------+  +----------+           |
|  |MageAgent |  | GraphRAG |  |FileProc  |  | Billing  |           |
|  |  (AI)    |  | (Cache)  |  |(Files)   |  |(Usage)   |           |
|  +----------+  +----------+  +----------+  +----------+           |
+------------------------------------------------------------------+
```

---

## Pricing

| Feature | Free | Starter | Pro | Enterprise |
|---------|------|---------|-----|------------|
| **Price** | $0/mo | $49/mo | $199/mo | $799/mo |
| **Generations/month** | 50 | 500 | 5,000 | Unlimited |
| **Max Resolution** | 1024px | 2048px | 4096px | 8192px |
| **Brand Profiles** | 1 | 3 | 10 | Unlimited |
| **Custom Style Training** | - | - | 1 model | Unlimited |
| **Asset Storage** | 1 GB | 10 GB | 100 GB | 1 TB |
| **API Access** | - | Basic | Full | Full |
| **Figma Integration** | - | Yes | Yes | Yes |
| **Priority Generation** | - | - | Yes | Yes |
| **Dedicated GPU** | - | - | - | Yes |

[View on Nexus Marketplace](https://marketplace.adverant.ai/plugins/atelier)

---

## Supported Formats

| Category | Formats |
|----------|---------|
| **Images** | PNG, JPEG, WebP, TIFF, BMP, GIF |
| **Vector** | SVG, AI, EPS, PDF |
| **Video** | MP4, WebM, MOV, GIF |
| **3D** | GLTF, GLB, USDZ, OBJ |
| **Design** | Figma, Sketch, XD, PSD |

---

## Documentation

- [Installation Guide](docs/getting-started/installation.md)
- [Configuration](docs/getting-started/configuration.md)
- [Quick Start](docs/getting-started/quickstart.md)
- [API Reference](docs/api-reference/endpoints.md)
- [Brand System Setup](docs/guides/brand-setup.md)
- [Custom Model Training](docs/guides/custom-training.md)

---

## API Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/generate` | Generate new images |
| `GET` | `/generations/:id` | Get generation result |
| `POST` | `/edit` | Edit existing image |
| `POST` | `/upscale` | Upscale image resolution |
| `POST` | `/brands` | Create brand profile |
| `GET` | `/brands` | List brand profiles |
| `POST` | `/assets` | Upload asset to library |
| `GET` | `/assets` | Search asset library |
| `POST` | `/export` | Export in multiple formats |

Full API documentation: [docs/api-reference/endpoints.md](docs/api-reference/endpoints.md)

---

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

```bash
# Clone the repository
git clone https://github.com/adverant/Adverant-Nexus-Plugin-Atelier.git
cd Adverant-Nexus-Plugin-Atelier

# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test
```

---

## Community & Support

- **Documentation**: [docs.adverant.ai/plugins/atelier](https://docs.adverant.ai/plugins/atelier)
- **Discord**: [discord.gg/adverant](https://discord.gg/adverant)
- **Email**: support@adverant.ai
- **GitHub Issues**: [Report a bug](https://github.com/adverant/Adverant-Nexus-Plugin-Atelier/issues)

---

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  <strong>Crafted with creativity by <a href="https://adverant.ai">Adverant</a></strong>
</p>

<p align="center">
  <a href="https://adverant.ai">Website</a> -
  <a href="https://docs.adverant.ai">Docs</a> -
  <a href="https://marketplace.adverant.ai">Marketplace</a> -
  <a href="https://twitter.com/adverant">Twitter</a>
</p>
