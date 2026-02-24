import { Project } from '@src/domain/types';
import { Pool } from 'pg';

export default class ProjectRepository {
  pool: Pool;
  constructor(pool: Pool) {
    this.pool = pool;
  }
  async getById(projectId: number, token: string): Promise<Project[]> {
    const queryString = `
      SELECT
      p.project_id 
      , p.domain
      , p.has_avatar
      , p.title
      , p.primary_color
      , p.start_messages
      , p.message_text_size
      , p.message_mobile_text_size
      , p.show_creators
      , p.is_active
      , p.pulse
      , p.open_timer
      FROM projects AS p
      WHERE p.project_id = $1 AND p.project_token = $2`;
    const { rows } = await this.pool.query(queryString, [projectId, token]);
    return rows;
  }
  async getFullById(projectId: number, token: string): Promise<Project[]> {
    const queryString = `
      SELECT
      project_id 
      , domain
      , has_avatar
      , project_token
      , created
      , last_update
      , title
      , primary_color
      , start_messages
      , message_text_size
      , message_mobile_text_size
      , show_creators
      , pulse
      , open_timer
      FROM projects
      WHERE project_id = $1 AND project_token = $2`;
    const { rows } = await this.pool.query(queryString, [projectId, token]);
    return rows;
  }
  async setNotActive(projectId: number, isActive: boolean): Promise<number>{
    const queryString = `
    UPDATE
    projects
    SET 
    is_active = $1
    , tokens = 0
    , last_update = NOW()
    WHERE project_id = $2;`;
    const { rowCount } = await this.pool.query(queryString, [isActive, projectId]);
    return rowCount;
  }
  async setTokens(projectId: number, tokens: number): Promise<number>{
    const queryString = `
    UPDATE
    projects
    SET 
    tokens = tokens - $1
    , last_update = NOW()
    WHERE project_id = $2;`;
    const { rowCount } = await this.pool.query(queryString, [tokens, projectId]);
    return rowCount;
  }
  async setLimitAlert(projectId: number): Promise<number>{
    const queryString = `
    UPDATE
    projects
    SET 
    limit_alert = true
    , last_update = NOW()
    WHERE project_id = $1 AND limit_alert = false;`;
    const { rowCount } = await this.pool.query(queryString, [projectId]);
    return rowCount;
  }
  async getOwner(projectId: number): Promise<Project[]> {
    const queryString = `
      SELECT
      p.project_id 
      , p.owner_id
      , u.email
      FROM projects AS p
      JOIN users AS u
      ON p.owner_id = u.user_id
      WHERE project_id = $1`;
    const { rows } = await this.pool.query(queryString, [projectId]);
    return rows;
  }
}