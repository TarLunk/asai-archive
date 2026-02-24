import { Chat, Message, MessageImage } from "@src/domain/types";

export interface ITgRepository {
  // getAll(): Promise<any[]>;
  // getByToken(token: string, chatId: number): Promise<any[]>;
  // getIntegration(token: string ): Promise<any[]>;
  getContextById(botChatId: string, campaignId: number): Promise<Chat[]>;
  createChat(projectId: number, chatBotId: string): Promise<Chat[]>;
  createMessage(chatId: number, role: string, content: string, options?: { images?: MessageImage[], reasoning?: string, botMessageId?: string, type?: "mass_send" }): Promise<Message[]>;
  // setOpened(chatId: number): Promise<number>;
  // setChatState(chatId: number, state: string): Promise<number>;
  // setChatDataName(chatId: number, value: string): Promise<number>;
  // setChatDataEmail(chatId: number, value: string): Promise<number>;
  // setChatDataPhone(chatId: number, value: string): Promise<number>;
  createCampaignEventsFromCampaigns(projectId: number, source: string, chatId: number): Promise<void>;
  getContextByChatId(chatId: number): Promise<Chat[]>;
  // getContextByChatIdAndMessageId(chatId: number, messageId: number): Promise<Chat[]>
  // setKeyboard(chatId: number, sendedKeyboard: string): Promise<number>;
  // setAssociatedInfo(chatId: number, firstName: string, lastName: string, username: string, languageCode: string, hasAvatar: boolean): Promise<Chat[]>;
  updateChatInfo(chatId: number, firstName?: string, lastName?: string, username?: string, languageCode?: string, hasAvatar?: boolean, sendedKeyboard?: string): Promise<Chat[]>;
  setAcceptedPrivacyPolicy(chatBotId: number,  accepted: boolean): Promise<Chat[]>;
  editMessageText(messageId: number, text: string): Promise<Message[]>;
  deleteMessage(messageId: number): Promise<Message[]>;
}