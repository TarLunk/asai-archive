import { IDependency } from '@src/application/ports';
import { FastifyReply } from 'fastify';

const tgControllerCreate = (dependencies: IDependency) => {


  const webhookChat = async (request: any, reply: FastifyReply) => {
    reply.status(200).send();
  }

  return {
    webhookChat,
  }
}
export default tgControllerCreate;