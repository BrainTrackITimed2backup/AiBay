import { useState } from "react";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
  TrendingUp, TrendingDown, DollarSign, Percent, Calculator,
  BarChart3, Info, Target, Zap, Package, ShoppingBag
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ROASResult {
  roas: number;
  breakEvenROAS: number;
  netProfit: number;
  profitMargin: number;
  verdict: string;
}

interface EbayFeeBreakdown {
  insertionFee: number;
  finalValueFee: number;
  promotedListingFee: number;
  paymentProcessingFee: number;
  total: number;
}

function calcEbayFees(salePrice: number, adPercent: number, category = "general"): EbayFeeBreakdown {
  const fvfRates: Record<string, number> = {
    electronics: 0.0875, clothing: 0.12, books: 0.1475, general: 0.1325,
    motors: 0.065, jewelry: 0.15, sporting: 0.12,
  };
  const fvfRate = fvfRates[category] ?? 0.1325;
  const finalValueFee = salePrice * fvfRate;
  const paymentProcessingFee = salePrice * 0.029 + 0.3;
  const promotedListingFee = salePrice * (adPercent / 100);
  return {
    insertionFee: 0,
    finalValueFee: Math.round(finalValueFee * 100) / 100,
    promotedListingFee: Math.round(promotedListingFee * 100) / 100,
    paymentProcessingFee: Math.round(paymentProcessingFee * 100) / 100,
    total: Math.round((finalValueFee + paymentProcessingFee + promotedListingFee) * 100) / 100,
  };
}

const verdictStyles: Record<string, { color: string; bg: string; icon: any }> = {
  "Excellent": { color: "text-green-700", bg: "bg-green-50 border-green-200", icon: TrendingUp },
  "Profitable": { color: "text-blue-700", bg: "bg-blue-50 border-blue-200", icon: TrendingUp },
  "Near": { color: "text-amber-700", bg: "bg-amber-50 border-amber-200", icon: BarChart3 },
  "Loss": { color: "text-red-700", bg: "bg-red-50 border-red-200", icon: TrendingDown },
};

function getVerdictStyle(verdict: string) {
  for (const key of Object.keys(verdictStyles)) {
    if (verdict.startsWith(key)) return verdictStyles[key];
  }
  return verdictStyles["Profitable"];
}

