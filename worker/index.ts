import { env } from "cloudflare:workers";
import { httpServerHandler } from "cloudflare:node";
import { createApp } from "../server/app";
import { initializeD1Database } from "../server/db";
import { D1_SCHEMA_SQL } from "../server/d1-schema";
import { setRuntimeEnv } from "../server/runtime-env";

setRuntimeEnv(env as unknown as Record<string, string | number | boolean | object | undefined | null>);
initializeD1Database(env.DB);
await env.DB.exec(D1_SCHEMA_SQL);

const app = await createApp();
app.listen(3000);

export default httpServerHandler({ port: 3000 });
