import axios, { AxiosError } from "axios";

const POLLINATIONS_API_KEY = process.env.POLLINATIONS_API_KEY;
const POLLINATIONS_BASE_URL = "https://gen.pollinations.ai";

export function isReplicateConfigured(): boolean {
  return !!POLLINATIONS_API_KEY;
}

export class ReplicateApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ReplicateApiError";
  }
}

function extractApiError(err: unknown, fallbackStatus = 500): ReplicateApiError {
  if (err instanceof AxiosError && err.response) {
    const data = err.response.data as { detail?: string; title?: string; message?: string; error?: { message?: string } } | undefined;
    const detail = data?.detail || data?.title || data?.message || data?.error?.message;
    return new ReplicateApiError(err.response.status, detail || `Pollinations API error (${err.response.status})`);
  }
  if (err instanceof Error) return new ReplicateApiError(fallbackStatus, err.message);
  return new ReplicateApiError(fallbackStatus, "Unknown image API error");
}

function requirePollinationsKey(): string {
  if (!POLLINATIONS_API_KEY) {
    throw new ReplicateApiError(401, "POLLINATIONS_API_KEY not configured");
  }
  return POLLINATIONS_API_KEY;
}

export async function upscaleImageStrict(_imageUrl: string): Promise<string> {
  throw new ReplicateApiError(501, "AI upscaling is not available in the Cloudflare + Pollinations stack yet.");
}

export async function upscaleImage(imageUrl: string): Promise<string> {
  return imageUrl;
}

export async function removeBackground(_imageUrl: string): Promise<string> {
  throw new ReplicateApiError(501, "Background removal is not available in the Cloudflare + Pollinations stack yet.");
}

export async function generateLifestyleImage(prompt: string): Promise<string> {
  const apiKey = requirePollinationsKey();
  const url = `${POLLINATIONS_BASE_URL}/image/${encodeURIComponent(
    `${prompt}, clean product photography, realistic lighting, ecommerce shot, no watermark, no text`
  )}`;

  try {
    const response = await axios.get<ArrayBuffer>(url, {
      timeout: 45000,
      responseType: "arraybuffer",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "image/*",
      },
      params: {
        width: 1024,
        height: 1024,
        model: "flux",
      },
      validateStatus: () => true,
    });

    if (response.status < 200 || response.status >= 300) {
      throw new ReplicateApiError(response.status, `Pollinations image generation failed (${response.status})`);
    }

    const contentType = String(response.headers["content-type"] || "image/jpeg");
    if (!contentType.startsWith("image/")) {
      throw new ReplicateApiError(502, "Pollinations returned a non-image response.");
    }
    const base64 = Buffer.from(response.data).toString("base64");
    return `data:${contentType};base64,${base64}`;
  } catch (err) {
    throw extractApiError(err);
  }
}

export async function upscaleImagesBatch(imageUrls: string[]): Promise<{ url: string; upscaledUrl: string; status: "done" | "failed" | "skipped" }[]> {
  return imageUrls.map((url) => ({ url, upscaledUrl: url, status: "skipped" as const }));
}
