import { Chat, LeadChannels, Project } from '@src/domain/types';
import { Pool } from 'pg';

export default class ProjectRepository {
  pool: Pool;
  constructor(pool: Pool) {
    this.pool = pool;
  }
  async getByTelegramChatId(telegramChatId: number): Promise<Project[]> {
    const queryString = `
    SELECT
      p.project_id
    , p.owner_id
    , p.domain
    , p.tokens
    , p.project_token
    , p.created
    , p.last_update
    , p.title
    , p.primary_color
    , p.pulse
    , p.start_messages
    , p.message_text_size
    , p.message_mobile_text_size
    , p.context_limit
    , p.system_prompt
    , p.has_avatar
    , p.open_timer
    , p.limit_alert
    , p.is_god
    , p.gpt_model
    , p.gpt_brand
    , p.cycles
    , p.cycle_start_date
    , p.last_payment_date
    , p.status
    , p.show_start_messages
    , p.is_faq_active
    , p.is_knowledge_base_active
    , p.is_product_base_active
    , p.ask_chat_data_name
    , p.ask_chat_data_email
    , p.ask_chat_data_phone
    , p.send_to_email
    , p.lead_qualification_type
    , p.temperature
    , p.self_study
    , p.openapi_key
    , p.openapi_is_active
    , p.inspection_agent
    , p.interruption_timer
    , p.switch_to_manager
    , p.keyboard
    , json_build_object(
        'telegram', ent.telegram_channels
      ) AS leads_channels
    FROM projects AS p
    JOIN leads_telegram_channels AS en
      ON en.project_id = p.project_id
    LEFT JOIN LATERAL (
      SELECT ARRAY(
        SELECT json_build_object(
            'channel_id', ltc.channel_id
          , 'project_id', ltc.project_id
          , 'key', ltc.key
          , 'key_refresh_date', ltc.key_refresh_date
          , 'is_active', ltc.is_active
          , 'is_connected', ltc.is_connected
          , 'is_private_chat', ltc.is_private_chat
          , 'username', ltc.username
          , 'telegram_user_id', ltc.telegram_user_id
          , 'telegram_chat_id', ltc.telegram_chat_id
          , 'telegram_chat_name', ltc.telegram_chat_name
          , 'first_name', ltc.first_name
          , 'last_name', ltc.last_name
          , 'language_code', ltc.language_code
          , 'last_update', ltc.last_update
          , 'created', ltc.created
        )
        FROM leads_telegram_channels AS ltc
        WHERE ltc.project_id = p.project_id
      ) AS telegram_channels
    ) ent ON TRUE
    WHERE en.telegram_chat_id = $1;`;
    const { rows } = await this.pool.query(queryString, [telegramChatId]);
    return rows;
  }
  async getByChatId(chatId: number): Promise<Chat[]> {
    const queryString = `
    SELECT 
      p.project_id 
    , c.chat_id
    , c.created
    , c.close_time
    , c.chat_data_name
    , c.chat_data_email
    , c.chat_data_phone
    , c.is_sended_bitrix24
    , c.is_sended_email
    , c.is_sended_amocrm
    , c.sending_attempts
    , c.website
    , c.source
    , c.stop_timer
    , c.is_stopped
    , c.sended_keyboard
    , c.associated_first_name
    , c.associated_last_name
    , c.associated_username
    , c.associated_language_code
    , c.associated_has_avatar
    , json_build_object(
        'context_limit', p.context_limit
      , 'system_prompt', p.system_prompt
      , 'owner_id', p.owner_id
      , 'is_active', p.is_active
      , 'gpt_model', p.gpt_model
      , 'gpt_brand', p.gpt_brand
      , 'project_id', p.project_id
      , 'send_to_email', p.send_to_email
      , 'limit_alert', p.limit_alert
      , 'is_faq_active', p.is_faq_active
      , 'is_knowledge_base_active', p.is_knowledge_base_active
      , 'is_product_base_active', p.is_product_base_active
      , 'ask_chat_data_name', p.ask_chat_data_name
      , 'ask_chat_data_email', p.ask_chat_data_email
      , 'ask_chat_data_phone', p.ask_chat_data_phone
      , 'lead_qualification_type', p.lead_qualification_type
      , 'temperature', p.temperature
      , 'self_study', p.self_study
      , 'inspection_agent', p.inspection_agent
      , 'title', p.title
      , 'interruption_timer', p.interruption_timer
      , 'switch_to_manager', p.switch_to_manager
      , 'leads_channels', json_build_object(
          'telegram', ARRAY(
              SELECT json_build_object(
                'channel_id', ltc.channel_id,
                'project_id', ltc.project_id,
                'key', ltc.key,
                'key_refresh_date', ltc.key_refresh_date,
                'is_active', ltc.is_active,
                'is_connected', ltc.is_connected,
                'is_private_chat', ltc.is_private_chat,
                'username', ltc.username,
                'telegram_user_id', ltc.telegram_user_id,
                'telegram_chat_id', ltc.telegram_chat_id,
                'telegram_chat_name', ltc.telegram_chat_name,
                'first_name', ltc.first_name,
                'last_name', ltc.last_name,
                'language_code', ltc.language_code,
                'last_update', ltc.last_update,
                'created', ltc.created
              )
              FROM leads_telegram_channels AS ltc
              WHERE ltc.project_id = p.project_id
              ORDER BY ltc.created ASC
            )
        )
    ) AS project
    FROM chats AS c
    JOIN projects AS p
      ON c.project_id = p.project_id
    WHERE c.chat_id = $1`;

    const { rows } = await this.pool.query(queryString, [chatId]);
    return rows;
}

}