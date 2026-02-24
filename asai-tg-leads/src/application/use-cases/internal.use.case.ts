import { IDatabaseService, IProjectRepository } from "@src/application/ports";

const SITE_DOMAIN = process.env.SITE_DOMAIN;
const internalUseCase = (databaseService: IDatabaseService) => {
    const projectRepository: IProjectRepository = databaseService.projectRepository;
    const sendLead = async (chatId: number) => {
        const chats = await projectRepository.getByChatId(chatId);
        const messages: { chatId: number, text: string }[] = [];
        const escMd = (s: string = "") =>
            s.replace(/([_*[\]()`\\])/g, "\\$1"); //TODO: расширить при переходе на MarkdownV2
        if (chats.length === 0) throw new Error("Чаты не найдены");
        const telegram = chats[0]?.project?.leads_channels?.telegram;
        console.log(telegram)
        if (!telegram || !Array.isArray(telegram) || telegram.length === 0) throw new Error("Каналы не найдены");
        for (let i = 0; i < telegram.length; i++) {
            const channel = telegram[i];
            if (!channel.is_active) continue;
            let messageText = '*Требуется внимание менеджера!*\n\n';
            // if (additionalInfo === 'askHuman') {
            //     messageText += `Причина: просьба пользователя\n`;
            // } else if (additionalInfo === 'negative') {
            //     messageText += `Причина: обнаружен негатив в чате\n`;
            // }
            if (chats[0].source === 'telegram') {
                const first = escMd(chats[0].associated_first_name ?? '');
                const last = escMd(chats[0].associated_last_name ?? '');
                const uname = chats[0].associated_username
                    ? `(@${escMd(chats[0].associated_username)})`
                    : '';
                if (first || last || uname) {
                    messageText += `Пользователь: ${first} ${last} ${uname}\n`;
                }
            }
            messageText += `\n[Ссылка на чат](https://app.${SITE_DOMAIN}/chats/${chatId})`;
            messages.push({ chatId: channel.telegram_chat_id, text: messageText })
        }
        // console.log(messages)
        return { messages }
    }
    return {
        sendLead,
    }
}
export default internalUseCase;