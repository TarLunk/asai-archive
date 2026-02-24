import 'module-alias/register';
import fastify, { FastifyError } from 'fastify';
import cors from '@fastify/cors';
import dependency from '@src/configuration/projectDependencies';
import fastifyCron from 'fastify-cron';
import massSendUseCaseFactory from '@src/application/use-cases/mass-send.use-case';
import { MassSend } from '@src/domain/types';

import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions';
import { TelegramClientParams } from 'telegram/client/telegramBaseClient';
import { LogLevel } from "telegram/extensions/Logger";
import { NewMessage, NewMessageEvent } from 'telegram/events';
import tgUseCaseFactory from './application/use-cases/tg.use-case';
const server = fastify({
  logger: true
});

server.register(cors);

const databaseService = dependency.DatabaseService;
const internalService = dependency.InternalService;
const massSendService = dependency.MassSendService;
const awsService = dependency.AwsService;
const massSendUseCase = massSendUseCaseFactory(databaseService, internalService, massSendService);
const tgUseCase = tgUseCaseFactory(databaseService, internalService, awsService);

const runningCampaigns = new Set<number>();

/**
 * campaignClients: Map<campaign_id, Map<account_id, AccountWithClient>>
 * привязка подключённых клиентов к каждой рассылке (campaign),
 * максимальное количество клиентов ограничено для каждой рассылки отдельно.
 */
type AccountWithClient = {
  client: TelegramClient;
  data: MassSend.Account;
  campaign_id?: number | null;
  project_id?: number | null;
  proxy?: MassSend.Proxy | null;
};

const campaignClients = new Map<number, Map<number, AccountWithClient>>();

const MAX_CLIENTS_PER_CAMPAIGN = 5;

// -----------------------------------------------------------------------------
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ДЛЯ ТАЙМАУТОВ
// -----------------------------------------------------------------------------

const connectWithTimeout = async (client: TelegramClient, timeoutMs: number): Promise<void> => {
  return new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => {
      const err: any = new Error(`client.connect timeout after ${timeoutMs}ms`);
      err.code = 'CONNECT_TIMEOUT';
      reject(err);
    }, timeoutMs);

    client
      .connect()
      .then(() => {
        clearTimeout(timer);
        resolve();
      })
      .catch((e) => {
        clearTimeout(timer);
        reject(e);
      });
  });
};

const rpcWithTimeout = async <T>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`RPC timeout after ${timeoutMs}ms`)), timeoutMs);
    promise
      .then((res) => {
        clearTimeout(timer);
        resolve(res);
      })
      .catch((e) => {
        clearTimeout(timer);
        reject(e);
      });
  });
};

// -----------------------------------------------------------------------------
// НАСТРОЙКА ПРОКСИ
// -----------------------------------------------------------------------------

const buildClientOptions = (proxy?: MassSend.Proxy): TelegramClientParams => {
  const options: TelegramClientParams = { connectionRetries: 5 };

  if (!proxy) {
    return options;
  }

  // MTProto-прокси
  if (proxy.is_mtproto) {
    const host = proxy.host;
    const port = proxy.port || 443;
    const secret = proxy.secret;

    options.proxy = {
      ip: host,
      port,
      secret,
      MTProxy: true
    };

    return options;
  }

  // SOCKS-прокси
  const ip = proxy.host;
  const port = proxy.port || 1080;
  const socksType = proxy.socks_type ?? 5; // по умолчанию SOCKS5
  const username = proxy.username ?? undefined;
  const password = proxy.password ?? undefined;

  options.proxy = {
    ip,
    port,
    socksType,
    username,
    password
  };

  return options;
};

// -----------------------------------------------------------------------------
// СОЗДАНИЕ КЛИЕНТА TELEGRAM
// -----------------------------------------------------------------------------

