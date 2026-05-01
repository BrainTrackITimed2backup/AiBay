import { drizzle } from "drizzle-orm/d1";
import * as schema from "@shared/schema";

export let db: any;
let rawD1Database: D1Database | null = null;

export function initializeD1Database(binding: D1Database) {
  rawD1Database = binding;
  db = drizzle(binding, { schema });
  return db;
}

export function getRawD1Database(): D1Database {
  if (!rawD1Database) {
    throw new Error("Cloudflare D1 database binding is not initialized");
  }
  return rawD1Database;
}

export function hasDatabase() {
  return !!db;
}
