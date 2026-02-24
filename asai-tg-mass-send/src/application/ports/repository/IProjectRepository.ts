import { Project } from "@src/domain/types";

export interface IProjectRepository {
  getById(projectId: number, token: string): Promise<Project[]>;
  getFullById(projectId: number, token: string): Promise<Project[]>;
  setNotActive(projectId: number, isActive: boolean): Promise<number>;
  setTokens(projectId: number, tokens: number): Promise<number>;
  setLimitAlert(projectId: number): Promise<number>;
  getOwner(projectId: number): Promise<Project[]>;
}