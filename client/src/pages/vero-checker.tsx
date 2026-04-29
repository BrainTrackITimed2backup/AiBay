import { useState } from "react";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Shield, ShieldAlert, ShieldCheck, ShieldX, Search, Loader2,
  AlertTriangle, CheckCircle2, XCircle, Info, Copy, UploadCloud,
  Sparkles, ArrowRight
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { motion, AnimatePresence } from "framer-motion";

interface VeroResult {
  isRisky: boolean;
  riskLevel: "Safe" | "Caution" | "High Risk" | "Blocked";
  riskScore: number;
  matchedBrands: string[];
  safeKeywords: string[];
  recommendation: string;
  canSell: boolean;
}

const riskConfig = {
  Safe: { icon: ShieldCheck, color: "text-green-600", bg: "bg-green-50", border: "border-green-200", badge: "bg-green-100 text-green-700" },
  Caution: { icon: ShieldAlert, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200", badge: "bg-amber-100 text-amber-700" },
  "High Risk": { icon: ShieldX, color: "text-red-600", bg: "bg-red-50", border: "border-red-200", badge: "bg-red-100 text-red-700" },
  Blocked: { icon: XCircle, color: "text-red-700", bg: "bg-red-100", border: "border-red-300", badge: "bg-red-200 text-red-800" },
};

const COMMON_VERO_BRANDS = [
  "Nike", "Apple", "Louis Vuitton", "Gucci", "Rolex", "Supreme", "Jordan",
  "Yeezy", "Chanel", "Disney", "Pokemon", "LEGO", "Ferrari", "Beats",
];

export default function VeroCheckerPage() {
  const [tab, setTab] = useState<"single" | "bulk">("single");
  const [singleText, setSingleText] = useState("");
  const [bulkText, setBulkText] = useState("");
  const [singleResult, setSingleResult] = useState<VeroResult | null>(null);
  const [bulkResults, setBulkResults] = useState<{ title: string; result: VeroResult }[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  async function checkSingle() {
    if (!singleText.trim()) return;
    setLoading(true);
    try {
      const res = await apiRequest("POST", "/api/vero/check", { text: singleText });
      const data = await res.json();
      setSingleResult(data);
    } catch {
      toast({ title: "Check failed", description: "Please try again", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  async function checkBulk() {
    const titles = bulkText.split("\n").map(t => t.trim()).filter(Boolean);
    if (titles.length === 0) return;
    setLoading(true);
    try {
      const res = await apiRequest("POST", "/api/vero/batch", { titles });
      const data = await res.json();
      setBulkResults(titles.map((title, i) => ({ title, result: data.results[i] })));
    } catch {
      toast({ title: "Batch check failed", description: "Please try again", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  function RiskBadge({ level }: { level: VeroResult["riskLevel"] }) {
    const cfg = riskConfig[level];
    return <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${cfg.badge}`}>{level}</span>;
  }

  function ResultCard({ result }: { result: VeroResult }) {
    const cfg = riskConfig[result.riskLevel];
    const Icon = cfg.icon;
    return (
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className={`rounded-xl border-2 ${cfg.border} ${cfg.bg} p-5`}>
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-xl bg-white shadow-sm`}>
            <Icon className={`w-7 h-7 ${cfg.color}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <RiskBadge level={result.riskLevel} />
              <span className="text-sm text-muted-foreground">Risk Score: <strong>{result.riskScore}/100</strong></span>
              {result.canSell
                ? <span className="text-xs text-green-600 font-medium flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />Can Sell</span>
                : <span className="text-xs text-red-600 font-medium flex items-center gap-1"><XCircle className="w-3 h-3" />Do Not List</span>}
            </div>

            <div className="w-full bg-white/60 rounded-full h-2 mb-3">
              <div className={`h-2 rounded-full transition-all ${result.riskScore < 30 ? "bg-green-500" : result.riskScore < 60 ? "bg-amber-500" : "bg-red-500"}`}
                style={{ width: `${result.riskScore}%` }} />
            </div>

            <p className="text-sm font-medium text-foreground mb-3">{result.recommendation}</p>

            {result.matchedBrands.length > 0 && (
              <div className="mb-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Flagged Brands</p>
                <div className="flex flex-wrap gap-1.5">
                  {result.matchedBrands.map(b => (
                    <span key={b} className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs font-medium">{b}</span>
                  ))}
                </div>
              </div>
            )}

            {result.safeKeywords.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Safe Alternatives</p>
                <div className="flex flex-wrap gap-1.5">
                  {result.safeKeywords.slice(0, 3).map((k, i) => (
                    <button key={i} onClick={() => { setSingleText(k); navigator.clipboard.writeText(k); toast({ title: "Copied!" }); }}
                      className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium hover:bg-green-200 transition-colors flex items-center gap-1">
                      {k.slice(0, 40)}{k.length > 40 ? "…" : ""} <Copy className="w-2.5 h-2.5" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <Layout>
      <div className="p-6 max-w-4xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-blue-100 rounded-xl">
              <Shield className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">VERO Brand Checker</h1>
              <p className="text-muted-foreground text-sm">Protect your eBay account — detect VeRO-protected brands before you list</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2.5 text-sm text-blue-700">
            <Info className="w-4 h-4 shrink-0" />
            <span>VeRO (Verified Rights Owner) brands actively report eBay listings. A single report can result in listing removal or account suspension.</span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
          {[
            { label: "Brands Monitored", value: "300+", icon: Shield, color: "text-blue-600 bg-blue-50" },
            { label: "Luxury Brands", value: "45+", icon: ShieldAlert, color: "text-amber-600 bg-amber-50" },
            { label: "Tech Brands", value: "60+", icon: ShieldCheck, color: "text-green-600 bg-green-50" },
            { label: "Sports Brands", value: "30+", icon: Sparkles, color: "text-purple-600 bg-purple-50" },
          ].map(s => (
            <Card key={s.label} className="border">
              <CardContent className="p-4">
                <div className={`w-9 h-9 rounded-lg ${s.color.split(" ")[1]} flex items-center justify-center mb-2`}>
                  <s.icon className={`w-5 h-5 ${s.color.split(" ")[0]}`} />
                </div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs value={tab} onValueChange={(v) => setTab(v as "single" | "bulk")}>
          <TabsList className="mb-4">
            <TabsTrigger value="single" data-testid="tab-single">Single Product Check</TabsTrigger>
            <TabsTrigger value="bulk" data-testid="tab-bulk">Bulk Check (up to 50)</TabsTrigger>
          </TabsList>

          <TabsContent value="single">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Check a Product Title or Keyword</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="vero-input">Product Title / Keyword</Label>
                  <div className="flex gap-2 mt-1">
                    <Input id="vero-input" data-testid="input-vero-text"
                      placeholder='e.g. "Nike Air Max 90 Mens Running Shoes"'
                      value={singleText} onChange={e => setSingleText(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && checkSingle()} />
                    <Button onClick={checkSingle} disabled={loading || !singleText.trim()} data-testid="button-check-vero">
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground mb-2 font-medium">Quick test (click to check):</p>
                  <div className="flex flex-wrap gap-1.5">
                    {COMMON_VERO_BRANDS.map(b => (
                      <button key={b} onClick={() => { setSingleText(b); }}
                        className="px-2.5 py-1 text-xs bg-muted hover:bg-muted/80 rounded-full transition-colors">
                        {b}
                      </button>
                    ))}
                  </div>
                </div>

                <AnimatePresence>
                  {singleResult && <ResultCard result={singleResult} />}
                </AnimatePresence>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bulk">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Bulk VERO Check — Paste Product Titles (one per line)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea data-testid="input-bulk-titles"
                  placeholder={"Nike Air Max 90 Mens Shoes\nLouis Vuitton Neverfull Tote Bag\nWireless Bluetooth Headphones\nApple iPhone 15 Pro Case\nGeneric USB-C Charging Cable"}
                  rows={8} value={bulkText} onChange={e => setBulkText(e.target.value)} />
                <Button onClick={checkBulk} disabled={loading || !bulkText.trim()} className="w-full" data-testid="button-bulk-check">
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Checking all products…</> : <><UploadCloud className="w-4 h-4 mr-2" />Check All Products</>}
                </Button>
                <AnimatePresence>
                  {bulkResults.length > 0 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-sm">{bulkResults.length} products checked</p>
                        <div className="flex gap-2 text-xs">
                          <span className="text-green-600">{bulkResults.filter(r => r.result.riskLevel === "Safe").length} Safe</span>
                          <span className="text-amber-600">{bulkResults.filter(r => r.result.riskLevel === "Caution").length} Caution</span>
                          <span className="text-red-600">{bulkResults.filter(r => r.result.riskLevel === "High Risk").length} High Risk</span>
                        </div>
                      </div>
                      {bulkResults.map((item, i) => {
                        const cfg = riskConfig[item.result.riskLevel];
                        const Icon = cfg.icon;
                        return (
                          <div key={i} className={`flex items-center gap-3 p-3 rounded-lg border ${cfg.border} ${cfg.bg}`}>
                            <Icon className={`w-5 h-5 ${cfg.color} shrink-0`} />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{item.title}</p>
                              {item.result.matchedBrands.length > 0 && (
                                <p className="text-xs text-muted-foreground">Flagged: {item.result.matchedBrands.join(", ")}</p>
                              )}
                            </div>
                            <RiskBadge level={item.result.riskLevel} />
                          </div>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Card className="mt-6 border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <h3 className="font-semibold text-blue-900 mb-2">How VERO Protection Works</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm text-blue-800">
              <div className="flex items-start gap-2">
                <ArrowRight className="w-4 h-4 mt-0.5 shrink-0" />
                <span><strong>Safe</strong> — No known VERO brands detected. Free to list.</span>
              </div>
              <div className="flex items-start gap-2">
                <ArrowRight className="w-4 h-4 mt-0.5 shrink-0" />
                <span><strong>Caution</strong> — Brand present. Authentic items OK with proof of purchase.</span>
              </div>
              <div className="flex items-start gap-2">
                <ArrowRight className="w-4 h-4 mt-0.5 shrink-0" />
                <span><strong>High Risk</strong> — Actively files VERO. Only authorized resellers may list.</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
