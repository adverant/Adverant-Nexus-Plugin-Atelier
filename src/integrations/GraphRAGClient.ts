/**
 * GraphRAG Client
 * Integration with Nexus GraphRAG service for memory and knowledge management
 */

import axios, { AxiosInstance } from 'axios';
import { config } from '../utils/config';
import { logger } from '../utils/logger';
import { GraphRAGDocument, GraphRAGQuery } from '../types';

export class GraphRAGClient {
  private client: AxiosInstance;
  private baseURL: string;

  constructor() {
    this.baseURL = config.services.graphrag_url;
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        logger.error('GraphRAG API error', error, {
          url: error.config?.url,
          status: error.response?.status,
        });
        throw error;
      }
    );
  }

  /**
   * Store project context in GraphRAG
   */
  async storeProjectContext(
    projectId: string,
    context: {
      name: string;
      description?: string;
      brand_guidelines?: Record<string, any>;
      characters?: Array<{ name: string; description: string; appearance?: string }>;
      style_guide?: string;
    }
  ): Promise<void> {
    try {
      const document: GraphRAGDocument = {
        content: JSON.stringify(context),
        title: `Project: ${context.name}`,
        metadata: {
          type: 'project_context',
          project_id: projectId,
          created_at: new Date().toISOString(),
        },
      };

      await this.client.post('/documents', document);
      logger.info('Stored project context in GraphRAG', { projectId });
    } catch (error) {
      logger.error('Failed to store project context', error, { projectId });
    }
  }

  /**
   * Recall project context
   */
  async recallProjectContext(projectId: string): Promise<any | null> {
    try {
      const query: GraphRAGQuery = {
        query: `project context for project_id: ${projectId}`,
        limit: 1,
        filters: {
          type: 'project_context',
          project_id: projectId,
        },
      };

      const response = await this.client.post('/query', query);

      if (response.data.results && response.data.results.length > 0) {
        return JSON.parse(response.data.results[0].content);
      }

      return null;
    } catch (error) {
      logger.error('Failed to recall project context', error, { projectId });
      return null;
    }
  }

  /**
   * Store character information
   */
  async storeCharacter(
    projectId: string,
    character: {
      name: string;
      description: string;
      appearance: string;
      traits?: string[];
    }
  ): Promise<void> {
    try {
      const document: GraphRAGDocument = {
        content: JSON.stringify(character),
        title: `Character: ${character.name}`,
        metadata: {
          type: 'character',
          project_id: projectId,
          character_name: character.name,
        },
      };

      await this.client.post('/documents', document);
      logger.info('Stored character in GraphRAG', { projectId, character: character.name });
    } catch (error) {
      logger.error('Failed to store character', error, { character: character.name });
    }
  }

  /**
   * Search similar assets
   */
  async searchSimilarAssets(
    query: string,
    assetType?: string,
    limit: number = 10
  ): Promise<Array<{ id: string; content: string; similarity: number }>> {
    try {
      const searchQuery: GraphRAGQuery = {
        query,
        limit,
        filters: assetType ? { asset_type: assetType } : undefined,
      };

      const response = await this.client.post('/query', searchQuery);
      return response.data.results || [];
    } catch (error) {
      logger.error('Asset search failed', error);
      return [];
    }
  }

  /**
   * Store brand guidelines
   */
  async storeBrandGuidelines(
    userId: string,
    guidelines: {
      colors?: string[];
      fonts?: string[];
      logo_url?: string;
      style_guide?: string;
      tone?: string;
    }
  ): Promise<void> {
    try {
      const document: GraphRAGDocument = {
        content: JSON.stringify(guidelines),
        title: `Brand Guidelines - User ${userId}`,
        metadata: {
          type: 'brand_guidelines',
          user_id: userId,
        },
      };

      await this.client.post('/documents', document);
    } catch (error) {
      logger.error('Failed to store brand guidelines', error);
    }
  }

  /**
   * Recall brand guidelines
   */
  async recallBrandGuidelines(userId: string): Promise<any | null> {
    try {
      const query: GraphRAGQuery = {
        query: `brand guidelines for user ${userId}`,
        limit: 1,
        filters: {
          type: 'brand_guidelines',
          user_id: userId,
        },
      };

      const response = await this.client.post('/query', query);

      if (response.data.results && response.data.results.length > 0) {
        return JSON.parse(response.data.results[0].content);
      }

      return null;
    } catch (error) {
      logger.error('Failed to recall brand guidelines', error);
      return null;
    }
  }

  /**
   * Store asset metadata for semantic search
   */
  async indexAsset(
    assetId: string,
    metadata: {
      type: string;
      prompt?: string;
      tags?: string[];
      description?: string;
      url: string;
    }
  ): Promise<void> {
    try {
      const document: GraphRAGDocument = {
        content: metadata.description || metadata.prompt || '',
        title: `Asset: ${assetId}`,
        metadata: {
          type: 'asset',
          asset_id: assetId,
          asset_type: metadata.type,
          tags: metadata.tags,
          url: metadata.url,
        },
      };

      await this.client.post('/documents', document);
    } catch (error) {
      logger.error('Failed to index asset', error, { assetId });
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
}

export default new GraphRAGClient();
