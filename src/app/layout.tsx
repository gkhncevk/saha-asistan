import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  // Türkçe karakterler (ğ, ş, ı, İ) latin-ext alt kümesinde.
  subsets: ["latin", "latin-ext"],
});

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
    <html lang="tr" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
