import { Geist } from "next/font/google";
import type { Metadata, Viewport } from "next";
import { Providers } from "@/components/Providers";
import "./globals.css";

const geist = Geist({
  subsets: ["latin", "latin-ext"],
  variable: "--font-geist-sans",
});

export const metadata: Metadata = {
  title: "Harcama Defteri",
  description: "Günlük harcamaları hızlıca kaydedin ve geçmişi kolayca görün.",
  applicationName: "Harcama Defteri",
  appleWebApp: {
    capable: true,
    title: "Harcama Defteri",
    statusBarStyle: "default",
  },
  icons: {
    icon: "/favicon.svg",
  },
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#F4F1EC",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full bg-canvas font-sans text-ink">
        <a
          href="#icerik"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-white focus:px-4 focus:py-2"
        >
          İçeriğe atla
        </a>
        <div id="icerik">
          <Providers>{children}</Providers>
        </div>
      </body>
    </html>
  );
}
