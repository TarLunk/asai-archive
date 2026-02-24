import { Message, OpenaiRes } from "@src/domain/types";

export interface IOpenaiService {
  /**
   * Отправляет ChatGPT промт и возвращает текст ответа.
   * @param {Message[]} context - контекст сообщений, отправляемых в GPT.
   * @param {string} systemPrompt - системный промпт, заданный в проекте.
   * @param {string} promptText - новое сообщение пользователя.
   * @returns {Promise<string>} - текст ответа ChatGPT.
   */
  getAnswer(model: string, context: Message[], systemPrompt: string, promptText: string, params: {  temperature?: number }): Promise<OpenaiRes>;
  getJsonAnswer(systemPropt: string, userPropmt: string, schema: any, params: { context?: Message[], model?: string, temperature?: number }): Promise<{ content: string, tokens: number }> ;
}