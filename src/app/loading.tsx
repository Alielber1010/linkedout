export default function Loading() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-9 w-full rounded-full bg-surface" />
      <div className="h-24 rounded-xl border border-border bg-surface" />
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="space-y-3 rounded-xl border border-border bg-surface p-4"
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-border" />
            <div className="h-3 w-32 rounded bg-border" />
          </div>
          <div className="h-3 w-full rounded bg-border" />
          <div className="h-3 w-4/5 rounded bg-border" />
        </div>
      ))}
    </div>
  );
}
