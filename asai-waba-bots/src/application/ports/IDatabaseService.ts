import { Pool } from 'pg';
import { IProjectRepository, IWabaRepository } from './repository';

export interface IDatabaseService {
  pool: Pool;
  wabaRepository: IWabaRepository;
  projectRepository: IProjectRepository;
}