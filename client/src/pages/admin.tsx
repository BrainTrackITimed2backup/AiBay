import { useEffect, useState } from "react";
import { Link } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout";
import { buildApiUrl } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Activity,
  ArrowRight,
  ClipboardList,
  FolderKanban,
  LayoutTemplate,
  Lock,
  Plus,
  Save,
  ShieldCheck,
  Sparkles,
  Store,
  Trash2,
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

interface AdminSettings {
  id: number;
  siteName: string;
  supportEmail: string;
  registrationEnabled: boolean;
  maintenanceMode: boolean;
  defaultTrialDays: number;
  trialPriceUsd: string;
  enableWisePayments: boolean;
  featureFlags: Record<string, boolean> | null;
}

interface SubscriptionPlan {
  id: number;
  name: string;
  slug: string;
  priceUsd: string;
  billingInterval: "monthly" | "quarterly" | "semiannual" | "annual" | "lifetime";
  trialDays: number;
  isActive: boolean;
  features: string[] | null;
}

interface PlanDraft {
  id?: number;
  name: string;
  slug: string;
  priceUsd: string;
  billingInterval: SubscriptionPlan["billingInterval"];
  trialDays: number;
  isActive: boolean;
  featuresText: string;
}

interface SettingsFormState {
  siteName: string;
  supportEmail: string;
  registrationEnabled: boolean;
  maintenanceMode: boolean;
  defaultTrialDays: number;
  trialPriceUsd: string;
  enableWisePayments: boolean;
  featureFlags: Record<string, boolean>;
}

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || "Admin@Bay";
const ADMIN_SESSION_KEY = "aibay-admin-unlocked";
const ADMIN_PASSWORD_SESSION_KEY = "aibay-admin-password";

const EMPTY_SETTINGS: SettingsFormState = {
  siteName: "AIBAY",
  supportEmail: "support@aibay.app",
  registrationEnabled: true,
  maintenanceMode: false,
  defaultTrialDays: 14,
  trialPriceUsd: "1.00",
  enableWisePayments: false,
  featureFlags: {
    aiArena: true,
    supplierFinder: true,
    adminAnalytics: true,
    wisePayments: false,
  },
};

const EMPTY_PLAN: PlanDraft = {
  name: "",
  slug: "",
  priceUsd: "0.00",
  billingInterval: "monthly",
  trialDays: 14,
  isActive: true,
  featuresText: "",
};

function getAdminHeaders(adminPassword?: string) {
  return adminPassword ? { "x-admin-password": adminPassword } : undefined;
}

async function fetchJson<T>(url: string, adminPassword?: string): Promise<T> {
  const res = await fetch(buildApiUrl(url), {
    headers: getAdminHeaders(adminPassword),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: `Failed to load ${url}` }));
    throw new Error(error.message || `Failed to load ${url}`);
  }
  return res.json();
}

