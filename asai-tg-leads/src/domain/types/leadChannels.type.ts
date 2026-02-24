export namespace LeadChannels {
    export type Telegram = {
        channel_id: number,
        project_id: number,
        key: string,
        key_refresh_date: string,
        is_active: boolean,
        is_connected: boolean,
        is_private_chat: boolean,
        username: string,
        telegram_user_id: number,
        telegram_chat_id: number,
        telegram_chat_name: string,
        first_name: string,
        last_name: string,
        language_code: string,
        last_update: string,
        created: string
    }
}