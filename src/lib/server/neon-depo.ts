import "server-only";
import { createHmac } from "node:crypto";
import { neon } from "@neondatabase/serverless";
import type { Talep } from "@/lib/talep-schema";
import type { TalepDeposu } from "./talep-handler";

// Tüm sorgular tagged template ile yazıldı: ${} içindeki değerler SQL metnine
// eklenmez, parametre olarak ayrı gönderilir (SQL injection'a karşı).

function baglanti() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL tanımlı değil");
  return neon(url);
}

export const neonDepo: TalepDeposu = {
  async denemeKaydet(ipHash, pencereDakika) {
    const sql = baglanti();
    // CTE'deki INSERT, aynı sorgunun SELECT'inde henüz görünmez (aynı anlık
    // görüntü); bu yüzden yeni denemeyi +1 ile sayıya ekliyoruz.
    const [satir] = await sql`
      WITH eklenen AS (
        INSERT INTO istek_denemeleri (ip_hash) VALUES (${ipHash})
      )
      SELECT count(*)::int + 1 AS sayi
      FROM istek_denemeleri
      WHERE ip_hash = ${ipHash}
        AND olusturuldu > now() - make_interval(mins => ${pencereDakika})
    `;
    return satir.sayi as number;
  },

  async talepKaydet(talep: Talep, ipHash: string) {
    const sql = baglanti();
    const eklenen = await sql`
      INSERT INTO talepler (ad, eposta, hizmet, aciklama, istek_anahtari, ip_hash)
      VALUES (${talep.ad}, ${talep.eposta}, ${talep.hizmet}, ${talep.aciklama}, ${talep.istekAnahtari}, ${ipHash})
      ON CONFLICT (istek_anahtari) DO NOTHING
      RETURNING id
    `;
    if (eklenen.length > 0) return { id: Number(eklenen[0].id), yeni: true };

    // Aynı anahtarla önceden kayıt var: tekrar gönderim, yeni kayıt açma.
    const [mevcut] = await sql`SELECT id FROM talepler WHERE istek_anahtari = ${talep.istekAnahtari}`;
    return { id: Number(mevcut.id), yeni: false };
  },
};

export function ipHash(ip: string): string {
  const tuz = process.env.IP_HASH_SALT;
  if (!tuz) throw new Error("IP_HASH_SALT tanımlı değil");
  return createHmac("sha256", tuz).update(ip).digest("hex");
}
