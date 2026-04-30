import { useEffect, useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/layout";
import { buildApiUrl } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Activity,
  ArrowRight,
  ClipboardList,
  FolderKanban,
  LayoutTemplate,
  Lock,
  ShieldCheck,
  Sparkles,
  Store,
  Users,
  Zap,
} from "lucide-react";

interface Stats {
  totalListings: number;
  totalWatchlist: number;
  totalTrackedSellers: number;
  keywordSearchesToday: number;
  ebayConfigured: boolean;
}

interface HealthResponse {
  status: string;
  timestamp: string;
}

interface ListingRow {
  id: number;
  generatedTitle: string;
  createdAt?: string | null;
}

interface TemplateRow {
  id: number;
  name: string;
  isDefault?: boolean | null;
}

interface WatchlistRow {
  id: number;
  productTitle: string;
  marketplace?: string | null;
}

interface SellerRow {
  id: number;
  username: string;
  totalListings?: number | null;
}

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || "Admin@Bay";
const ADMIN_SESSION_KEY = "aibay-admin-unlocked";

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(buildApiUrl(url));
  if (!res.ok) throw new Error(`Failed to load ${url}`);
  return res.json();
}

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined" && sessionStorage.getItem(ADMIN_SESSION_KEY) === "1") {
      setUnlocked(true);
    }
  }, []);

  const health = useQuery<HealthResponse>({
    queryKey: ["/api/health"],
    enabled: unlocked,
    refetchInterval: 30000,
  });

  const stats = useQuery<Stats>({
    queryKey: ["/api/stats"],
    enabled: unlocked,
    refetchInterval: 30000,
  });

  const listings = useQuery<ListingRow[]>({
    queryKey: ["/api/listings"],
    enabled: unlocked,
    queryFn: () => fetchJson<ListingRow[]>("/api/listings"),
  });

  const templates = useQuery<TemplateRow[]>({
    queryKey: ["/api/templates"],
    enabled: unlocked,
    queryFn: () => fetchJson<TemplateRow[]>("/api/templates"),
  });

  const watchlist = useQuery<WatchlistRow[]>({
    queryKey: ["/api/watchlist"],
    enabled: unlocked,
    queryFn: () => fetchJson<WatchlistRow[]>("/api/watchlist"),
  });

  const sellers = useQuery<SellerRow[]>({
    queryKey: ["/api/tracked-sellers"],
    enabled: unlocked,
    queryFn: () => fetchJson<SellerRow[]>("/api/tracked-sellers"),
  });

  function handleUnlock(e: React.FormEvent) {
    e.preventDefault();
    if (password !== ADMIN_PASSWORD) {
      setError("Invalid admin password");
      return;
    }
    sessionStorage.setItem(ADMIN_SESSION_KEY, "1");
    setUnlocked(true);
    setError("");
    setPassword("");
  }

  if (!unlocked) {
    return (
      <Layout>
        <div className="max-w-md mx-auto py-10">
          <Card className="border-border/60 shadow-xl">
            <CardHeader className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-900 to-blue-700 text-white flex items-center justify-center shadow-lg">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-xl font-display font-black">Admin Control Center</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Initial admin gate for AIBAY operations, live metrics, templates, watchlist coverage, and seller tracking.
                </p>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUnlock} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="admin-password" className="text-sm font-medium">Password</label>
                  <Input
                    id="admin-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter admin password"
                    data-testid="input-admin-password"
                  />
                </div>
                {error ? <p className="text-sm text-destructive">{error}</p> : null}
                <Button type="submit" className="w-full gap-2" data-testid="btn-admin-unlock">
                  <ShieldCheck className="w-4 h-4" /> Unlock Admin
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  const metrics = [
    { label: "Listings", value: stats.data?.totalListings ?? 0, icon: ClipboardList },
    { label: "Watchlist Items", value: stats.data?.totalWatchlist ?? 0, icon: FolderKanban },
    { label: "Tracked Sellers", value: stats.data?.totalTrackedSellers ?? 0, icon: Users },
    { label: "Keyword Runs Today", value: stats.data?.keywordSearchesToday ?? 0, icon: Sparkles },
  ];

  return (
    <Layout>
      <div className="space-y-6 max-w-7xl mx-auto">
        <section className="rounded-3xl border border-blue-500/20 bg-gradient-to-r from-slate-950 via-blue-950 to-blue-700 text-white p-6 md:p-8 overflow-hidden relative">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "26px 26px" }} />
          <div className="relative flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div className="space-y-3 max-w-2xl">
              <Badge className="bg-white/10 text-white border-white/15">/admin live now</Badge>
              <h1 className="text-3xl md:text-4xl font-display font-black tracking-tight">AIBAY Command Center</h1>
              <p className="text-sm md:text-base text-blue-100/85">
                First admin foundation: live platform health, content volume, seller coverage, templates, and quick operational links.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 min-w-[280px]">
              <div className="rounded-2xl bg-white/8 border border-white/10 p-4">
                <p className="text-xs uppercase tracking-wider text-blue-100/70 mb-1">API Health</p>
                <p className="text-lg font-bold">{health.data?.status || "..."}</p>
              </div>
              <div className="rounded-2xl bg-white/8 border border-white/10 p-4">
                <p className="text-xs uppercase tracking-wider text-blue-100/70 mb-1">eBay API</p>
                <p className="text-lg font-bold">{stats.data?.ebayConfigured ? "Connected" : "Setup Needed"}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {metrics.map((metric) => (
            <Card key={metric.label} className="border-border/60">
              <CardContent className="p-5">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                  <metric.icon className="w-4 h-4 text-primary" />
                </div>
                <p className="text-2xl font-display font-black">{metric.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{metric.label}</p>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="grid lg:grid-cols-[1.4fr_1fr] gap-4">
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Activity className="w-4 h-4 text-primary" /> Realtime Operations
              </CardTitle>
            </CardHeader>
            <CardContent className="grid sm:grid-cols-2 gap-3">
              {[
                { label: "Open generator", href: "/generate", icon: Zap, desc: "Launch the listing engine" },
                { label: "Manage templates", href: "/templates", icon: LayoutTemplate, desc: "Edit reusable listing blocks" },
                { label: "Review watchlist", href: "/watchlist", icon: FolderKanban, desc: "Track products and pricing" },
                { label: "Seller intelligence", href: "/top-sellers", icon: Store, desc: "Monitor seller competition" },
              ].map((item) => (
                <Link key={item.href} href={item.href}>
                  <div className="rounded-2xl border border-border/50 hover:border-primary/30 bg-secondary/25 hover:bg-secondary/40 transition-colors p-4 cursor-pointer">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                      <item.icon className="w-4 h-4 text-primary" />
                    </div>
                    <p className="font-semibold text-sm">{item.label}</p>
                    <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
                    <div className="mt-3 flex items-center gap-1 text-xs text-primary font-medium">
                      Open <ArrowRight className="w-3 h-3" />
                    </div>
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldCheck className="w-4 h-4 text-primary" /> System Snapshot
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between rounded-xl border border-border/50 p-3">
                <span className="text-muted-foreground">Health timestamp</span>
                <span className="font-medium">{health.data?.timestamp ? new Date(health.data.timestamp).toLocaleString() : "Loading..."}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-border/50 p-3">
                <span className="text-muted-foreground">Default template</span>
                <span className="font-medium">{templates.data?.find((template) => template.isDefault)?.name || "Not set"}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-border/50 p-3">
                <span className="text-muted-foreground">Recent listings available</span>
                <span className="font-medium">{listings.data?.length ?? 0}</span>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid lg:grid-cols-3 gap-4">
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base">Recent Listings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(listings.data || []).slice(0, 5).map((listing) => (
                <Link key={listing.id} href={`/listing/${listing.id}`}>
                  <div className="rounded-xl border border-border/50 p-3 hover:border-primary/30 transition-colors cursor-pointer">
                    <p className="text-sm font-medium line-clamp-2">{listing.generatedTitle}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      #{listing.id} · {listing.createdAt ? new Date(listing.createdAt).toLocaleString() : "Unknown time"}
                    </p>
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base">Templates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(templates.data || []).slice(0, 5).map((template) => (
                <div key={template.id} className="rounded-xl border border-border/50 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium">{template.name}</p>
                    {template.isDefault ? <Badge variant="secondary">Default</Badge> : null}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base">Market Coverage</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(watchlist.data || []).slice(0, 3).map((item) => (
                <div key={item.id} className="rounded-xl border border-border/50 p-3">
                  <p className="text-sm font-medium line-clamp-2">{item.productTitle}</p>
                  <p className="text-xs text-muted-foreground mt-1">{item.marketplace || "Marketplace not set"}</p>
                </div>
              ))}
              {(sellers.data || []).slice(0, 3).map((seller) => (
                <div key={seller.id} className="rounded-xl border border-border/50 p-3">
                  <p className="text-sm font-medium">{seller.username}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {seller.totalListings != null ? `${seller.totalListings} active listings tracked` : "Seller snapshot stored"}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>
      </div>
    </Layout>
  );
}
