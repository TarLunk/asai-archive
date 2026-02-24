import { Chat, Project } from "@src/domain/types";

export interface IProjectRepository {
  getByTelegramChatId(telegramChatId: number): Promise<Project[]>;
  getByChatId(chatId: number): Promise<Chat[]>;
}