/**
 * API Routes
 * REST API endpoints for Nexus-Atelier
 */

import { Router, Request, Response } from 'express';
import { logger } from '../utils/logger';
import { APIResponse } from '../types';
import VideoGeneratorService from '../services/VideoGeneratorService';
import ImageGeneratorService from '../services/ImageGeneratorService';
import AudioGeneratorService from '../services/AudioGeneratorService';
import JobRepository from '../models/JobRepository';
import AssetRepository from '../models/AssetRepository';
import JobQueueManager from '../queue/JobQueueManager';

const router = Router();

// Helper function for API responses
function successResponse<T>(data: T, metadata?: Record<string, any>): APIResponse<T> {
  return {
    success: true,
    data,
    metadata: {
      request_id: Math.random().toString(36).substring(7),
      timestamp: new Date().toISOString(),
      latency_ms: 0,
      ...metadata,
    },
  };
}

function errorResponse(code: string, message: string, details?: Record<string, any>): APIResponse {
  return {
    success: false,
    error: {
      code,
      message,
      details,
    },
  };
}

// ============================================================================
// Video Generation Routes
// ============================================================================

router.post('/video/generate/text', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string || 'demo-user';
    const { prompt, style, duration_seconds, resolution, quality, ...rest } = req.body;

    if (!prompt) {
      return res.status(400).json(errorResponse('MISSING_PROMPT', 'Prompt is required'));
    }

    const job = await VideoGeneratorService.generateFromText(
      userId,
      {
        type: 'text-to-video',
        prompt,
        style: style || 'cinematic',
        duration_seconds: duration_seconds || 10,
        resolution: resolution || '1920x1080',
        quality: quality || 'standard',
        ...rest,
      },
      req.body.project_id
    );

    await JobQueueManager.enqueueJob(job);

    return res.status(202).json(successResponse({ job_id: job.id, status: job.status }));
  } catch (error) {
    logger.error('Video generation endpoint error', error);
    return res.status(500).json(errorResponse('INTERNAL_ERROR', 'Failed to create video generation job'));
  }
});

router.post('/video/generate/image', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string || 'demo-user';
    const { image_url, duration_seconds, motion_intensity, ...rest } = req.body;

    if (!image_url) {
      return res.status(400).json(errorResponse('MISSING_IMAGE', 'Image URL is required'));
    }

    const job = await VideoGeneratorService.generateFromImage(
      userId,
      {
        type: 'image-to-video',
        image_url,
        duration_seconds: duration_seconds || 5,
        motion_intensity: motion_intensity || 5,
        ...rest,
      },
      req.body.project_id
    );

    await JobQueueManager.enqueueJob(job);

    return res.status(202).json(successResponse({ job_id: job.id, status: job.status }));
  } catch (error) {
    logger.error('Image-to-video endpoint error', error);
    return res.status(500).json(errorResponse('INTERNAL_ERROR', 'Failed to create image-to-video job'));
  }
});

// ============================================================================
// Image Generation Routes
// ============================================================================

router.post('/image/generate/text', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string || 'demo-user';
    const { prompt, resolution, quality, ...rest } = req.body;

    if (!prompt) {
      return res.status(400).json(errorResponse('MISSING_PROMPT', 'Prompt is required'));
    }

    const job = await ImageGeneratorService.generateFromText(
      userId,
      {
        type: 'text-to-image',
        prompt,
        resolution: resolution || '1024x1024',
        quality: quality || 'standard',
        ...rest,
      },
      req.body.project_id
    );

    await JobQueueManager.enqueueJob(job);

    return res.status(202).json(successResponse({ job_id: job.id, status: job.status }));
  } catch (error) {
    logger.error('Image generation endpoint error', error);
    return res.status(500).json(errorResponse('INTERNAL_ERROR', 'Failed to create image generation job'));
  }
});

// ============================================================================
// Audio Generation Routes
// ============================================================================