export default function RoasCalculatorPage() {
  const [salePrice, setSalePrice] = useState(29.99);
  const [costPrice, setCostPrice] = useState(8);
  const [shippingCost, setShippingCost] = useState(4.99);
  const [adPercent, setAdPercent] = useState(5);
  const [category, setCategory] = useState("general");
  const [volume, setVolume] = useState(1);

  const fees = calcEbayFees(salePrice, adPercent, category);
  const netRevenue = salePrice - fees.total - shippingCost;
  const netProfit = netRevenue - costPrice;
  const profitMargin = salePrice > 0 ? (netProfit / salePrice) * 100 : 0;
  const roi = costPrice > 0 ? (netProfit / costPrice) * 100 : 0;
  const roas = fees.promotedListingFee > 0 ? salePrice / fees.promotedListingFee : 0;
  const breakEven = costPrice + fees.total + shippingCost;

  const result: ROASResult = {
    roas: Math.round(roas * 100) / 100,
    breakEvenROAS: Math.round((breakEven / Math.max(fees.promotedListingFee, 0.01)) * 100) / 100,
    netProfit: Math.round(netProfit * 100) / 100,
    profitMargin: Math.round(profitMargin * 100) / 100,
    verdict: netProfit > salePrice * 0.3
      ? "Excellent — highly profitable"
      : netProfit > 0
        ? "Profitable — positive ROI"
        : netProfit > -2
          ? "Near break-even — review costs"
          : "Loss-making — increase price or reduce costs",
  };

  const verdictStyle = getVerdictStyle(result.verdict);
  const VerdictIcon = verdictStyle.icon;

  const CATEGORIES = [
    { value: "general", label: "General (13.25%)" },
    { value: "electronics", label: "Electronics (8.75%)" },
    { value: "clothing", label: "Clothing (12%)" },
    { value: "books", label: "Books & Media (14.75%)" },
    { value: "motors", label: "Motors Parts (6.5%)" },
    { value: "jewelry", label: "Jewelry & Watches (15%)" },
    { value: "sporting", label: "Sporting Goods (12%)" },
  ];

  function MetricCard({ label, value, sub, color = "text-foreground", prefix = "" }: { label: string; value: number | string; sub?: string; color?: string; prefix?: string }) {
    return (
      <div className="text-center p-4 bg-muted/30 rounded-xl">
        <p className="text-xs text-muted-foreground mb-1">{label}</p>
        <p className={`text-2xl font-bold ${color}`}>{prefix}{typeof value === "number" ? value.toFixed(2) : value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    );
  }

  return (
    <Layout>
      <div className="p-6 max-w-5xl mx-auto">
        <div className="mb-6 flex items-center gap-3">
          <div className="p-2.5 bg-purple-100 rounded-xl">
            <Calculator className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">ROAS & Profit Calculator</h1>
            <p className="text-muted-foreground text-sm">Calculate Return on Ad Spend, fees, and true profit — beats ZikAnalytics free tools</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Inputs */}
          <div className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><DollarSign className="w-4 h-4" />Pricing & Costs</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Sale Price: <strong>${salePrice.toFixed(2)}</strong></Label>
                  <Slider min={0.99} max={500} step={0.01} value={[salePrice]} onValueChange={([v]) => setSalePrice(v)} className="mt-2" data-testid="slider-sale-price" />
                  <Input type="number" value={salePrice} onChange={e => setSalePrice(Number(e.target.value))} className="mt-2" data-testid="input-sale-price" />
                </div>
                <div>
                  <Label>Cost of Goods (COGS): <strong>${costPrice.toFixed(2)}</strong></Label>
                  <Slider min={0} max={Math.max(salePrice, 200)} step={0.01} value={[costPrice]} onValueChange={([v]) => setCostPrice(v)} className="mt-2" />
                  <Input type="number" value={costPrice} onChange={e => setCostPrice(Number(e.target.value))} className="mt-2" data-testid="input-cost-price" />
                </div>
                <div>
                  <Label>Shipping Cost: <strong>${shippingCost.toFixed(2)}</strong></Label>
                  <Slider min={0} max={50} step={0.01} value={[shippingCost]} onValueChange={([v]) => setShippingCost(v)} className="mt-2" />
                </div>
                <div>
                  <Label htmlFor="category-select">eBay Category (affects FVF)</Label>
                  <select id="category-select" data-testid="select-category"
                    className="w-full mt-1 px-3 py-2 border rounded-md bg-background text-sm"
                    value={category} onChange={e => setCategory(e.target.value)}>
                    {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Percent className="w-4 h-4" />Promoted Listings Ad Rate</CardTitle></CardHeader>
              <CardContent>
                <Label>Ad Rate: <strong>{adPercent}%</strong> of sale price = <strong>${fees.promotedListingFee.toFixed(2)}</strong></Label>
                <Slider min={0} max={20} step={0.5} value={[adPercent]} onValueChange={([v]) => setAdPercent(v)} className="mt-3" data-testid="slider-ad-rate" />
                <p className="text-xs text-muted-foreground mt-2">eBay Promoted Listings standard rate (0% = organic only, 5-10% typical)</p>

                <div className="mt-4">
                  <Label>Monthly Volume: <strong>{volume} sales</strong></Label>
                  <Slider min={1} max={500} step={1} value={[volume]} onValueChange={([v]) => setVolume(v)} className="mt-2" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Results */}
          <div className="space-y-4">
            <motion.div key={result.verdict} initial={{ opacity: 0.6, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}>
              <Card className={`border-2 ${verdictStyle.bg}`}>
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <VerdictIcon className={`w-6 h-6 ${verdictStyle.color}`} />
                    <p className={`font-bold ${verdictStyle.color}`}>{result.verdict}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <MetricCard label="Net Profit" value={result.netProfit} prefix="$"
                      color={result.netProfit >= 0 ? "text-green-600" : "text-red-600"} />
                    <MetricCard label="Profit Margin" value={result.profitMargin} sub="%"
                      color={result.profitMargin >= 20 ? "text-green-600" : result.profitMargin >= 0 ? "text-amber-600" : "text-red-600"} />
                    <MetricCard label="ROI" value={Math.round(roi * 100) / 100} sub="%"
                      color={roi >= 30 ? "text-green-600" : roi >= 0 ? "text-amber-600" : "text-red-600"} />
                    <MetricCard label="ROAS" value={roas > 0 ? roas.toFixed(1) + "x" : "N/A"}
                      color={roas >= 3 ? "text-green-600" : roas >= 1 ? "text-amber-600" : "text-muted-foreground"} />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <Card>
              <CardHeader><CardTitle className="text-base">Fee Breakdown</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  {[
                    { label: "Sale Price", value: salePrice, positive: true },
                    { label: `Final Value Fee (${category === "general" ? "13.25" : category === "electronics" ? "8.75" : category === "clothing" ? "12" : "varies"}%)`, value: -fees.finalValueFee },
                    { label: "Payment Processing (2.9% + $0.30)", value: -fees.paymentProcessingFee },
                    { label: `Promoted Listings (${adPercent}%)`, value: -fees.promotedListingFee },
                    { label: "Shipping Cost", value: -shippingCost },
                    { label: "Cost of Goods", value: -costPrice },
                  ].map((item, i) => (
                    <div key={i} className={`flex justify-between py-1.5 ${i === 0 ? "font-semibold border-b pb-2" : i === 5 ? "border-t pt-2 font-semibold" : ""}`}>
                      <span className="text-muted-foreground">{item.label}</span>
                      <span className={item.positive ? "text-green-600 font-medium" : ""}>${Math.abs(item.value).toFixed(2)}</span>
                    </div>
                  ))}
                  <div className={`flex justify-between py-2 border-t font-bold text-base ${result.netProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
                    <span>Net Profit</span>
                    <span>${result.netProfit.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {volume > 1 && (
              <Card className="bg-muted/30">
                <CardContent className="p-4">
                  <p className="font-semibold text-sm mb-2 flex items-center gap-2"><Package className="w-4 h-4" />Monthly Projection ({volume} sales)</p>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><p className="text-muted-foreground">Monthly Revenue</p><p className="font-bold text-green-600">${(salePrice * volume).toFixed(2)}</p></div>
                    <div><p className="text-muted-foreground">Monthly Profit</p><p className={`font-bold ${result.netProfit * volume >= 0 ? "text-green-600" : "text-red-600"}`}>${(result.netProfit * volume).toFixed(2)}</p></div>
                    <div><p className="text-muted-foreground">Total Fees</p><p className="font-bold">${(fees.total * volume + shippingCost * volume).toFixed(2)}</p></div>
                    <div><p className="text-muted-foreground">Ad Spend</p><p className="font-bold">${(fees.promotedListingFee * volume).toFixed(2)}</p></div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <Card className="mt-6 bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Info className="w-4 h-4 text-purple-600" />
              <p className="font-semibold text-purple-900">Break-even Price: ${breakEven.toFixed(2)}</p>
            </div>
            <p className="text-sm text-purple-800">You must sell above <strong>${breakEven.toFixed(2)}</strong> to break even after all eBay fees, shipping, and COGS. Recommended minimum list price: <strong>${(breakEven * 1.15).toFixed(2)}</strong> (15% margin).</p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
