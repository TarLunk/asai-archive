import axios from 'axios';

export default class GPTSearchService {
  apiKey: string;
  apiUrl: string;
    constructor() {
      this.apiKey = process.env.OPENAI_API_KEY ?? '';
      this.apiUrl = 'https://gpt.progrs.ru/v1/chat';
    }
    async findProducts(products: string[][], query: string, limit: number): Promise<{content:string, tokens: number}> {
      const response = await axios.post(
        this.apiUrl+"/completions",
        {
            messages: [
                { role: 'system', content: `Ты - поисковый бот. Твоя задача - найти в миссиве, полученном от пользователя, элементы массива, максимально подходящие под поисковый запрос. В своем ответе верни только массив объектов, состоящий из ${limit} 'элементов. Если в списке нет достаточно подходящих элементов, допольни массив наиболее подходящими до требуемо количества.` },
                { role: 'user', content: `Поисковый  запрос: ${query}. Массив объектов: ${JSON.stringify(products)}`}
            ],
            model: 'gpt-4o-mini',
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${this.apiKey}`,
            },
          });
          const openaiRes = response.data;
          return { content: openaiRes.choices[0].message.content, tokens: openaiRes.usage.total_tokens };
    }
}