const createTelegramClientForAccount = async (
  account: MassSend.Account,
  campaign_id: number,
  proxy?: MassSend.Proxy | null
): Promise<TelegramClient> => {
  const data = account.data || {};
  const app_id_raw = data?.app_id;
  const app_hash_raw = data?.app_hash;

  if (!app_id_raw || !app_hash_raw) {
    const err: any = new Error(`Missing app_id/app_hash for account ${account.account_id}`);
    err.code = 'CONFIG_MISSING_API';
    throw err;
  }

  const app_id = Number(app_id_raw);
  const app_hash = String(app_hash_raw);

  if (!app_id || !app_hash.length) {
    const err: any = new Error(`Invalid app_id/app_hash for account ${account.account_id}`);
    err.code = 'CONFIG_INVALID_API';
    throw err;
  }

  if (!account.session || !(Buffer.isBuffer(account.session) || typeof account.session === 'string')) {
    const err: any = new Error(`Missing or invalid session for account ${account.account_id}`);
    err.code = 'CONFIG_INVALID_SESSION';
    throw err;
  }

  // account.session может быть Buffer (bytea) или строкой (legacy)
  const sessionString =
    Buffer.isBuffer(account.session) ? account.session.toString('latin1') : String(account.session);

  const session = new StringSession(sessionString);
  const clientOptions = buildClientOptions(proxy ?? undefined);
  const client = new TelegramClient(session, app_id, app_hash, clientOptions);
  client.setLogLevel(LogLevel.INFO);
  server.log.info(
    { account_id: account.account_id, proxy: proxy?.host ?? null },
    'Connecting Telegram client...'
  );
  async function eventPrint(event: NewMessageEvent) {
    // console.log(event.message)
    // const message = event.message;

    // Checks if it's a private message (from user or bot)
    if (event.isPrivate) {
      await tgUseCase.sendMessage(client, event, campaign_id);
    }
  }
  // adds an event handler for new messages
  client.addEventHandler(eventPrint, new NewMessage({}));
  try {
    await connectWithTimeout(client, 60000);
    server.log.info({ account_id: account.account_id }, 'Telegram client connected');

    try {
      const me = await rpcWithTimeout(client.getMe(), 10000);
      server.log.info(
        {
          account_id: account.account_id,
          username: (me as any)?.username ?? null
        },
        'getMe succeeded after connect'
      );
    } catch (rpcErr: any) {
      server.log.error(
        {
          account_id: account.account_id,
          err: rpcErr?.message
        },
        'getMe failed after connect'
      );
      throw rpcErr;
    }
  } catch (e: any) {
    server.log.error(
      {
        account_id: account.account_id,
        proxy: proxy?.host ?? null,
        err: e?.message,
        code: e?.code
      },
      'Telegram client connect failed'
    );
    throw e;
  }

  return client;
};

// -----------------------------------------------------------------------------
// ОЧИСТКА КЛИЕНТОВ КАМПАНИИ
// -----------------------------------------------------------------------------

const cleanupCampaignClients = async (campaign_id: number) => {
  const m = campaignClients.get(campaign_id);
  if (!m) return;

  for (const [account_id, awc] of m.entries()) {
    try {
      await awc.client.disconnect();
    } catch (_) { }
    m.delete(account_id);
  }

  campaignClients.delete(campaign_id);
};

// -----------------------------------------------------------------------------
// ГАРАНТИРОВАНИЕ КЛИЕНТОВ ДЛЯ КАМПАНИИ
// -----------------------------------------------------------------------------

