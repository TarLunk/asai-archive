import { MassSend } from "@src/domain/types";
import { IDatabaseService, IInternalService, IMassSendService } from "../ports";

const massSendUseCase = (
  databaseService: IDatabaseService,
  internalService: IInternalService,
  massSendService: IMassSendService,
) => {
  const massSendRepository = databaseService.massSendRepository;

  const sendTickForCampaign = async (
    campaign: MassSend.Campaign,
    accountsWithClients: MassSend.AccountWithClient[],
  ): Promise<void> => {
    const recipients: MassSend.Recipient[] = campaign.recipients ?? [];
    const accounts = (accountsWithClients ?? []).filter(a => a.data?.status === "ready");

    if (accounts.length === 0 || recipients.length === 0) return;

    const batchRecipients = recipients.slice(0, accounts.length);
    const pairs = batchRecipients.map((recipient, index) => {
      const accountObj = accounts[index % accounts.length];
      return { accountObj, recipient };
    });

    for (const { accountObj, recipient } of pairs) {
      let text = campaign.message_template;

      try {
        if (campaign.is_rewrite_required) {
          const rewrite = await internalService.rewriteMessage(
            campaign.rewrite_prompt,
            campaign.message_template,
          );
          text = rewrite.content;
        }

        const result = await massSendService.sendToRecipient(
          campaign,
          accountObj,
          recipient,
          { message: text },
        );

        if (result.status !== "success") {
          const recipientStatus =
            result.status === "perm_error" ? "failed_perm" : "failed_temp";

          await massSendRepository.markRecipientStatus(recipient.recipient_id, recipientStatus);

          await massSendRepository.createDeliveryLog(
            campaign.campaign_id,
            recipient.recipient_id,
            accountObj.data.account_id,
            result.status,
            null,
            text,
            result.error_code ?? null,
            result.error_message ?? null,
          );

          if (result.banned) {
            await massSendRepository.updateAccountStatus(accountObj.data.account_id, "disabled");
            await massSendService.dropSession(accountObj);
          } else if (result.floodwait_until) {
            await massSendRepository.updateAccountFloodwait(
              accountObj.data.account_id,
              result.floodwait_until,
              "floodwait",
            );
          } else if (result.next_send_at) {
            await massSendRepository.updateAccountNextSendAt(
              accountObj.data.account_id,
              result.next_send_at,
            );
          }

          continue;
        }

        const sent = result.sendedMessage;
        if (!sent) throw new Error("sendedMessage is not defined");

        const chatId = await accountObj.client.getPeerId(sent.peerId);
        const messageId = sent.id?.toString?.() ?? String(sent.id);

        await massSendRepository.markRecipientStatus(
          recipient.recipient_id,
          "sent",
          chatId.toString(),
        );

        await massSendRepository.createDeliveryLog(
          campaign.campaign_id,
          recipient.recipient_id,
          accountObj.data.account_id,
          "success",
          messageId,
          text,
          null,
          null,
        );

        if (result.banned) {
          await massSendRepository.updateAccountStatus(accountObj.data.account_id, "disabled");
          await massSendService.dropSession(accountObj);
        } else if (result.floodwait_until) {
          await massSendRepository.updateAccountFloodwait(
            accountObj.data.account_id,
            result.floodwait_until,
            "floodwait",
          );
        } else if (result.next_send_at) {
          await massSendRepository.updateAccountNextSendAt(
            accountObj.data.account_id,
            result.next_send_at,
          );
        }
      } catch (e: any) {
        await massSendRepository.markRecipientStatus(recipient.recipient_id, "failed_temp");

        await massSendRepository.createDeliveryLog(
          campaign.campaign_id,
          recipient.recipient_id,
          accountObj.data.account_id,
          "temp_error",
          null,
          text ?? null,
          "UNEXPECTED_ERROR",
          e?.message ?? String(e),
        );
      }
    }
  };

  return { sendTickForCampaign };
};

export default massSendUseCase;
