import { env } from "cloudflare:workers";

export const DAILY_SUPPORT_LIMIT = 20;

export function utcDay(now = new Date()) {
  return now.toISOString().slice(0, 10);
}

export async function remainingSupportRuns(userId: string, day = utcDay()) {
  if (!env.DB) throw new Error("Support usage store unavailable");
  const row = await env.DB.prepare("SELECT used FROM support_daily_usage WHERE id = ?")
    .bind(`${day}:${userId}`).first<{ used: number }>();
  return Math.max(0, DAILY_SUPPORT_LIMIT - (row?.used ?? 0));
}

export async function consumeSupportRun(userId: string, day = utcDay()) {
  if (!env.DB) throw new Error("Support usage store unavailable");
  const row = await env.DB.prepare(`
    INSERT INTO support_daily_usage (id, user_id, day, used)
    VALUES (?, ?, ?, 1)
    ON CONFLICT(id) DO UPDATE SET used = used + 1 WHERE used < ?
    RETURNING used
  `).bind(`${day}:${userId}`, userId, day, DAILY_SUPPORT_LIMIT).first<{ used: number }>();
  return row ? DAILY_SUPPORT_LIMIT - row.used : null;
}
