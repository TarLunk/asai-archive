import { IDependency } from '@src/application/ports';
import { FastifyReply } from 'fastify';

const tgControllerCreate = (dependencies: IDependency) => {

  // const { botTokens } = dependencies;

  const webhookChat = async (request: any, reply: FastifyReply) => {
    const { token } = request.params;
    // console.log('get webhook with - ' + token)
    // const bot = botTokens.get(token);
    // if (bot) {
    //   bot.processUpdate(request.body);
    // }
    reply.status(200).send();
  }
  // const sendMessageFromPanel = async (request: any, reply: FastifyReply) => {
  //   const { token } = request.params;
  //   const bot = botTokens.get(token);
  //   if (bot) {
  //     bot.sendMessage(request.body.chat.bot_chat_id, request.body.messages[0].content, { parse_mode: "Markdown" });
  //   }
  //   reply.status(200).send();
  // }
  return {
    webhookChat,
    // sendMessageFromPanel,
  }
}
export default tgControllerCreate;