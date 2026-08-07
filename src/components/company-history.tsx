"use client";

import { useState, useTransition } from "react";
import { addCompany, removeCompany } from "@/app/profile/actions";
import { COMPANY_STATUSES, statusLabel } from "@/lib/company-status";

type Entry = { id: string; company: string; status: string };

export function CompanyHistory({ initialEntries }: { initialEntries: Entry[] }) {
  const [entries, setEntries] = useState(initialEntries);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleAdd(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await addCompany(formData);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setEntries((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          company: String(formData.get("company")),
          status: String(formData.get("status")),
        },
      ]);
    });
  }

  function handleRemove(id: string) {
    setEntries((prev) => prev.filter((e) => e.id !== id));
    startTransition(async () => {
      await removeCompany(id);
    });
  }

  return (
    <div>
      <h2 className="font-semibold mb-1">
        Employment History <span aria-hidden>💀</span>
      </h2>
      <p className="text-xs text-secondary mb-3">
        The companies you left, or that left you.
      </p>

      <ul className="space-y-2 mb-4">
        {entries.map((entry) => (
          <li
            key={entry.id}
            className="flex items-center justify-between rounded-md border border-border bg-background px-3 py-2 text-sm"
          >
            <span>
              {entry.company}{" "}
              <span className="text-xs text-secondary">
                — {statusLabel(entry.status)}
              </span>
            </span>
            <button
              type="button"
              onClick={() => handleRemove(entry.id)}
              aria-label={`Remove ${entry.company}`}
              className="text-secondary hover:text-primary text-xs"
            >
              ✕
            </button>
          </li>
        ))}
        {entries.length === 0 && (
          <li className="text-sm text-secondary">
            No companies added yet. Living the dream, or unemployed.
          </li>
        )}
      </ul>

      <form action={handleAdd} className="flex gap-2">
        <input
          name="company"
          placeholder="Company"
          required
          maxLength={100}
          className="flex-1 min-w-0 rounded-md border border-border bg-background px-2 py-1.5 text-sm outline-none focus:border-primary"
        />
        <select
          name="status"
          defaultValue="left"
          className="rounded-md border border-border bg-background px-2 py-1.5 text-sm outline-none focus:border-primary"
        >
          {COMPANY_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-primary hover:bg-primary-hover text-white text-sm font-medium px-3 disabled:opacity-50"
        >
          Add
        </button>
      </form>
      {error && <p className="mt-2 text-sm text-primary">{error}</p>}
    </div>
  );
}
