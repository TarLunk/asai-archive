import { IMassSendRepository } from '@src/application/ports';
import { MassSend } from '@src/domain/types';
import { Pool } from 'pg';

export default class MassSendRepository implements IMassSendRepository {
  pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async getRunnableBatch(): Promise<MassSend.Campaign[]> {
    const queryString = `
    SELECT
      c.*,
      acc.accounts,
      prx.proxies,
      rcp.recipients
    FROM mass_send_campaigns AS c
    LEFT JOIN LATERAL (
      SELECT 
        jsonb_agg(to_jsonb(a)) AS accounts,
        COUNT(*) FILTER (WHERE a.status = 'ready') AS ready_accounts_cnt
      FROM mass_send_accounts_tg AS a
      WHERE a.campaign_id = c.campaign_id
        AND (a.is_deleted = FALSE OR a.is_deleted IS NULL)
        AND (a.next_send_at IS NULL OR a.next_send_at <= NOW())
    ) AS acc ON TRUE
    LEFT JOIN LATERAL (
      SELECT 
        jsonb_agg(to_jsonb(pr)) AS proxies
      FROM mass_send_proxies AS pr
      WHERE pr.campaign_id = c.campaign_id
        AND (pr.is_deleted = FALSE OR pr.is_deleted IS NULL)
    ) AS prx ON TRUE
    LEFT JOIN LATERAL (
      SELECT 
        jsonb_agg(to_jsonb(r)) AS recipients
      FROM (
        SELECT r.*
        FROM mass_send_recipients AS r
        WHERE r.campaign_id = c.campaign_id
          AND r.status = 'pending'
          AND (r.is_deleted = FALSE OR r.is_deleted IS NULL)
        ORDER BY r.recipient_id
        LIMIT COALESCE(acc.ready_accounts_cnt, 5)
      ) AS r
    ) AS rcp ON TRUE
    WHERE c.status NOT IN ('draft','paused')  AND (c.is_deleted = FALSE OR c.is_deleted IS NULL);
  `;
    const { rows } = await this.pool.query(queryString, []);
    return rows as MassSend.Campaign[];
  }
  async getCampaignById(campaignId: number): Promise<MassSend.Campaign> {
    const queryString = `
    SELECT
      c.*,
      acc.accounts,
      prx.proxies,
      rcp.recipients
    FROM mass_send_campaigns AS c
    LEFT JOIN LATERAL (
      SELECT 
        jsonb_agg(to_jsonb(a)) AS accounts,
        COUNT(*) FILTER (WHERE a.status = 'ready') AS ready_accounts_cnt
      FROM mass_send_accounts_tg AS a
      WHERE a.campaign_id = c.campaign_id
        AND (a.is_deleted = FALSE OR a.is_deleted IS NULL)
    ) AS acc ON TRUE
    LEFT JOIN LATERAL (
      SELECT 
        jsonb_agg(to_jsonb(p)) AS proxies
      FROM mass_send_proxies AS p
      WHERE p.campaign_id = c.campaign_id
        AND (p.is_deleted = FALSE OR p.is_deleted IS NULL)
    ) AS prx ON TRUE
    LEFT JOIN LATERAL (
      SELECT 
        jsonb_agg(to_jsonb(r)) AS recipients
      FROM (
        SELECT r.*
        FROM mass_send_recipients AS r
        WHERE r.campaign_id = c.campaign_id
          AND (r.is_deleted = FALSE OR r.is_deleted IS NULL)
        ORDER BY r.recipient_id
      ) AS r
    ) AS rcp ON TRUE
    WHERE c.campaign_id = $1
      AND (c.is_deleted = FALSE OR c.is_deleted IS NULL)
    LIMIT 1;
  `;
    const { rows } = await this.pool.query(queryString, [campaignId]);
    return rows[0] as MassSend.Campaign;
  }
  async getCampaignWithDeliveryLog(
    campaignId: number,
    externalUserId: string | null
  ): Promise<MassSend.Campaign | null> {
    const queryString = `
    SELECT
      json_build_object(
        'campaign_id', msc.campaign_id,
        'name',        msc.name,
        'channel',     msc.channel,
        'message_template',   msc.message_template,
        'is_rewrite_required', msc.is_rewrite_required,
        'status',      msc.status,
        'min_interval_sec', msc.min_interval_sec,
        'max_interval_sec', msc.max_interval_sec,
        'created',     msc.created,
        'last_update', msc.last_update,
        'project_id',  msc.project_id,
        'recipients',  r.recipients
      ) AS campaign
    FROM mass_send_campaigns AS msc
    LEFT JOIN LATERAL (
      SELECT
        json_agg(
          json_build_object(
            'recipient_id', r.recipient_id,
            'campaign_id',  r.campaign_id,
            'channel',      r.channel,
            'address',      r.address,
            'status',       r.status,
            'created',      r.created,
            'last_update',  r.last_update,
            'delivery_logs', COALESCE(dl.delivery_logs, '[]'::json)
          )
        ) AS recipients
      FROM (
        SELECT r.*
        FROM mass_send_recipients AS r
        WHERE r.campaign_id = msc.campaign_id
          AND ($2::text IS NULL OR r.external_user_id = $2::text)
        ORDER BY r.created DESC
        -- если нужно только последнего получателя по external_user_id — оставляем LIMIT 1
        -- если нужны все, убери LIMIT
        LIMIT 1
      ) AS r
      LEFT JOIN LATERAL (
        SELECT
          COALESCE(
            json_agg(
              json_build_object(
                'log_id',            dl_sub.log_id,
                'campaign_id',       dl_sub.campaign_id,
                'recipient_id',      dl_sub.recipient_id,
                'sender_account_id', dl_sub.sender_account_id,
                'status',            dl_sub.status,
                'error_code',        dl_sub.error_code,
                'error_message',     dl_sub.error_message,
                'created',           dl_sub.created,
                'message_text',      dl_sub.message_text
              )
              ORDER BY dl_sub.created DESC
            ),
            '[]'::json
          ) AS delivery_logs
        FROM mass_send_delivery_logs AS dl_sub
        WHERE dl_sub.recipient_id = r.recipient_id
      ) AS dl ON TRUE
    ) r ON TRUE
    WHERE msc.campaign_id = $1
  `;

    const { rows } = await this.pool.query(queryString, [campaignId, externalUserId]);
    return rows[0]?.campaign ?? null;
  }


