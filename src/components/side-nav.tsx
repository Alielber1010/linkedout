"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Home, Search, User, Settings, SquarePen, MoreHorizontal } from "lucide-react";
import { Avatar } from "@/components/avatar";
import { SignOutButton } from "@/components/sign-out-button";

const NAV_ITEMS = [
  { href: "/", label: "Feed", Icon: Home, match: (p: string) => p === "/" },
  { href: "/search", label: "Search", Icon: Search, match: (p: string) => p.startsWith("/search") },
  { href: "/profile", label: "Profile", Icon: User, match: (p: string) => p.startsWith("/profile") },
  { href: "/settings", label: "Settings", Icon: Settings, match: (p: string) => p.startsWith("/settings") },
];

type NavProfile = {
  displayName: string | null;
  username: string | null;
  userNumber: number;
};

function itemClass(active: boolean) {
  return `flex items-center gap-4 h-12 rounded-full px-3 justify-center xl:justify-start transition-colors hover:bg-surface ${
    active ? "text-primary" : "text-foreground"
  }`;
}

function ProfileMenu({ profile }: { profile: NavProfile }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const name = profile.displayName || `Anonymous #${profile.userNumber}`;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={containerRef} className="relative mt-auto mb-2">
      {open && (
        <div className="absolute bottom-full left-0 mb-2 w-full min-w-[220px] rounded-xl border border-border bg-background shadow-lg overflow-hidden">
          <SignOutButton className="flex w-full items-center gap-2 px-4 py-3 text-sm font-medium text-primary hover:bg-surface transition-colors">
            Sign out
          </SignOutButton>
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex w-full items-center gap-3 rounded-full p-2 justify-center xl:justify-start hover:bg-surface transition-colors"
      >
        <Avatar content="" size={32} />
        <span className="hidden min-w-0 flex-1 text-left xl:block">
          <span className="block truncate text-sm font-semibold">{name}</span>
          {profile.username && (
            <span className="block truncate text-xs text-secondary">@{profile.username}</span>
          )}
        </span>
        <MoreHorizontal size={18} className="hidden shrink-0 text-secondary xl:block" />
      </button>
    </div>
  );
}

export function SideNav({ signedIn, profile }: { signedIn: boolean; profile: NavProfile | null }) {
  const pathname = usePathname();

  if (!signedIn) return null;

  return (
    <>
      {/* Desktop / tablet rail — icon-only until xl, icon+label from xl up */}
      <aside className="hidden sm:flex sticky top-0 h-screen shrink-0 flex-col w-[68px] xl:w-[230px] py-3 px-2 border-r border-border">
        <Link
          href="/"
          aria-label="LinkedOut home"
          className="mb-2 flex items-center gap-2 rounded-full p-2 hover:bg-surface transition-colors justify-center xl:justify-start"
        >
          <Image src="/icon.png" alt="" width={32} height={32} className="h-8 w-8 shrink-0" />
          <span className="hidden xl:inline font-bold text-lg">LinkedOut</span>
        </Link>

        {NAV_ITEMS.map(({ href, label, Icon, match }) => (
          <Link
            key={href}
            href={href}
            aria-label={label}
            aria-current={match(pathname) ? "page" : undefined}
            title={label}
            className={itemClass(match(pathname))}
          >
            <Icon size={24} strokeWidth={1.75} className="shrink-0" />
            <span className="hidden xl:inline text-[15px]">{label}</span>
          </Link>
        ))}

        {profile && <ProfileMenu profile={profile} />}
      </aside>

      {/* Mobile bottom bar */}
      <nav className="sm:hidden fixed bottom-0 inset-x-0 h-14 border-t border-border bg-background/95 backdrop-blur flex items-center justify-around z-40">
        {NAV_ITEMS.slice(0, 2).map(({ href, label, Icon, match }) => (
          <Link
            key={href}
            href={href}
            aria-label={label}
            aria-current={match(pathname) ? "page" : undefined}
            className={`flex h-11 w-11 items-center justify-center rounded-full transition-colors ${
              match(pathname) ? "text-primary" : "text-foreground"
            }`}
          >
            <Icon size={22} strokeWidth={1.75} />
          </Link>
        ))}
        <Link
          href="/#compose"
          aria-label="New confession"
          className="h-11 w-11 rounded-full bg-primary text-white flex items-center justify-center"
        >
          <SquarePen size={18} strokeWidth={2} />
        </Link>
        {NAV_ITEMS.slice(2).map(({ href, label, Icon, match }) => (
          <Link
            key={href}
            href={href}
            aria-label={label}
            aria-current={match(pathname) ? "page" : undefined}
            className={`flex h-11 w-11 items-center justify-center rounded-full transition-colors ${
              match(pathname) ? "text-primary" : "text-foreground"
            }`}
          >
            <Icon size={22} strokeWidth={1.75} />
          </Link>
        ))}
      </nav>
    </>
  );
}