const ensureClientsForCampaign = async (campaign: MassSend.Campaign): Promise<AccountWithClient[]> => {
  const campaignId = campaign.campaign_id;
  const pickRunnableProxies = (proxies: MassSend.Proxy[]): MassSend.Proxy[] => {
    return (proxies ?? [])
      .filter((p) => !p.is_deleted && (p.status === "ready"))
      .sort((a, b) => a.proxy_id - b.proxy_id); // детерминированный порядок
  };

  // Стабильное назначение прокси аккаунту, НЕ зависит от порядка массивов
  const pickProxyForAccount = (accountId: number, proxies: MassSend.Proxy[]): MassSend.Proxy | null => {
    if (!proxies.length) return null;
    const idx = Math.abs(accountId) % proxies.length;
    return proxies[idx];
  };
  const safeDisconnectClient = async (client: TelegramClient) => {
  try {
    await client.disconnect();
  } catch {}
  try {
    await (client as any).destroy?.();
  } catch {}
};
  if (!campaignClients.has(campaignId)) {
    campaignClients.set(campaignId, new Map<number, AccountWithClient>());
  }
  const map = campaignClients.get(campaignId)!;

  // 1) Детерминируем аккаунты
  const readyAccounts: MassSend.Account[] = (campaign.accounts ?? [])
    .filter((a) => a.status === "ready")
    .sort((a, b) => a.account_id - b.account_id);

  if (readyAccounts.length === 0) return [];

  // 2) Берём только "живые" прокси и тоже детерминируем
  const runnableProxies = pickRunnableProxies(campaign.proxies ?? []);
  if (runnableProxies.length === 0) return [];

  // 3) Детерминированный выбор под лимит
  const selected = readyAccounts.slice(0, MAX_CLIENTS_PER_CAMPAIGN);

  const accountsWithClients: AccountWithClient[] = [];

  for (const account of selected) {
    const desiredProxy = pickProxyForAccount(account.account_id, runnableProxies);

    // На всякий случай (у тебя прокси обязательны)
    if (!desiredProxy) continue;

    const existing = map.get(account.account_id);

    // Если клиент уже есть и прокси тот же — переиспользуем
    if (
      existing &&
      existing.proxy?.proxy_id === desiredProxy.proxy_id
    ) {
      existing.data = account;
      accountsWithClients.push({
        client: existing.client,
        data: account,
        campaign_id: campaignId,
        project_id: campaign.project_id,
        proxy: desiredProxy
      });
      continue;
    }

    // Если клиент есть, но прокси изменился — НУЖНО пересоздать клиент.
    if (existing) {
      try {
        await safeDisconnectClient(existing.client);
      } catch { }
      map.delete(account.account_id);
    }

    try {
      const client = await createTelegramClientForAccount(account, campaignId, desiredProxy);

      const awc: AccountWithClient = {
        client,
        data: account,
        campaign_id: campaignId,
        project_id: campaign.project_id,
        proxy: desiredProxy
      };

      map.set(account.account_id, awc);
      accountsWithClients.push(awc);
    } catch (e: any) {
      server.log.error(
        { campaign_id: campaignId, account_id: account.account_id },
        `Failed to create client for account: ${e?.message ?? e}`
      );

      try {
        await databaseService.massSendRepository.updateAccountStatus(account.account_id, "disabled");
      } catch (dbErr) {
        server.log.error(
          { account_id: account.account_id },
          `Failed to mark account disabled: ${String(dbErr)}`
        );
      }

      continue;
    }
  }

  return accountsWithClients;
};

// -----------------------------------------------------------------------------
// ПЕРИОДИЧЕСКАЯ ПРОВЕРКА РАССЫЛОК
// -----------------------------------------------------------------------------

