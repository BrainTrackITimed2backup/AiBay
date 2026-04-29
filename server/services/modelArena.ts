// ─── AIBAY Model Arena — Pollinations.AI ─────────────────────────────────────
// LMArena-style: runs multiple AI models in parallel and scores their outputs.
// Powered by Pollinations.AI — 100% free, no API key, no registration needed.
// Models: GPT-4o, Claude Opus 4.7, DeepSeek V4 Flash/Pro, Gemini, Llama, Mistral

import OpenAI from "openai";

const POLLINATIONS_BASE = "https://gen.pollinations.ai/v1";

// Single Pollinations client — no API key needed
const pollinationsClient = new OpenAI({
  baseURL: POLLINATIONS_BASE,
  apiKey: "pollinations",
});

// ─── Model Registry ───────────────────────────────────────────────────────────
export interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  free: boolean;
  contextK: number;
  strengths: string[];
  speed: "fast" | "medium" | "slow";
  recommended?: boolean;
  badge?: string;
}

export const MODEL_REGISTRY: ModelInfo[] = [
  {
    id: "openai",
    name: "GPT-4o",
    provider: "OpenAI",
    free: true,
    contextK: 128,
    strengths: ["eBay titles", "structured output", "reliable JSON"],
    speed: "fast",
    recommended: true,
    badge: "🏆 Most Reliable",
  },
  {
    id: "claude",
    name: "Claude Sonnet",
    provider: "Anthropic",
    free: true,
    contextK: 200,
    strengths: ["persuasive copy", "nuanced descriptions", "eBay SEO"],
    speed: "medium",
    badge: "✍️ Best Copy",
  },
  {
    id: "claude-xlarge",
    name: "Claude Opus 4.7",
    provider: "Anthropic",
    free: true,
    contextK: 200,
    strengths: ["highest quality", "complex reasoning", "premium listings"],
    speed: "slow",
    recommended: true,
    badge: "⭐ Premium Quality",
  },
  {
    id: "deepseek-v4-flash",
    name: "DeepSeek V4 Flash",
    provider: "DeepSeek",
    free: true,
    contextK: 64,
    strengths: ["fast", "logical", "keyword analysis", "structured data"],
    speed: "fast",
    badge: "⚡ Fastest",
  },
  {
    id: "deepseek-v4-pro",
    name: "DeepSeek V4 Pro",
    provider: "DeepSeek",
    free: true,
    contextK: 64,
    strengths: ["deep reasoning", "price analysis", "market intelligence"],
    speed: "medium",
    badge: "🧠 Deep Analysis",
  },
  {
    id: "gemini",
    name: "Gemini 2.0",
    provider: "Google",
    free: true,
    contextK: 1000,
    strengths: ["multimodal", "Google Shopping SEO", "trending topics"],
    speed: "fast",
    badge: "🌐 Google AI",
  },
  {
    id: "llama",
    name: "Llama 3.3 70B",
    provider: "Meta",
    free: true,
    contextK: 128,
    strengths: ["natural language", "long descriptions", "open source"],
    speed: "medium",
    badge: "🦙 Open Source",
  },
  {
    id: "mistral",
    name: "Mistral Large",
    provider: "Mistral AI",
    free: true,
    contextK: 32,
    strengths: ["concise titles", "European market", "fast output"],
    speed: "fast",
    badge: "🇫🇷 Efficient",
  },
  {
    id: "qwen-coder",
    name: "Qwen3 Coder 30B",
    provider: "Alibaba",
    free: true,
    contextK: 128,
    strengths: ["structured JSON", "e-commerce copy", "Asian market"],
    speed: "medium",
    badge: "🛒 E-Commerce",
  },
];

// ─── Optimization Scorer ──────────────────────────────────────────────────────

export interface OptimizationDimension {
  name: string;
  score: number;
  max: number;
  detail: string;
}

export interface OptimizationScore {
  overall: number;
  grade: "A+" | "A" | "B+" | "B" | "C" | "D";
  rankingConfidence: "Very Likely" | "Likely" | "Moderate" | "Needs Work";
  rankingConfidenceColor: "green" | "blue" | "yellow" | "red";
  dimensions: OptimizationDimension[];
  suggestions: string[];
  delta?: number;
}

