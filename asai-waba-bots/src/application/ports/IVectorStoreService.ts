import { GetResponse, QueryResponse, Where } from "chromadb";

export type IVectorStoreService = {
    add(projectId: number, ids:string[], metadatas: any[], documents: string[]): Promise<void>;
    deleteByIds(projectId: number, ids: string[]): Promise<void>;
    deleteByMetadata(projectId: number, metadata: Where): Promise<void>;
    update(projectId: number, ids:string[], metadatas: any[], documents: string[]): Promise<void>;
    query(projectId: number, queryTexts: string, nResults?: number): Promise<QueryResponse>;
    getAll(projectId: number): Promise<GetResponse>;
}