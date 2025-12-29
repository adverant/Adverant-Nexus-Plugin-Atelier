/**
 * Asset Repository
 * Database operations for assets
 */

import { db } from '../utils/database';
import { Asset, AssetType, AssetMetadata } from '../types';

export class AssetRepository {
  async create(
    userId: string,
    type: AssetType,
    url: string,
    metadata: AssetMetadata,
    jobId?: string,
    projectId?: string
  ): Promise<Asset> {
    const query = `
      INSERT INTO atelier.assets (
        user_id, project_id, job_id, type, url, metadata,
        file_size, duration_seconds, resolution, format
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;

    const result = await db.query<Asset>(query, [
      userId,
      projectId,
      jobId,
      type,
      url,
      JSON.stringify(metadata),
      metadata.custom?.file_size,
      metadata.custom?.duration_seconds,
      metadata.width && metadata.height ? `${metadata.width}x${metadata.height}` : null,
      metadata.custom?.format,
    ]);

    return result.rows[0];
  }

  async findById(id: string): Promise<Asset | null> {
    const query = 'SELECT * FROM atelier.assets WHERE id = $1';
    const result = await db.query<Asset>(query, [id]);
    return result.rows[0] || null;
  }

  async findByUser(
    userId: string,
    type?: AssetType,
    limit: number = 50,
    offset: number = 0
  ): Promise<Asset[]> {
    let query = 'SELECT * FROM atelier.assets WHERE user_id = $1';
    const params: any[] = [userId];

    if (type) {
      query += ' AND type = $2';
      params.push(type);
    }

    query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(limit, offset);

    const result = await db.query<Asset>(query, params);
    return result.rows;
  }

  async findByProject(projectId: string): Promise<Asset[]> {
    const query = 'SELECT * FROM atelier.assets WHERE project_id = $1 ORDER BY created_at DESC';
    const result = await db.query<Asset>(query, [projectId]);
    return result.rows;
  }

  async findByJob(jobId: string): Promise<Asset | null> {
    const query = 'SELECT * FROM atelier.assets WHERE job_id = $1 LIMIT 1';
    const result = await db.query<Asset>(query, [jobId]);
    return result.rows[0] || null;
  }

  async delete(id: string, userId: string): Promise<boolean> {
    const query = 'DELETE FROM atelier.assets WHERE id = $1 AND user_id = $2';
    const result = await db.query(query, [id, userId]);
    return (result.rowCount || 0) > 0;
  }

  async count(userId: string, type?: AssetType): Promise<number> {
    let query = 'SELECT COUNT(*) as count FROM atelier.assets WHERE user_id = $1';
    const params: any[] = [userId];

    if (type) {
      query += ' AND type = $2';
      params.push(type);
    }

    const result = await db.query<{ count: string }>(query, params);
    return parseInt(result.rows[0].count, 10);
  }
}

export default new AssetRepository();
