import { IDependency } from '@src/application/ports';
import wabaControllerCreate from '@src/presentation/controllers/waba.controller';
import { FastifyInstance } from 'fastify';

export const wabaRouter = (dependencies: IDependency) => {
  return (app: FastifyInstance, opts, done) => {
    const chatController = wabaControllerCreate(dependencies);
    app.post('/webhooks/messages', chatController.sendMessageController);
    app.get('/webhooks/messages', chatController.checkWebhookController);
    done();
  }
}
