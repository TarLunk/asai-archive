import { Api } from "telegram";

export type MassSendResponse = {
  status: 'success' | 'temp_error' | 'perm_error';
  error_code?: string | null;
  error_message?: string | null;
  banned?: boolean;
  floodwait_until?: Date | null;
  next_send_at?: Date | null;
  sendedMessage? :Api.Message
};