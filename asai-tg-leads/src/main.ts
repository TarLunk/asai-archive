import 'module-alias/register';
import fastify from 'fastify';
import cors from '@fastify/cors';
import { internalRouter } from '@src/framework/web/routers';
import dependency from "@src/configuration/projectDependencies";
// import fastifyCron from 'fastify-cron';
import TelegramBot from 'node-telegram-bot-api';
import tgUseCase from '@src/application/use-cases/tg.use-case';

const TELEGRAM_LEADS = process.env.TELEGRAM_LEADS;
const bot = new TelegramBot(TELEGRAM_LEADS, { polling: true });

const server = fastify({
  logger: true
});
server.register(cors);
server.register(internalRouter(dependency, bot), { prefix: '/internal/' });
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

  try {
    const { DatabaseService } = dependency;
    const useCase = tgUseCase(DatabaseService);

    console.log('Webhook set for bot with token:', TELEGRAM_LEADS);

    // Получаем username бота, чтобы фильтровать команды вида /cmd@OtherBot
    const me = await bot.getMe();
    const myUsername = (me.username || '').toLowerCase();

    // Хелпер: вытащить команду и аргументы из message.entities
    function parseCommand(msg: any): null | {
      base: string;        // 'start' | 'connect' | 'pause' | 'unpaus' | 'unpause'
      mentionTo?: string;  // username после @ в самой команде, если указан
      args: string | null; // остальной текст после команды
    } {
      if (!msg?.text || !Array.isArray(msg.entities)) return null;

      const cmdEnt = msg.entities.find(
        (e: any) => e.type === 'bot_command' && e.offset === 0
      );
      if (!cmdEnt) return null;

      const fullCmd = msg.text.slice(0, cmdEnt.length);
      const rest = msg.text.slice(cmdEnt.length).trim();
      const m = fullCmd.match(/^\/([A-Za-z0-9_]+)(?:@([A-Za-z0-9_]+))?$/);
      if (!m) return null;

      const base = m[1].toLowerCase();
      const mentionTo = m[2]?.toLowerCase();

      if (mentionTo && mentionTo !== myUsername) return null;

      return { base, mentionTo, args: rest.length ? rest : null };
    }

    bot.on('message', async (msg) => {
      const parsed = parseCommand(msg);
      if (!parsed) return;

      const { base, args } = parsed;

      try {
        if (base === 'start') {
          const data = await useCase.startCommand(msg, bot, args ?? null);
          for (const element of data.messages) {
            await bot.sendMessage(msg.chat.id, element, { parse_mode: 'Markdown' });
          }
          return;
        }

        if (base === 'connect') {
          console.log('/connect command');
          if(!args) return bot.sendMessage(msg.chat.id, "Ошибка. Комманда connect не может быть вызвана без аргумента ", { parse_mode: 'Markdown' });
          const data = await useCase.connectChannel(msg, bot, args);
          for (const element of data.messages) {
            await bot.sendMessage(msg.chat.id, element, { parse_mode: 'Markdown' });
          }
          return;
        }

        if (base === 'pause') {
          console.log('/pause command');
          const data = await useCase.pauseChannel(msg, bot, args ?? null);
          for (const element of data.messages) {
            await bot.sendMessage(msg.chat.id, element, { parse_mode: 'Markdown' });
          }
          return;
        }

        if (base === 'unpause') {
          console.log('/unpause command');
          const data = await useCase.unpauseChannel(msg, bot, args ?? null);
          for (const element of data.messages) {
            await bot.sendMessage(msg.chat.id, element, { parse_mode: 'Markdown' });
          }
          return;
        }
      } catch (err) {
        console.error(`Error handling /${base}:`, err);
      }
    });
  } catch (error) {
    console.error('Error updating bot:', error);
  }

});