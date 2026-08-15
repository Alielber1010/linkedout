import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeScript } from "@/components/theme-script";
import { WelcomeToast } from "@/components/welcome-toast";
import { SideNav } from "@/components/side-nav";
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
  const signedIn = Boolean(user);

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
        <SideNav signedIn={signedIn} />
        <div
          className={`flex-1 flex flex-col ${
            signedIn ? "sm:pl-16 lg:pl-20 pb-14 sm:pb-0" : ""
          }`}
        >
          <main className="flex-1 mx-auto w-full max-w-2xl px-4 py-6">
            {children}
          </main>
          <footer className="border-t border-border py-4">
            <div className="mx-auto max-w-2xl px-4 text-center text-xs text-secondary">
              <Link
                href="/privacy"
                className="hover:text-primary hover:underline"
              >
                Privacy &amp; Terms
              </Link>
            </div>
          </footer>
        </div>
        <WelcomeToast />
      </body>
    </html>
  );
}
