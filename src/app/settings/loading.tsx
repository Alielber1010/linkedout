export default function Loading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-6 w-24 rounded bg-surface" />
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="h-16 rounded-xl border border-border bg-surface"
        />
      ))}
    </div>
  );
}
