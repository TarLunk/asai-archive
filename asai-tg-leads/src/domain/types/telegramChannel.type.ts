import { TelegramConnection } from "./telegramConnection.type"

export type TelegramChannel = {
    channel_id: number,
    user_id: number,
    key: string,
    key_refresh_date: string,
    is_connected: boolean,
    username: string,
    telegram_user_id: number,
    first_name: string,
    second_name: string,
    language_code: string,
    connections: TelegramConnection[]
    last_update: string,
    created: string
}