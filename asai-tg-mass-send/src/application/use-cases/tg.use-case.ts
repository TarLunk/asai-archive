import { ITgRepository, IDatabaseService, IProjectRepository, IInternalService, IAwsService, IMassSendRepository } from "@src/application/ports";
import { CreateMessageResponse } from "@src/domain/types";
import { splitMessageBySentence } from "@src/utils";
import axios from "axios";
import { Api, TelegramClient } from "telegram";
import { NewMessageEvent } from "telegram/events";



const tgUseCase = (
  databaseService: IDatabaseService,
  internalService: IInternalService,
  AwsService: IAwsService
) => {
  const tgRepository: ITgRepository = databaseService.tgRepository;
  const massSendRepository: IMassSendRepository = databaseService.massSendRepository;


  const sendMessage = async (client: TelegramClient, event: NewMessageEvent, campaignId: number): Promise<CreateMessageResponse> => {
    try {
      // 1) Контекст
      const msg = event.message
      console.log(event.chatId)
      console.log(event.chatId.toString())
      console.log(campaignId)
      const chatId = event.chatId;
      let chats = await tgRepository.getContextById(chatId.toString(), campaignId);
      const sender = await msg.getSender();
      //  const  sender = await event.get_input_sender()

      if (!sender) {
        throw new Error("Генерация ответа отклонена. Ошибка получения данных отправителя");
      }
      else if (chats.length > 0) {
        if (!chats[0].is_bot_active) throw new Error("Генерация ответа отклонена, т.к. интеграция неактивна");
      } else {
        const campaign = await massSendRepository.getCampaignWithDeliveryLog(campaignId, chatId.toString());
        console.log(campaign)
        if (campaign && campaign.status != 'paused' && campaign.status != 'draft') {
          const newChat = await tgRepository.createChat(campaign.project_id, chatId.toString());
          await tgRepository.createMessage(newChat[0].chat_id, "assistant", campaign.recipients[0].delivery_logs[0].message_text, { botMessageId: campaign.recipients[0].delivery_logs[0].external_user_id })
          chats = await tgRepository.getContextById(chatId.toString(), campaignId);
          // await tgRepository.createCampaignEventsFromCampaigns(
          //   bots[0].project_id,
          //   "telegram",
          //   chats[0].chat_id
          // );
        } else {
          throw new Error("Создание чата отклонено, т.к. интеграция неактивна");
        }
      }
      await msg.markAsRead();
      tgRepository.createMessage(chats[0].chat_id, "user", msg.message, { botMessageId: msg.id.toString() })
      const response = await internalService.createMessage(chats[0], msg.message);
      console.log("sender is", sender);
      for (let i = 0; i < response.messages.length; i++) {
        const msg = response.messages[i];
        const sendedMessage = await client.sendMessage(sender, {
          message: msg.content
        });
        tgRepository.createMessage(chats[0].chat_id, "assistant", sendedMessage.message, { botMessageId: sendedMessage.id.toString() })
      }
      let hasAssociatedAvatar = false;
      if (!chats[0].associated_has_avatar) {
        try {
          const avatarBuffer = await client.downloadProfilePhoto(sender);

          if (avatarBuffer) {
            hasAssociatedAvatar = await AwsService.saveAvatar(
              avatarBuffer,
              `chat_${chats[0].chat_id}`,
              "chat-avatars"
            );
          }
        } catch (e) {
          console.log(e)
        }
      }
      if (sender instanceof Api.User) {

        const needUpdate =
          (sender.firstName !== chats[0].associated_first_name) ||
          (sender.lastName !== chats[0].associated_last_name) ||
          (sender.username !== chats[0].associated_username) ||
          (sender.langCode !== chats[0].associated_language_code) ||
          hasAssociatedAvatar
        if (needUpdate) {
          await tgRepository.updateChatInfo(
            chats[0].chat_id,
            sender.firstName,
            sender.lastName,
            sender.username,
            sender.langCode,
            hasAssociatedAvatar
          );
        }
      }
      return response;
    } catch (e) {
      console.log(e)
      return { messages: [] };
    };
  }
  return { sendMessage };
};

export default tgUseCase;
