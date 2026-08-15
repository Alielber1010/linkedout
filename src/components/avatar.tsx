const PALETTE = [
  "#e53935",
  "#3b82f6",
  "#22c55e",
  "#f59e0b",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
  "#f97316",
];

function colorForSeed(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return PALETTE[hash % PALETTE.length];
}

export function Avatar({
  seed,
  content,
  size = 40,
  muted = false,
}: {
  seed: string;
  content: string;
  size?: number;
  muted?: boolean;
}) {
  return (
    <div
      aria-hidden
      className="flex shrink-0 items-center justify-center rounded-full font-semibold text-white select-none"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.42,
        backgroundColor: muted ? "var(--secondary)" : colorForSeed(seed),
      }}
    >
      {content}
    </div>
  );
}
