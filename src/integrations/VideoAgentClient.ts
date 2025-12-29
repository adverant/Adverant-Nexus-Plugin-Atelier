/**
 * VideoAgent Client
 * Integration with Nexus VideoAgent for video processing
 */

import axios, { AxiosInstance } from 'axios';
import { config } from '../utils/config';
import { logger } from '../utils/logger';

export class VideoAgentClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: config.services.videoagent_url,
      timeout: 60000,
    });
  }

  async extractFrames(videoUrl: string, fps: number = 1): Promise<string[]> {
    try {
      const response = await this.client.post('/api/extract-frames', {
        video_url: videoUrl,
        fps,
      });
      return response.data.frame_urls || [];
    } catch (error) {
      logger.error('Frame extraction failed', error);
      return [];
    }
  }

  async analyzeVideo(videoUrl: string): Promise<{
    duration: number;
    resolution: string;
    fps: number;
    codec: string;
  }> {
    try {
      const response = await this.client.post('/api/analyze', {
        video_url: videoUrl,
      });
      return response.data;
    } catch (error) {
      logger.error('Video analysis failed', error);
      throw error;
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/health');
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }
}

export default new VideoAgentClient();
