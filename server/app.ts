import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { storage } from "./storage";

const ALLOWED_ORIGINS = [
  /^https:\/\/.*\.pages\.dev$/,
  /^https:\/\/aibay\.pages\.dev$/,
  /^https:\/\/.*\.workers\.dev$/,
  /^https:\/\/.*\.cloudflareaccess\.com$/,
  /^https:\/\/.*\.github\.io$/,
  /^http:\/\/localhost(:\d+)?$/,
  /^https?:\/\/.*\.repl(it)?\.co$/,
  /^https?:\/\/.*\.replit\.dev$/,
];

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

async function seedDefaultTemplates() {
  try {
    const existing = await storage.getTemplates();
    if (existing.length > 0) return;

    const defaults = [
      {
        name: "Electronics Pro",
        description: "Professional template for electronics and tech products",
        blocks: [
          { id: "b1", type: "hero_banner", settings: { bgColor: "#1e3a8a", textColor: "#ffffff", fontSize: 22 } },
          { id: "b2", type: "feature_bullets", settings: { iconStyle: "checkmark", bulletCount: 6 } },
          { id: "b3", type: "specifications_table", settings: { alternateRowColor: "#f8f9fa", headerColor: "#1e3a8a" } },
          { id: "b4", type: "shipping_returns", settings: { text: "Free fast shipping on all orders. 30-day hassle-free returns. Ships within 1 business day." } },
          { id: "b5", type: "seller_promise", settings: { badges: ["Free Returns", "Fast Shipping", "100% Authentic", "Top Rated Seller"] } },
        ],
        isDefault: true,
      },
      {
        name: "Fashion & Apparel",
        description: "Stylish template for clothing, shoes and accessories",
        blocks: [
          { id: "b1", type: "hero_banner", settings: { bgColor: "#7c3aed", textColor: "#ffffff", fontSize: 24 } },
          { id: "b2", type: "image_gallery", settings: { maxImages: 6, borderRadius: 8, shadow: true } },
          { id: "b3", type: "feature_bullets", settings: { iconStyle: "star", bulletCount: 5 } },
          { id: "b4", type: "specifications_table", settings: { alternateRowColor: "#faf5ff", headerColor: "#7c3aed" } },
          { id: "b5", type: "shipping_returns", settings: { text: "Fast dispatch. Free returns on all fashion items. Try before you commit." } },
          { id: "b6", type: "seller_promise", settings: { badges: ["Free Returns", "Authentic Brand", "Secure Packaging"] } },
        ],
        isDefault: false,
      },
      {
        name: "Home & Garden",
        description: "Warm, inviting template for home goods and garden products",
        blocks: [
          { id: "b1", type: "hero_banner", settings: { bgColor: "#166534", textColor: "#ffffff", fontSize: 22 } },
          { id: "b2", type: "feature_bullets", settings: { iconStyle: "checkmark", bulletCount: 5 } },
          { id: "b3", type: "specifications_table", settings: { alternateRowColor: "#f0fdf4", headerColor: "#166534" } },
          { id: "b4", type: "shipping_returns", settings: { text: "Carefully packed. Free returns. Delivered to your door quickly." } },
          { id: "b5", type: "seller_promise", settings: { badges: ["Fast Shipping", "Secure Packaging", "Easy Returns"] } },
        ],
        isDefault: false,
      },
    ];

    for (const tmpl of defaults) {
      await storage.createTemplate({ ...tmpl, versions: [] });
    }
    console.log("[seed] Default templates created");
  } catch (err) {
    console.warn("[seed] Template seeding failed:", err);
  }
}

async function seedDefaultAdminData() {
  try {
    const existingSettings = await storage.getAdminSettings();
    if (!existingSettings) {
      await storage.upsertAdminSettings({
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
      });
    }

    const existingPlans = await storage.getSubscriptionPlans();
    if (existingPlans.length > 0) return;

    await storage.createSubscriptionPlan({
      name: "Starter Trial",
      slug: "starter-trial",
      priceUsd: "1.00",
      billingInterval: "monthly",
      trialDays: 14,
      isActive: true,
      features: ["14-day trial", "Listing generator", "Market research", "Basic supplier finder"],
    });

    await storage.createSubscriptionPlan({
      name: "Pro Monthly",
      slug: "pro-monthly",
      priceUsd: "29.00",
      billingInterval: "monthly",
      trialDays: 14,
      isActive: true,
      features: ["Unlimited listing generation", "Top sellers", "Templates", "Watchlist tracking", "Admin support"],
    });

    await storage.createSubscriptionPlan({
      name: "Scale Annual",
      slug: "scale-annual",
      priceUsd: "249.00",
      billingInterval: "annual",
      trialDays: 14,
      isActive: true,
      features: ["Everything in Pro", "Annual discount", "Priority support", "Advanced competitor workflows"],
    });
  } catch (err) {
    console.warn("[seed] Admin seed failed:", err);
  }
}

export async function createApp() {
  const app = express();

  app.use((req, res, next) => {
    const origin = req.headers.origin || "";
    const allowed =
      ALLOWED_ORIGINS.some((re) => re.test(origin)) ||
      process.env.CORS_ORIGIN === "*" ||
      (process.env.CORS_ORIGIN && origin === process.env.CORS_ORIGIN);
    if (allowed) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Access-Control-Allow-Credentials", "true");
      res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Admin-Password");
    }
    if (req.method === "OPTIONS") return res.sendStatus(204);
    next();
  });

  app.use(
    express.json({
      verify: (req, _res, buf) => {
        req.rawBody = buf;
      },
    }),
  );
  app.use(express.urlencoded({ extended: false }));

  app.use((req, res, next) => {
    const start = Date.now();
    const path = req.path;
    let capturedJsonResponse: Record<string, any> | undefined = undefined;

    const originalResJson = res.json;
    res.json = function (bodyJson, ...args) {
      capturedJsonResponse = bodyJson;
      return originalResJson.apply(res, [bodyJson, ...args]);
    };

    res.on("finish", () => {
      const duration = Date.now() - start;
      if (path.startsWith("/api")) {
        let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
        if (capturedJsonResponse) {
          logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
        }
        log(logLine);
      }
    });

    next();
  });

  await registerRoutes(app);
  await seedDefaultTemplates();
  await seedDefaultAdminData();

  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error("Internal Server Error:", err);

    if (res.headersSent) {
      return next(err);
    }

    return res.status(status).json({ message });
  });

  return app;
}
