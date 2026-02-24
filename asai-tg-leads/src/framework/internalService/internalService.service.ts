import { Chat, Message, ChatProps, CreateMessageResponse } from '@src/domain/types';
import axios from 'axios';



export default class internalService {
    public async createMessage(chat: Chat, text: string, options?: any): Promise<CreateMessageResponse> {
        // do things to turn texts into embeddings with an api_key perhaps

        try {
            const response = await axios.post(
                'http://asai-response-generator:3000/chats',
                {
                    chat,
                    text,
                    options
                }
            );
            const messages: Message[] = response.data.data.messages;
            const chatProps: ChatProps = response.data.data.chatProps;
            if (!Array.isArray(messages) || messages.length === 0) throw new Error()
            return { messages, chatProps }

        } catch (error: any) {
            throw new Error(`Ошибка при получении ответа: ${error?.message}`);
        }
    }
}
