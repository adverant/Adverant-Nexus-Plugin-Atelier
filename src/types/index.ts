/**
 * Nexus-Atelier Core Types
 * Type definitions for the creative production platform
 */

// ============================================================================
// Job Types
// ============================================================================

export type JobType = 'video' | 'image' | 'audio' | 'workflow';
export type JobStatus = 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';
export type QualityTier = 'draft' | 'standard' | 'hd' | 'premium';
export type VideoStyle = 'cinematic' | 'animated' | 'photorealistic' | 'anime' | 'surreal';
export type ImageStyle = 'photorealistic' | 'oil_painting' | 'anime' | 'sketch' | 'watercolor';

export interface Job {
  id: string;
  user_id: string;
  project_id?: string;
  type: JobType;
  status: JobStatus;
  priority: number;
  params: JobParams;
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

export type JobParams =
  | TextToVideoParams
  | ImageToVideoParams
  | VideoToVideoParams
  | TextToImageParams
  | ImageEditParams
  | AudioGenerationParams
  | WorkflowParams;

export interface TextToVideoParams {
  type: 'text-to-video';
  prompt: string;
  style: VideoStyle;
  duration_seconds: number;
  resolution: string;
  quality: QualityTier;
  fps?: number;
  aspect_ratio?: string;
  camera_controls?: CameraControls;
  reference_images?: string[];
}

export interface ImageToVideoParams {
  type: 'image-to-video';
  image_url: string;
  prompt?: string;
  duration_seconds: number;
  motion_intensity: number;
  keyframes?: Keyframe[];
  camera_movement?: CameraMovement;
}

export interface VideoToVideoParams {
  type: 'video-to-video';
  video_url: string;
  operation: 'style_transfer' | 'add_object' | 'remove_object' | 'transform' | 'effect';
  prompt: string;
  effect_type?: string;
}

export interface TextToImageParams {
  type: 'text-to-image';
  prompt: string;
  style?: ImageStyle;
  resolution: string;
  quality: QualityTier;
  aspect_ratio?: string;
  variations?: number;
  seed?: number;
  negative_prompt?: string;
}

export interface ImageEditParams {
  type: 'image-edit';
  image_url: string;
  operation: 'inpaint' | 'outpaint' | 'erase' | 'expand' | 'background_remove';
  prompt?: string;
  mask?: string;
  expand_direction?: 'all' | 'top' | 'bottom' | 'left' | 'right';
}

export interface AudioGenerationParams {
  type: 'audio-generation';
  audio_type: 'soundtrack' | 'voiceover' | 'sound_effect';
  prompt: string;
  duration_seconds?: number;
  voice_id?: string;
  style?: string;
}

export interface WorkflowParams {
  type: 'workflow';
  workflow_type: 'storyboard' | 'magic_switch' | 'batch';
  data: Record<string, any>;
}

export interface CameraControls {
  lens_type?: string;
  movement?: string;
  depth_of_field?: string;
  angle?: string;
}

export interface CameraMovement {
  type: 'pan' | 'zoom' | 'dolly' | 'orbit' | 'track';
  intensity: number;
  direction?: string;
}

export interface Keyframe {
  time_seconds: number;
  properties: Record<string, any>;
}

export interface JobResult {
  asset_id: string;
  url: string;
  thumbnail_url?: string;
  metadata: Record<string, any>;
  quality_score?: number;
  model_used: string;
}

export interface JobError {
  code: string;
  message: string;
  details?: Record<string, any>;
  retryable: boolean;
  suggestion?: string;
}

// ============================================================================
// Asset Types
// ============================================================================

export type AssetType = 'video' | 'image' | 'audio';

export interface Asset {
  id: string;
  user_id: string;
  project_id?: string;
  job_id?: string;
  type: AssetType;
  url: string;
  thumbnail_url?: string;
  metadata: AssetMetadata;
  file_size?: number;
  duration_seconds?: number;
  resolution?: string;
  format?: string;
  created_at: Date;
}

export interface AssetMetadata {
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

// ============================================================================
// Project Types
// ============================================================================

export interface Project {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  tags?: string[];
  brand_guidelines?: BrandGuidelines;
  metadata?: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export interface BrandGuidelines {
  colors?: string[];
  fonts?: string[];
  logo_url?: string;
  style_guide?: string;
  tone?: string;
  custom_model_id?: string;
}

// ============================================================================
// Personalization Types
// ============================================================================

export interface PersonalizationProfile {
  user_id: string;
  ratings_count: number;
  style_preferences?: StylePreferences;
  favorite_models?: string[];
  preferred_quality?: QualityTier;
  avg_rating?: number;
  created_at: Date;
  updated_at: Date;
}

export interface StylePreferences {
  video_styles?: Record<VideoStyle, number>;
  image_styles?: Record<ImageStyle, number>;
  camera_preferences?: string[];
  color_palettes?: string[][];
}

export interface AssetRating {
  id: string;
  user_id: string;
  asset_id: string;
  rating: number;
  feedback?: string;
  created_at: Date;
}

// ============================================================================
// Storyboard Types
// ============================================================================

export interface Storyboard {
  id: string;
  user_id: string;
  project_id?: string;
  name: string;
  description?: string;
  total_duration_seconds?: number;
  status: 'draft' | 'generating' | 'completed' | 'failed';
  created_at: Date;
  updated_at: Date;
}

export interface StoryboardScene {
  id: string;
  storyboard_id: string;
  sequence_order: number;
  name?: string;
  description?: string;
  duration_seconds?: number;
  asset_id?: string;
  job_id?: string;
  camera_settings?: CameraControls;
  transition_in?: string;
  transition_out?: string;
  created_at: Date;
}

// ============================================================================
// Model Types
// ============================================================================

export interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  capabilities: ModelCapability[];
  cost_per_unit: number;
  avg_latency_ms: number;
  quality_score: number;
  availability: boolean;
}

export type ModelCapability =
  | 'text-to-video'
  | 'image-to-video'
  | 'video-to-video'
  | 'text-to-image'
  | 'image-edit'
  | 'audio-generation';

export interface RoutingDecision {
  model: string;
  provider: string;
  endpoint: string;
  expected_latency_ms: number;
  expected_cost_usd: number;
  quality_score: number;
  confidence: number;
}

// ============================================================================
// Integration Types
// ============================================================================

export interface MageAgentRequest {
  task: string;
  context?: Record<string, any>;
  model?: string;
  temperature?: number;
  max_tokens?: number;
}

export interface MageAgentResponse {
  result: string;
  model_used: string;
  tokens_used: number;
  cost_usd: number;
  latency_ms: number;
}

export interface GraphRAGDocument {
  content: string;
  title?: string;
  metadata?: Record<string, any>;
}

export interface GraphRAGQuery {
  query: string;
  limit?: number;
  filters?: Record<string, any>;
}

// ============================================================================
// API Types
// ============================================================================

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
  metadata?: {
    request_id: string;
    timestamp: string;
    latency_ms: number;
  };
}

export interface PaginatedResponse<T> extends APIResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    has_more: boolean;
  };
}

export interface JobProgressUpdate {
  job_id: string;
  status: JobStatus;
  progress: number;
  stage?: string;
  eta_ms?: number;
  metadata?: Record<string, any>;
}

// ============================================================================
// Configuration Types
// ============================================================================

export interface AtelierConfig {
  port: number;
  ws_port: number;
  database_url: string;
  redis_url: string;
  minio_endpoint: string;
  minio_bucket: string;
  services: {
    mageagent_url: string;
    graphrag_url: string;
    videoagent_url: string;
    fileprocess_url: string;
    sandbox_url: string;
    auth_service_url: string;
  };
  queue: {
    video_concurrency: number;
    image_concurrency: number;
    audio_concurrency: number;
  };
  features: {
    draft_mode: boolean;
    consensus_mode: boolean;
    personalization: boolean;
  };
  limits: {
    max_video_duration: number;
    max_image_resolution: string;
    max_file_size_bytes: number;
  };
}
