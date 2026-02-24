import { Message } from '@src/domain/types';
import axios from 'axios';

export default class ProxyGPTService {
  apiKey: string;
  apiUrl: string;

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY ?? '';
    this.apiUrl = 'https://gpt.progrs.ru/v1/chat';
  }

  async getAnswer(model: string, context: Message[], systemPropt: string, userPropmt: string, params: {  temperature?: number } = {}): Promise<any> {
    const {temperature = 1 } = params;
    const messages = context.map((msg) => {
      const role = msg.role === 'user' ? 'user' : 'assistant';
      return { content: msg.content, role };
    });

    const gptMessages = [
      { role: 'system', content: systemPropt },
      ...messages,
      { role: 'user', content: userPropmt },
    ];

    console.log(gptMessages);

    try {
      const response = await axios.post(
        this.apiUrl+"/completions",
        {
          model,
          messages: gptMessages,
          temperature,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
          },
        }
      );

      const openaiRes = response.data;
      return { content: openaiRes.choices[0].message.content, tokens: openaiRes.usage.total_tokens };
    } catch (error: any) {
      throw new Error(`OpenAI API request failed: ${error?.message}`);
    }
  }
  async getJsonAnswer(systemPropt: string, userPropmt: string, schema: any, params: { context?: Message[], model?: string, temperature?: number } = {}): Promise<{ content: string, tokens: number }> {
    const { context = [], model = 'gpt-4o-mini', temperature = 0.4 } = params;
    const messages = context.map((msg) => {
      const role = msg.role === 'user' ? 'user' : 'assistant';
      return { content: msg.content, role };
    });

    const gptMessages = [
      { role: 'system', content: systemPropt },
      ...messages,
      { role: 'user', content: userPropmt },
    ];

    try {
      const response = await axios.post(
        this.apiUrl + "/completions",
        {
          model,
          messages: gptMessages,
          temperature,
          response_format: {
            type: "json_schema",
            json_schema: { ...schema }
          }
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
          },
        }
      );

      const openaiRes = response.data;
      return { content: openaiRes.choices[0].message.content, tokens: openaiRes.usage.total_tokens };
    } catch (error: any) {
      console.error("OpenAI API request failed:", error?.response?.data || error?.message);
      throw new Error(`OpenAI API request failed: ${error?.response?.data?.error?.message || error?.message}`);
    }
  }
}