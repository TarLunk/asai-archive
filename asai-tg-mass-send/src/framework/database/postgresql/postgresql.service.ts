import { Pool } from 'pg';
import TgRepository from './TgRepository';
import { IProjectRepository, ITgRepository, IMassSendRepository } from '@src/application/ports/';
import ProjectRepository from './ProjectRepository';
import MassSendRepository from './MassSendRepository';

export default class PostgresqlDatabaseService {
  pool: Pool;
  tgRepository: ITgRepository;
  projectRepository: IProjectRepository;
  massSendRepository: IMassSendRepository;
  constructor() {
    this.pool = new Pool({
      user: process.env.POSTGRES_USER ?? '',
      database: process.env.POSTGRES_DB ?? '',
      password: process.env.POSTGRES_PASSWORD ?? '',
      port: 5432,
      host: 'postgres',
    });
    this.tgRepository = new TgRepository(this.pool);
    this.projectRepository = new ProjectRepository(this.pool);
    this.massSendRepository = new MassSendRepository(this.pool);
  }
}
