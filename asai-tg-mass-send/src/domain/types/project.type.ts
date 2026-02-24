import { User, ProductBase, KnowledgeBase } from "./";

export type Project = {
  project_id?: number,
  domain?: string,
  project_token?: string,
  title?: string,
  primary_color?: string,
  last_update?: string,
  created?: string,
  start_messages?: string[],
  message_text_size?: number,
  message_mobile_text_size?: number,
  owner_id?: number;
  show_creators?: boolean;
  context_limit?: number;
  system_prompt?: string,
  has_avatar?: boolean,
  pulse?: boolean,
  is_active?: boolean,
  open_timer?: number,
  limit_alert?: number,
  invoice_id?: number,
  last_payment_date?: string,
  cycle_start_date?: string,
  tariff_id?: number,
  cycles?: number,
  status?: string,
  email?: string,
  subscription_id?: string,
  show_start_messages?: string,
  is_deleted?: boolean,
  send_email_after_closing?: boolean,
  is_faq_active?: boolean,
  is_product_base_active?: boolean,
  ask_chat_data_name?: boolean;
  ask_chat_data_email?: boolean;
  ask_chat_data_phone?: boolean;
  send_to_email?: any,
  is_knowledge_base_active?: boolean,
  lead_qualification_type?: string,
  temperature?: number,
  gpt_model?: string,
  gpt_brand?: string,
  tariff_type?: string,
  openapi_key?: string,
  openapi_is_active?: boolean,
  inspection_agent?: boolean,
  interruption_timer?: any,
  switch_to_manager?: boolean,
  privacy_policy_link?: string,
  privacy_policy?: boolean,
  product_base?: ProductBase[],
  knowledge_base?: KnowledgeBase[],
  user?: User;
  keyboard?: KeyboardButton[],
  bitrix24?: {
    is_active?: boolean,
    webhook?: string,
    send_chat?: boolean,
  } | null;
  integrations: {
    telegram?: {
      bot_id: number,
      token: string,
      is_active: boolean,
    },
    bitrix24_open_line: {
      bot_id: number,
      is_active: boolean,
      bitrix_url: string,
      client_id: string,
      client_secret: string,
      create_deal: boolean,
      is_connected: boolean,
    },
    amocrm: {
      bot_id: number,
      is_active: boolean;
      is_connected: boolean;
      referer: string;
      access_token: string;
      refresh_token: string;
    },
    avito?: {
      access_token?: string,
      refresh_token?: string,
      expires_in?: string,
    }
  }
}
export type KeyboardButton = {
  button: string,
  text: string
}