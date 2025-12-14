import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Lipid-AI - 脂質管理AIアシスタント",
  description: "脂質管理の専門家AIが、あなたの食事を分析します",
  icons: {
    icon: "/icon-192.png",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.json",
};

import Navigation from "./components/Navigation";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen text-gray-100 pb-24`}
      >
        <div className="fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/10 blur-[100px] animate-float" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-600/10 blur-[100px] animate-float" style={{ animationDelay: "2s" }} />
        </div>
        {children}
        <Navigation />
      </body>
    </html>
  );
}

