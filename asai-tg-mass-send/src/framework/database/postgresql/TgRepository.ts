import { Chat, Message, MessageImage } from '@src/domain/types';
import { Client, Pool } from 'pg';

export default class TgRepository {
  pool: Pool;
  constructor(pool: Pool) {
    this.pool = pool;
  }

  async getContextById(botChatId: string, campaignId: number, externalUserId?: string): Promise<Chat[]> {
    const queryString = `
          SELECT
      c.chat_id
      , c.is_closed
      , 'true' AS is_bot_active
      , c.chat_data_name
      , c.chat_data_email
      , c.chat_data_phone
      , c.lead_qualification
      , c.bot_chat_id
      , c.bot_user_id
      , c.state
      , c.is_stopped
      , c.stop_timer
      , c.project_id
      , c.sended_keyboard
      , c.associated_first_name
      , c.associated_last_name
      , c.associated_username
      , c.associated_language_code
      , c.associated_has_avatar
      , c.privacy_policy_accepted
      , c.last_response_date
      , json_build_object(
          'context_limit', p.context_limit
          , 'system_prompt', p.system_prompt
          , 'owner_id', p.owner_id
          , 'is_active', p.is_active
          , 'gpt_model', p.gpt_model
          , 'gpt_brand', p.gpt_brand
          , 'project_id', p.project_id
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
          , 'keyboard', p.keyboard
          , 'reasoning_effort', p.reasoning_effort
          , 'lead_collection', p.lead_collection
          , 'lead_collection_pattern', p.lead_collection_pattern
          , 'privacy_policy_link', p.privacy_policy_link
          , 'privacy_policy', p.privacy_policy
          , 'product_base', pb.product_base
          , 'knowledge_base', kb.knowledge_base
          , 'integrations', json_build_object(
              'bitrix24_open_line', json_build_object(
                  'bot_id', b.bot_id
                  , 'is_active', b.is_active
                  , 'bitrix_url', b.bitrix_url
                  , 'client_id', b.client_id
                  , 'client_secret', b.client_secret
                  , 'create_deal', b.create_deal
                  , 'is_connected', b.is_connected
              )
              , 'telegram', json_build_object(
                  'bot_id', tg.bot_id,
                  'is_active', tg.is_active,
                  'token', tg.token
                )
            )
          , 'user', json_build_object(
              'user_id', u.user_id
              , 'email', u.email
              , 'tokens_left', u.tokens_left
              , 'godmode', u.godmode
              , 'chats_left', u.chats_left
              , 'limit_type', u.limit_type
              , 'is_active', u.is_active
              , 'requests_after_alert', u.requests_after_alert
            )
        ) AS project
      , ARRAY(
        SELECT json_build_object(
          'role', sub.role,
          'content', sub.content,
          'created', sub.created
        )
        FROM (
          SELECT m.role, m.content, m.created
          FROM messages AS m
          WHERE m.chat_id = c.chat_id AND m.role IN ('user', 'assistant')
          ORDER BY m.created DESC
          LIMIT COALESCE(p.context_limit, 6)
        ) AS sub
        ORDER BY sub.created ASC
      ) AS messages
      FROM chats AS c
      JOIN projects AS p
        ON c.project_id = p.project_id
      JOIN mass_send_campaigns AS msc
        ON p.project_id = msc.project_id
      JOIN users AS u
        ON p.owner_id = u.user_id
      LEFT JOIN bots_telegram AS tg
        ON p.project_id = tg.project_id
      LEFT JOIN bots_bitrix24 AS b
        ON b.project_id = p.project_id
      LEFT JOIN LATERAL (
        SELECT json_agg(json_build_object(
          'kb_id', kb.kb_id
          , 'source', kb.source
          , 'project_id', kb.project_id
          , 'filename', kb.filename
          , 'last_update', kb.last_update
          , 'created', kb.created
        )) AS knowledge_base
        FROM knowledge_bases AS kb
        WHERE p.project_id = kb.project_id
        LIMIT 1
      ) kb 
        ON p.is_knowledge_base_active = true
      LEFT JOIN LATERAL (
        SELECT json_agg(json_build_object(
          'type', pb.type
          , 'pb_id', pb.pb_id
          , 'google_sheets_link', pb.google_sheets_link
          , 'google_sheets_api_key', pb.google_sheets_api_key
          , 'skip_rows', pb.skip_rows
          , 'method', pb.method
          , 'bitrix24_webhook', pb.bitrix24_webhook
          , 'website_url', pb.website_url
          , 'website_html_block', pb.website_html_block
          , 'website_type', pb.website_type
          , 'website_encoding', pb.website_encoding
          , 'search_scope', pb.search_scope
          , 'list_name', pb.list_name
          , 'created', pb.created
          , 'last_update', pb.last_update
          , 'products_description', pb.products_description
        )) AS product_base
        FROM product_bases AS pb
        WHERE p.project_id = pb.project_id
        LIMIT 1
      ) pb
        ON p.is_product_base_active = true
      WHERE c.bot_chat_id = $1
        AND msc.campaign_id = $2
        AND c.source = 'telegram_mass_send'
  `;
    const { rows } = await this.pool.query(queryString, [botChatId, campaignId]);
    return rows;
  }
  async getContextByChatId(chatId: number): Promise<Chat[]> {
    const queryString = `
      SELECT
      c.chat_id
      , c.is_closed
      , tg.is_active AS is_bot_active
      , c.chat_data_name
      , c.chat_data_email
      , c.chat_data_phone
      , c.lead_qualification
      , c.bot_chat_id
      , c.bot_user_id
      , c.state
      , c.sended_keyboard
      , c.is_stopped
      , c.stop_timer
      , json_build_object(
          'context_limit', p.context_limit
          , 'system_prompt', p.system_prompt
          , 'owner_id', p.owner_id
          , 'is_active', p.is_active
          , 'is_deleted', p.is_deleted
          , 'gpt_model', p.gpt_model
          , 'gpt_brand', p.gpt_brand
          , 'project_id', p.project_id
          , 'limit_alert', p.limit_alert
          , 'is_faq_active', p.is_faq_active
          , 'is_knowledge_base_active', p.is_knowledge_base_active
          , 'is_product_base_active', p.is_product_base_active
          , 'ask_chat_data_name', p.ask_chat_data_name
          , 'ask_chat_data_email', p.ask_chat_data_email
          , 'ask_chat_data_phone', p.ask_chat_data_phone
          , 'lead_qualification_type', p.lead_qualification_type
          , 'temperature', p.temperature
          , 'inspection_agent', p.inspection_agent
          , 'title', p.title
          , 'interruption_timer', p.interruption_timer
          , 'switch_to_manager', p.switch_to_manager
          , 'product_base', pb.product_base
          , 'knowledge_base', kb.knowledge_base
          , 'integrations', json_build_object(
              'bitrix24_open_line', json_build_object(
                  'bot_id', b.bot_id
                  , 'is_active', b.is_active
                  , 'bitrix_url', b.bitrix_url
                  , 'client_id', b.client_id
                  , 'client_secret', b.client_secret
                  , 'create_deal', b.create_deal
                  , 'is_connected', b.is_connected
              )  
              , 'telegram', json_build_object(
                  'bot_id', tg.bot_id,
                  'is_active', tg.is_active,
                  'token', tg.token
                )
            )
          , 'user', json_build_object(
              'user_id', u.user_id
              , 'email', u.email
              , 'tokens_left', u.tokens_left
              , 'godmode', u.godmode
              , 'chats_left', u.chats_left
              , 'limit_type', u.limit_type
              , 'is_active', u.is_active
              , 'requests_after_alert', u.requests_after_alert
            )
        ) AS project
      , ARRAY(
        SELECT json_build_object(
          'role', sub.role,
          'content', sub.content,
          'created', sub.created
        )
        FROM (
          SELECT m.role, m.content, m.created
          FROM messages AS m
          WHERE m.chat_id = c.chat_id AND m.role IN ('user', 'assistant')
          ORDER BY m.created DESC
          LIMIT COALESCE(p.context_limit, 6)
        ) AS sub
        ORDER BY sub.created ASC
      ) AS messages
      FROM chats AS c
      JOIN projects AS p
        ON c.project_id = p.project_id
      JOIN users AS u
        ON p.owner_id = u.user_id
      JOIN bots_telegram AS tg
        ON p.project_id = tg.project_id
      LEFT JOIN bots_bitrix24 AS b
        ON b.project_id = p.project_id
      LEFT JOIN LATERAL (
        SELECT json_agg(json_build_object(
          'kb_id', kb.kb_id
          , 'source', kb.source
          , 'project_id', kb.project_id
          , 'filename', kb.filename
          , 'last_update', kb.last_update
          , 'created', kb.created
        )) AS knowledge_base
        FROM knowledge_bases AS kb
        WHERE p.project_id = kb.project_id
        LIMIT 1
      ) kb 
        ON p.is_knowledge_base_active = true
      LEFT JOIN LATERAL (
        SELECT json_agg(json_build_object(
          'type', pb.type
          , 'pb_id', pb.pb_id
          , 'google_sheets_link', pb.google_sheets_link
          , 'google_sheets_api_key', pb.google_sheets_api_key
          , 'skip_rows', pb.skip_rows
          , 'method', pb.method
          , 'bitrix24_webhook', pb.bitrix24_webhook
          , 'website_url', pb.website_url
          , 'website_html_block', pb.website_html_block
          , 'website_type', pb.website_type
          , 'website_encoding', pb.website_encoding
          , 'search_scope', pb.search_scope
          , 'list_name', pb.list_name
          , 'created', pb.created
          , 'last_update', pb.last_update
          , 'products_description', pb.products_description
        )) AS product_base
        FROM product_bases AS pb
        WHERE p.project_id = pb.project_id
        LIMIT 1
      ) pb
        ON p.is_product_base_active = true
      WHERE c.chat_id = $1`;
    const { rows } = await this.pool.query(queryString, [chatId]);
    return rows;
  }
  async createChat(projectId: number, chatBotId: string): Promise<Chat[]> {
    const queryString = `
      INSERT INTO chats
      (project_id, bot_chat_id, created, last_update, source) 
      VALUES ($1, $2, NOW(), NOW(), 'telegram_mass_send') 
      RETURNING chat_id
      , project_id
      , chat_token 
      , sended_keyboard 
      , chat_id
      , sended_keyboard
      , associated_first_name
      , associated_last_name
      , associated_username
      , associated_language_code
      , associated_has_avatar
      , created
      , last_update`;
    const { rows } = await this.pool.query(queryString, [projectId, chatBotId]);
    return rows;
  }
  async createMessage(chatId: number, role: string, content: string, options?: { images?: MessageImage[], reasoning?: string, botMessageId?: string, type?: "mass_send" }): Promise<Message[]> {
    const queryString = `
    INSERT INTO messages (chat_id, role, content, bot_message_id, images, reasoning, type, created)
    VALUES ($1, $2, $3, COALESCE($4, NULL), COALESCE($5::jsonb, NULL), COALESCE($6, NULL), COALESCE($7, NULL), NOW())
    RETURNING message_id, chat_id, role, content, bot_message_id, images, reasoning, type, created, edited`;
    const { rows } = await this.pool.query(queryString, [chatId, role, content, options?.botMessageId, options?.images, options?.reasoning, options?.type]);
    return rows;
  }

