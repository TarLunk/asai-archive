import { Chat, CreateMessageResponse, Message } from '@src/domain/types';

export type IInternalService = {
    createMessage(chat: Chat, text: string, options?: any): Promise<CreateMessageResponse>;
    sendToClient(userId: number, projectId: number, chat_id: number, title: string, message: Message): Promise<any>;
    rewriteMessage(prompt: string, text: string): Promise<{content: string}>;
}