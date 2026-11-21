import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Providers } from "@/components/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Al Gurg Furniture Group | Operations Portal",
  description:
    "Production and operations management portal for Al Gurg Furniture Group covering enquiries, quotations, procurement, store, quality control, production, engineering, delivery and finance.",
  keywords: [
    "Al Gurg Furniture",
    "Operations Portal",
    "Production Management",
    "Procurement",
    "Quality Control",
  ],
  authors: [{ name: "Al Gurg Furniture Group" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <Providers>{children}</Providers>
        <Toaster />
        <Sonner richColors position="top-right" />
      </body>
    </html>
  );
}
