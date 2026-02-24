import { MassSend } from "@src/domain/types";

export interface IMassSendRepository {
  getRunnableBatch(): Promise<MassSend.Campaign[]>;
  getCampaignById(campaignId: number): Promise<MassSend.Campaign>;
  getCampaignWithDeliveryLog(
    campaignId: number,
    externalUserId: string
  ): Promise<MassSend.Campaign | null>;
  markRecipientStatus(recipient_id: number, status: MassSend.RecipientStatus,
    external_user_id?: string): Promise<void>;
  createDeliveryLog(
    campaign_id: number,
    recipient_id: number,
    sender_account_id: number,
    status: MassSend.DeliveryStatus,
    external_message_id: string,
    message_text: string,
    error_code: string | null,
    error_message: string | null
  ): Promise<MassSend.DeliveryLog>;
  updateProxyStatus(
    proxy_id: number,
    status: string
  ): Promise<MassSend.Proxy>
  updateAccountStatus(account_id: number, status: MassSend.SenderStatus): Promise<void>;
  updateAccountFloodwait(
    account_id: number,
    floodwait_until: Date,
    status: MassSend.SenderStatus
  ): Promise<void>;
  updateAccountNextSendAt(account_id: number, next_send_at: Date): Promise<void>;
  hasPendingRecipients(campaign_id: number): Promise<boolean>;
  updateCampaignStatus(campaign_id: number, status: MassSend.CampaignStatus): Promise<void>;
}