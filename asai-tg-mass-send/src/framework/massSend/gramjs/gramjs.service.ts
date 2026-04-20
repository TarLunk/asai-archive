import { MassSend, MassSendResponse } from '@src/domain/types';
import { Api, TelegramClient } from 'telegram';


export default class GramJsService {

  public async sendToRecipient(
    campaign: MassSend.Campaign,
    accountWithClient: MassSend.AccountWithClient,
    recipient: MassSend.Recipient,
    options?: {
      message: string
    }
  ): Promise<MassSendResponse> {
    try {
      if (!accountWithClient || !accountWithClient.client) {
        const err: any = new Error('NO_SESSION_PROVIDED');
        err.code = 'NO_SESSION';
        throw err;
      }

      const client = accountWithClient.client;

      try {
        if (!client.connected) {
          await client.connect();
        }
      } catch (connectErr: any) {
        return {
          status: 'temp_error',
          error_code: connectErr?.code || 'CLIENT_CONNECT_FAILED',
          error_message: connectErr?.message ?? String(connectErr),
          banned: false,
          floodwait_until: null,
          next_send_at: null,
        };
      }

      const text = options?.message ?? campaign.message_template ?? '';

      const sendedMessage = await client.sendMessage(recipient.address, { message: text });

      const now = new Date();
      const interval =
        campaign.min_interval_sec === campaign.max_interval_sec
          ? campaign.min_interval_sec
          : campaign.min_interval_sec +
          Math.floor(
            Math.random() *
            (campaign.max_interval_sec - campaign.min_interval_sec + 1)
          );

      const next_send_at = new Date(now.getTime() + (interval ?? 0) * 1000);

      return {
        status: 'success',
        error_code: null,
        error_message: null,
        banned: false,
        floodwait_until: null,
        next_send_at,
        sendedMessage
      };
    } catch (e: any) {
      const message = e?.message ?? String(e ?? "");

      // code может быть числом/объектом -> приводим к строке безопасно
      const rawCode = e?.code ?? e?.error_code ?? e?.errorCode ?? null;
      const codeStr = typeof rawCode === "string" ? rawCode : rawCode != null ? String(rawCode) : "";

      // RpcError в GramJS: важнее e.errorMessage (типа "FLOOD_WAIT_123")
      const rpcErrorMessage =
        typeof e?.errorMessage === "string" ? e.errorMessage : "";

      const lower = (message || rpcErrorMessage).toLowerCase();
      const effectiveCode = codeStr || (rpcErrorMessage ? "RPC_ERROR" : "");

      // Перманентные конфиги
      if (effectiveCode.startsWith("CONFIG_")) {
        return {
          status: "perm_error",
          error_code: effectiveCode,
          error_message: message,
          banned: true,
          floodwait_until: null,
          next_send_at: null,
        };
      }

      const floodSource = rpcErrorMessage || message;
      if (lower.includes("flood") || lower.includes("flood_wait")) {
        const seconds = this.extractFloodwaitSeconds(floodSource);
        const until =
          seconds > 0
            ? new Date(Date.now() + seconds * 1000)
            : new Date(Date.now() + 60 * 1000);

        return {
          status: "temp_error",
          error_code: effectiveCode || "FLOOD_WAIT",
          error_message: floodSource,
          banned: false,
          floodwait_until: until,
          next_send_at: until,
        };
      }

      const authSource = (rpcErrorMessage || message).toLowerCase();
      if (
        authSource.includes("auth_key_unregistered") ||
        authSource.includes("user_deactivated") ||
        authSource.includes("user_deactivated_ban") ||
        authSource.includes("session_revoked") ||
        authSource.includes("ban") ||
        authSource.includes("blocked")
      ) {
        return {
          status: "perm_error",
          error_code: effectiveCode || "AUTH_ERROR",
          error_message: rpcErrorMessage || message,
          banned: true,
          floodwait_until: null,
          next_send_at: null,
        };
      }

      // Сетевые ошибки (node)
      if (
        effectiveCode === "ECONNREFUSED" ||
        effectiveCode === "ETIMEDOUT" ||
        effectiveCode === "ENETUNREACH" ||
        effectiveCode === "EHOSTUNREACH"
      ) {
        return {
          status: "temp_error",
          error_code: effectiveCode,
          error_message: message,
          banned: false,
          floodwait_until: null,
          next_send_at: null,
        };
      }

      return {
        status: "temp_error",
        error_code: effectiveCode || "UNKNOWN",
        error_message: rpcErrorMessage || message,
        banned: false,
        floodwait_until: null,
        next_send_at: null,
      };
    }
  }

  public async dropSession(accountWithClient: MassSend.AccountWithClient): Promise<void> {
    const client = accountWithClient.client;
    if (!client) return;
    try {
      // @ts-ignore
      await client.disconnect();
    } catch (_) {
      // ignore
    }
  }

  public async dropAllSessions(accounts: MassSend.AccountWithClient[]): Promise<void> {
    for (const awc of accounts) {
      try {
        // @ts-ignore
        await awc.client.disconnect();
      } catch (_) { }
    }
  }

  private extractFloodwaitSeconds(message: string): number {
    const match = message.match(/FLOOD_WAIT_(\d+)/i);
    if (match && match[1]) {
      const v = Number(match[1]);
      if (!isNaN(v)) return v;
    }
    const match2 = message.match(/(\d+)\s*second/i);
    if (match2 && match2[1]) {
      const v = Number(match2[1]);
      if (!isNaN(v)) return v;
    }
    return 0;
  }

}
