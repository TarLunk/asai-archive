import axios from 'axios';

export default class ProxyGptEmbedding {
    private apiKey: string;
    private apiUrl: string;
    private model: string;

    constructor() {
        this.apiKey = process.env.OPENAI_API_KEY ?? '';
        this.model = 'text-embedding-3-small';
        this.apiUrl = 'https://gpt.progrs.ru/v1/embeddings';
    }

    public async generate(texts: string[]): Promise<number[][]> {
        // do things to turn texts into embeddings with an api_key perhaps

        try {
            const response = await axios.post(
                this.apiUrl,
                {
                    model: this.model,
                    input: texts,
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.apiKey}`,
                    },
                }
            );
            return response.data.data.map((item) => item.embedding);

        } catch (error: any) {
            throw new Error(`OpenAI API request failed: ${error?.message}`);
        }
    }
}
