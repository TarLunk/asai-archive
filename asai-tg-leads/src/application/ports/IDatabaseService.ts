import { Pool } from 'pg';
import { IProjectRepository, ILeadChannelsRepository } from './repository';

export interface IDatabaseService {
  pool: Pool;
  leadChannelsRepository: ILeadChannelsRepository;
  projectRepository: IProjectRepository;
}