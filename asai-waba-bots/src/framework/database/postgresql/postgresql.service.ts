import { Pool } from 'pg';
import WabaRepository from './WabaRepository';
import { IProjectRepository, IWabaRepository } from '@src/application/ports/';
import ProjectRepository from './ProjectRepository';

export default class PostgresqlDatabaseService {
  pool: Pool;
  wabaRepository: IWabaRepository;
  projectRepository: IProjectRepository;
  constructor() {
    this.pool = new Pool({
      user: process.env.POSTGRES_USER ?? '',
      database: process.env.POSTGRES_DB ?? '',
      password: process.env.POSTGRES_PASSWORD ?? '',
      port: 5432,
      host: 'postgres',
    });
    this.wabaRepository = new WabaRepository(this.pool);
    this.projectRepository = new ProjectRepository(this.pool);
  }
}
