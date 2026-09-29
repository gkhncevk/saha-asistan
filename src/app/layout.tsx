import type { Metadata, Viewport } from "next";
import { Inter, Source_Serif_4 } from "next/font/google";
import "./globals.css";

// Gövde metni Inter, başlıklar serif (Source Serif 4).
// Türkçe karakterler (ğ, ş, ı, İ) latin-ext alt kümesinde.
const inter = Inter({ variable: "--font-inter", subsets: ["latin", "latin-ext"] });
const serif = Source_Serif_4({ variable: "--font-source-serif", subsets: ["latin", "latin-ext"] });

export const metadata: Metadata = {
  title: "SahaRehber — Üretim tesisleri için bakım ve arıza asistanı",
  description:
    "Makine kılavuzlarınızı ve arıza kayıtlarınızı, sahadaki teknisyenin telefondan sorgulayabildiği ve her cevabın kaynağını gösteren bir asistana dönüştürüyoruz.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0f172a",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="tr" className={`${inter.variable} ${serif.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
