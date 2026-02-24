import { Chat, CreateMessageResponse } from '@src/domain/types';

export type IInternalService = {
    createMessage(chat: Chat, text: string, options?: any): Promise<CreateMessageResponse>
}