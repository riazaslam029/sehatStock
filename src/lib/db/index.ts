/* eslint-disable @typescript-eslint/no-explicit-any */
import * as schema from "./schema";
import { CREATE_TABLES_SQL } from "./init";
import path from "path";
import fs from "fs";

let dbInstance: any = null;
let pgliteClient: any = null;
let initialized = false;

export async function getDb() {
  if (dbInstance && initialized) {
    return dbInstance;
  }

  const databaseUrl = process.env.DATABASE_URL;

  if (databaseUrl && databaseUrl.trim().length > 0 && !databaseUrl.includes("sample-pooler")) {
    if (databaseUrl.includes("neon.tech")) {
      const { neon } = await import("@neondatabase/serverless");
      const { drizzle } = await import("drizzle-orm/neon-http");
      const sqlClient = neon(databaseUrl);
      dbInstance = drizzle(sqlClient, { schema });
      // Initialize tables
      try {
        await (sqlClient as any)(CREATE_TABLES_SQL);
      } catch (e) {
        console.warn("Neon DDL execution note:", e);
      }
      initialized = true;
      return dbInstance;
    } else {
      const postgres = (await import("postgres")).default;
      const { drizzle } = await import("drizzle-orm/postgres-js");
      const client = postgres(databaseUrl);
      dbInstance = drizzle(client, { schema });
      try {
        await client.unsafe(CREATE_TABLES_SQL);
      } catch (e) {
        console.warn("Postgres DDL execution note:", e);
      }
      initialized = true;
      return dbInstance;
    }
  }

  // Local Embedded PostgreSQL (PGlite)
  if (!pgliteClient) {
    const { PGlite } = await import("@electric-sql/pglite");
    const { drizzle } = await import("drizzle-orm/pglite");

    const dataDir = path.join(process.cwd(), "data", "sehatstock_pg");
    if (!fs.existsSync(path.dirname(dataDir))) {
      fs.mkdirSync(path.dirname(dataDir), { recursive: true });
    }

    pgliteClient = new PGlite(dataDir);
    dbInstance = drizzle(pgliteClient, { schema });

    try {
      await pgliteClient.exec(CREATE_TABLES_SQL);
    } catch (e) {
      console.warn("PGlite init note:", e);
    }
    initialized = true;
  }

  return dbInstance;
}

export { schema };
