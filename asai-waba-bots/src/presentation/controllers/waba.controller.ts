import { IDependency } from '@src/application/ports';
import { FastifyReply } from 'fastify';
import wabaUseCase from '@src/application/use-cases/waba.use-case';
const wabaControllerCreate = (dependencies: IDependency) => {

  const { DatabaseService,OpenaiService, MailService, FuseService, GPTSearchService, GigachatService, VectorStoreService } = dependencies;
  const {
    sendMessage,
    checkWebhook
  } = wabaUseCase(DatabaseService,OpenaiService, MailService, FuseService, GPTSearchService, GigachatService, VectorStoreService);
  const sendMessageController = async (request: any, reply: FastifyReply) => {
    try {
      const project = await sendMessage(reply.locals, projectId);
      return reply.status(200).send({
        status: 'success',
        data: {
          project,
        },
      })
    } catch (err: any) {
      console.log(err);
      return reply.status(500).send({
        status: 'error',
        message: err.message ?? "Server error"
      })
    }
  }
  const checkWebhookController = async (request: any, reply: FastifyReply) => {
    try {
      const project = await checkWebhook(reply.locals, projectId);
      return reply.status(200).send({
        status: 'success',
        data: {
          project,
        },
      })
    } catch (err: any) {
      console.log(err);
      return reply.status(500).send({
        status: 'error',
        message: err.message ?? "Server error"
      })
    }
  }
  return {
    sendMessageController,
    checkWebhookController
  }
}
export default wabaControllerCreate;