import type { Metadata, Viewport } from "next";
import { Outfit } from "next/font/google";
import { AppNav } from "@/components/layout/AppNav";
import { RegisterSW } from "@/components/layout/RegisterSW";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "HS Accounts - Textile Trader",
  description: "Accounting for textile traders: customers, invoices, payments, due & balance.",
  manifest: "/manifest.json",
  icons: {
    icon: "/fav.png",
    apple: "/fav.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "HS Accounts",
  },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/fav.png" />
      </head>
      <body
        className={`${outfit.variable} font-sans antialiased min-h-screen`}
      >
        <AppNav />
        <RegisterSW />
        <main className="pb-16 pt-2 md:pb-4 md:pt-14 md:pl-4 md:pr-4">
          {children}
        </main>
      </body>
    </html>
  );
}
