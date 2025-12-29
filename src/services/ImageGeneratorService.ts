/**
 * Image Generator Service
 * Handles all image generation and editing operations
 */

import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';
import { Job, TextToImageParams, ImageEditParams, JobResult } from '../types';
import JobRepository from '../models/JobRepository';
import AssetRepository from '../models/AssetRepository';
import ModelRouter from '../orchestration/ModelRouter';
// import MageAgentClient from '../integrations/MageAgentClient';
import GraphRAGClient from '../integrations/GraphRAGClient';

export class ImageGeneratorService {
  /**
   * Generate image from text prompt
   */
  async generateFromText(
    userId: string,
    params: TextToImageParams,
    projectId?: string
  ): Promise<Job> {
    const job = await JobRepository.create(userId, 'image', params, projectId);

    logger.info('Image generation job created', {
      jobId: job.id,
      userId,
      quality: params.quality,
      resolution: params.resolution,
    });

    return job;
  }

  /**
   * Edit existing image
   */
  async editImage(
    userId: string,
    params: ImageEditParams,
    projectId?: string
  ): Promise<Job> {
    const job = await JobRepository.create(userId, 'image', params, projectId);

    logger.info('Image edit job created', {
      jobId: job.id,
      userId,
      operation: params.operation,
    });

    return job;
  }

  /**
   * Process image generation job
   */
  async processImageJob(job: Job): Promise<JobResult> {
    const startTime = Date.now();

    try {
      await JobRepository.updateStatus(job.id, 'processing');

      const params = job.params as TextToImageParams | ImageEditParams;
      const quality = (params as any).quality || 'standard';

      const routing = await ModelRouter.routeImageGeneration(params, quality);

      logger.info('Generating image with model', {
        jobId: job.id,
        model: routing.model,
        provider: routing.provider,
        quality,
      });

      // Simulate generation
      await this.simulateGeneration(routing.expected_latency_ms);

      const assetId = uuidv4();
      const imageUrl = `https://cdn.nexus-atelier.com/images/${assetId}.png`;

      const asset = await AssetRepository.create(
        job.user_id,
        'image',
        imageUrl,
        {
          width: 1024,
          height: 1024,
          custom: {
            format: 'png',
          },
        },
        job.id,
        job.project_id
      );

      await GraphRAGClient.indexAsset(asset.id, {
        type: 'image',
        prompt: (params as any).prompt,
        description: `Generated image: ${(params as any).prompt}`,
        url: imageUrl,
      });

      const result: JobResult = {
        asset_id: asset.id,
        url: imageUrl,
        metadata: {
          resolution: '1024x1024',
          format: 'png',
        },
        quality_score: routing.quality_score,
        model_used: routing.model,
      };

      await JobRepository.setResult(job.id, result);

      const duration = Date.now() - startTime;
      logger.info('Image generation completed', {
        jobId: job.id,
        assetId: asset.id,
        duration,
        model: routing.model,
      });

      return result;
    } catch (error) {
      logger.error('Image generation failed', error, { jobId: job.id });
      await JobRepository.setError(job.id, {
        code: 'GENERATION_FAILED',
        message: error instanceof Error ? error.message : 'Unknown error',
        retryable: true,
      });
      throw error;
    }
  }

  private async simulateGeneration(expectedLatency: number): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, Math.min(expectedLatency / 10, 5000)));
  }
}

export default new ImageGeneratorService();
