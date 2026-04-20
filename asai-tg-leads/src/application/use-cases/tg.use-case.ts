import { IDatabaseService, IProjectRepository, ILeadChannelsRepository } from "@src/application/ports";
import TelegramBot, { KeyboardButton } from "node-telegram-bot-api";

const tgUseCase = (databaseService: IDatabaseService) => {
  const externalNotificationRepository: ILeadChannelsRepository = databaseService.leadChannelsRepository;
  const projectRepository: IProjectRepository = databaseService.projectRepository;

  const startCommand = async (msg: TelegramBot.Message, bot: TelegramBot, mention: string) => {
    return {
      messages: [
        `🤖 *Вас приветствует бот ASAI Leads!*

Он отправляет уведомления о появлении лидов в любой чат, который вы подключите.

Для получения кода подключения:
1. Перейдите в *админ-панель*
2. Откройте раздел *Настройки*
3. Выберите вкладку *Общие*

📋 *Команды:*
/connect _код_ — подключить бота к чату  
/pause — приостановить работу бота  
/unpause — возобновить работу бота`
      ]
    }
  }
  const connectChannel = async (msg: TelegramBot.Message, bot: TelegramBot, mention: string) => {
    try {
      const channels = await externalNotificationRepository.getByKey(mention);
      if (channels.length !== 1) throw new Error('Ошибка подключения');
      const updatedChannels = await externalNotificationRepository.updateTelegramChannel(channels[0].channel_id,
        {
          is_active: true,
          is_connected: true,
          is_private_chat: msg.chat.type === 'private',
          telegram_user_id: msg.from.id,
          telegram_chat_id: msg.chat.id,
          telegram_chat_name: msg.chat.title,
          first_name: msg.from.first_name,
          last_name: msg.from.last_name,
          language_code: msg.from.language_code,
        })
      if (updatedChannels.length !== 1) throw new Error('Ошибка обновления данных');
      return { messages: ['Бот ASAI Alerts успешно подключен к чату'] }
    } catch (e: any) {
      console.log(e)
      if (e && e?.message) {
        return { messages: [e] }
      } else {
        return { messages: ["Ошибка сервера"] }
      }
    }
  }
  const pauseChannel = async (msg: TelegramBot.Message, bot: TelegramBot, mention: string) => {
    try {
      const projects = await projectRepository.getByTelegramChatId(msg.chat.id);
      const updatedChannelIds: number[] = []
      for (let i = 0; i < projects.length; i++) {
        const element = projects[i];
        if (element.leads_channels?.telegram && Array.isArray(element.leads_channels.telegram) && element.leads_channels.telegram.length > 0) {
          for (let q = 0; q < element.leads_channels.telegram.length; q++) {
            const channel = element.leads_channels.telegram[q];
            updatedChannelIds.push(channel.channel_id)
          }
        }
      }
      await externalNotificationRepository.updateIsActive(updatedChannelIds, false);
      return { messages: ['Бот ASAI Leads поставлен на паузу в этом чате'] }
    } catch (e: any) {
      console.log(e)
      if (e && e?.message) {
        return { messages: [e] }
      } else {
        return { messages: ["Ошибка сервера"] }
      }
    }

  }
  const unpauseChannel = async (msg: TelegramBot.Message, bot: TelegramBot, mention: string) => {
    try {
      const projects = await projectRepository.getByTelegramChatId(msg.chat.id);
      const updatedChannelIds: number[] = []
      for (let i = 0; i < projects.length; i++) {
        const element = projects[i];
        if (element.leads_channels?.telegram && Array.isArray(element.leads_channels.telegram) && element.leads_channels.telegram.length > 0) {
          for (let q = 0; q < element.leads_channels.telegram.length; q++) {
            const channel = element.leads_channels.telegram[q];
            updatedChannelIds.push(channel.channel_id)
          }
        }
      }
      await externalNotificationRepository.updateIsActive(updatedChannelIds, true);
      return { messages: ['Бот ASAI Leads снят с паузы в этом чате'] }

    } catch (e: any) {
      console.log(e)
      if (e && e?.message) {
        return { messages: [e] }
      }
    }
  }


  return {
    startCommand,
    connectChannel,
    pauseChannel,
    unpauseChannel,
  }
}
export default tgUseCase;