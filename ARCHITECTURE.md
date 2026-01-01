# Atelier Architecture Overview

This document provides a comprehensive technical overview of Atelier - AI Creative Design Studio, covering system architecture, data flows, integration patterns, and deployment specifications for developers and platform architects.

## System Architecture

Atelier operates as a containerized MCP (Model Context Protocol) plugin within the Nexus ecosystem, leveraging distributed AI infrastructure for scalable image generation and creative asset production.

### High-Level Architecture

```mermaid
flowchart TB
    subgraph Client Layer
        A[Nexus Dashboard] --> B[API Gateway]
        C[SDK Clients] --> B
        D[Webhook Consumers] --> B
    end

    subgraph Nexus Core
        B --> E[Authentication Service]
        E --> F[Plugin Router]
        F --> G[Billing Service]
        G --> H[Atelier Plugin Container]
    end

    subgraph Atelier Plugin
        H --> I[Request Handler]
        I --> J[Job Queue Manager]
        J --> K[Generation Engine]
        K --> L[Model Pipeline]
        L --> M[Post-Processing]
        M --> N[Asset Storage]
    end

    subgraph AI Infrastructure
        L --> O[Diffusion Models]
        L --> P[Style Transfer]
        L --> Q[Upscaling Models]
        L --> R[Quality Control]
    end

    subgraph External Services
        K --> S[MageAgent AI Service]
        N --> T[FileProcess CDN]
        J --> U[GraphRAG Cache]
    end
```

## Component Architecture

### Request Handler

The request handler validates incoming API calls, enforces rate limits, and routes requests to appropriate processing pipelines.

```mermaid
flowchart LR
    A[Incoming Request] --> B{Validate Schema}
    B -->|Invalid| C[400 Error Response]
    B -->|Valid| D{Check Rate Limit}
    D -->|Exceeded| E[429 Rate Limited]
    D -->|OK| F{Check Credits}
    F -->|Insufficient| G[402 Payment Required]
    F -->|Available| H[Queue Job]
    H --> I[Return Job ID]
```

**Request Validation Pipeline:**

| Stage | Function | Timeout |
|-------|----------|---------|
| Schema Validation | JSON schema compliance | 50ms |
| Authentication | JWT/API key verification | 100ms |
| Rate Limiting | Token bucket algorithm | 20ms |
| Credit Check | Real-time balance query | 150ms |
| Job Creation | Queue insertion | 100ms |

### Job Queue Manager

Atelier uses a priority-based job queue with tier-aware scheduling to ensure fair resource allocation while providing premium users with faster processing.

```mermaid
flowchart TD
    A[New Job] --> B{Determine Priority}
    B -->|Studio Tier| C[Priority Queue]
    B -->|Professional Tier| D[Standard Queue]
    B -->|Starter Tier| E[Basic Queue]

    C --> F[GPU Pool A - Dedicated]
    D --> G[GPU Pool B - Shared Priority]
    E --> H[GPU Pool C - Shared Standard]

    F & G & H --> I[Generation Workers]
    I --> J[Result Storage]
    J --> K[Webhook Dispatch]
```

**Queue Configuration:**

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

### Generation Engine

The generation engine orchestrates multiple AI models to produce final outputs based on request parameters.

```mermaid
flowchart TB
    subgraph Input Processing
        A[User Prompt] --> B[Prompt Enhancement]
        B --> C[Safety Filtering]
        C --> D[Style Injection]
    end

    subgraph Model Selection
        D --> E{Generation Type}
        E -->|Standard| F[Base Diffusion Model]
        E -->|Photorealistic| G[Photorealistic Model]
        E -->|Illustration| H[Illustration Model]
        E -->|Book Cover| I[Typography-Aware Model]
    end

    subgraph Generation Pipeline
        F & G & H & I --> J[Initial Generation]
        J --> K{Quality Check}
        K -->|Pass| L[Post-Processing]
        K -->|Fail| M[Regeneration Loop]
        M --> J
        L --> N[Format Conversion]
        N --> O[CDN Upload]
    end
```

### Model Pipeline Details

Atelier employs a multi-stage model pipeline optimized for different creative outputs:

**Stage 1: Prompt Processing**
- Semantic analysis and enhancement
- Brand guideline injection
- Safety content filtering
- Style parameter extraction

