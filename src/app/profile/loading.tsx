export default function Loading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        <div className="h-20 bg-border/60" />
        <div className="-mt-8 space-y-3 px-5 pb-5">
          <div className="h-16 w-16 rounded-full border-4 border-background bg-border" />
          <div className="h-4 w-40 rounded bg-border" />
          <div className="h-3 w-56 rounded bg-border" />
        </div>
      </div>
      <div className="space-y-3 rounded-xl border border-border bg-surface p-5">
        <div className="h-4 w-48 rounded bg-border" />
        <div className="h-9 w-full rounded-md bg-border" />
        <div className="h-9 w-full rounded-md bg-border" />
      </div>
    </div>
  );
}
