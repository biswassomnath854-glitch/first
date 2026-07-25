import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ApexFinance | Personal Expense Tracker & Budget Manager",
  description: "Take control of your finances with ApexFinance. Track income, expenses, budgets, saving goals, and generate premium reports.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased bg-gray-50 text-gray-950 dark:bg-slate-950 dark:text-slate-50 min-h-screen`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

