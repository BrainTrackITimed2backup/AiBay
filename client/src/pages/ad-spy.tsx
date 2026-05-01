import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  TrendingUp, Search, ExternalLink, Flame, Zap, Eye,
  ShoppingBag, Heart, Share2, Play, Hash, Globe, ArrowUpRight,
  Loader2, Star, DollarSign, BarChart3
} from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "wouter";

interface TrendProduct {
  title: string;
  platform: string;
  trendScore: number;
  estimatedSearchVolume: string;
  avgPrice: string;
  category: string;
  tags: string[];
  ebayOpportunity: "Hot" | "High" | "Medium" | "Low";
  winScore: number;
  emoji: string;
}

// Curated trend examples until live social ingestion is implemented.
const TRENDING_BY_CATEGORY: Record<string, TrendProduct[]> = {
  all: [],
  tech: [
    { title: "MagSafe Charger Stand 3-in-1 iPhone 15 Pro", platform: "TikTok", trendScore: 97, estimatedSearchVolume: "180K/mo", avgPrice: "$18-35", category: "Tech Accessories", tags: ["#iphoneaccessories", "#magsafe", "#techgadgets"], ebayOpportunity: "Hot", winScore: 94, emoji: "📱" },
    { title: "Portable Mini Projector 1080p WiFi Bluetooth", platform: "Instagram", trendScore: 91, estimatedSearchVolume: "95K/mo", avgPrice: "$45-89", category: "Electronics", tags: ["#hometheatre", "#projector", "#movienight"], ebayOpportunity: "Hot", winScore: 88, emoji: "🎬" },
    { title: "RGB Mechanical Gaming Keyboard TKL Wireless", platform: "YouTube", trendScore: 88, estimatedSearchVolume: "140K/mo", avgPrice: "$35-80", category: "PC Gaming", tags: ["#gaming", "#mechanicalkeyboard", "#pcsetup"], ebayOpportunity: "High", winScore: 85, emoji: "⌨️" },
    { title: "Smart Home Hub Google Alexa Compatible", platform: "Facebook", trendScore: 82, estimatedSearchVolume: "75K/mo", avgPrice: "$25-60", category: "Smart Home", tags: ["#smarthome", "#homeautomation", "#alexa"], ebayOpportunity: "High", winScore: 79, emoji: "🏠" },
    { title: "USB-C 140W GaN Charger Multi-Port Fast Charging", platform: "TikTok", trendScore: 79, estimatedSearchVolume: "62K/mo", avgPrice: "$22-45", category: "Charging", tags: ["#fastcharging", "#usbc", "#techaccessories"], ebayOpportunity: "Medium", winScore: 76, emoji: "⚡" },
  ],
  fashion: [
    { title: "Y2K Cargo Pants Women Streetwear Baggy", platform: "TikTok", trendScore: 99, estimatedSearchVolume: "220K/mo", avgPrice: "$15-35", category: "Women's Clothing", tags: ["#y2kfashion", "#cargopants", "#streetwear"], ebayOpportunity: "Hot", winScore: 96, emoji: "👖" },
    { title: "Oversized Vintage Graphic Tee Unisex 90s", platform: "Instagram", trendScore: 94, estimatedSearchVolume: "180K/mo", avgPrice: "$12-28", category: "Clothing", tags: ["#vintagefashion", "#graphictee", "#thrift"], ebayOpportunity: "Hot", winScore: 91, emoji: "👕" },
    { title: "Platform Chunky Dad Shoes Women Retro", platform: "TikTok", trendScore: 92, estimatedSearchVolume: "155K/mo", avgPrice: "$20-55", category: "Footwear", tags: ["#dadshoes", "#platformshoes", "#ootd"], ebayOpportunity: "Hot", winScore: 89, emoji: "👟" },
    { title: "Mini Crossbody Bag Canvas Aesthetic Trendy", platform: "Pinterest", trendScore: 87, estimatedSearchVolume: "98K/mo", avgPrice: "$8-22", category: "Bags", tags: ["#crossbodybag", "#aestheticfashion", "#itgirl"], ebayOpportunity: "High", winScore: 83, emoji: "👜" },
    { title: "Satin Slip Dress Y2K Silky Camisole Women", platform: "TikTok", trendScore: 85, estimatedSearchVolume: "88K/mo", avgPrice: "$12-30", category: "Dresses", tags: ["#satindress", "#y2kstyle", "#slipskirt"], ebayOpportunity: "High", winScore: 81, emoji: "👗" },
  ],
  home: [
    { title: "Aesthetic LED Neon Sign Custom Bedroom Decor", platform: "TikTok", trendScore: 95, estimatedSearchVolume: "210K/mo", avgPrice: "$15-45", category: "Home Decor", tags: ["#neonsign", "#roomdecor", "#bedroomaesthetic"], ebayOpportunity: "Hot", winScore: 92, emoji: "💡" },
    { title: "Stanley Tumbler Dupe 40oz Quencher", platform: "TikTok", trendScore: 93, estimatedSearchVolume: "195K/mo", avgPrice: "$12-25", category: "Drinkware", tags: ["#stanley", "#tumbler", "#watertumbler"], ebayOpportunity: "Hot", winScore: 90, emoji: "🥤" },
    { title: "Linen Set Pillowcase Duvet Aesthetic Neutral", platform: "Pinterest", trendScore: 84, estimatedSearchVolume: "72K/mo", avgPrice: "$18-65", category: "Bedding", tags: ["#linenset", "#bedroomdecor", "#homedecor"], ebayOpportunity: "High", winScore: 80, emoji: "🛏️" },
    { title: "Air Fryer Compact 4QT Digital Non-Stick", platform: "Facebook", trendScore: 88, estimatedSearchVolume: "310K/mo", avgPrice: "$35-80", category: "Kitchen", tags: ["#airfryer", "#kitchengadgets", "#healthycooking"], ebayOpportunity: "High", winScore: 85, emoji: "🍳" },
    { title: "Boho Macrame Wall Hanging Handmade Decor", platform: "Etsy/Pinterest", trendScore: 78, estimatedSearchVolume: "55K/mo", avgPrice: "$12-35", category: "Wall Art", tags: ["#macrame", "#bohodecor", "#walldecor"], ebayOpportunity: "Medium", winScore: 74, emoji: "🎨" },
  ],
  beauty: [
    { title: "Heatless Curling Rod Silk Ribbon Overnight", platform: "TikTok", trendScore: 98, estimatedSearchVolume: "230K/mo", avgPrice: "$5-15", category: "Hair Tools", tags: ["#heatlesscurls", "#hairhack", "#noheathair"], ebayOpportunity: "Hot", winScore: 95, emoji: "💇" },
    { title: "Glass Skin Serum Hyaluronic Acid Niacinamide", platform: "Instagram", trendScore: 96, estimatedSearchVolume: "185K/mo", avgPrice: "$8-25", category: "Skincare", tags: ["#glasskin", "#kbeauty", "#skincareroutine"], ebayOpportunity: "Hot", winScore: 93, emoji: "✨" },
    { title: "Dermaplaning Face Razor Women Flawless", platform: "TikTok", trendScore: 90, estimatedSearchVolume: "120K/mo", avgPrice: "$5-12", category: "Skincare Tools", tags: ["#dermaplaning", "#skintok", "#skincare"], ebayOpportunity: "Hot", winScore: 87, emoji: "🪒" },
    { title: "Press-On Nails Short Almond Gel Glossy Set", platform: "TikTok", trendScore: 94, estimatedSearchVolume: "175K/mo", avgPrice: "$4-15", category: "Nails", tags: ["#pressonnails", "#nailsoftiktok", "#nailart"], ebayOpportunity: "Hot", winScore: 91, emoji: "💅" },
    { title: "LED Red Light Face Mask Therapy Skincare", platform: "Instagram", trendScore: 87, estimatedSearchVolume: "88K/mo", avgPrice: "$15-65", category: "Skincare Devices", tags: ["#redlighttherapy", "#ledmask", "#antiaging"], ebayOpportunity: "High", winScore: 84, emoji: "🔴" },
  ],
  pets: [
    { title: "Cat Window Perch Hammock Suction Cup Mount", platform: "TikTok", trendScore: 92, estimatedSearchVolume: "105K/mo", avgPrice: "$12-28", category: "Cat Accessories", tags: ["#cattok", "#catsoftiktok", "#cattoys"], ebayOpportunity: "Hot", winScore: 89, emoji: "🐱" },
    { title: "Slow Feeder Dog Bowl Puzzle Anti-Bloat", platform: "Facebook", trendScore: 85, estimatedSearchVolume: "78K/mo", avgPrice: "$8-20", category: "Dog Accessories", tags: ["#dogtok", "#doghealth", "#slowfeeder"], ebayOpportunity: "High", winScore: 81, emoji: "🐶" },
    { title: "Lick Mat Grooming Distraction Pad Suction", platform: "TikTok", trendScore: 88, estimatedSearchVolume: "92K/mo", avgPrice: "$6-15", category: "Pet Toys", tags: ["#lickmat", "#dogbath", "#pethacks"], ebayOpportunity: "Hot", winScore: 85, emoji: "🌀" },
  ],
};