const FORBIDDEN_WORDS = [
  "free shipping", "sale", "new arrival", "best", "wow", "amazing", "see description",
  "check", "click", "buy now", "visit store", "cheap", "lowest price", "hot",
  "must have", "limited", "bargain", "deal", "offer",
];

const CASSINI_KEYWORDS = [
  "new", "sealed", "oem", "genuine", "original", "authentic", "kit", "bundle",
  "lot", "set", "inch", "mm", "cm", "lb", "oz", "gb", "tb", "mhz",
  "wireless", "bluetooth", "usb", "hdmi", "4k", "1080p", "rechargeable",
  "waterproof", "pro", "max", "plus", "mini", "xl", "pack",
];

function scoreTitleDimension(title: string): OptimizationDimension & { suggestions: string[] } {
  const len = title.length;
  const lower = title.toLowerCase();
  const words = lower.split(/\s+/);
  const firstThree = words.slice(0, 3).join(" ");
  let lenScore = len >= 70 ? 25 : len >= 60 ? 22 : len >= 50 ? 17 : len >= 40 ? 12 : len >= 25 ? 7 : 3;
  const hasKeywordFront = CASSINI_KEYWORDS.some(k => firstThree.includes(k));
  const keywordCount = CASSINI_KEYWORDS.filter(k => lower.includes(k)).length;
  let kwScore = (hasKeywordFront ? 15 : 0) + Math.min(keywordCount * 5, 20);
  kwScore = Math.min(kwScore, 25);
  const hasNumbers = /\d/.test(title);
  const hasUnits = /\b(mm|cm|inch|gb|tb|mb|lb|oz|ft|kg|mhz|ghz|w\b)/i.test(title);
  const specScore = Math.min((hasNumbers ? 10 : 0) + (hasUnits ? 15 : 0), 20);
  const foundForbidden = FORBIDDEN_WORDS.filter(w => lower.includes(w));
  const forbiddenScore = Math.max(15 - foundForbidden.length * 8, 0);
  const conditionWords = ["new", "used", "refurbished", "open box", "pre-owned", "for parts"];
  const hasCondition = conditionWords.some(c => lower.includes(c));
  const condScore = hasCondition ? 15 : 3;
  const totalScore = Math.min(lenScore + kwScore + specScore + forbiddenScore + condScore, 100);
  const suggestions: string[] = [];
  if (len < 55) suggestions.push(`Title only ${len} chars — aim for 60–68`);
  if (len > 80) suggestions.push("Title exceeds 80 chars — eBay will truncate it");
  if (!hasKeywordFront) suggestions.push("Move primary keyword to first 3 words for Cassini ranking");
  if (!hasNumbers && !hasUnits) suggestions.push("Add measurements/model numbers to increase CTR");
  if (!hasCondition) suggestions.push('Include condition word like "New" for buyer confidence');
  if (foundForbidden.length > 0) suggestions.push(`Remove forbidden words: ${foundForbidden.join(", ")}`);
  return { name: "Title Optimization", score: totalScore, max: 100, detail: `${len} chars · ${keywordCount} Cassini keywords${foundForbidden.length ? ` · ${foundForbidden.length} forbidden word(s)` : ""}`, suggestions };
}

function scoreDescriptionDimension(html: string): OptimizationDimension & { suggestions: string[] } {
  const lower = html.toLowerCase();
  const suggestions: string[] = [];
  let score = 0;
  const hasH1orH2 = /<h[12]/i.test(html);
  const hasUl = /<ul|<li/i.test(html);
  const hasTable = /<table/i.test(html);
  const hasImage = /<img/i.test(html);
  const hasInlineStyle = /style=/i.test(html);
  if (hasH1orH2) score += 20; else suggestions.push("Add H1/H2 headers for structure");
  if (hasUl) score += 20; else suggestions.push("Add bullet list of key features");
  if (hasTable) score += 20; else suggestions.push("Add item specifics table");
  if (hasInlineStyle) score += 15; else suggestions.push("Use inline styles for email/eBay compatibility");
  const wordCount = html.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;
  if (wordCount >= 150) score += 25; else if (wordCount >= 80) { score += 15; suggestions.push(`Description has ${wordCount} words — aim for 150+`); }
  else suggestions.push(`Description too short (${wordCount} words) — add more product details`);
  return { name: "Description Quality", score: Math.min(score, 100), max: 100, detail: `${wordCount} words · ${[hasH1orH2 && "headers", hasUl && "bullets", hasTable && "table"].filter(Boolean).join(" · ")}`, suggestions };
}

