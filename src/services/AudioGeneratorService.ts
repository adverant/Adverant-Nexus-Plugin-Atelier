/**
 * Audio Generator Service
 * Handles audio generation (soundtracks, voiceovers, sound effects)
 */

import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';
import { Job, AudioGenerationParams, JobResult } from '../types';
import JobRepository from '../models/JobRepository';
import AssetRepository from '../models/AssetRepository';
import ModelRouter from '../orchestration/ModelRouter';

export class AudioGeneratorService {
  async generateAudio(
    userId: string,
    params: AudioGenerationParams,
    projectId?: string
  ): Promise<Job> {
    const job = await JobRepository.create(userId, 'audio', params, projectId);

    logger.info('Audio generation job created', {
      jobId: job.id,
      userId,
      audioType: params.audio_type,
    });

    return job;
  }

  async processAudioJob(job: Job): Promise<JobResult> {
    // const startTime = Date.now();

    try {
      await JobRepository.updateStatus(job.id, 'processing');

      const params = job.params as AudioGenerationParams;
      const routing = await ModelRouter.routeAudioGeneration(params);

      logger.info('Generating audio with model', {
        jobId: job.id,
        model: routing.model,
        audioType: params.audio_type,
      });

      await this.simulateGeneration(routing.expected_latency_ms);

      const assetId = uuidv4();
      const audioUrl = `https://cdn.nexus-atelier.com/audio/${assetId}.mp3`;

      const asset = await AssetRepository.create(
        job.user_id,
        'audio',
        audioUrl,
        {
          channels: 2,
          sample_rate: 44100,
          custom: {
            duration_seconds: params.duration_seconds || 30,
            format: 'mp3',
          },
        },
        job.id,
        job.project_id
      );

      const result: JobResult = {
        asset_id: asset.id,
        url: audioUrl,
        metadata: {
          duration: params.duration_seconds || 30,
          format: 'mp3',
        },
        quality_score: routing.quality_score,
        model_used: routing.model,
      };

      await JobRepository.setResult(job.id, result);

      logger.info('Audio generation completed', { jobId: job.id, assetId: asset.id });

      return result;
    } catch (error) {
      logger.error('Audio generation failed', error, { jobId: job.id });
      await JobRepository.setError(job.id, {
        code: 'GENERATION_FAILED',
        message: error instanceof Error ? error.message : 'Unknown error',
        retryable: true,
      });
      throw error;
    }
  }

  private async simulateGeneration(expectedLatency: number): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, Math.min(expectedLatency / 10, 3000)));
  }
}

export default new AudioGeneratorService();
