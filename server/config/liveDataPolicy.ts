export function isLiveDataRequired(): boolean {
  return process.env.NODE_ENV === "production" || process.env.LIVE_DATA_REQUIRED === "true";
}

export function assertNoFallback(source: string): void {
  if (isLiveDataRequired()) {
    throw new Error(`${source} unavailable: live-only mode active and fallback data is blocked.`);
  }
}
