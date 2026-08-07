export const COMPANY_STATUSES = [
  { value: "left", label: "Left" },
  { value: "fired", label: "Fired" },
  { value: "laid_off", label: "Laid Off" },
  { value: "escaped", label: "Escaped" },
  { value: "ghosted", label: "Ghosted" },
] as const;

export type CompanyStatusValue = (typeof COMPANY_STATUSES)[number]["value"];

export function statusLabel(status: string) {
  return (
    COMPANY_STATUSES.find((s) => s.value === status)?.label ?? status
  );
}
