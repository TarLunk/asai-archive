import { MassSend, MassSendResponse } from '@src/domain/types';

export interface IMassSendService {


  sendToRecipient(
    campaign: MassSend.Campaign,
    account: MassSend.AccountWithClient,
    recipient: MassSend.Recipient,
    options?: {
      message: string
    }
  ): Promise<MassSendResponse>;

  dropSession(accountWithClient: MassSend.AccountWithClient): Promise<void>;

  dropAllSessions(accountWithClient: MassSend.AccountWithClient[]): Promise<void>;
  // safeDisconnectClient(client: TelegramClient):Promise<void>
}