const PLATFORM_COLORS: Record<string, string> = {
  TikTok: "bg-black text-white",
  Instagram: "bg-gradient-to-r from-purple-600 to-pink-500 text-white",
  YouTube: "bg-red-600 text-white",
  Facebook: "bg-blue-600 text-white",
  Pinterest: "bg-red-500 text-white",
  "Etsy/Pinterest": "bg-orange-500 text-white",
};

const OPPORTUNITY_STYLES: Record<string, string> = {
  Hot: "bg-red-100 text-red-700 border-red-200",
  High: "bg-orange-100 text-orange-700 border-orange-200",
  Medium: "bg-amber-100 text-amber-700 border-amber-200",
  Low: "bg-gray-100 text-gray-600 border-gray-200",
};

export default function AdSpyPage() {
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"trendScore" | "winScore" | "volume">("trendScore");

  let products: TrendProduct[] = category === "all"
    ? Object.values(TRENDING_BY_CATEGORY).flat().filter(p => p.title !== undefined)
    : TRENDING_BY_CATEGORY[category] || [];

  if (search) {
    products = products.filter(p =>
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase()) ||
      p.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))
    );
  }

  products = [...products].sort((a, b) => b[sortBy === "volume" ? "trendScore" : sortBy] - a[sortBy === "volume" ? "trendScore" : sortBy]);

  const hotCount = products.filter(p => p.ebayOpportunity === "Hot").length;
  const avgWinScore = products.length ? Math.round(products.reduce((s, p) => s + p.winScore, 0) / products.length) : 0;

  return (
    <Layout>
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-gradient-to-br from-pink-100 to-red-100 rounded-xl">
              <Flame className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Social Trend Spy</h1>
              <p className="text-muted-foreground text-sm">Curated trend board for product ideas from TikTok, Instagram, YouTube, and Facebook</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/40 rounded-lg px-3 py-2">
            <Globe className="w-3.5 h-3.5" />
            <span>Currently curated sample trends for frontend preview. Live social ingestion is not wired yet.</span>
          </div>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Hot Opportunities", value: hotCount, icon: Flame, color: "text-red-500 bg-red-50" },
            { label: "Avg Win Score", value: `${avgWinScore}/100`, icon: Star, color: "text-amber-500 bg-amber-50" },
            { label: "Products Tracked", value: products.length, icon: Eye, color: "text-blue-500 bg-blue-50" },
            { label: "Platforms Monitored", value: "5", icon: Globe, color: "text-purple-500 bg-purple-50" },
          ].map(s => (
            <Card key={s.label} className="border">
              <CardContent className="p-3 flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${s.color.split(" ")[1]}`}>
                  <s.icon className={`w-4 h-4 ${s.color.split(" ")[0]}`} />
                </div>
                <div>
                  <p className="text-lg font-bold leading-none">{s.value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search trending products, tags, categories…"
              value={search} onChange={e => setSearch(e.target.value)} data-testid="input-search-trends" />
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-full sm:w-44" data-testid="select-category">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="tech">Tech & Gadgets</SelectItem>
              <SelectItem value="fashion">Fashion</SelectItem>
              <SelectItem value="home">Home & Garden</SelectItem>
              <SelectItem value="beauty">Beauty & Health</SelectItem>
              <SelectItem value="pets">Pet Accessories</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={(v: "trendScore" | "winScore") => setSortBy(v)}>
            <SelectTrigger className="w-full sm:w-40" data-testid="select-sort">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="trendScore">Sort: Trending</SelectItem>
              <SelectItem value="winScore">Sort: Win Score</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Product grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((p, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <Card className="h-full hover:shadow-md transition-shadow border" data-testid={`card-trend-${i}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{p.emoji}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PLATFORM_COLORS[p.platform] || "bg-gray-100 text-gray-700"}`}>
                        {p.platform}
                      </span>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${OPPORTUNITY_STYLES[p.ebayOpportunity]}`}>
                      {p.ebayOpportunity === "Hot" ? "🔥 " : ""}{p.ebayOpportunity}
                    </span>
                  </div>

                  <h3 className="font-semibold text-sm leading-snug mb-2">{p.title}</h3>
                  <p className="text-xs text-muted-foreground mb-3">{p.category}</p>

                  <div className="grid grid-cols-3 gap-2 mb-3 text-center">
                    <div className="bg-muted/40 rounded-lg p-2">
                      <p className="text-xs text-muted-foreground">Trend</p>
                      <p className="font-bold text-sm text-red-500">{p.trendScore}</p>
                    </div>
                    <div className="bg-muted/40 rounded-lg p-2">
                      <p className="text-xs text-muted-foreground">Win Score</p>
                      <p className="font-bold text-sm text-blue-600">{p.winScore}</p>
                    </div>
                    <div className="bg-muted/40 rounded-lg p-2">
                      <p className="text-xs text-muted-foreground">Searches</p>
                      <p className="font-bold text-sm">{p.estimatedSearchVolume.split("/")[0]}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-1 text-sm text-green-600 font-medium">
                      <DollarSign className="w-3.5 h-3.5" />
                      {p.avgPrice}
                    </div>
                    <div className="flex gap-1 flex-wrap justify-end">
                      {p.tags.slice(0, 2).map(t => (
                        <span key={t} className="text-xs text-blue-600 bg-blue-50 rounded px-1.5 py-0.5">{t}</span>
                      ))}
                    </div>
                  </div>

                  {/* Win score bar */}
                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>AIBAY Win Score</span>
                      <span className="font-semibold">{p.winScore}/100</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-1.5">
                      <div className={`h-1.5 rounded-full ${p.winScore >= 90 ? "bg-green-500" : p.winScore >= 75 ? "bg-blue-500" : "bg-amber-500"}`}
                        style={{ width: `${p.winScore}%` }} />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <a href={`https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(p.title)}&_sop=12`}
                      target="_blank" rel="noopener noreferrer" className="flex-1">
                      <Button variant="outline" size="sm" className="w-full text-xs" data-testid={`button-search-ebay-${i}`}>
                        <Search className="w-3 h-3 mr-1" /> Find on eBay
                      </Button>
                    </a>
                    <Link href={`/generate?title=${encodeURIComponent(p.title)}`}>
                      <Button size="sm" className="text-xs" data-testid={`button-generate-listing-${i}`}>
                        <Zap className="w-3 h-3 mr-1" /> Generate
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {products.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <Search className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No products found</p>
            <p className="text-sm">Try a different search or category</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