  async markRecipientStatus(
    recipient_id: number,
    status: MassSend.RecipientStatus,
    external_chat_id: string = null
  ): Promise<void> {
    const queryString = `
      UPDATE mass_send_recipients
      SET status = $2,
        external_user_id = $3,
        last_update = NOW()
      WHERE recipient_id = $1;
    `;
    await this.pool.query(queryString, [recipient_id, status, external_chat_id]);
  }

  async createDeliveryLog(
    campaign_id: number,
    recipient_id: number,
    sender_account_id: number,
    status: MassSend.DeliveryStatus,
    external_message_id: string,
    message_text: string,
    error_code: string | null,
    error_message: string | null
  ): Promise<MassSend.DeliveryLog> {
    const queryString = `
      INSERT INTO mass_send_delivery_logs
        (campaign_id, recipient_id, sender_account_id, status, external_message_id, message_text, error_code, error_message, created)
      VALUES
        ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      RETURNING *;
    `;
    const values = [
      campaign_id,
      recipient_id,
      sender_account_id,
      status,
      external_message_id,
      message_text,
      error_code,
      error_message,
    ];
    const { rows } = await this.pool.query(queryString, values);
    return rows[0] as MassSend.DeliveryLog;
  }
  async updateProxyStatus(
    proxy_id: number,
    status: string
  ): Promise<MassSend.Proxy> {
    const query = `
    UPDATE mass_send_proxies
    SET
      status = $3,
      last_update = NOW()
    WHERE proxy_id = $1 
    RETURNING *;
  `;
    const values = [proxy_id, status];
    const { rows } = await this.pool.query(query, values);
    return rows[0];
  }
  async updateAccountStatus(
    account_id: number,
    status: MassSend.SenderStatus
  ): Promise<void> {
    const queryString = `
      UPDATE mass_send_accounts_tg
      SET status = $2,
          last_update = NOW()
      WHERE account_id = $1;
    `;
    await this.pool.query(queryString, [account_id, status]);
  }

  async updateAccountFloodwait(
    account_id: number,
    floodwait_until: Date,
    status: MassSend.SenderStatus
  ): Promise<void> {
    const queryString = `
      UPDATE mass_send_accounts_tg
      SET status = $3,
          floodwait_until = $2,
          last_update = NOW()
      WHERE account_id = $1;
    `;
    await this.pool.query(queryString, [account_id, floodwait_until, status]);
  }

  async updateAccountNextSendAt(
    account_id: number,
    next_send_at: Date
  ): Promise<void> {
    const queryString = `
      UPDATE mass_send_accounts_tg
      SET next_send_at = $2,
          last_update = NOW()
      WHERE account_id = $1;
    `;
    await this.pool.query(queryString, [account_id, next_send_at]);
  }

  async hasPendingRecipients(campaign_id: number): Promise<boolean> {
    const queryString = `
      SELECT 1
      FROM mass_send_recipients
      WHERE campaign_id = $1
        AND status = 'pending'
      LIMIT 1;
    `;
    const { rows } = await this.pool.query(queryString, [campaign_id]);
    return rows.length > 0;
  }

  async updateCampaignStatus(
    campaign_id: number,
    status: MassSend.CampaignStatus
  ): Promise<void> {
    const queryString = `
      UPDATE mass_send_campaigns
      SET status = $2,
        last_update = NOW()
      WHERE campaign_id = $1;
    `;
    await this.pool.query(queryString, [campaign_id, status]);
  }
}