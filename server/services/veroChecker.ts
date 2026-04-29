// ─── AIBAY VERO Brand Checker ────────────────────────────────────────────────
// VeRO = Verified Rights Owner. eBay removes listings that infringe IP.
// This service checks if a product keyword/title contains VERO-protected brands.

export interface VeroResult {
  isRisky: boolean;
  riskLevel: "Safe" | "Caution" | "High Risk" | "Blocked";
  riskScore: number; // 0-100
  matchedBrands: string[];
  safeKeywords: string[];
  recommendation: string;
  canSell: boolean;
}

// ─── VERO Brand Database ──────────────────────────────────────────────────────
// Curated list of brands known to actively file VERO reports on eBay

const VERO_BLOCKED: string[] = [
  // Luxury Fashion
  "Louis Vuitton","LV","Gucci","Chanel","Prada","Hermes","Hermès","Burberry",
  "Versace","Dior","Fendi","Givenchy","Balenciaga","Off-White","Bottega Veneta",
  "Celine","Valentino","Balmain","Saint Laurent","YSL","Moschino","Kenzo",
  // Streetwear / Hype
  "Supreme","Palace","Bape","A Bathing Ape","Stone Island","Chrome Hearts",
  "Yeezy","Fear of God","ESSENTIALS","Travis Scott","Off White","Stüssy","Stussy",
  // Sports / Athleisure (careful — authentic can be listed, replicas = VERO)
  "Nike","Adidas","Jordan","Air Jordan","Puma","Under Armour","New Balance",
  "Reebok","Vans","Converse","FILA","Champion","North Face",
  // Watches / Jewelry
  "Rolex","Omega","Patek Philippe","Audemars Piguet","Richard Mille","Cartier",
  "TAG Heuer","Breitling","IWC","Tiffany","Tiffany & Co","Pandora","Swarovski",
  // Electronics
  "Apple","AirPods","iPhone","iPad","MacBook","iWatch","Apple Watch",
  "Beats","Beats by Dre","Bose","Dyson","Roomba","iRobot","GoPro","DJI",
  "Leica","Sonos","Bang & Olufsen","B&O",
  // Gaming / Entertainment
  "Nintendo","PlayStation","Xbox","Pokemon","Pokémon","LEGO","Lego",
  "Disney","Marvel","DC Comics","Star Wars","Harry Potter","Funko",
  "EA Sports","FIFA","Fortnite","Call of Duty","Minecraft",
  // Automotive Luxury
  "Ferrari","Lamborghini","Porsche","Bentley","Bugatti","Rolls Royce",
  // Beauty / Cosmetics
  "MAC Cosmetics","Charlotte Tilbury","Urban Decay","Too Faced","NARS",
  "La Mer","SK-II","Creed","Tom Ford",
  // Bags / Accessories  
  "Coach","Michael Kors","Kate Spade","Tory Burch","Longchamp","Goyard",
  "Mulberry","Ted Baker","Fossil","Mk",
  // Sports Leagues
  "NFL","NBA","MLB","NHL","Premier League","UEFA","FIFA","Champions League",
  // Other  
  "IKEA","Lululemon","Peloton","Theragun","Hydro Flask","Stanley","Yeti",
  "Nespresso","Vitamix","KitchenAid","Le Creuset","Staub",
];

// Caution brands — authentic items allowed but replicas/unauthorized = VERO risk
const VERO_CAUTION: string[] = [
  "Nike","Adidas","Jordan","North Face","Canada Goose","Moncler",
  "Ralph Lauren","Tommy Hilfiger","Calvin Klein","Lacoste","Polo",
  "Sony","Samsung","Microsoft","Google","Amazon","Xiaomi","Huawei",
  "UGG","Timberland","Dr Martens","Crocs","Birkenstock","Clarks",
  "Zara","H&M","ASOS","Shein","PrettyLittleThing",
];

export function checkVero(text: string): VeroResult {
  const lower = text.toLowerCase();
  const matchedBlocked: string[] = [];
  const matchedCaution: string[] = [];

  for (const brand of VERO_BLOCKED) {
    const bl = brand.toLowerCase();
    if (lower.includes(bl) || lower.replace(/\s+/g, "").includes(bl.replace(/\s+/g, ""))) {
      matchedBlocked.push(brand);
    }
  }

  for (const brand of VERO_CAUTION) {
    const bl = brand.toLowerCase();
    if (lower.includes(bl) && !matchedBlocked.find(b => b.toLowerCase() === bl)) {
      matchedCaution.push(brand);
    }
  }

  const allMatched = [...matchedBlocked, ...matchedCaution];
  const riskScore = Math.min(100, matchedBlocked.length * 40 + matchedCaution.length * 15);

  // Safe keyword suggestions (generic alternatives)
  const safeKeywords = generateSafeAlternatives(text, allMatched);

  let riskLevel: VeroResult["riskLevel"];
  let recommendation: string;
  let canSell: boolean;

  if (matchedBlocked.length > 0) {
    riskLevel = "High Risk";
    canSell = false;
    recommendation = `⛔ HIGH VERO RISK: "${matchedBlocked[0]}" actively files eBay VERO reports. Only list if you are an authorized reseller with proof of authenticity. Replica/unauthorized listings WILL be removed and may result in account suspension.`;
  } else if (matchedCaution.length > 0) {
    riskLevel = "Caution";
    canSell = true;
    recommendation = `⚠️ CAUTION: "${matchedCaution[0]}" is a regulated brand. Authentic used/new items CAN be sold. Ensure you have proof of purchase. Avoid using brand name in ways implying counterfeit. Add "Authentic" or "Genuine" to your listing.`;
  } else {
    riskLevel = "Safe";
    canSell = true;
    recommendation = "✅ SAFE: No known VERO brands detected. You can list this product freely.";
  }

  return {
    isRisky: riskScore > 20,
    riskLevel,
    riskScore,
    matchedBrands: allMatched,
    safeKeywords,
    recommendation,
    canSell,
  };
}

function generateSafeAlternatives(text: string, brands: string[]): string[] {
  let safe = text;
  for (const brand of brands) {
    const regex = new RegExp(brand.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
    safe = safe.replace(regex, "Compatible");
  }
  return [
    safe.trim(),
    safe.replace(/Compatible/gi, "Replacement").trim(),
    `Generic ${text.replace(new RegExp(brands.join("|"), "gi"), "").replace(/\s+/g, " ").trim()}`,
  ].filter(s => s.length > 5);
}

export function checkVeroBatch(titles: string[]): VeroResult[] {
  return titles.map(t => checkVero(t));
}
