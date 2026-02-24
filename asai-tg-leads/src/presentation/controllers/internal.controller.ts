import { IDependency } from '@src/application/ports';
import internalUseCase from '@src/application/use-cases/internal.use.case';
import { FastifyReply } from 'fastify';
import TelegramBot from 'node-telegram-bot-api';

const internalControllerCreate = (dependencies: IDependency, bot: TelegramBot) => {

  const { DatabaseService } = dependencies;
  const { sendLead } = internalUseCase(DatabaseService);
  const sendLeadController = async (request: any, reply: FastifyReply) => {
    try {
      const chat_id: number = request.body.chat_id;
      // const type = request.body.type;
      // const additionalInfo = request.body.additional_info;
      const { messages } = await sendLead(chat_id);
      for (let i = 0; i < messages.length; i++) {
        const msg = messages[i];
        await bot.sendMessage(msg.chatId, msg.text, { parse_mode: 'Markdown' })
      }
      return reply.status(200).send();
    } catch (e) {
      console.log(e)
      return reply.status(500).send()
    }

  }
  return {
    sendLeadController,
  }
}
export default internalControllerCreate;