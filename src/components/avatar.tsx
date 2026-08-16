import Image from "next/image";

export function Avatar({
  content,
  size = 40,
  muted = false,
}: {
  seed?: string;
  content: string;
  size?: number;
  muted?: boolean;
}) {
  if (muted) {
    return (
      <div
        aria-hidden
        className="flex shrink-0 items-center justify-center rounded-full font-semibold text-white select-none"
        style={{ width: size, height: size, fontSize: size * 0.42, backgroundColor: "var(--secondary)" }}
      >
        {content}
      </div>
    );
  }

  return (
    <div
      aria-hidden
      className="relative shrink-0 overflow-hidden rounded-full"
      style={{ width: size, height: size }}
    >
      <Image src="/angry_profile.png" alt="" fill sizes={`${size}px`} className="object-cover" />
    </div>
  );
}