**Stage 2: Core Generation**
- Latent diffusion processing
- Attention mechanism optimization
- Conditional generation based on parameters
- Multi-step denoising (20-50 steps based on quality setting)

**Stage 3: Refinement**
- Face correction for human subjects
- Detail enhancement pass
- Color correction and grading
- Artifact removal

**Stage 4: Output Processing**
- Resolution upscaling (up to 8K)
- Format conversion (PNG, JPEG, WebP, SVG)
- Metadata embedding
- Compression optimization

## Data Flow Architecture

### Generation Request Flow

```mermaid
sequenceDiagram
    participant Client
    participant Gateway
    participant Atelier
    participant Queue
    participant Worker
    participant Storage
    participant CDN

    Client->>Gateway: POST /generate
    Gateway->>Gateway: Authenticate
    Gateway->>Atelier: Forward Request
    Atelier->>Atelier: Validate & Debit Credits
    Atelier->>Queue: Enqueue Job
    Atelier-->>Client: 202 Accepted + Job ID

    Queue->>Worker: Dispatch Job
    Worker->>Worker: Generate Image
    Worker->>Storage: Store Result
    Storage->>CDN: Replicate Asset
    Worker->>Atelier: Job Complete
    Atelier-->>Client: Webhook Notification

    Client->>Gateway: GET /projects/:id
    Gateway->>Atelier: Fetch Result
    Atelier->>Storage: Retrieve Metadata
    Atelier-->>Client: 200 OK + Image URLs
```

### Asset Storage Architecture

Generated assets flow through a tiered storage system optimized for different access patterns:

```mermaid
flowchart LR
    A[Generation Complete] --> B[Hot Storage]
    B -->|24 hours| C[Warm Storage]
    C -->|30 days| D[Cold Storage]

    B --> E[CDN Edge Cache]
    E --> F[Global Distribution]

    subgraph Retention Policy
        G[Starter: 7 days]
        H[Professional: 90 days]
        I[Studio: 1 year]
    end
```

**Storage Specifications:**

| Tier | Storage Type | Access Latency | Cost |
|------|--------------|----------------|------|
| Hot | NVMe SSD | <10ms | High |
| Warm | SSD | <100ms | Medium |
| Cold | Object Storage | <1s | Low |
| Archive | Glacier-class | Minutes | Minimal |

## Integration Architecture

### Nexus Core Services Integration

Atelier integrates with core Nexus services for AI processing, caching, and file management:

```mermaid
flowchart TB
    subgraph Atelier Plugin
        A[Generation Engine]
    end

    subgraph MageAgent Service
        B[AI Model Hosting]
        C[Inference API]
        D[Model Versioning]
    end

    subgraph GraphRAG Service
        E[Prompt Cache]
        F[Style Embeddings]
        G[Brand Profiles]
    end

    subgraph FileProcess Service
        H[Image Processing]
        I[Format Conversion]
        J[CDN Management]
    end

    A <--> C
    A <--> E
    A <--> H

    B --> C
    D --> C

    F --> E
    G --> E

    I --> H
    J --> H
```

**Service Communication:**

| Service | Protocol | Port | Authentication |
|---------|----------|------|----------------|
| MageAgent | gRPC | 50051 | mTLS |
| GraphRAG | REST | 8080 | Service Token |
| FileProcess | REST | 8081 | Service Token |
| Billing | gRPC | 50052 | mTLS |

### Webhook Architecture

Atelier supports robust webhook delivery for asynchronous notification of generation events:

```mermaid
flowchart TD
    A[Event Triggered] --> B[Webhook Queue]
    B --> C{Delivery Attempt}
    C -->|Success| D[Mark Delivered]
    C -->|Failure| E{Retry Count}
    E -->|< 5| F[Exponential Backoff]
    F --> C
    E -->|>= 5| G[Dead Letter Queue]
    G --> H[Alert Operations]
```

**Webhook Payload Example:**

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

## Deployment Architecture

### Kubernetes Deployment

Atelier deploys as a containerized workload with horizontal pod autoscaling based on queue depth and GPU utilization:

```mermaid
flowchart TB
    subgraph Kubernetes Cluster
        subgraph Atelier Namespace
            A[Ingress Controller] --> B[Service]
            B --> C[Pod 1]
            B --> D[Pod 2]
            B --> E[Pod N]

            F[HPA] --> B
            G[ConfigMap] --> C & D & E
            H[Secrets] --> C & D & E
        end

        subgraph GPU Node Pool
            I[GPU Node 1]
            J[GPU Node 2]
            K[GPU Node N]
        end

        C --> I
        D --> J
        E --> K
    end
```

