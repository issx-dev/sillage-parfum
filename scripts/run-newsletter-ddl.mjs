import fs from "node:fs";
import postgres from "postgres";

const envFile = fs.readFileSync(".env.local", "utf8");
const m = envFile.match(/^DATABASE_URL=(.+)$/m);
if (!m) throw new Error("DATABASE_URL not found in .env.local");
const sql = postgres(m[1].trim(), { max: 1, prepare: false, connect_timeout: 15, idle_timeout: 5 });

const ddl = `
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  source TEXT NOT NULL DEFAULT 'lead_modal',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_email ON newsletter_subscribers (email);
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role can manage newsletter_subscribers" ON newsletter_subscribers;
CREATE POLICY "Service role can manage newsletter_subscribers"
  ON newsletter_subscribers FOR ALL TO service_role USING (true) WITH CHECK (true);
`;
await sql.unsafe(ddl);
console.log("DDL ok");

// Temp row: verify UNIQUE + SELECT, then delete (filas temporales propias).
const tmp = `tmp-verify-${Date.now()}@example.com`;
await sql.unsafe(`INSERT INTO newsletter_subscribers (email, source) VALUES ($1, 'verify')`, [tmp]);
try {
  await sql.unsafe(`INSERT INTO newsletter_subscribers (email, source) VALUES ($1, 'verify')`, [tmp]);
  console.log("WARN: duplicate insert did NOT fail");
} catch (e) {
  console.log("UNIQUE ok:", String(e.message).slice(0, 80));
}
const rows = await sql.unsafe(`SELECT id, email, source, created_at FROM newsletter_subscribers WHERE email = $1`, [tmp]);
console.log("SELECT ok:", JSON.stringify(rows).slice(0, 160));
await sql.unsafe(`DELETE FROM newsletter_subscribers WHERE email = $1`, [tmp]);
const left = await sql.unsafe(`SELECT COUNT(*)::int AS n FROM newsletter_subscribers WHERE email = $1`, [tmp]);
console.log("DELETE ok, remaining:", JSON.stringify(left));
await sql.end();
