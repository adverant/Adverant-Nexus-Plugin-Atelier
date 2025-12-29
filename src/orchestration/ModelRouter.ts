/**
 * Model Router
 * Intelligent routing to optimal AI models based on task requirements
 */

import { RoutingDecision, JobParams, QualityTier } from '../types';
import MageAgentClient from '../integrations/MageAgentClient';

export class ModelRouter {
  /**
   * Route to best model for video generation
   */
  async routeVideoGeneration(
    params: JobParams,
    quality: QualityTier
  ): Promise<RoutingDecision> {
    const taskType = params.type;
    const complexity = this.calculateComplexity(params, quality);

    try {
      // Try MageAgent for intelligent routing
      return await MageAgentClient.selectModel(taskType, complexity);
    } catch (error) {
      // Fallback to rule-based routing
      return this.ruleBasedVideoRouting(params, quality);
    }
  }

  /**
   * Route to best model for image generation
   */
  async routeImageGeneration(
    params: JobParams,
    quality: QualityTier
  ): Promise<RoutingDecision> {
    // Draft mode: use fast local models
    if (quality === 'draft') {
      return {
        model: 'sdxl-turbo',
        provider: 'local-sandbox',
        endpoint: 'sandbox://sdxl-turbo',
        expected_latency_ms: 3000,
        expected_cost_usd: 0,
        quality_score: 0.7,
        confidence: 0.95,
      };
    }

    // Standard/HD/Premium: use external APIs
    const complexity = this.calculateComplexity(params, quality);

    try {
      return await MageAgentClient.selectModel('text-to-image', complexity);
    } catch (error) {
      return this.ruleBasedImageRouting(quality);
    }
  }

  /**
   * Route to best model for audio generation
   */
  async routeAudioGeneration(
    params: JobParams
  ): Promise<RoutingDecision> {
    const audioParams = params as any;
    const audioType = audioParams.audio_type;

    if (audioType === 'voiceover') {
      return {
        model: 'elevenlabs-turbo',
        provider: 'elevenlabs',
        endpoint: 'https://api.elevenlabs.io/v1/text-to-speech',
        expected_latency_ms: 5000,
        expected_cost_usd: 0.30,
        quality_score: 0.88,
        confidence: 0.9,
      };
    } else if (audioType === 'soundtrack') {
      return {
        model: 'firefly-audio',
        provider: 'adobe',
        endpoint: 'https://firefly-api.adobe.io/v2/audio/generate',
        expected_latency_ms: 15000,
        expected_cost_usd: 0.15,
        quality_score: 0.85,
        confidence: 0.85,
      };
    }

    // Default for sound effects
    return {
      model: 'firefly-sfx',
      provider: 'adobe',
      endpoint: 'https://firefly-api.adobe.io/v2/audio/sfx',
      expected_latency_ms: 8000,
      expected_cost_usd: 0.10,
      quality_score: 0.8,
      confidence: 0.8,
    };
  }

  private calculateComplexity(params: JobParams, quality: QualityTier): number {
    let complexity = 0.5; // Base complexity

    // Quality tier affects complexity
    if (quality === 'premium') complexity += 0.3;
    else if (quality === 'hd') complexity += 0.2;
    else if (quality === 'standard') complexity += 0.1;

    // Task-specific complexity
    if (params.type === 'text-to-video') {
      const videoParams = params as any;
      if (videoParams.duration_seconds > 10) complexity += 0.1;
      if (videoParams.camera_controls) complexity += 0.1;
      if (videoParams.reference_images?.length > 0) complexity += 0.1;
    } else if (params.type === 'image-to-video') {
      const videoParams = params as any;
      if (videoParams.keyframes && videoParams.keyframes.length > 2) complexity += 0.15;
    }

    return Math.min(complexity, 1.0);
  }

  private ruleBasedVideoRouting(_params: JobParams, quality: QualityTier): RoutingDecision {
    // Premium quality → Runway Gen-4 or Veo 2
    if (quality === 'premium') {
      return {
        model: 'runway-gen4',
        provider: 'runway',
        endpoint: 'https://api.runwayml.com/v1/generate',
        expected_latency_ms: 60000,
        expected_cost_usd: 0.20,
        quality_score: 0.95,
        confidence: 0.9,
      };
    }

    // Standard/HD → Luma or Pika
    return {
      model: 'luma-dream-machine',
      provider: 'luma',
      endpoint: 'https://api.lumalabs.ai/v1/generate',
      expected_latency_ms: 45000,
      expected_cost_usd: 0.10,
      quality_score: 0.85,
      confidence: 0.85,
    };
  }

  private ruleBasedImageRouting(quality: QualityTier): RoutingDecision {
    if (quality === 'premium') {
      return {
        model: 'dall-e-3',
        provider: 'openai',
        endpoint: 'https://api.openai.com/v1/images/generations',
        expected_latency_ms: 12000,
        expected_cost_usd: 0.08,
        quality_score: 0.9,
        confidence: 0.9,
      };
    }

    return {
      model: 'dall-e-3',
      provider: 'openai',
      endpoint: 'https://api.openai.com/v1/images/generations',
      expected_latency_ms: 10000,
      expected_cost_usd: 0.04,
      quality_score: 0.85,
      confidence: 0.9,
    };
  }
}

export default new ModelRouter();
