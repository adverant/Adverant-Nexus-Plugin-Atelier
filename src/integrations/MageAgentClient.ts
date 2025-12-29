/**
 * MageAgent Client
 * Integration with Nexus MageAgent service for AI orchestration
 */

import axios, { AxiosInstance } from 'axios';
import { config } from '../utils/config';
import { logger } from '../utils/logger';
import { MageAgentRequest, MageAgentResponse, RoutingDecision } from '../types';

export class MageAgentClient {
  private client: AxiosInstance;
  private baseURL: string;

  constructor() {
    this.baseURL = config.services.mageagent_url;
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 120000, // 2 minutes
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        logger.error('MageAgent API error', error, {
          url: error.config?.url,
          status: error.response?.status,
        });
        throw error;
      }
    );
  }

  /**
   * Select best model for a given task
   */
  async selectModel(
    taskType: string,
    complexity: number,
    constraints?: { max_cost?: number; max_latency?: number }
  ): Promise<RoutingDecision> {
    try {
      const response = await this.client.post('/api/model-selection', {
        task_type: taskType,
        complexity,
        constraints,
      });

      return {
        model: response.data.model,
        provider: response.data.provider,
        endpoint: response.data.endpoint,
        expected_latency_ms: response.data.expected_latency_ms,
        expected_cost_usd: response.data.expected_cost_usd,
        quality_score: response.data.quality_score,
        confidence: response.data.confidence,
      };
    } catch (error) {
      logger.warn('Model selection failed, using default', { taskType, error });

      // Fallback to default routing
      return this.getDefaultRouting(taskType);
    }
  }

  /**
   * Enhance text prompt using AI
   */
  async enhancePrompt(
    prompt: string,
    context?: string,
    style?: string
  ): Promise<string> {
    try {
      const request: MageAgentRequest = {
        task: `Enhance this creative prompt with more vivid details and cinematic descriptions: "${prompt}"${style ? ` Style: ${style}` : ''}${context ? ` Context: ${context}` : ''}`,
        max_tokens: 500,
        temperature: 0.7,
      };

      const response = await this.client.post<MageAgentResponse>('/api/complete', request);
      return response.data.result;
    } catch (error) {
      logger.error('Prompt enhancement failed', error);
      return prompt; // Return original if enhancement fails
    }
  }

  /**
   * Multi-agent consensus validation
   */
  async validateWithConsensus(
    content: string,
    criteria: string[],
    numAgents: number = 3
  ): Promise<{ score: number; feedback: string[]; passed: boolean }> {
    try {
      const response = await this.client.post('/api/consensus-validate', {
        content,
        criteria,
        num_agents: numAgents,
      });

      return {
        score: response.data.score,
        feedback: response.data.feedback,
        passed: response.data.score >= 0.7,
      };
    } catch (error) {
      logger.error('Consensus validation failed', error);
      return { score: 0.5, feedback: [], passed: false };
    }
  }

  /**
   * Analyze content quality
   */
  async analyzeQuality(
    assetUrl: string,
    assetType: 'video' | 'image' | 'audio'
  ): Promise<{ quality_score: number; issues: string[]; suggestions: string[] }> {
    try {
      const response = await this.client.post('/api/analyze-quality', {
        asset_url: assetUrl,
        asset_type: assetType,
      });

      return {
        quality_score: response.data.quality_score,
        issues: response.data.issues || [],
        suggestions: response.data.suggestions || [],
      };
    } catch (error) {
      logger.error('Quality analysis failed', error);
      return { quality_score: 0.7, issues: [], suggestions: [] };
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/health');
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }

  private getDefaultRouting(taskType: string): RoutingDecision {
    // Fallback routing decisions
    const defaults: Record<string, RoutingDecision> = {
      'text-to-video': {
        model: 'runway-gen4',
        provider: 'runway',
        endpoint: 'https://api.runwayml.com/v1/generate',
        expected_latency_ms: 45000,
        expected_cost_usd: 0.12,
        quality_score: 0.9,
        confidence: 0.8,
      },
      'text-to-image': {
        model: 'dall-e-3',
        provider: 'openai',
        endpoint: 'https://api.openai.com/v1/images/generations',
        expected_latency_ms: 12000,
        expected_cost_usd: 0.04,
        quality_score: 0.85,
        confidence: 0.9,
      },
      'audio-generation': {
        model: 'elevenlabs-turbo',
        provider: 'elevenlabs',
        endpoint: 'https://api.elevenlabs.io/v1/text-to-speech',
        expected_latency_ms: 8000,
        expected_cost_usd: 0.30,
        quality_score: 0.88,
        confidence: 0.85,
      },
    };

    return defaults[taskType] || defaults['text-to-image'];
  }
}

export default new MageAgentClient();
