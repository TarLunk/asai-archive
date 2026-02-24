import { ChromaClient, GetResponse, IEmbeddingFunction, QueryResponse, Where } from 'chromadb';
import ProxyGptEmbedding from '../proxyGptEmbedding/proxyGptEmbedding.service';

export default class CromaService {
    private client: ChromaClient;
    private embeddingFunction: IEmbeddingFunction;
    constructor() {
        this.client = new ChromaClient({ path: "http://chroma:8000" });
        this.embeddingFunction = new ProxyGptEmbedding();
    }
    async add(projectId: number, ids: string[], metadatas: any[], documents: string[]): Promise<void> {
        const collection = await this.client.getOrCreateCollection({ name: "project-" + projectId, embeddingFunction: this.embeddingFunction });
        await collection.add({
            ids,
            metadatas,
            documents,
        })
    }
    async deleteByIds(projectId: number, ids: string[]): Promise<void> {
        const collection = await this.client.getOrCreateCollection({ name: "project-" + projectId, embeddingFunction: this.embeddingFunction });
        await collection.delete({
            ids
        })
    }
    async deleteByMetadata(projectId: number, metadata: Where): Promise<void> {
        const collection = await this.client.getOrCreateCollection({ name: "project-" + projectId, embeddingFunction: this.embeddingFunction });
        await collection.delete({
            where: metadata
        })
    }
    async update(projectId: number, ids: string[], metadatas: any[], documents: string[]): Promise<void> {
        const collection = await this.client.getOrCreateCollection({ name: "project-" + projectId, embeddingFunction: this.embeddingFunction });
        await collection.update({
            ids,
            metadatas,
            documents,
        })
    }
    async query(projectId: number, queryTexts: string, nResults: number = 10): Promise<QueryResponse> {
        const collection = await this.client.getOrCreateCollection({ name: "project-" + projectId, embeddingFunction: this.embeddingFunction });
        const result = await collection.query({
            queryTexts,
            nResults,
        })
        return result;
    }
    async getAll(projectId: number): Promise<GetResponse> {
        const collection = await this.client.getOrCreateCollection({ name: "project-" + projectId, embeddingFunction: this.embeddingFunction });
        const result = await collection.get();
        return result;
    }
}