const checkActiveMassSends = async (): Promise<void> => {
  const massSendRepository = databaseService.massSendRepository;

  // 0) Чистим кампании, у которых статус стал draft или paused
  for (const [campaignId] of campaignClients.entries()) {
    try {
      const campaignRow = await massSendRepository.getCampaignById(campaignId);
      const status = campaignRow?.status as MassSend.CampaignStatus | undefined;

      if (!campaignRow || status === 'draft' || status === 'paused') {
        server.log.info(
          { campaign_id: campaignId, status: status ?? 'unknown' },
          'Campaign moved to draft/paused or not found — cleaning up clients'
        );
        await cleanupCampaignClients(campaignId);
      }
    } catch (e) {
      server.log.error(
        { campaign_id: campaignId },
        `Failed checking campaign status: ${String(e)}`
      );
    }
  }

  const activeCampaigns = await massSendRepository.getRunnableBatch();
  server.log.info(
    `Active campaigns (running/finished): ${activeCampaigns?.length ?? 0}`
  );
  if (!activeCampaigns || activeCampaigns.length === 0) return;

  for (const item of activeCampaigns) {
    const id: number = item.campaign_id;
    if (runningCampaigns.has(id)) continue;

    runningCampaigns.add(id);

    const campaign: MassSend.Campaign = {
      campaign_id: item.campaign_id,
      name: item.name,
      channel: item.channel,
      message_template: item.message_template,
      is_rewrite_required: item.is_rewrite_required,
      status: item.status,
      min_interval_sec: item.min_interval_sec,
      max_interval_sec: item.max_interval_sec,
      created: item.created,
      last_update: item.last_update,
      project_id: item.project_id,
      rewrite_prompt: (item as any).rewrite_prompt,
      proxies: item.proxies ?? [],
      accounts: item.accounts ?? [],
      recipients: item.recipients ?? [],
    };

    (async () => {
      try {
        const proxies: MassSend.Proxy[] = campaign.proxies ?? [];
        const recipients: MassSend.Recipient[] = campaign.recipients ?? [];

        if (!campaign.accounts || campaign.accounts.length === 0) {
          server.log.warn({ campaign_id: id }, 'No accounts for campaign');
          return;
        }
        if (!proxies || proxies.length === 0) {
          server.log.warn(
            { campaign_id: id },
            'No proxies for campaign — skipping'
          );
          return;
        }

        // Клиенты должны быть для running/finished кампаний
        const accountsWithClients = await ensureClientsForCampaign(campaign);

        if (accountsWithClients.length === 0) {
          server.log.warn(
            { campaign_id: id },
            'No clients available after creation attempts — skipping campaign tick'
          );
          return;
        }

        // Если нет реципиентов — для running переводим в finished,
        // но клиенты НЕ трогаем (остаются для входящих).
        if (!recipients || recipients.length === 0) {
          server.log.info(
            { campaign_id: id },
            'No recipients pending for campaign'
          );
          if (campaign.status === 'running') {
            try {
              await massSendRepository.updateCampaignStatus(
                campaign.campaign_id,
                'finished'
              );
              campaign.status = 'finished';
              server.log.info(
                { campaign_id: id },
                'Campaign has no pending recipients — status set to finished'
              );
            } catch (err) {
              server.log.error(
                { campaign_id: id },
                `Failed to update campaign status to finished: ${String(err)}`
              );
            }
          }
          return;
        }

        // Рассылка только в режиме running.
        if (campaign.status === 'running') {
          await massSendUseCase.sendTickForCampaign(
            campaign,
            accountsWithClients
          );
        } else if (campaign.status === 'finished') {
          server.log.info(
            { campaign_id: id },
            'Campaign status is finished — clients kept, no send tick executed'
          );
        } else {
          // Теоретически сюда не должны попадать (paused/draft отфильтрованы),
          // но оставим лог на всякий случай.
          server.log.info(
            { campaign_id: id, status: campaign.status },
            'Campaign in non-sending state — clients kept'
          );
        }
      } catch (e) {
        server.log.error(e);
      } finally {
        runningCampaigns.delete(id);
      }
    })();
  }
};


// -----------------------------------------------------------------------------
// CRON
// -----------------------------------------------------------------------------

server.register(fastifyCron, {
  jobs: [
    {
      cronTime: '*/10 * * * * *',
      onTick: async () => {
        server.log.debug('checkActiveMassSends start');
        await checkActiveMassSends();
        server.log.debug('checkActiveMassSends end');
      }
    }
  ]
});

// -----------------------------------------------------------------------------
// ХУКИ И ОБРАБОТКА ОШИБОК
// -----------------------------------------------------------------------------

server.addHook('onRequest', (request, reply, done) => {
  server.log.debug('URL request:', request.url);
  done();
});

server.setErrorHandler((error: FastifyError, request, reply) => {
  server.log.error(error);

  const status = (error as any).statusCode ?? 500;

  if ((error as any).code === '22021') {
    return reply.status(400).send({
      error: 'BadInput',
      message: 'Неверная кодировка данных (invalid byte sequence for UTF-8)',
      code: (error as any).code
    });
  }

  reply.status(status).send({
    error: error.name ?? 'Error',
    message: error.message,
    code: (error as any).code ?? null
  });
});

// -----------------------------------------------------------------------------
// ГРЕЙСФУЛ-ШТАТДАУН
// -----------------------------------------------------------------------------

const shutdown = async () => {
  server.log.info('Shutting down — disconnecting clients');
  for (const [campaign_id, map] of campaignClients.entries()) {
    for (const [account_id, awc] of map.entries()) {
      try {
        await awc.client.disconnect();
      } catch (err) {
        server.log.warn(
          { campaign_id, account_id },
          `Failed disconnecting client: ${String(err)}`
        );
      }
    }
    map.clear();
  }
  campaignClients.clear();

  try {
    await server.close();
  } catch (_) { }

  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// -----------------------------------------------------------------------------
// START
// -----------------------------------------------------------------------------

server.listen({ port: 3000, host: '0.0.0.0' }, async (err, address) => {
  if (err) {
    console.error('Ошибка при запуске сервера:', err);
    process.exit(1);
  }
  server.cron.startAllJobs();
  server.log.info(`Server listening at ${address}`);
});
