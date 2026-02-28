import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { QueryProvider } from "@/components/query-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ServiceWorkerRegistrar } from "@/components/service-worker-registrar";
import "./globals.css";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Corto",
  description: "URL shortener",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "Corto",
    statusBarStyle: "default",
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="it">
      <head>
        <meta name="theme-color" content="#f97316" />
      </head>
      <body className={`${geist.className} antialiased`}>
        <QueryProvider>
          <TooltipProvider>
            <ServiceWorkerRegistrar />
            {children}
            <Toaster richColors position="top-center" />
          </TooltipProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
