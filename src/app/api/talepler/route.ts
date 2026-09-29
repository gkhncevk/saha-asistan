import { talepOlustur } from "@/lib/server/talep-handler";
import { ipHash, neonDepo } from "@/lib/server/neon-depo";

export async function POST(istek: Request) {
  return talepOlustur(istek, { depo: neonDepo, ipHash });
}
