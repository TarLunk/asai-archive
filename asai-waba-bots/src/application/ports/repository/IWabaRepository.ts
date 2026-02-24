import { Chat } from "@src/domain/types";

export interface IWabaRepository {
  getAll(): Promise<any[]>;
  getByToken(token: string, chatId: number): Promise<any[]>;
  getContextByPhoneId(chatBotId: number, token: string): Promise<Chat[]>;
  createChat(projectId: number, chatBotId: number): Promise<Chat[]>;
  createMessage(chatId: number, role: string, content: string): Promise<any[]>;
  setOpened(chatId: number): Promise<number>;
  setChatState(chatId: number, state: string): Promise<number>;
  setChatDataName(chatId: number, value: string): Promise<number>
  setChatDataEmail(chatId: number, value: string): Promise<number>
  setChatDataPhone(chatId: number, value: string): Promise<number>
}