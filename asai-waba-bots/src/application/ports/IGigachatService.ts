import { Message } from "@src/domain/types";
import OpenAI from "openai";

export interface IGigachatService{
  /**
   * Отправляет ChatGPT промт и возвращает текст ответа.
   * @param {number} type - тип запроса.
   * @param {number} limit - максимальное число символов, содержащихся в ответе ChatGPT.
   * @param {string} promt - текст промта, отправляемоего ChatGPT.
   * @returns {Promise<string>} - текст ответа ChatGPT.
   */
  getAnswer(model: string, context: Message[], systemPropt: string, userPropmt: string, params: {  temperature?: number }): Promise<{content:string, tokens: number}>
}