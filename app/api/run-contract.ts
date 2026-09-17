import { z } from "zod";

export const runInput = z.object({
  agentId: z.number().int().positive(),
  task: z.string().trim().min(1).max(160),
  status: z.enum(["success", "review", "failed"]),
  durationMs: z.number().int().min(0).max(86_400_000),
  costUsd: z.number().min(0).max(100_000).default(0),
  steps: z.array(z.object({
    kind: z.enum(["input", "model", "tool", "policy", "output", "error"]),
    title: z.string().trim().min(1).max(100),
    detail: z.string().trim().max(1000).default(""),
    offsetMs: z.number().int().min(0).max(86_400_000),
  }).strict()).min(1).max(40),
}).strict();

export type RunInput = z.infer<typeof runInput>;

export async function hashKey(key: string) {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(key));
  return Array.from(new Uint8Array(bytes), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function createKey() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return `snt_${Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("")}`;
}
