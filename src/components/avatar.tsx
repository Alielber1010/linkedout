import Image from "next/image";

export function Avatar({
  content,
  size = 40,
  muted = false,
  src = null,
}: {
  seed?: string;
  content: string;
  size?: number;
  muted?: boolean;
  /** Uploaded avatar. Never pass this for anonymous posts — it deanonymizes them. */
  src?: string | null;
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
      <Image
        src={src || "/angry_profile_v1.png"}
        alt=""
        fill
        sizes={`${size}px`}
        className="object-cover"
      />
    </div>
  );
}
