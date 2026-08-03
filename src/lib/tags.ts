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
