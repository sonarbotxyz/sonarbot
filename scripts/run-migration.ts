/**
 * Run Supabase migration against the connected instance.
 *
 * Usage: npx tsx scripts/run-migration.ts
 *
 * Reads SQL from supabase/migrations/001_data_foundation.sql
 * and executes it via the Supabase client's rpc call.
 */

import * as fs from "fs";
import * as path from "path";
import { createClient } from "@supabase/supabase-js";

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
    );
    console.error("Ensure .env.local is loaded (use dotenv or export vars).");
    process.exit(1);
  }

  const supabase = createClient(url, key);

  const sqlPath = path.resolve(
    __dirname,
    "../supabase/migrations/001_data_foundation.sql"
  );

  if (!fs.existsSync(sqlPath)) {
    console.error(`Migration file not found: ${sqlPath}`);
    process.exit(1);
  }

  const sql = fs.readFileSync(sqlPath, "utf-8");

  // Split on semicolons but keep statements intact (skip empty ones)
  const statements = sql
    .split(/;\s*$/m)
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith("--"));

  console.log(`Running migration: ${path.basename(sqlPath)}`);
  console.log(`Found ${statements.length} SQL statements\n`);

  let succeeded = 0;
  let failed = 0;

  for (const statement of statements) {
    const preview = statement.slice(0, 80).replace(/\n/g, " ");
    process.stdout.write(`  Executing: ${preview}...`);

    const { error } = await supabase.rpc("exec_sql", { query: statement });

    if (error) {
      // Some errors are expected (IF NOT EXISTS / IF EXISTS patterns)
      const isIdempotent =
        error.message.includes("already exists") ||
        error.message.includes("does not exist") ||
        error.message.includes("duplicate key");

      if (isIdempotent) {
        console.log(" SKIPPED (already applied)");
        succeeded++;
      } else {
        console.log(` FAILED: ${error.message}`);
        failed++;
      }
    } else {
      console.log(" OK");
      succeeded++;
    }
  }

  console.log(`\nMigration complete: ${succeeded} succeeded, ${failed} failed`);

  if (failed > 0) {
    console.log(
      "\nNote: Some failures may require running the SQL directly in the Supabase SQL editor."
    );
    console.log(
      "Copy the contents of supabase/migrations/001_data_foundation.sql and run it there."
    );
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Migration script error:", err);
  process.exit(1);
});
