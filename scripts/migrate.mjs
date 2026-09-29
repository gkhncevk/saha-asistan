// Kullanım: npm run db:migrate  (DATABASE_URL .env.local içinden okunur)
import { readFile } from "node:fs/promises";
import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL tanımlı değil. .env.local dosyasını kontrol edin.");
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);
const sema = await readFile(new URL("../db/schema.sql", import.meta.url), "utf8");

// Neon HTTP sürücüsü tek istekte tek komut çalıştırır; dosyayı komutlara bölüyoruz.
const komutlar = sema
  .split(/;\s*$/m)
  .map((k) => k.replace(/^\s*--.*$/gm, "").trim())
  .filter(Boolean);

for (const komut of komutlar) {
  await sql.query(komut);
}

const tablolar = await sql.query(
  "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name",
);
console.log(`${komutlar.length} komut çalıştı. Tablolar:`, tablolar.map((t) => t.table_name).join(", "));
