import { Pool } from 'pg';
import LeadChannelsRepository from './LeadChannelsRepository';
import { IProjectRepository, ILeadChannelsRepository } from '@src/application/ports/';
import ProjectRepository from './ProjectRepository';

export default class PostgresqlDatabaseService {
  pool: Pool;
  leadChannelsRepository: ILeadChannelsRepository;
  projectRepository: IProjectRepository;
  constructor() {
    this.pool = new Pool({
      user: process.env.POSTGRES_USER ?? '',
      database: process.env.POSTGRES_DB ?? '',
      password: process.env.POSTGRES_PASSWORD ?? '',
      port: 5432,
      host: 'postgres',
    });
    this.leadChannelsRepository = new LeadChannelsRepository(this.pool);
    this.projectRepository = new ProjectRepository(this.pool);
  }
}
