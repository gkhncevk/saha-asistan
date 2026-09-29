-- Talep formu kayıtları. Kısıtlar uygulama doğrulamasının (src/lib/talep-schema.ts)
-- aynısıdır; kod hatalı olsa bile geçersiz veri tabloya yazılamaz.
CREATE TABLE IF NOT EXISTS talepler (
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  ad              TEXT        NOT NULL CHECK (char_length(ad) BETWEEN 2 AND 80),
  eposta          TEXT        NOT NULL CHECK (char_length(eposta) BETWEEN 3 AND 254 AND eposta LIKE '%_@_%'),
  hizmet          TEXT        NOT NULL CHECK (hizmet IN ('ariza-asistani', 'dokuman-dijitallestirme', 'cmms-entegrasyonu', 'emin-degilim')),
  aciklama        TEXT        NOT NULL CHECK (char_length(aciklama) BETWEEN 20 AND 2000),
  istek_anahtari  UUID        NOT NULL UNIQUE,
  ip_hash         TEXT        NOT NULL,
  olusturuldu     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Hız sınırı için her POST denemesi (geçersiz olanlar dahil) buraya yazılır.
-- IP adresi açık metin olarak saklanmaz, gizli tuzla HMAC'lenir.
CREATE TABLE IF NOT EXISTS istek_denemeleri (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  ip_hash     TEXT        NOT NULL,
  olusturuldu TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS istek_denemeleri_ip_zaman ON istek_denemeleri (ip_hash, olusturuldu);