router.post('/audio/generate', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string || 'demo-user';
    const { audio_type, prompt, duration_seconds, ...rest } = req.body;

    if (!audio_type || !prompt) {
      return res.status(400).json(errorResponse('MISSING_PARAMS', 'Audio type and prompt are required'));
    }

    const job = await AudioGeneratorService.generateAudio(
      userId,
      {
        type: 'audio-generation',
        audio_type,
        prompt,
        duration_seconds: duration_seconds || 30,
        ...rest,
      },
      req.body.project_id
    );

    await JobQueueManager.enqueueJob(job);

    return res.status(202).json(successResponse({ job_id: job.id, status: job.status }));
  } catch (error) {
    logger.error('Audio generation endpoint error', error);
    return res.status(500).json(errorResponse('INTERNAL_ERROR', 'Failed to create audio generation job'));
  }
});

// ============================================================================
// Job Status Routes
// ============================================================================

router.get('/jobs/:jobId', async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    const job = await JobRepository.findById(jobId);

    if (!job) {
      return res.status(404).json(errorResponse('JOB_NOT_FOUND', 'Job not found'));
    }

    return res.json(successResponse(job));
  } catch (error) {
    logger.error('Job status endpoint error', error);
    return res.status(500).json(errorResponse('INTERNAL_ERROR', 'Failed to fetch job status'));
  }
});

router.get('/jobs/:jobId/result', async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    const job = await JobRepository.findById(jobId);

    if (!job) {
      return res.status(404).json(errorResponse('JOB_NOT_FOUND', 'Job not found'));
    }

    if (job.status !== 'completed') {
      return res.status(400).json(errorResponse('JOB_NOT_COMPLETED', 'Job is not completed yet', { status: job.status }));
    }

    return res.json(successResponse(job.result));
  } catch (error) {
    logger.error('Job result endpoint error', error);
    return res.status(500).json(errorResponse('INTERNAL_ERROR', 'Failed to fetch job result'));
  }
});

// ============================================================================
// Asset Routes
// ============================================================================

router.get('/assets', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string || 'demo-user';
    const type = req.query.type as string | undefined;
    const limit = parseInt(req.query.limit as string || '50', 10);
    const offset = parseInt(req.query.offset as string || '0', 10);

    const assets = await AssetRepository.findByUser(userId, type as any, limit, offset);

    return res.json(successResponse(assets));
  } catch (error) {
    logger.error('Assets list endpoint error', error);
    return res.status(500).json(errorResponse('INTERNAL_ERROR', 'Failed to fetch assets'));
  }
});

router.get('/assets/:assetId', async (req: Request, res: Response) => {
  try {
    const { assetId } = req.params;
    const asset = await AssetRepository.findById(assetId);

    if (!asset) {
      return res.status(404).json(errorResponse('ASSET_NOT_FOUND', 'Asset not found'));
    }

    return res.json(successResponse(asset));
  } catch (error) {
    logger.error('Asset detail endpoint error', error);
    return res.status(500).json(errorResponse('INTERNAL_ERROR', 'Failed to fetch asset'));
  }
});

// ============================================================================
// Queue Stats Routes
// ============================================================================

router.get('/queue/stats', async (req: Request, res: Response) => {
  try {
    const type = req.query.type as string | undefined;

    const stats = type
      ? await JobQueueManager.getQueueStats(type as any)
      : {
          video: await JobQueueManager.getQueueStats('video'),
          image: await JobQueueManager.getQueueStats('image'),
          audio: await JobQueueManager.getQueueStats('audio'),
        };

    return res.json(successResponse(stats));
  } catch (error) {
    logger.error('Queue stats endpoint error', error);
    return res.status(500).json(errorResponse('INTERNAL_ERROR', 'Failed to fetch queue stats'));
  }
});

// ============================================================================
// Health Check Routes
// ============================================================================

router.get('/health', async (_req: Request, res: Response) => {
  return res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

router.get('/health/ready', async (_req: Request, res: Response) => {
  try {
    const dbHealthy = await require('../utils/database').db.healthCheck();

    if (!dbHealthy) {
      return res.status(503).json({ status: 'not_ready', reason: 'database_unavailable' });
    }

    return res.json({ status: 'ready', timestamp: new Date().toISOString() });
  } catch (error) {
    return res.status(503).json({ status: 'not_ready', error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

export default router;
