import 'module-alias/register';
import fastify from 'fastify';
import cors from '@fastify/cors'; 
import { wabaRouter } from '@src/framework/web/routers';
import dependency from "@src/configuration/projectDependencies";
import fastifyCron from 'fastify-cron';
import tgUseCase from '@src/application/use-cases/waba.use-case';

const server = fastify({
  logger: true
});
server.register(cors);
server.register(wabaRouter(dependency), { prefix: '/waba/v1/' });
// server.register(fastifyCron, {
//   jobs: [
//     {
//       cronTime: '*/2 * * * *', // Каждые 5 минут
//       onTick: async () => {
//         console.log('CRON функция начата')
//         await updateBotList();
//         console.log('CRON функция завершена')
//       }
//     }
//   ]
// })
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
  // server.cron.startAllJobs();
  console.log(`Сервер запущен по адресу ${address}`);
  
  // Теперь вызываем функцию updateBotList() после успешного запуска сервера
  // await updateBotList();
})
// async function updateBotList() {
//   try {
//     const { OpenaiService, DatabaseService, MailService, botTokens, FuseService, GPTSearchService, GigachatService, VectorStoreService } = dependency;
//     const useCase = tgUseCase(DatabaseService, OpenaiService, MailService, FuseService, GPTSearchService, GigachatService, VectorStoreService);
//     const wabaRepository = DatabaseService.wabaRepository;
//     const bots = await wabaRepository.getAll();
//     const tokensFromDB = bots.map(row => row.token);
//     // Удаление ботов, которые не найдены в базе данных
//     botTokens.forEach(async (bot, token) => {
//       if (!tokensFromDB.includes(token)) {
//         await bot.stopPolling();
//         await bot.deleteWebHook(); 
//         botTokens.delete(token);
//         console.log('Bot removed with token:', token);
//       }
//     });

//     tokensFromDB.forEach(async (token) => {
//       try{
//         if (!botTokens.has(token)) {
//           const bot = new TelegramBot(token);
//           // await bot.setWebHook(`https://bots.${process.env.SITE_DOMAIN}/waba/v1/${token}`);
//           console.log('Webhook set for bot with token:', token);
  
//           bot.onText(/\/start/, async (msg) => {
//             console.log('/start command')
//             await useCase.createChat(msg, bot, token)
//           });
//           bot.on('message', async (msg) => {
//             let text = msg.text;
//             if (text && text === "/start") return;
//             console.log('text message')
//             await useCase.sendMessage(msg, bot, token)
//           });
//           botTokens.set(token, bot);
//         }
//       } catch {
//         console.log(`Webhook error: `+ token)
//       }

//     });
//   } catch (error) {
//     console.error('Error updating bot list:', error);
//   }
// }
