export type User = {
    user_id?: number;
    email?: string;
    tokens_left?: number;
    godmode?: boolean;
    chats_left?: number;
    limit_type?: string;
    is_active?: boolean;
    requests_after_alert?: number;
}