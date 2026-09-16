import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { PersonProvider } from "@/components/PersonProvider";
import { NavBar } from "@/components/NavBar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "HouseM8 — Pacific Beach household budget",
  description: "Track what you still need, groceries, and split expenses together.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <PersonProvider>
          <NavBar />
          <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-8">{children}</main>
          <footer className="mx-auto w-full max-w-5xl px-5 pb-8 pt-4 text-center text-xs text-ocean-700/50">
            Made with ☀️ for our place in Pacific Beach
          </footer>
        </PersonProvider>
      </body>
    </html>
  );
}