function scoreItemSpecifics(specifics: { key?: string; name?: string; value: string }[]): OptimizationDimension & { suggestions: string[] } {
  const suggestions: string[] = [];
  const count = specifics.length;
  let score = 0;
  if (count >= 8) score = 100; else if (count >= 5) { score = 75; suggestions.push(`Have ${count} specifics — aim for 8+`); }
  else if (count >= 3) { score = 50; suggestions.push(`Only ${count} item specifics — add Brand, MPN, Color, Size, Material`); }
  else { score = 20; suggestions.push("Item specifics missing — critical for eBay search filtering"); }
  const keys = specifics.map(s => (s.key || s.name || "").toLowerCase());
  if (!keys.includes("brand")) suggestions.push("Add 'Brand' specific");
  if (!keys.includes("mpn") && !keys.includes("model")) suggestions.push("Add 'MPN' or 'Model Number'");
  return { name: "Item Specifics", score, max: 100, detail: `${count} specifics defined`, suggestions };
}

function scoreImages(imageCount: number): OptimizationDimension & { suggestions: string[] } {
  const suggestions: string[] = [];
  let score = 0;
  if (imageCount >= 12) score = 100; else if (imageCount >= 8) score = 85;
  else if (imageCount >= 5) { score = 65; suggestions.push(`${imageCount} images — aim for 8+ to maximize conversion`); }
  else if (imageCount >= 2) { score = 40; suggestions.push("Add more product images (angles, details, in-use shots)"); }
  else { score = 15; suggestions.push("Add product images — listings without photos rarely sell"); }
  return { name: "Image Quality", score, max: 100, detail: `${imageCount} image${imageCount !== 1 ? "s" : ""} provided`, suggestions };
}

export function scoreFullListing(params: {
  title: string;
  htmlDescription: string;
  itemSpecifics?: { key?: string; name?: string; value: string }[];
  imageCount?: number;
  rawTitle?: string;
}): OptimizationScore {
  const titleDim = scoreTitleDimension(params.title || "");
  const descDim = scoreDescriptionDimension(params.htmlDescription || "");
  const specsDim = scoreItemSpecifics(params.itemSpecifics || []);
  const imagesDim = scoreImages(params.imageCount ?? 0);
  const dimensions: OptimizationDimension[] = [titleDim, descDim, specsDim, imagesDim];
  const overall = Math.round(titleDim.score * 0.35 + descDim.score * 0.30 + specsDim.score * 0.20 + imagesDim.score * 0.15);
  const grade: OptimizationScore["grade"] = overall >= 90 ? "A+" : overall >= 80 ? "A" : overall >= 70 ? "B+" : overall >= 60 ? "B" : overall >= 45 ? "C" : "D";
  const rankingConfidence: OptimizationScore["rankingConfidence"] = overall >= 80 ? "Very Likely" : overall >= 65 ? "Likely" : overall >= 45 ? "Moderate" : "Needs Work";
  const rankingConfidenceColor: OptimizationScore["rankingConfidenceColor"] = overall >= 80 ? "green" : overall >= 65 ? "blue" : overall >= 45 ? "yellow" : "red";
  const allSuggestions = [...titleDim.suggestions, ...descDim.suggestions, ...specsDim.suggestions, ...imagesDim.suggestions].slice(0, 6);
  let delta: number | undefined;
  if (params.rawTitle && params.rawTitle !== params.title) {
    const rawScore = scoreTitleDimension(params.rawTitle).score;
    delta = titleDim.score - rawScore;
  }
  return { overall, grade, rankingConfidence, rankingConfidenceColor, dimensions, suggestions: allSuggestions, delta };
}

// ─── Arena Runner ─────────────────────────────────────────────────────────────

export interface ArenaEntry {
  modelId: string;
  modelName: string;
  provider: string;
  free: boolean;
  badge?: string;
  title: string;
  htmlDescription: string;
  optimizationScore: OptimizationScore;
  latencyMs: number;
  status: "success" | "error";
  errorMessage?: string;
  recommended?: boolean;
}

