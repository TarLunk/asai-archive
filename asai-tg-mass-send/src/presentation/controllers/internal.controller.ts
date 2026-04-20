import { IDependency } from '@src/application/ports';
import { Message, MessageImage } from '@src/domain/types';
import { FastifyReply } from 'fastify';

const tgControllerCreate = (dependencies: IDependency) => {

  const {  DatabaseService } = dependencies;
  const { tgRepository } = DatabaseService
  const sendMessageFromPanel = async (request: any, reply: FastifyReply) => {
    const chatId: number = request.params.chatId;
    const messages = request.body.messages;
    const options = request.body.options;
    const chats = await tgRepository.getContextByChatId(chatId);
    const chat = chats[0]
    console.log(chat)
    if (!chat) throw new Error('Данные чата отсутствуют')
    if (!chat.project.integrations?.telegram?.token) throw new Error('Токен бота отсутствует')
    if (!messages || !Array.isArray(messages) || messages.length === 0) throw new Error("Массив сообщений не задан")
    let savedMessages: Message[] = []
    return reply.status(200).send({ success: true, messages: savedMessages });
  }
  const editMessageFromPanel = async (request: any, reply: FastifyReply) => {
    const chatId: number = request.params.chatId;
    const options = request.body.options;
    const messages: Message[] = request.body.messages;
    if (!messages || !Array.isArray(messages) || messages.length === 0) throw new Error("Массив сообщений не задан")
    const chats = await tgRepository.getContextByChatId(chatId);
    const chat = chats[0]
    console.log(messages)
    if (!chat) throw new Error('Данные чата отсутствуют')
    if (!chat.project.integrations?.telegram?.token) throw new Error('Токен бота отсутствует')
    return reply.status(200).send({ success: true, messages });
  }
  const deleteMessageFromPanel = async (request: any, reply: FastifyReply) => {
    const chatId: number = request.params.chatId;
    const messages = request.body.messages;
    if (!messages || !Array.isArray(messages) || messages.length === 0) throw new Error("Массив сообщений не задан")
    const chats = await tgRepository.getContextByChatId(chatId);
    const chat = chats[0]
    console.log(chat)
    return reply.status(200).send({ success: true, messages });
  }
  return {
    sendMessageFromPanel,
    editMessageFromPanel,
    deleteMessageFromPanel
  }
}
export default tgControllerCreate;