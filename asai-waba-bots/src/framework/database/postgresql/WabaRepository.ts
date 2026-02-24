import { Chat } from '@src/domain/types';
import { Client, Pool } from 'pg';

export default class ChatRepository {
  pool: Pool;
  constructor(pool: Pool) {
    this.pool = pool;
  }
  async getAll(): Promise<any[]> {
    const queryString = `
    SELECT tg.token 
    FROM bots_waba AS waba
    JOIN projects AS p
    ON p.project_id = waba.project_id
    WHERE waba.is_active = true AND waba.is_connected = true AND p.is_active = true`;
    const { rows } = await this.pool.query(queryString, []);
    return rows;
  }
  async getByToken(phoneNumberId: string, chatId: number): Promise<any[]> {
    const queryString = `
    SELECT 
      p.project_id,
      p.is_active AS is_project_active,
      p.start_messages,
      waba.is_active AS is_bot_active,
      p.start_messages,
      c.chat_id
    FROM bots_waba AS waba
    JOIN projects AS p ON p.project_id = tg.project_id
    LEFT JOIN chats AS c ON p.project_id = c.project_id AND c.bot_chat_id = $2
    WHERE waba.phone_number_id = $1`;
        const { rows } = await this.pool.query(queryString, [phoneNumberId, chatId]);
    return rows;
  }
  async getContextByPhoneId(botChatId: number, phoneNumberId: string): Promise<Chat[]> {
    const queryString = `
      SELECT
      c.chat_id
      , c.is_closed
      , p.context_limit
      , p.system_prompt
      , p.tokens
      , p.is_active AS is_project_active
      , waba.is_active AS is_bot_active
      , p.gpt_model 
      , p.gpt_brand  
      , p.project_id
      , p.limit_alert
      , p.is_faq_active
      , p.is_knowledge_base_active
      , p.is_product_base_active
      , p.is_god
      , p.ask_chat_data_name
      , p.ask_chat_data_email
      , p.ask_chat_data_phone
      , p.temperature
      , p.inspection_agent
      , c.chat_data_name
      , c.chat_data_email
      , c.chat_data_phone
      , c.state
      , kb.faq
      , pb.product_base
      , json_build_object(
        'bitrix24_open_line', json_build_object(
          'bot_id', b.bot_id,
          'is_active', b.is_active,
          'bitrix_url', b.bitrix_url,
          'client_id', b.client_id,
          'client_secret', b.client_secret,
          'create_deal', b.create_deal,
          'is_connected', b.is_connected
        )
      ) AS integrations
      , ARRAY(
        SELECT json_build_object(
          'role', sub.role,
          'content', sub.content,
          'created', sub.created
        )
        FROM (
          SELECT m.role, m.content, m.created
          FROM messages AS m
          WHERE m.chat_id = c.chat_id
          ORDER BY m.created DESC
          LIMIT COALESCE(p.context_limit, 6)
        ) AS sub
        ORDER BY sub.created ASC
      ) AS messages
      FROM chats AS c
      JOIN projects AS p
      ON c.project_id = p.project_id
      JOIN bots_waba AS waba
      ON p.project_id = waba.project_id
      LEFT JOIN bots_bitrix24 AS b
      ON b.project_id = p.project_id
      LEFT JOIN LATERAL (
        SELECT ARRAY(
          SELECT
            json_build_object(
              'text', kb.text
              , 'faq_id', kb.faq_id
              , 'created', kb.created
              , 'last_update', kb.last_update
            )
          FROM faqs AS kb
          WHERE p.project_id = kb.project_id
          LIMIT 1
        ) AS faq
      ) kb ON p.is_faq_active = true
      LEFT JOIN LATERAL (
        SELECT ARRAY(
          SELECT
            json_build_object(
              'type', pb.type
              , 'pb_id', pb.pb_id
              , 'google_sheets_link', pb.google_sheets_link
              , 'google_sheets_api_key', pb.google_sheets_api_key
              , 'skip_rows', pb.skip_rows
              , 'method', pb.method
              , 'search_scope', pb.search_scope
              , 'list_name', pb.list_name
              , 'created', pb.created
              , 'last_update', pb.last_update
            )
          FROM product_bases AS pb
          WHERE p.project_id = pb.project_id
          LIMIT 1
        ) AS product_base
      ) pb ON p.is_product_base_active = true
      WHERE c.bot_chat_id = $1 AND waba.phone_number_id = $2`;
    const { rows } = await this.pool.query(queryString, [botChatId, phoneNumberId]);
    return rows;
  }
  async createChat(projectId: number, chatBotId: number): Promise<Chat[]> {
    const queryString = `
      INSERT INTO chats
      (project_id, bot_chat_id, created, last_update, source) 
      VALUES ($1, $2, NOW(), NOW(), 'waba') 
      RETURNING chat_id
      , project_id
      , chat_token 
      , created
      , last_update`;
    const { rows } = await this.pool.query(queryString, [projectId, chatBotId]);
    return rows;
  }
  async createMessage(chatId: number, role: string, content: string) {
    const queryString = `
      INSERT INTO messages (chat_id, role, content, created)
      VALUES
        ($1, $2, $3, NOW())
      RETURNING
        message_id, chat_id`;
    const { rows } = await this.pool.query(queryString, [chatId, role, content]);
    return rows;
  }
  async setChatState(chatId: number, state: string): Promise<number> {
    const queryString = `
    UPDATE
    chats
    SET 
    state = $1
    , last_update = NOW()
    WHERE chat_id = $2;`;
    const { rowCount } = await this.pool.query(queryString, [state, chatId]);
    return rowCount;
  }
  async setChatDataName(chatId: number, value: string): Promise<number> {
    const queryString = `
        UPDATE
        test_chats
        SET 
        chat_data_name = $1
        , last_update = NOW()
        WHERE chat_id = $2;`;
    const { rowCount } = await this.pool.query(queryString, [value, chatId]);
    return rowCount;
  }
  async setChatDataEmail(chatId: number, value: string): Promise<number> {
    const queryString = `
        UPDATE
        test_chats
        SET 
        chat_data_email = $1
        , last_update = NOW()
        WHERE chat_id = $2;`;
    const { rowCount } = await this.pool.query(queryString, [value, chatId]);
    return rowCount;
  }
  async setChatDataPhone(chatId: number, value: string): Promise<number> {
    const queryString = `
        UPDATE
        test_chats
        SET 
        chat_data_phone = $1
        , last_update = NOW()
        WHERE chat_id = $2;`;
    const { rowCount } = await this.pool.query(queryString, [value, chatId]);
    return rowCount;
  }
  async setOpened(chatId: number): Promise<number>{
    const queryString = `
    UPDATE
    chats
    SET 
    is_closed = false
    , is_sended_bitrix24 = false
    , is_sended_email = false
    , is_sended_amocrm = false
    , sending_attempts = 0
    , last_update = NOW()
    WHERE chat_id = $1;`;
    const { rowCount } = await this.pool.query(queryString, [chatId]);
    return rowCount;
  }
}