  // async setChatState(chatId: number, state: string): Promise<number> {
  //   const queryString = `
  //   UPDATE
  //   chats
  //   SET 
  //   state = $1
  //   , last_update = NOW()
  //   WHERE chat_id = $2;`;
  //   const { rowCount } = await this.pool.query(queryString, [state, chatId]);
  //   return rowCount;
  // }
  // async setChatDataName(chatId: number, value: string): Promise<number> {
  //   const queryString = `
  //       UPDATE
  //       test_chats
  //       SET 
  //       chat_data_name = $1
  //       , last_update = NOW()
  //       WHERE chat_id = $2;`;
  //   const { rowCount } = await this.pool.query(queryString, [value, chatId]);
  //   return rowCount;
  // }
  // async setChatDataEmail(chatId: number, value: string): Promise<number> {
  //   const queryString = `
  //       UPDATE
  //       test_chats
  //       SET 
  //       chat_data_email = $1
  //       , last_update = NOW()
  //       WHERE chat_id = $2;`;
  //   const { rowCount } = await this.pool.query(queryString, [value, chatId]);
  //   return rowCount;
  // }
  // async setChatDataPhone(chatId: number, value: string): Promise<number> {
  //   const queryString = `
  //       UPDATE
  //       test_chats
  //       SET 
  //       chat_data_phone = $1
  //       , last_update = NOW()
  //       WHERE chat_id = $2;`;
  //   const { rowCount } = await this.pool.query(queryString, [value, chatId]);
  //   return rowCount;
  // }
  // async setOpened(chatId: number): Promise<number> {
  //   const queryString = `
  //   UPDATE
  //   chats
  //   SET 
  //   is_closed = false
  //   , is_sended_bitrix24 = false
  //   , is_sended_email = false
  //   , is_sended_amocrm = false
  //   , sending_attempts = 0
  //   , last_update = NOW()
  //   WHERE chat_id = $1;`;
  //   const { rowCount } = await this.pool.query(queryString, [chatId]);
  //   return rowCount;
  // }
  // async setKeyboard(chatId: number, sendedKeyboard: string): Promise<number> {
  //   const queryString = `
  //   UPDATE
  //   chats
  //   SET 
  //   sended_keyboard = $1
  //   , last_update = NOW()
  //   WHERE chat_id = $2;`;
  //   const { rowCount } = await this.pool.query(queryString, [sendedKeyboard, chatId]);
  //   return rowCount;
  // }
  async createCampaignEventsFromCampaigns(projectId: number, source: string, chatId: number): Promise<void> {
    const query = `
      INSERT INTO campaign_events (
        chat_id,
        campaign_id,
        position,
        time,
        created
      )
      SELECT
        $3 AS chat_id,
        sub.campaign_id,
        sub.position,
        CASE sub.delay_interval_name
          WHEN 'minutes' THEN NOW() + make_interval(mins := sub.delay)
          WHEN 'hours'   THEN NOW() + make_interval(hours := sub.delay)
          WHEN 'days'    THEN NOW() + make_interval(days := sub.delay)
          ELSE NOW()
        END AS time,
        NOW() AS created
      FROM (
        SELECT DISTINCT ON (c.campaign_id)
          c.campaign_id,
          m.position,
          m.delay,
          m.delay_interval_name
        FROM campaigns AS c
        JOIN campaign_messages AS m ON c.campaign_id = m.campaign_id
        WHERE 
          c.project_id = $1
          AND c.source = $2
          AND c.is_active = true
          AND m.is_active = true
        ORDER BY c.campaign_id, m.position ASC
      ) AS sub;
    `;
    await this.pool.query(query, [projectId, source, chatId]);
  }
  // async setAssociatedInfo(chatId: number, firstName: string, lastName: string, username: string, languageCode: string, hasAvatar: boolean): Promise<Chat[]> {
  //   const queryString = `
  //   UPDATE
  //   chats
  //   SET 
  //   associated_first_name = $1
  //   , associated_last_name = $2
  //   , associated_username = $3
  //   , associated_language_code = $4
  //   , associated_has_avatar =  COALESCE($5, associated_has_avatar)
  //   WHERE chat_id = $6
  //   RETURNING
  //   chat_id;`;
  //   const { rows } = await this.pool.query(queryString, [firstName, lastName, username, languageCode, hasAvatar, chatId]);
  //   return rows;
  // }
  async updateChatInfo(
    chatId: number,
    firstName?: string,
    lastName?: string,
    username?: string,
    languageCode?: string,
    hasAvatar?: boolean,
    sendedKeyboard?: string
  ): Promise<Chat[]> {
    const fields = [];
    const values = [];
    let idx = 1;

    if (firstName !== undefined) {
      fields.push(`associated_first_name = $${idx++}`);
      values.push(firstName);
    }
    if (lastName !== undefined) {
      fields.push(`associated_last_name = $${idx++}`);
      values.push(lastName);
    }
    if (username !== undefined) {
      fields.push(`associated_username = $${idx++}`);
      values.push(username);
    }
    if (languageCode !== undefined) {
      fields.push(`associated_language_code = $${idx++}`);
      values.push(languageCode);
    }
    if (hasAvatar !== undefined) {
      fields.push(`associated_has_avatar = $${idx++}`);
      values.push(hasAvatar);
    }
    if (sendedKeyboard !== undefined) {
      fields.push(`sended_keyboard = $${idx++}`);
      values.push(sendedKeyboard);
      fields.push(`last_update = NOW()`); // обновляем время при изменении клавиатуры
    }

    if (fields.length === 0) {
      throw new Error('Нет данных для обновления');
    }

    values.push(chatId);
    const query = `
    UPDATE chats
    SET ${fields.join(', ')}
    WHERE chat_id = $${idx}
    RETURNING chat_id
  `;

    const { rows } = await this.pool.query(query, values);
    return rows;
  }
  async setAcceptedPrivacyPolicy(chatBotId: number, accepted: boolean): Promise<Chat[]> {
    const queryString = `
      UPDATE
      chats
      SET 
      privacy_policy_accepted = $1
      , last_update = NOW()
      WHERE bot_chat_id = $2
      RETURNING chat_id`;
    const { rows } = await this.pool.query(queryString, [accepted, chatBotId]);
    return rows;
  }
  async editMessageText(messageId: number, text: string): Promise<Message[]> {
    const queryString = `
      UPDATE
      messages
      SET 
      content = $1
      , edited = NOW()
      WHERE message_id = $2
      RETURNING message_id
      , content
      , bot_message_id
      , created
      , chat_id
      , role`;
    const { rows } = await this.pool.query(queryString, [messageId, text]);
    return rows;
  }
  async deleteMessage(messageId: number): Promise<Message[]> {
    const queryString = `
      DELETE FROM
      messages
      WHERE message_id = $1
      RETURNING message_id
      , content
      , bot_message_id
      , created
      , chat_id
      , role`;
    const { rows } = await this.pool.query(queryString, [messageId]);
    return rows;
  }
}