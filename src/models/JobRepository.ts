/**
 * Job Repository
 * Database operations for jobs
 */

import { db } from '../utils/database';
import { Job, JobParams, JobResult, JobError, JobStatus, JobType } from '../types';

export class JobRepository {
  async create(
    userId: string,
    type: JobType,
    params: JobParams,
    projectId?: string,
    priority: number = 5
  ): Promise<Job> {
    const query = `
      INSERT INTO atelier.jobs (user_id, project_id, type, params, priority, credits_used)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const creditsEstimate = this.estimateCredits(type, params);

    const result = await db.query<Job>(query, [
      userId,
      projectId,
      type,
      JSON.stringify(params),
      priority,
      creditsEstimate,
    ]);

    return result.rows[0];
  }

  async findById(id: string): Promise<Job | null> {
    const query = 'SELECT * FROM atelier.jobs WHERE id = $1';
    const result = await db.query<Job>(query, [id]);
    return result.rows[0] || null;
  }

  async findByUser(
    userId: string,
    status?: JobStatus,
    limit: number = 50,
    offset: number = 0
  ): Promise<Job[]> {
    let query = 'SELECT * FROM atelier.jobs WHERE user_id = $1';
    const params: any[] = [userId];

    if (status) {
      query += ' AND status = $2';
      params.push(status);
    }

    query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(limit, offset);

    const result = await db.query<Job>(query, params);
    return result.rows;
  }

  async updateStatus(id: string, status: JobStatus, metadata?: Record<string, any>): Promise<void> {
    const updates: string[] = ['status = $2'];
    const params: any[] = [id, status];
    let paramIndex = 3;

    if (status === 'processing') {
      updates.push(`started_at = NOW()`);
    } else if (status === 'completed' || status === 'failed') {
      updates.push(`completed_at = NOW()`);

      if (metadata?.duration_ms) {
        updates.push(`duration_ms = $${paramIndex++}`);
        params.push(metadata.duration_ms);
      }
    }

    const query = `UPDATE atelier.jobs SET ${updates.join(', ')} WHERE id = $1`;
    await db.query(query, params);
  }

  async setResult(id: string, result: JobResult): Promise<void> {
    const query = `
      UPDATE atelier.jobs
      SET result = $2, model_used = $3, status = 'completed', completed_at = NOW()
      WHERE id = $1
    `;
    await db.query(query, [id, JSON.stringify(result), result.model_used]);
  }

  async setError(id: string, error: JobError): Promise<void> {
    const query = `
      UPDATE atelier.jobs
      SET error = $2, status = 'failed', completed_at = NOW()
      WHERE id = $1
    `;
    await db.query(query, [id, JSON.stringify(error)]);
  }

  async getQueueStats(type?: JobType): Promise<{ queued: number; processing: number; completed: number; failed: number }> {
    let query = `
      SELECT status, COUNT(*) as count
      FROM atelier.jobs
      WHERE created_at > NOW() - INTERVAL '24 hours'
    `;

    const params: any[] = [];
    if (type) {
      query += ' AND type = $1';
      params.push(type);
    }

    query += ' GROUP BY status';

    const result = await db.query<{ status: JobStatus; count: string }>(query, params);

    const stats = {
      queued: 0,
      processing: 0,
      completed: 0,
      failed: 0,
    };

    result.rows.forEach(row => {
      const status = row.status as keyof typeof stats;
      stats[status] = parseInt(row.count, 10);
    });

    return stats;
  }

  private estimateCredits(type: JobType, params: JobParams): number {
    // Simple credit estimation based on type and quality
    if (type === 'video') {
      const videoParams = params as any;
      const duration = videoParams.duration_seconds || 5;
      const quality = videoParams.quality || 'standard';

      const baseCredits = duration * 4;
      const qualityMultiplier = quality === 'draft' ? 0.5 : quality === 'hd' ? 2 : quality === 'premium' ? 4 : 1;

      return Math.ceil(baseCredits * qualityMultiplier);
    } else if (type === 'image') {
      const imageParams = params as any;
      const quality = imageParams.quality || 'standard';

      return quality === 'draft' ? 1 : quality === 'hd' ? 15 : quality === 'premium' ? 30 : 5;
    } else if (type === 'audio') {
      const audioParams = params as any;
      const duration = audioParams.duration_seconds || 30;
      return Math.ceil(duration / 3);
    }

    return 5; // Default
  }
}

export default new JobRepository();