**Resource Specifications:**

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

### High Availability Configuration

```mermaid
flowchart TB
    subgraph Region A
        A1[Load Balancer] --> A2[Atelier Pods]
        A2 --> A3[GPU Nodes]
        A4[(Primary DB)]
    end

    subgraph Region B
        B1[Load Balancer] --> B2[Atelier Pods]
        B2 --> B3[GPU Nodes]
        B4[(Replica DB)]
    end

    A4 <-->|Sync Replication| B4

    C[Global Load Balancer] --> A1
    C --> B1
```

## Security Architecture

### Data Protection

```mermaid
flowchart LR
    A[Client Request] -->|TLS 1.3| B[API Gateway]
    B -->|mTLS| C[Atelier Service]
    C -->|Encrypted| D[Storage]

    subgraph Encryption
        E[In Transit: TLS 1.3]
        F[At Rest: AES-256-GCM]
        G[Keys: HashiCorp Vault]
    end
```

**Security Controls:**

| Layer | Control | Implementation |
|-------|---------|----------------|
| Network | Encryption | TLS 1.3 mandatory |
| Authentication | API Keys | SHA-256 hashed, rotatable |
| Authorization | RBAC | Workspace-scoped permissions |
| Data | Encryption | AES-256-GCM at rest |
| Audit | Logging | Immutable audit trail |
| Compliance | GDPR | Data residency options |

### Content Safety Pipeline

All generated content passes through multi-stage safety filtering:

```mermaid
flowchart TD
    A[Input Prompt] --> B[Text Safety Filter]
    B --> C{Safe?}
    C -->|No| D[Reject Request]
    C -->|Yes| E[Generation]
    E --> F[Output Safety Filter]
    F --> G{Safe?}
    G -->|No| H[Regenerate/Block]
    G -->|Yes| I[Deliver to Client]
```

## Performance Specifications

### Latency Targets

| Operation | P50 | P95 | P99 |
|-----------|-----|-----|-----|
| API Response | 150ms | 300ms | 500ms |
| Standard Generation (1024px) | 15s | 25s | 35s |
| High Quality Generation (2048px) | 30s | 45s | 60s |
| Ultra Quality Generation (4096px) | 60s | 90s | 120s |
| Webhook Delivery | 500ms | 2s | 5s |

### Throughput Capacity

| Tier | Concurrent Jobs | Jobs/Hour | Peak Burst |
|------|-----------------|-----------|------------|
| Starter | 2 | 20 | 5 |
| Professional | 5 | 100 | 15 |
| Studio | 20 | Unlimited | 50 |

## Monitoring and Observability

### Metrics Collection

```mermaid
flowchart LR
    A[Atelier Pods] -->|Prometheus| B[Metrics Server]
    A -->|Structured Logs| C[Log Aggregator]
    A -->|Traces| D[Jaeger]

    B --> E[Grafana Dashboards]
    C --> F[Elasticsearch]
    D --> G[Trace Analysis]

    E & F & G --> H[Alerting System]
    H --> I[PagerDuty]
    H --> J[Slack]
```

**Key Metrics Monitored:**

- Generation success rate
- Queue depth and wait times
- GPU utilization and temperature
- API latency percentiles
- Credit consumption rates
- Error rates by type

## API Specifications Summary

| Endpoint | Method | Timeout | Rate Limit |
|----------|--------|---------|------------|
| `/api/v1/atelier/generate` | POST | 600s | 10/min |
| `/api/v1/atelier/book-covers` | POST | 600s | 5/min |
| `/api/v1/atelier/characters` | POST | 600s | 5/min |
| `/api/v1/atelier/projects/:id` | GET | 30s | 60/min |

For complete API documentation, see [API Reference](docs/api-reference/endpoints.md).

## Further Reading

- [Quick Start Guide](QUICKSTART.md) - Get up and running quickly
- [Use Cases](USE-CASES.md) - Real-world implementation patterns
- [API Reference](docs/api-reference/endpoints.md) - Complete endpoint documentation
- [Security Whitepaper](docs/security/overview.md) - Detailed security architecture
