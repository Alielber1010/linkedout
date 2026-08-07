"use client";

import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { SignOutButton } from "@/components/sign-out-button";

function NavLink({
  href,
  emoji,
  label,
  active,
}: {
  href: string;
  emoji: string;
  label: string;
  active: boolean;
}) {
  return (
    <a
      href={href}
      className={`flex flex-col items-center gap-0.5 px-3 pt-1.5 border-b-2 transition-colors ${
        active
          ? "border-primary text-primary"
          : "border-transparent text-secondary hover:text-foreground"
      }`}
    >
      <span className="text-lg leading-none" aria-hidden>
        {emoji}
      </span>
      <span className="text-[10px] leading-none pb-1.5">{label}</span>
    </a>
  );
}

export function HeaderNav({ signedIn }: { signedIn: boolean }) {
  const pathname = usePathname();

  return (
    <div className="flex items-end gap-1">
      {signedIn && (
        <>
          <NavLink href="/" emoji="🏠" label="Feed" active={pathname === "/"} />
          <NavLink
            href="/profile"
            emoji="👤"
            label="Profile"
            active={pathname.startsWith("/profile")}
          />
        </>
      )}
      <div className="flex flex-col items-center gap-0.5 px-2 pt-1.5">
        <ThemeToggle />
        <span className="text-[10px] leading-none text-secondary pb-1.5">
          Theme
        </span>
      </div>
      {signedIn && (
        <div className="flex flex-col items-center gap-0.5 px-2 pt-1.5">
          <SignOutButton />
          <span className="text-[10px] leading-none text-secondary pb-1.5">
            Log out
          </span>
        </div>
      )}
    </div>
  );
}
