import 'module-alias/register';
import fastify from 'fastify';
import cors from '@fastify/cors'; 
import { wabaRouter } from '@src/framework/web/routers';
import dependency from "@src/configuration/projectDependencies";

const server = fastify({
  logger: true
});
server.register(cors);
server.register(wabaRouter(dependency), { prefix: '/waba/v1/' });

server.addHook('onRequest', (request, reply, done) => {
  console.log('URL запроса:', request.url);
  done();
});
server.setErrorHandler((error, request, reply) => {
  server.log.error(error);
  reply.status(500).send({
    status: "error",
    message: error.code + ": " + error.message
  });
});
server.listen({ port: 3000, host: '0.0.0.0' }, async (err, address) => {
  if (err) {
      console.error('Ошибка при запуске сервера:', err);
      process.exit(1);
  }
  console.log(`Сервер запущен по адресу ${address}`);
  
})

