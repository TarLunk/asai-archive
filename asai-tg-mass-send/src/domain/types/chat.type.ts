import { MassSend, Message, Project } from "./"

export type Chat = {
  chat_id?: number,
  chat_token?: string,
  created?: string,
  last_update?: string,
  project_id?: number,
  messages?: Message[],
  limit_alert?: boolean,
  is_closed?: boolean,
  is_sended_bitrix24?: boolean,
  is_sended_email?: boolean,
  is_sended_amocrm?: boolean,
  sending_attempts?: number,
  bot_chat_id?: number;
  bot_user_id?: string;
  project?: Project;
  chat_data_name?: string;
  chat_data_email?: string;
  chat_data_phone?: string;
  state?: string;
  temperature?: number;
  country?: string;
  city?: string;
  stop_timer?: string;
  is_stopped?: boolean;
  website?: string;
  is_bot_active?: boolean;
  source?: string;
  sended_keyboard?: string;
  associated_first_name?: string;
  associated_last_name?: string;
  associated_username?: string;
  associated_has_avatar?: boolean;
  associated_language_code?: string;
  privacy_policy_accepted?: boolean;
}