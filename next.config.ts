import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // next dev'in AGENTS.md / CLAUDE.md dosyalarını otomatik oluşturmasını kapatır.
  agentRules: false,
};

export default nextConfig;
