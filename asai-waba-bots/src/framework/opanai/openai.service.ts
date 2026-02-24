import { Message } from '@src/domain/types';
import OpenAI from 'openai';
import { ChatCompletionMessageParam } from 'openai/resources';

export default class OpenAIService {
  openai: OpenAI;
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY ?? '',
    });
  }
  async getAnswer(model: string, context: Message[], systemPropt: string, userPropmt: string): Promise<any> {
    const messages: ChatCompletionMessageParam[] = context.map((msg) => {
      const role = (msg.role === 'user' ? 'user' : 'assistant')
      return { content: msg.content, role }
    })
    // const optionalMessages: ChatCompletionMessageParam[] = optMessages.map((msg) => {
    //   const role = (msg.role === 'user' ? 'user' : 'assistant')
    //   return { content: msg.content, role }
    // })
    const openaiRes = await this.openai.chat.completions.create({
      messages: [
        { role: 'system', content: systemPropt },
        ...messages,
        { role: 'user', content: userPropmt },
      ],
      model,
    });
    return { content: openaiRes.choices[0].message.content, tokens: openaiRes.usage.total_tokens };
  }
  async generateImage(promptText: string): Promise<OpenAI.Images.Image[]> {
    const openaiRes = await this.openai.images.generate({
      model: "dall-e-3",
      prompt: promptText,
      size: "1024x1024",
      quality: "standard",
      n: 1,
      response_format: "b64_json"
    })
    return openaiRes.data;
  }
}