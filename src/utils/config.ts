/**
 * Configuration Management
 * Loads and validates environment variables
 */

import dotenv from 'dotenv';
import { AtelierConfig } from '../types';

dotenv.config();

function getEnv(key: string, defaultValue?: string): string {
  const value = process.env[key];
  if (!value && !defaultValue) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value || defaultValue!;
}

function getEnvNumber(key: string, defaultValue: number): number {
  const value = process.env[key];
  return value ? parseInt(value, 10) : defaultValue;
}

function getEnvBoolean(key: string, defaultValue: boolean): boolean {
  const value = process.env[key];
  return value ? value.toLowerCase() === 'true' : defaultValue;
}

export const config: AtelierConfig = {
  port: getEnvNumber('PORT', 9130),
  ws_port: getEnvNumber('WS_PORT', 9131),
  database_url: getEnv('DATABASE_URL'),
  redis_url: getEnv('REDIS_URL', 'redis://localhost:6379'),
  minio_endpoint: getEnv('MINIO_ENDPOINT', 'localhost'),
  minio_bucket: getEnv('MINIO_BUCKET', 'nexus-atelier'),
  services: {
    mageagent_url: getEnv('MAGEAGENT_URL', 'http://localhost:9080'),
    graphrag_url: getEnv('GRAPHRAG_URL', 'http://localhost:9090'),
    videoagent_url: getEnv('VIDEOAGENT_URL', 'http://localhost:9200'),
    fileprocess_url: getEnv('FILEPROCESS_URL', 'http://localhost:9096'),
    sandbox_url: getEnv('SANDBOX_URL', 'http://localhost:9095'),
    auth_service_url: getEnv('AUTH_SERVICE_URL', 'http://localhost:9101'),
  },
  queue: {
    video_concurrency: getEnvNumber('QUEUE_CONCURRENCY_VIDEO', 10),
    image_concurrency: getEnvNumber('QUEUE_CONCURRENCY_IMAGE', 50),
    audio_concurrency: getEnvNumber('QUEUE_CONCURRENCY_AUDIO', 20),
  },
  features: {
    draft_mode: getEnvBoolean('ENABLE_DRAFT_MODE', true),
    consensus_mode: getEnvBoolean('ENABLE_CONSENSUS_MODE', true),
    personalization: getEnvBoolean('ENABLE_PERSONALIZATION', true),
  },
  limits: {
    max_video_duration: getEnvNumber('MAX_VIDEO_DURATION', 60),
    max_image_resolution: getEnv('MAX_IMAGE_RESOLUTION', '4096x4096'),
    max_file_size_bytes: getEnvNumber('MAX_FILE_SIZE_BYTES', 5368709120), // 5GB
  },
};

export default config;
