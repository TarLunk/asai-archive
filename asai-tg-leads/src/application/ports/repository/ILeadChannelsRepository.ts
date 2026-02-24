import { Chat, LeadChannels } from "@src/domain/types";

export interface ILeadChannelsRepository {
  getByKey(key: string): Promise<LeadChannels.Telegram[]>;
  updateTelegramChannel(
    channelId: number,
    values: {
      is_active: boolean
      is_connected: boolean
      is_private_chat: boolean
      telegram_user_id: number | null
      telegram_chat_id: number | null
      telegram_chat_name: string | null
      first_name: string | null
      last_name: string | null
      language_code: string | null
    }
  ): Promise<LeadChannels.Telegram[]>
  updateIsActive(
    channelIds: number[],
    isActive: boolean
  ): Promise<LeadChannels.Telegram[]>
}