function buildArenaPrompt(productData: {
  title: string;
  description?: string;
  images?: string[];
  specs?: Record<string, string>;
}): string {
  return `You are an elite eBay listing copywriter with 10+ years of experience optimizing for eBay's Cassini search algorithm.

PRODUCT DATA:
Title: ${productData.title}
Description: ${(productData.description || "").slice(0, 1500)}
${productData.specs ? `Specs: ${JSON.stringify(productData.specs).slice(0, 500)}` : ""}

YOUR TASK: Create a premium eBay listing optimized for maximum search visibility and conversion.

REQUIREMENTS:
1. TITLE: Exactly 60–68 characters (NEVER exceed 80). Front-load primary keyword. Include condition word (New/Used). No punctuation except hyphens. No promotional words (no "Best", "Amazing", "Free Shipping"). Include brand, model number, key specs.
2. HTML DESCRIPTION: Professional inline-styled HTML. Must include: gradient header with product title, bullet feature list (min 6 bullets), item specifics table (min 5 rows), "Why Buy From Us" grid (4 trust badges), shipping/returns section. Mobile-responsive with max-width:700px. Use #1e3a8a / #2563eb brand colors.

OUTPUT: Valid JSON only — no markdown, no code blocks:
{
  "title": "...",
  "html_description": "..."
}`;
}

async function callSingleModel(
  modelId: string,
  productData: { title: string; description?: string; images?: string[]; specs?: Record<string, string> }
): Promise<{ title: string; html_description: string }> {
  const prompt = buildArenaPrompt(productData);
  const completion = await pollinationsClient.chat.completions.create({
    model: modelId,
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
    max_tokens: 3000,
  });
  const content = completion.choices[0].message.content || "";
  const parsed = JSON.parse(content);
  if (!parsed.title || !parsed.html_description) {
    throw new Error("Model returned incomplete output");
  }
  return { title: parsed.title, html_description: parsed.html_description };
}

export async function runArena(params: {
  productData: { title: string; description?: string; images?: string[]; specs?: Record<string, string> };
  modelIds: string[];
  itemSpecifics?: { key: string; value: string }[];
  imageCount?: number;
}): Promise<ArenaEntry[]> {
  const modelsToRun = params.modelIds
    .map(id => MODEL_REGISTRY.find(m => m.id === id))
    .filter(Boolean) as ModelInfo[];

  const results = await Promise.allSettled(
    modelsToRun.map(async (model): Promise<ArenaEntry> => {
      const start = Date.now();
      try {
        const output = await callSingleModel(model.id, params.productData);
        const latencyMs = Date.now() - start;
        const optimizationScore = scoreFullListing({
          title: output.title,
          htmlDescription: output.html_description,
          itemSpecifics: params.itemSpecifics,
          imageCount: params.imageCount,
          rawTitle: params.productData.title,
        });
        return {
          modelId: model.id, modelName: model.name, provider: model.provider,
          free: model.free, badge: model.badge,
          title: output.title, htmlDescription: output.html_description,
          optimizationScore, latencyMs, status: "success",
        };
      } catch (err) {
        return {
          modelId: model.id, modelName: model.name, provider: model.provider,
          free: model.free, badge: model.badge,
          title: "", htmlDescription: "",
          optimizationScore: scoreFullListing({ title: "", htmlDescription: "" }),
          latencyMs: Date.now() - start, status: "error",
          errorMessage: err instanceof Error ? err.message : "Unknown error",
        };
      }
    })
  );

  const entries: ArenaEntry[] = results.map(r => {
    if (r.status === "fulfilled") return r.value;
    return {
      modelId: "unknown", modelName: "Unknown", provider: "Unknown", free: true,
      title: "", htmlDescription: "",
      optimizationScore: scoreFullListing({ title: "", htmlDescription: "" }),
      latencyMs: 0, status: "error" as const,
      errorMessage: r.reason?.message || "Failed",
    };
  });

  const successEntries = entries.filter(e => e.status === "success");
  successEntries.sort((a, b) => b.optimizationScore.overall - a.optimizationScore.overall);
  if (successEntries.length > 0) successEntries[0].recommended = true;
  const failedEntries = entries.filter(e => e.status === "error");
  return [...successEntries, ...failedEntries];
}

export async function runFullAuto(productData: {
  title: string;
  description?: string;
  images?: string[];
  specs?: Record<string, string>;
}): Promise<ArenaEntry | null> {
  const fastModelIds = MODEL_REGISTRY.filter(m => m.speed === "fast").map(m => m.id);
  const results = await runArena({ productData, modelIds: fastModelIds.slice(0, 4) });
  return results.find(r => r.status === "success") || null;
}
