/**
 * Job Queue Manager
 * BullMQ-based job queue for async processing
 */

import { Queue, Worker, Job as BullJob } from 'bullmq';
import Redis from 'ioredis';
import { config } from '../utils/config';
import { logger } from '../utils/logger';
import { Job, JobType } from '../types';
import JobRepository from '../models/JobRepository';
import VideoGeneratorService from '../services/VideoGeneratorService';
import ImageGeneratorService from '../services/ImageGeneratorService';
import AudioGeneratorService from '../services/AudioGeneratorService';

export class JobQueueManager {
  private connection: Redis;
  private queues: Map<JobType, Queue>;
  private workers: Map<JobType, Worker>;

  constructor() {
    this.connection = new Redis(config.redis_url, {
      maxRetriesPerRequest: null,
    });

    this.queues = new Map();
    this.workers = new Map();

    this.initializeQueues();
  }

  private initializeQueues() {
    const jobTypes: JobType[] = ['video', 'image', 'audio', 'workflow'];

    for (const type of jobTypes) {
      // Create queue
      const queue = new Queue(type, { connection: this.connection });
      this.queues.set(type, queue);

      // Create worker
      const concurrency = this.getConcurrency(type);
      const worker = new Worker(
        type,
        async (bullJob: BullJob) => this.processJob(bullJob),
        {
          connection: this.connection.duplicate(),
          concurrency,
        }
      );

      // Worker event handlers
      worker.on('completed', (job) => {
        logger.info('Job completed', { jobId: job.id, type });
      });

      worker.on('failed', (job, err) => {
        logger.error('Job failed', err, { jobId: job?.id, type });
      });

      worker.on('progress', (job, progress) => {
        logger.debug('Job progress', { jobId: job.id, progress, type });
      });

      this.workers.set(type, worker);

      logger.info('Job queue initialized', { type, concurrency });
    }
  }

  async enqueueJob(job: Job): Promise<void> {
    const queue = this.queues.get(job.type);
    if (!queue) {
      throw new Error(`No queue found for job type: ${job.type}`);
    }

    await queue.add(
      job.type,
      { jobId: job.id },
      {
        jobId: job.id,
        priority: 10 - job.priority, // BullMQ: lower number = higher priority
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: {
          age: 86400, // Keep for 24 hours
          count: 1000,
        },
        removeOnFail: {
          age: 604800, // Keep for 7 days
        },
      }
    );

    logger.info('Job enqueued', {
      jobId: job.id,
      type: job.type,
      priority: job.priority,
    });
  }

  private async processJob(bullJob: BullJob): Promise<void> {
    const { jobId } = bullJob.data;

    logger.info('Processing job', { jobId, queueType: bullJob.queueName });

    // Fetch job from database
    const job = await JobRepository.findById(jobId);
    if (!job) {
      throw new Error(`Job not found: ${jobId}`);
    }

    // Process based on type
    try {
      if (job.type === 'video') {
        await VideoGeneratorService.processVideoJob(job);
      } else if (job.type === 'image') {
        await ImageGeneratorService.processImageJob(job);
      } else if (job.type === 'audio') {
        await AudioGeneratorService.processAudioJob(job);
      } else {
        throw new Error(`Unknown job type: ${job.type}`);
      }

      // Update progress (for WebSocket streaming)
      await bullJob.updateProgress(100);
    } catch (error) {
      logger.error('Job processing error', error, { jobId });
      throw error;
    }
  }

  async getQueueStats(type: JobType): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
  }> {
    const queue = this.queues.get(type);
    if (!queue) {
      return { waiting: 0, active: 0, completed: 0, failed: 0 };
    }

    const counts = await queue.getJobCounts();
    return {
      waiting: counts.waiting || 0,
      active: counts.active || 0,
      completed: counts.completed || 0,
      failed: counts.failed || 0,
    };
  }

  async close(): Promise<void> {
    for (const worker of this.workers.values()) {
      await worker.close();
    }
    for (const queue of this.queues.values()) {
      await queue.close();
    }
    await this.connection.quit();
    logger.info('Job queue manager closed');
  }

  private getConcurrency(type: JobType): number {
    const concurrencyMap: Record<JobType, number> = {
      video: config.queue.video_concurrency,
      image: config.queue.image_concurrency,
      audio: config.queue.audio_concurrency,
      workflow: 5,
    };
    return concurrencyMap[type] || 10;
  }
}

export default new JobQueueManager();
