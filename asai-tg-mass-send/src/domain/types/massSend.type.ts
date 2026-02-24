import { TelegramClient } from "telegram";

export declare namespace MassSend {
  type Channel = 'telegram' | 'whatsapp';
  type CampaignStatus = 'draft' | 'running' | 'paused' | 'finished';
  type SenderStatus = 'ready' | 'floodwait' | 'temp_blocked' | 'disabled';
  type RecipientStatus = 'pending' | 'sent' | 'failed_temp' | 'failed_perm';
  type DeliveryStatus = 'success' | 'temp_error' | 'perm_error';
  type ProxyStatus = 'ready' | 'error';

  interface Campaign {
    campaign_id: number;
    name: string;
    channel: Channel;
    message_template: string;
    is_rewrite_required: boolean;
    status: CampaignStatus;
    min_interval_sec: number;
    max_interval_sec: number;
    created: Date;
    last_update: Date;
    project_id: number;
    rewrite_prompt: string;
    proxies?: Proxy[];
    accounts?: Account[];
    recipients?: Recipient[];
  }

  interface Proxy {
    proxy_id: number;
    user_id: number;
    host: string;
    port: number;
    username: string;
    password: string;
    socks_type: 4 | 5;
    is_mtproto: boolean;
    is_deleted: boolean;
    secret: string;
    status: ProxyStatus;
    created: Date;
    last_update: Date;
  }

  interface Account {
    account_id: number;
    user_id: number;
    session: Buffer;
    name: string;
    status: SenderStatus;
    next_send_at: Date | null;
    floodwait_until: Date | null;
    data: any | null;
    first_name: string;
    last_name: string;
    has_avatar: boolean;
    created: Date;
    last_update: Date;
  }

  interface Recipient {
    recipient_id: number;
    campaign_id: number;
    channel: Channel;
    address: string;
    status: RecipientStatus;
    created: Date;
    last_update: Date;
    external_user_id: string;
    delivery_logs: DeliveryLog[];
  }

  interface DeliveryLog {
    log_id: number;
    campaign_id: number;
    recipient_id: number;
    sender_account_id: number;
    status: DeliveryStatus;
    error_code?: string | null;
    error_message?: string | null;
    message_text?: string;
    external_user_id?: string;
    created: Date;
  }
  interface AccountWithClient {
    client: TelegramClient;
    data: MassSend.Account;
    project_id?: number;
    proxy?: MassSend.Proxy | null;
  }
}
