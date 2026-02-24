import { Chat, Message, ChatProps, CreateMessageResponse } from '@src/domain/types';
import axios from 'axios';
const INTERNAL_SERVICE_KEY = process.env.INTERNAL_SERVICE_KEY;

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
        public async sendToClient(user_id: number, project_id: number, chat_id: number, title: string, message: Message): Promise<any> {

        try {
            const response = await axios.post(
                'http://asai-panel-server:3000/internal/send-message-to-client',
                {
                    user_id,
                    project_id,
                    chat_id,
                    title,
                    message
                }, {
                headers: {
                    Authorization: "Bearer " + INTERNAL_SERVICE_KEY
                }
            }
            );
            return {}

        } catch (error: any) {
            throw new Error(`Ошибка при получении ответа: ${error?.message}`);
        }
    }
        public async rewriteMessage(prompt: string, text: string): Promise<{content: string}> {
        // do things to turn texts into embeddings with an api_key perhaps

        try {
            const response = await axios.post(
                'http://asai-response-generator:3000/chats/rewrite-message',
                {
                    prompt,
                    text,
                }
            );
            const answer = response.data.data.answer;
            console.log("answer.content - " +answer.content)
            return { content: answer.content }

        } catch (error: any) {
            throw new Error(`Ошибка при получении ответа: ${error?.message}`);
        }
    }
}
