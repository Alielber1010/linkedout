export const TAGS = [
  "InterviewFail",
  "Ghosted",
  "Micromanager",
  "Salary",
  "Layoffs",
  "Promotion",
  "InternLife",
  "AIEngineer",
  "SoftwareEngineer",
  "Amazon",
  "Google",
  "Startup",
  "ToxicBoss",
  "Meeting",
  "Overtime",
  "WorkLifeBalance",
  "CareerSwitch",
  "Resigned",
  "Burnout",
  "HR",
  "WFH",
  "Onsite",
  "Internship",
] as const;

const TAGS_LOWER = new Map(TAGS.map((tag) => [tag.toLowerCase(), tag]));

// Resolves a typed hashtag (any case) to its canonical stored casing, e.g.
// "layoffs" -> "Layoffs". Returns undefined for anything not in the curated list.
export function canonicalTag(name: string): string | undefined {
  return TAGS_LOWER.get(name.toLowerCase());
}

// Tags come from #hashtags typed directly in the post body (X/LinkedIn-style),
// not a separate picker — this pulls out whichever curated tags were used.
export function extractTags(body: string): string[] {
  const found = new Set<string>();
  for (const match of body.matchAll(/#(\w+)/g)) {
    const tag = canonicalTag(match[1]);
    if (tag) found.add(tag);
  }
  return [...found];
}

export type ReactionType =
  | "been_there"
  | "same"
  | "red_flag"
  | "escaped"
  | "corporate";

export const REACTIONS: {
  type: ReactionType;
  emoji: string;
  label: string;
}[] = [
  { type: "been_there", emoji: "\u{1F480}", label: "Been There" },
  { type: "same", emoji: "☕", label: "Same" },
  { type: "red_flag", emoji: "\u{1F6A9}", label: "Red Flag" },
  { type: "escaped", emoji: "\u{1FAE1}", label: "Escaped" },
  { type: "corporate", emoji: "\u{1F921}", label: "Corporate Moment" },
];
