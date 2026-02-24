import { Chat, LeadChannels } from '@src/domain/types';
import { Client, Pool } from 'pg';

export default class leadChannelsRepository {
  pool: Pool;
  constructor(pool: Pool) {
    this.pool = pool;
  }
  async getByKey(key: string): Promise<LeadChannels.Telegram[]> {
    const queryString = `
    SELECT 
      ltc.channel_id
      , ltc.project_id
      , ltc.key
      , ltc.key_refresh_date
      , ltc.is_active
      , ltc.is_connected
      , ltc.is_private_chat
      , ltc.username
      , ltc.telegram_user_id
      , ltc.telegram_chat_id
      , ltc.telegram_chat_name
      , ltc.first_name
      , ltc.last_name
      , ltc.language_code
      , ltc.last_update
      , ltc.created
    FROM leads_telegram_channels AS ltc
    WHERE ltc.key = $1`;
    const { rows } = await this.pool.query(queryString, [key]);
    return rows;
  }
  async updateTelegramChannel(
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
  ): Promise<LeadChannels.Telegram[]> {
    const queryString = `
        UPDATE leads_telegram_channels 
        SET is_active = $1
        , is_connected = $2
        , is_private_chat = $3
        , telegram_user_id = $4
        , telegram_chat_id = $5
        , telegram_chat_name = $6
        , first_name = $7
        , last_name = $8
        , language_code = $9
        , last_update = NOW()
        WHERE channel_id = $10
        RETURNING 
        channel_id
        , project_id
        , key
        , key_refresh_date
        , is_active
        , is_connected
        , is_private_chat
        , username
        , telegram_user_id
        , telegram_chat_id
        , telegram_chat_name
        , first_name
        , last_name
        , language_code
        , last_update
        , created;
    `;
    const { rows } = await this.pool.query(queryString, [
      values.is_active
      , values.is_connected
      , values.is_private_chat
      , values.telegram_user_id
      , values.telegram_chat_id
      , values.telegram_chat_name
      , values.first_name
      , values.last_name
      , values.language_code
      , channelId
    ]);
    return rows;
  }
  async updateIsActive(
    channelIds: number[],
    isActive: boolean
  ): Promise<LeadChannels.Telegram[]> {
    const queryString = `
        UPDATE leads_telegram_channels
        SET is_active = $1
          , last_update = NOW()
        WHERE channel_id = ANY($2)
        RETURNING 
          channel_id
          , project_id
          , key
          , key_refresh_date
          , is_active
          , is_connected
          , is_private_chat
          , telegram_user_id
          , telegram_chat_id
          , telegram_chat_name
          , first_name
          , last_name
          , language_code
          , last_update
          , created `;
    const { rows } = await this.pool.query(queryString, [isActive, channelIds]);
    if (rows.length === 0) throw new Error('Канал не найден');
    return rows;
  }
}