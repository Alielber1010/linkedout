"use client";

import { useState, useTransition } from "react";
import { updateDefaultAnonymous } from "@/app/settings/actions";
import { ToggleSwitch } from "@/components/toggle-switch";

export function AnonymousDefaultToggle({
  initialValue,
}: {
  initialValue: boolean;
}) {
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleChange(next: boolean) {
    setValue(next);
    setError(null);
    startTransition(async () => {
      const result = await updateDefaultAnonymous(next);
      if (result?.error) {
        setValue(!next);
        setError(result.error);
      }
    });
  }

  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium">Post anonymously by default</p>
        <p className="text-xs text-secondary mt-0.5">
          Pre-checks &quot;anonymous&quot; every time you vent. You can still
          flip it per post.
        </p>
        {error && <p className="text-xs text-primary mt-1">{error}</p>}
      </div>
      <ToggleSwitch
        checked={value}
        onChange={handleChange}
        disabled={pending}
        label="Post anonymously by default"
      />
    </div>
  );
}
