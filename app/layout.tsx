import type { Metadata } from "next";
import "./globals.css";

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
      <body className="antialiased min-h-screen text-gray-100 pb-24 font-sans">
        <div className="fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/10 blur-[100px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-600/10 blur-[100px]" />
        </div>
        {children}
        <Navigation />
      </body>
    </html>
  );
}
