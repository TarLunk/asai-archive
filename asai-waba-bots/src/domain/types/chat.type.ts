import { KnowledgeBase } from "./knowledgeBase.type"
import { Message } from "./message.type"
import { ProductBase } from "./productBase.type"

export type Chat = {
  thread_id?: string,
  project_id?: number,
  chat_id?: number,
  chat_token?: string,
  created?: string,
  context_limit?: string,
  system_prompt?: string,
  last_update?: string,
  messages?: Message[],
  tokens?: number,
  gpt_model?: string,
  gpt_brand?: string,
  limit_alert?: boolean,
  is_project_active?: boolean,
  is_bot_active?: boolean,
  is_closed?: boolean,
  is_god?:boolean,
  is_faq_active?: boolean,
  is_knowledge_base_active?: boolean,
  is_product_base_active?: boolean,
  is_sended_bitrix24?: boolean,
  is_sended_email?: boolean,
  sending_attempts?: number,
  faq?: KnowledgeBase[],
  product_base?: ProductBase[],
  ask_chat_data_name?: boolean;
  ask_chat_data_email?: boolean;
  ask_chat_data_phone?: boolean;
  chat_data_name?: string;
  chat_data_email?: string;
  chat_data_phone?: string;
  state?: string;
  temperature?: number;
}