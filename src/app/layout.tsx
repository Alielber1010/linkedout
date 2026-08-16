import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeScript } from "@/components/theme-script";
import { WelcomeToast } from "@/components/welcome-toast";
import { SideNav } from "@/components/side-nav";
import { TrendingPanel } from "@/components/trending-panel";
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

  let navProfile = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name, username, user_number")
      .eq("id", user.id)
      .single();

    navProfile = {
      displayName: profile?.display_name ?? null,
      username: profile?.username ?? null,
      userNumber: profile?.user_number ?? 0,
    };
  }

  const content = (
    <>
      <main className="flex-1 w-full px-4 py-6">{children}</main>
      <footer className="border-t border-border py-4">
        <div className="px-4 text-center text-xs text-secondary">
          <Link href="/privacy" className="hover:text-primary hover:underline">
            Privacy &amp; Terms
          </Link>
        </div>
      </footer>
    </>
  );

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <ThemeScript />
      </head>
      <body className="min-h-full bg-background text-foreground">
        {signedIn ? (
          <div className="mx-auto flex w-full max-w-[1280px] pb-14 sm:pb-0">
            <SideNav signedIn={signedIn} profile={navProfile} />
            <div className="flex min-w-0 flex-1 flex-col border-x border-border">
              <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col">
                {content}
              </div>
            </div>
            <aside className="hidden lg:block w-[320px] shrink-0 px-4 py-6">
              <div className="sticky top-6">
                <TrendingPanel />
              </div>
            </aside>
          </div>
        ) : (
          <div className="mx-auto flex w-full max-w-2xl flex-col">{content}</div>
        )}
        <WelcomeToast />
      </body>
    </html>
  );
}
