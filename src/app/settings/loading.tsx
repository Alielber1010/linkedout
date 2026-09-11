export default function Loading() {
  return (
    <div className="animate-pulse space-y-8">
      <div className="h-6 w-24 rounded bg-surface" />

      <div className="space-y-3">
        <div className="h-3 w-20 rounded bg-surface" />
        <div className="h-44 rounded-xl border border-border bg-surface" />
        <div className="h-16 rounded-xl border border-border bg-surface" />
      </div>

      <div className="space-y-3">
        <div className="h-3 w-24 rounded bg-surface" />
        <div className="h-32 rounded-xl border border-border bg-surface" />
      </div>
    </div>
  );
}
