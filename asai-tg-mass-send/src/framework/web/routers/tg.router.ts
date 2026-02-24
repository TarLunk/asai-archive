import { IDependency } from '@src/application/ports';
import tgControllerCreate from '@src/presentation/controllers/tg.controller';
import { FastifyInstance } from 'fastify';
import { checkInternalToken } from '../middlewares';

export const tgRouter = (dependencies: IDependency) => {
  return (app: FastifyInstance, opts, done) => {
    const chatController = tgControllerCreate(dependencies);
    app.post('/:token', chatController.webhookChat);
    done();
  }
}
