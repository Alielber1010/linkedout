import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeScript } from "@/components/theme-script";
import { WelcomeToast } from "@/components/welcome-toast";
import { HeaderNav } from "@/components/header-nav";
import { createClient } from "@/lib/supabase/server";
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
  title: "LinkedOut — Disconnect from the corporate bullshit",
  description:
    "The professional network for people who have drafts they never sent.",
  icons: {
    icon: "/icon.png",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <ThemeScript />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
          <div className="mx-auto max-w-2xl px-4 flex items-end justify-between gap-4">
            <a href="/" className="flex flex-col shrink-0 py-2">
              <img
                src="/logo-light.png"
                alt="LinkedOut"
                className="h-7 w-auto logo-light-img"
              />
              <img
                src="/logo-dark.png"
                alt="LinkedOut"
                className="h-7 w-auto logo-dark-img"
              />
              <span className="text-[11px] italic text-secondary leading-tight">
                Leave Your Positivity at the Door.
              </span>
            </a>
            <HeaderNav signedIn={Boolean(user)} />
          </div>
        </header>
        <main className="flex-1 mx-auto w-full max-w-2xl px-4 py-6">
          {children}
        </main>
        <footer className="border-t border-border py-4">
          <div className="mx-auto max-w-2xl px-4 text-center text-xs text-secondary">
            <a href="/privacy" className="hover:text-primary hover:underline">
              Privacy &amp; Terms
            </a>
          </div>
        </footer>
        <WelcomeToast />
      </body>
    </html>
  );
}
