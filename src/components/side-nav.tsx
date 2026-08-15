"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Home, Search, User, Settings, SquarePen } from "lucide-react";

const itemClass =
  "flex items-center justify-center h-11 w-11 sm:h-12 sm:w-12 rounded-full transition-colors hover:bg-surface";

function railLinkClass(active: boolean) {
  return `${itemClass} ${active ? "text-primary" : "text-foreground"}`;
}

export function SideNav({ signedIn }: { signedIn: boolean }) {
  const pathname = usePathname();

  if (!signedIn) return null;

  const isFeed = pathname === "/";
  const isSearch = pathname.startsWith("/search");
  const isProfile = pathname.startsWith("/profile");
  const isSettings = pathname.startsWith("/settings");

  return (
    <>
      {/* Desktop / tablet rail */}
      <aside className="hidden sm:flex flex-col items-center gap-1 fixed left-0 top-0 h-full w-16 lg:w-20 py-3 border-r border-border bg-background z-40">
        <Link href="/" aria-label="LinkedOut home" className="mb-4">
          <Image src="/icon.png" alt="" width={32} height={32} className="h-8 w-8" />
        </Link>

        <Link
          href="/"
          aria-label="Feed"
          aria-current={isFeed ? "page" : undefined}
          title="Feed"
          className={railLinkClass(isFeed)}
        >
          <Home size={24} strokeWidth={1.75} />
        </Link>
        <Link
          href="/search"
          aria-label="Search"
          aria-current={isSearch ? "page" : undefined}
          title="Search"
          className={railLinkClass(isSearch)}
        >
          <Search size={24} strokeWidth={1.75} />
        </Link>
        <Link
          href="/profile"
          aria-label="Profile"
          aria-current={isProfile ? "page" : undefined}
          title="Profile"
          className={railLinkClass(isProfile)}
        >
          <User size={24} strokeWidth={1.75} />
        </Link>
        <Link
          href="/settings"
          aria-label="Settings"
          aria-current={isSettings ? "page" : undefined}
          title="Settings"
          className={railLinkClass(isSettings)}
        >
          <Settings size={24} strokeWidth={1.75} />
        </Link>

        <Link
          href="/#compose"
          aria-label="New confession"
          title="New confession"
          className="mt-auto mb-2 h-12 w-12 rounded-full bg-primary hover:bg-primary-hover text-white flex items-center justify-center transition-colors"
        >
          <SquarePen size={20} strokeWidth={2} />
        </Link>
      </aside>

      {/* Mobile bottom bar */}
      <nav className="sm:hidden fixed bottom-0 inset-x-0 h-14 border-t border-border bg-background/95 backdrop-blur flex items-center justify-around z-40">
        <Link
          href="/"
          aria-label="Feed"
          aria-current={isFeed ? "page" : undefined}
          className={railLinkClass(isFeed)}
        >
          <Home size={22} strokeWidth={1.75} />
        </Link>
        <Link
          href="/search"
          aria-label="Search"
          aria-current={isSearch ? "page" : undefined}
          className={railLinkClass(isSearch)}
        >
          <Search size={22} strokeWidth={1.75} />
        </Link>
        <Link
          href="/#compose"
          aria-label="New confession"
          className="h-11 w-11 rounded-full bg-primary text-white flex items-center justify-center"
        >
          <SquarePen size={18} strokeWidth={2} />
        </Link>
        <Link
          href="/profile"
          aria-label="Profile"
          aria-current={isProfile ? "page" : undefined}
          className={railLinkClass(isProfile)}
        >
          <User size={22} strokeWidth={1.75} />
        </Link>
        <Link
          href="/settings"
          aria-label="Settings"
          aria-current={isSettings ? "page" : undefined}
          className={railLinkClass(isSettings)}
        >
          <Settings size={22} strokeWidth={1.75} />
        </Link>
      </nav>
    </>
  );
}
