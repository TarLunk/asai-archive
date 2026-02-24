import { IDependency } from '@src/application/ports';
import internalControllerCreate from '@src/presentation/controllers/internal.controller';
import { FastifyInstance } from 'fastify';
import { checkInternalToken } from '../middlewares';
import TelegramBot from 'node-telegram-bot-api';

export const internalRouter = (dependencies: IDependency, bot: TelegramBot) => {
  return (app: FastifyInstance, opts, done) => {
    const internalController = internalControllerCreate(dependencies, bot);
    app.post('/send-lead', { preHandler: checkInternalToken }, internalController.sendLeadController);
    done();
  }
}
