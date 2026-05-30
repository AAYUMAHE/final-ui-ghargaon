import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ThemeProvider from "../providers/ThemeProvider";
import ReduxProvider from "@/store/provider";
import { Toaster } from "sonner";
import AuthInitializer from "@/providers/AuthInitializer";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Suspense } from "react";
import Navbar from "@/components/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Welcome to Ghar Gaon!",
  description: "Fresh homemade meals, delivered daily",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html suppressHydrationWarning lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          <ReduxProvider>
            <AuthInitializer />
            <TooltipProvider>
              <Navbar />
              <Suspense fallback={null}>
                {children}
              </Suspense>
              <Toaster position="top-right" richColors />
            </TooltipProvider>
          </ReduxProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}