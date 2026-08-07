"use client";

import { usePathname } from "next/navigation";
import { Home, User, SquarePen } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { SignOutButton } from "@/components/sign-out-button";

const itemClass =
  "flex items-center justify-center h-11 w-11 sm:h-12 sm:w-12 rounded-full transition-colors hover:bg-surface";

function railLinkClass(active: boolean) {
  return `${itemClass} ${active ? "text-primary" : "text-foreground"}`;
}

export function SideNav({ signedIn }: { signedIn: boolean }) {
  const pathname = usePathname();

  if (!signedIn) return null;

  const isFeed = pathname === "/";
  const isProfile = pathname.startsWith("/profile");

  return (
    <>
      {/* Desktop / tablet rail */}
      <aside className="hidden sm:flex flex-col items-center gap-1 fixed left-0 top-0 h-full w-16 lg:w-20 py-3 border-r border-border bg-background z-40">
        <a href="/" aria-label="LinkedOut home" className="mb-4">
          <img src="/icon.png" alt="" className="h-8 w-8" />
        </a>

        <a
          href="/"
          aria-label="Feed"
          aria-current={isFeed ? "page" : undefined}
          title="Feed"
          className={railLinkClass(isFeed)}
        >
          <Home size={24} strokeWidth={1.75} />
        </a>
        <a
          href="/profile"
          aria-label="Profile"
          aria-current={isProfile ? "page" : undefined}
          title="Profile"
          className={railLinkClass(isProfile)}
        >
          <User size={24} strokeWidth={1.75} />
        </a>
        <ThemeToggle className={railLinkClass(false)} />
        <SignOutButton className={railLinkClass(false)} />

        <a
          href="/#compose"
          aria-label="New confession"
          title="New confession"
          className="mt-auto mb-2 h-12 w-12 rounded-full bg-primary hover:bg-primary-hover text-white flex items-center justify-center transition-colors"
        >
          <SquarePen size={20} strokeWidth={2} />
        </a>
      </aside>

      {/* Mobile bottom bar */}
      <nav className="sm:hidden fixed bottom-0 inset-x-0 h-14 border-t border-border bg-background/95 backdrop-blur flex items-center justify-around z-40">
        <a
          href="/"
          aria-label="Feed"
          aria-current={isFeed ? "page" : undefined}
          className={railLinkClass(isFeed)}
        >
          <Home size={22} strokeWidth={1.75} />
        </a>
        <a
          href="/profile"
          aria-label="Profile"
          aria-current={isProfile ? "page" : undefined}
          className={railLinkClass(isProfile)}
        >
          <User size={22} strokeWidth={1.75} />
        </a>
        <a
          href="/#compose"
          aria-label="New confession"
          className="h-11 w-11 rounded-full bg-primary text-white flex items-center justify-center"
        >
          <SquarePen size={18} strokeWidth={2} />
        </a>
        <ThemeToggle className={railLinkClass(false)} />
        <SignOutButton className={railLinkClass(false)} />
      </nav>
    </>
  );
}
