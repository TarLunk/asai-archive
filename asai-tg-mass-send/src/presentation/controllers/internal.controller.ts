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
    // const bot = botTokens.get(chat.project.integrations.telegram.token);

    // let sendedMessages: TelegramBot.Message[] = []
    let savedMessages: Message[] = []
    let savedImages: MessageImage[]=[]
    // if (bot) {
    //   if (options?.images && Array.isArray(options?.images)) {
    //     savedImages = options.images.map((img) => { return {url: img.url} })
    //     const images = options.images.map((img) => { return ({ type: 'photo', media: img.url }) })
    //     images[0].caption = messages[0].content;
    //     images[0].parse_mode = "Markdown";
    //     sendedMessages = await bot.sendMediaGroup(chat.bot_chat_id, images);
    //   } else {
    //     const msg = await bot.sendMessage(chat.bot_chat_id, messages[0].content, { parse_mode: "Markdown" });
    //     sendedMessages.push(msg)
    //   }
    // }
    // if (sendedMessages && sendedMessages?.length > 0) {
    //   savedMessages = await tgRepository.createMessage(chatId, "assistant", messages[0].content, { botMessageId: sendedMessages[0].message_id.toString(), images: savedImages })
    // }
    return reply.status(200).send({ success: true, messages: savedMessages });
  }
  const editMessageFromPanel = async (request: any, reply: FastifyReply) => {
    const chatId: number = request.params.chatId;
    const options = request.body.options;
    const messages: Message[] = request.body.messages;
    if (!messages || !Array.isArray(messages) || messages.length === 0) throw new Error("Массив сообщений не задан")
    const chats = await tgRepository.getContextByChatId(chatId);
    const chat = chats[0]
    // console.log(chat)
    console.log(messages)
    if (!chat) throw new Error('Данные чата отсутствуют')
    if (!chat.project.integrations?.telegram?.token) throw new Error('Токен бота отсутствует')
    // const bot = botTokens.get(chat.project.integrations.telegram.token);
    // let sendedMessage: TelegramBot.Message | boolean;
    let savedMessages: Message[] = []

    // if (bot) {
    //   for (let i = 0; i < messages.length; i++) {
    //     const msg = messages[i];
    //     if (options?.images && Array.isArray(options?.images)) {
    //       const images = options.images.map((img) => { return ({ type: 'photo', media: img.url }) })
    //       images[0].caption = msg.content;
    //       images[0].parse_mode = "Markdown";
    //       sendedMessage = await bot.editMessageCaption(msg.content, { chat_id: chat.bot_chat_id, message_id: Number(msg.bot_message_id) });
    //     } else {
    //       sendedMessage = await bot.editMessageText(msg.content, { parse_mode: "Markdown", chat_id: chat.bot_chat_id, message_id: Number(msg.bot_message_id) });
    //     }
    //   }
    // }
    return reply.status(200).send({ success: true, messages });
  }
  const deleteMessageFromPanel = async (request: any, reply: FastifyReply) => {
    const chatId: number = request.params.chatId;
    const messages = request.body.messages;
    if (!messages || !Array.isArray(messages) || messages.length === 0) throw new Error("Массив сообщений не задан")
    const chats = await tgRepository.getContextByChatId(chatId);
    const chat = chats[0]
    console.log(chat)
    // if (!chat) throw new Error('Данные чата отсутствуют')
    // if (!chat.project.integrations?.telegram?.token) throw new Error('Токен бота отсутствует')
    // const bot = botTokens.get(chat.project.integrations.telegram.token);
    // let sendedMessage: boolean;
    // sendedMessage = await bot.deleteMessage(chat.bot_chat_id, Number(messages[0].bot_message_id));
    // // if (sendedMessage) {
    // //   tgRepository.deleteMessage(messageId)
    // // }
    return reply.status(200).send({ success: true, messages });
  }
  return {
    sendMessageFromPanel,
    editMessageFromPanel,
    deleteMessageFromPanel
  }
}
export default tgControllerCreate;