import { Pool } from 'pg';
import { IMassSendRepository, IProjectRepository, ITgRepository } from './repository';

export interface IDatabaseService {
  pool: Pool;
  tgRepository: ITgRepository;
  projectRepository: IProjectRepository;
  massSendRepository: IMassSendRepository;
}