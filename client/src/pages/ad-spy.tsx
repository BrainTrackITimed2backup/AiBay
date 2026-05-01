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
  return (
    <Layout>
      <div className="p-6 max-w-4xl mx-auto">
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-pink-100 to-red-100 rounded-xl">
                <Flame className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <span className="block text-2xl font-bold">Social Trend Spy</span>
                <span className="block text-sm font-normal text-muted-foreground mt-1">
                  Live social ingestion is not connected yet in the Cloudflare stack.
                </span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="rounded-lg border border-amber-400/40 bg-amber-400/8 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
              This page no longer shows curated or mock social trend cards. It will stay empty until a real TikTok, Instagram, YouTube, or Facebook ingestion source is wired.
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { label: "Live Sources", value: "0", icon: Globe },
                { label: "Mock Cards", value: "0", icon: Eye },
                { label: "Suggested Action", value: "Wire a source", icon: BarChart3 },
              ].map((item) => (
                <Card key={item.label} className="border">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                      <item.icon className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-lg font-bold leading-none">{item.value}</p>
                      <p className="text-xs text-muted-foreground mt-1">{item.label}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              <Link href="/trending">
                <Button size="sm" data-testid="button-open-trending">
                  <TrendingUp className="w-3.5 h-3.5 mr-1.5" /> Open Live eBay Trends
                </Button>
              </Link>
              <Link href="/market-research">
                <Button size="sm" variant="outline" data-testid="button-open-market-research">
                  <BarChart3 className="w-3.5 h-3.5 mr-1.5" /> Open Market Research
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
