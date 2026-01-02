import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { ClientWalletProvider } from "@/components/ClientWalletProvider";

export const metadata: Metadata = {
  title: "Xandeum pNode Explorer",
  description: "Xandeum Network pNode Explorer & Analytics",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet" />
      </head>
      <body
        className="antialiased min-h-screen transition-colors duration-300 font-sans"
      >
        <Script src="https://cdn.jsdelivr.net/npm/bs58@5.0.0/index.min.js" strategy="beforeInteractive" />
        <ClientWalletProvider>
          {children}
        </ClientWalletProvider>
      </body>
    </html>
  );
}
