export const REALTIME_INTERVALS = {
  ticker: 15_000,
  trends: 60_000,
  analytics: 120_000,
} as const;

export function withJitter(intervalMs: number, ratio = 0.15): number {
  const jitter = intervalMs * ratio;
  return Math.max(5_000, Math.round(intervalMs - jitter + Math.random() * jitter * 2));
}