async function sendJson<T>(url: string, method: string, body: unknown, adminPassword?: string): Promise<T> {
  const res = await fetch(buildApiUrl(url), {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(getAdminHeaders(adminPassword) || {}),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Request failed" }));
    throw new Error(error.message || "Request failed");
  }
  return res.json();
}

function planToDraft(plan: SubscriptionPlan): PlanDraft {
  return {
    id: plan.id,
    name: plan.name,
    slug: plan.slug,
    priceUsd: plan.priceUsd,
    billingInterval: plan.billingInterval,
    trialDays: plan.trialDays,
    isActive: plan.isActive,
    featuresText: (plan.features || []).join(", "),
  };
}

function normalizeFeatures(text: string): string[] {
  return text
    .split(",")
    .map((feature) => feature.trim())
    .filter(Boolean);
}

export default function AdminPage() {
  const queryClient = useQueryClient();
  const [password, setPassword] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [error, setError] = useState("");
  const [settingsForm, setSettingsForm] = useState<SettingsFormState>(EMPTY_SETTINGS);
  const [planDraft, setPlanDraft] = useState<PlanDraft>(EMPTY_PLAN);

  useEffect(() => {
    if (typeof window !== "undefined" && sessionStorage.getItem(ADMIN_SESSION_KEY) === "1") {
      const savedPassword = sessionStorage.getItem(ADMIN_PASSWORD_SESSION_KEY);
      if (savedPassword) {
        setAdminPassword(savedPassword);
        setUnlocked(true);
      }
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

  const adminSettings = useQuery<AdminSettings | null>({
    queryKey: ["/api/admin/settings"],
    enabled: unlocked,
    queryFn: () => fetchJson<AdminSettings | null>("/api/admin/settings", adminPassword),
  });

  const subscriptionPlans = useQuery<SubscriptionPlan[]>({
    queryKey: ["/api/admin/plans"],
    enabled: unlocked,
    queryFn: () => fetchJson<SubscriptionPlan[]>("/api/admin/plans", adminPassword),
  });

  useEffect(() => {
    if (!adminSettings.data) return;
    setSettingsForm({
      siteName: adminSettings.data.siteName,
      supportEmail: adminSettings.data.supportEmail,
      registrationEnabled: adminSettings.data.registrationEnabled,
      maintenanceMode: adminSettings.data.maintenanceMode,
      defaultTrialDays: adminSettings.data.defaultTrialDays,
      trialPriceUsd: adminSettings.data.trialPriceUsd,
      enableWisePayments: adminSettings.data.enableWisePayments,
      featureFlags: adminSettings.data.featureFlags || {},
    });
  }, [adminSettings.data]);

  const saveSettings = useMutation({
    mutationFn: async () => sendJson<AdminSettings>("/api/admin/settings", "PATCH", settingsForm, adminPassword),
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/admin/settings"], data);
    },
  });

  const savePlan = useMutation({
    mutationFn: async () => {
      const payload = {
        name: planDraft.name,
        slug: planDraft.slug,
        priceUsd: planDraft.priceUsd,
        billingInterval: planDraft.billingInterval,
        trialDays: Number(planDraft.trialDays),
        isActive: planDraft.isActive,
        features: normalizeFeatures(planDraft.featuresText),
      };

      if (planDraft.id) {
        return sendJson<SubscriptionPlan>(`/api/admin/plans/${planDraft.id}`, "PUT", payload, adminPassword);
      }
      return sendJson<SubscriptionPlan>("/api/admin/plans", "POST", payload, adminPassword);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/admin/plans"] });
      setPlanDraft(EMPTY_PLAN);
    },
  });

  const deletePlan = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(buildApiUrl(`/api/admin/plans/${id}`), {
        method: "DELETE",
        headers: getAdminHeaders(adminPassword),
      });
      if (!res.ok) throw new Error("Failed to delete plan");
      return res.json();
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/admin/plans"] });
      if (planDraft.id) setPlanDraft(EMPTY_PLAN);
    },
  });

  useEffect(() => {
    const authError = [adminSettings.error, subscriptionPlans.error, saveSettings.error, savePlan.error, deletePlan.error].find(
      (value) => value instanceof Error && value.message === "Invalid admin password",
    );

    if (!authError || typeof window === "undefined") return;

    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    sessionStorage.removeItem(ADMIN_PASSWORD_SESSION_KEY);
    setAdminPassword("");
    setUnlocked(false);
    setError("Admin session expired. Enter the password again.");
  }, [adminSettings.error, subscriptionPlans.error, saveSettings.error, savePlan.error, deletePlan.error]);

  async function handleUnlock(e: React.FormEvent) {
    e.preventDefault();
    const trimmedPassword = password.trim();
    if (!trimmedPassword) {
      setError("Enter admin password");
      return;
    }

    try {
      await fetchJson<{ ok: true }>("/api/admin/verify", trimmedPassword);
      sessionStorage.setItem(ADMIN_SESSION_KEY, "1");
      sessionStorage.setItem(ADMIN_PASSWORD_SESSION_KEY, trimmedPassword);
      setAdminPassword(trimmedPassword);
      setUnlocked(true);
      setError("");
      setPassword("");
    } catch (err) {
      sessionStorage.removeItem(ADMIN_SESSION_KEY);
      sessionStorage.removeItem(ADMIN_PASSWORD_SESSION_KEY);
      setAdminPassword("");
      setUnlocked(false);
      setError(err instanceof Error ? err.message : "Invalid admin password");
    }
  }

  function setFlag(name: string, value: boolean) {
    setSettingsForm((prev) => ({
      ...prev,
      featureFlags: {
        ...prev.featureFlags,
        [name]: value,
      },
    }));
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
                  Persistent SaaS controls for plans, trials, registrations, payments, and feature switches.
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
              <Badge className="bg-white/10 text-white border-white/15">/admin persistent mode</Badge>
              <h1 className="text-3xl md:text-4xl font-display font-black tracking-tight">AIBAY Command Center</h1>
              <p className="text-sm md:text-base text-blue-100/85">
                Live operations plus stored SaaS controls for plans, trials, registration state, and payment readiness.
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

        <section className="grid xl:grid-cols-[1.15fr_0.85fr] gap-4">
          <Card className="border-border/60">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Activity className="w-4 h-4 text-primary" /> SaaS Settings
              </CardTitle>
              <Button
                size="sm"
                className="gap-2"
                onClick={() => saveSettings.mutate()}
                disabled={saveSettings.isPending}
                data-testid="btn-save-admin-settings"
              >
                <Save className="w-4 h-4" /> Save Settings
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Site name</label>
                  <Input value={settingsForm.siteName} onChange={(e) => setSettingsForm((prev) => ({ ...prev, siteName: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Support email</label>
                  <Input value={settingsForm.supportEmail} onChange={(e) => setSettingsForm((prev) => ({ ...prev, supportEmail: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Default trial days</label>
                  <Input type="number" value={settingsForm.defaultTrialDays} onChange={(e) => setSettingsForm((prev) => ({ ...prev, defaultTrialDays: Number(e.target.value) }))} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Trial price USD</label>
                  <Input value={settingsForm.trialPriceUsd} onChange={(e) => setSettingsForm((prev) => ({ ...prev, trialPriceUsd: e.target.value }))} />
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-3">
                {[
                  { label: "Registrations enabled", key: "registrationEnabled" as const },
                  { label: "Maintenance mode", key: "maintenanceMode" as const },
                  { label: "Wise payments enabled", key: "enableWisePayments" as const },
                ].map((toggle) => (
                  <label key={toggle.key} className="rounded-xl border border-border/50 p-3 flex items-center justify-between gap-3 cursor-pointer">
                    <span className="text-sm">{toggle.label}</span>
                    <input
                      type="checkbox"
                      checked={settingsForm[toggle.key]}
                      onChange={(e) => setSettingsForm((prev) => ({ ...prev, [toggle.key]: e.target.checked }))}
                    />
                  </label>
                ))}
              </div>

              <div className="space-y-3">
                <p className="text-sm font-medium">Feature flags</p>
                <div className="grid md:grid-cols-2 gap-3">
                  {Object.entries(settingsForm.featureFlags).map(([flag, enabled]) => (
                    <label key={flag} className="rounded-xl border border-border/50 p-3 flex items-center justify-between gap-3 cursor-pointer">
                      <span className="text-sm">{flag}</span>
                      <input type="checkbox" checked={enabled} onChange={(e) => setFlag(flag, e.target.checked)} />
                    </label>
                  ))}
                </div>
                {saveSettings.error ? <p className="text-sm text-destructive">{(saveSettings.error as Error).message}</p> : null}
              </div>
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
                <span className="text-muted-foreground">Live plans configured</span>
                <span className="font-medium">{subscriptionPlans.data?.length ?? 0}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-border/50 p-3">
                <span className="text-muted-foreground">Recent listings available</span>
                <span className="font-medium">{listings.data?.length ?? 0}</span>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid xl:grid-cols-[1.05fr_0.95fr] gap-4">
          <Card className="border-border/60">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles className="w-4 h-4 text-primary" /> Subscription Plans
              </CardTitle>
              <Button variant="outline" size="sm" className="gap-2" onClick={() => setPlanDraft(EMPTY_PLAN)}>
                <Plus className="w-4 h-4" /> New Plan
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {(subscriptionPlans.data || []).map((plan) => (
                <div key={plan.id} className="rounded-xl border border-border/50 p-4 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold text-sm">{plan.name}</p>
                      <p className="text-xs text-muted-foreground">{plan.slug} · ${plan.priceUsd} · {plan.billingInterval}</p>
                    </div>
                    <Badge variant={plan.isActive ? "secondary" : "outline"}>{plan.isActive ? "Active" : "Inactive"}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{(plan.features || []).join(" · ")}</p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setPlanDraft(planToDraft(plan))}>Edit</Button>
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deletePlan.mutate(plan.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">{planDraft.id ? "Edit Plan" : "Create Plan"}</CardTitle>
              <Button size="sm" className="gap-2" onClick={() => savePlan.mutate()} disabled={savePlan.isPending}>
                <Save className="w-4 h-4" /> Save Plan
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Plan name</label>
                  <Input value={planDraft.name} onChange={(e) => setPlanDraft((prev) => ({ ...prev, name: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Slug</label>
                  <Input value={planDraft.slug} onChange={(e) => setPlanDraft((prev) => ({ ...prev, slug: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Price USD</label>
                  <Input value={planDraft.priceUsd} onChange={(e) => setPlanDraft((prev) => ({ ...prev, priceUsd: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Billing interval</label>
                  <Input value={planDraft.billingInterval} onChange={(e) => setPlanDraft((prev) => ({ ...prev, billingInterval: e.target.value as SubscriptionPlan["billingInterval"] }))} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Trial days</label>
                  <Input type="number" value={planDraft.trialDays} onChange={(e) => setPlanDraft((prev) => ({ ...prev, trialDays: Number(e.target.value) }))} />
                </div>
                <label className="rounded-xl border border-border/50 p-3 flex items-center justify-between gap-3 cursor-pointer mt-7">
                  <span className="text-sm">Plan active</span>
                  <input type="checkbox" checked={planDraft.isActive} onChange={(e) => setPlanDraft((prev) => ({ ...prev, isActive: e.target.checked }))} />
                </label>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Features</label>
                <Textarea
                  rows={5}
                  value={planDraft.featuresText}
                  onChange={(e) => setPlanDraft((prev) => ({ ...prev, featuresText: e.target.value }))}
                  placeholder="Unlimited listing generation, Market research, Supplier finder"
                />
              </div>
              {savePlan.error ? <p className="text-sm text-destructive">{(savePlan.error as Error).message}</p> : null}
            </CardContent>
          </Card>
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

        <section className="grid lg:grid-cols-2 gap-4">
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
        </section>
      </div>
    </Layout>
  );
}
