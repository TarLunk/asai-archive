import { IDependency } from '@src/application/ports';
import internalControllerCreate from '@src/presentation/controllers/internal.controller';
import { FastifyInstance } from 'fastify';
import { checkInternalToken } from '../middlewares';

export const internalRouter = (dependencies: IDependency) => {
  return (app: FastifyInstance, opts, done) => {
    const internalController = internalControllerCreate(dependencies);
    app.post('/chats/:chatId/messages', {preHandler: checkInternalToken}, internalController.sendMessageFromPanel);
    app.patch('/chats/:chatId/messages', {preHandler: checkInternalToken}, internalController.editMessageFromPanel);
    app.post('/chats/:chatId/messages/delete', {preHandler: checkInternalToken}, internalController.deleteMessageFromPanel);
    done();
  }
}
