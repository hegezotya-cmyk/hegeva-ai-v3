// SAMPLE / DEMO workspace foundation (P1-5).
//
// Single config-driven source of truth for clearly-labelled, guest-facing
// DEMO content. No fake real customer exists here: this registry only
// describes future DEMO/EXAMPLE workspaces that can be provisioned later,
// and the exact illustrative metrics used on the public homepage while a
// visitor is signed out.

export type SampleOperatingPicture = {
  customers: string;
  overdue: string;
  dueToday: string;
  opportunities: string;
  campaign: string;
  attention: number;
};

export const SAMPLE_WORKSPACE_LABELS = {
  code: "DEMO",
  badge: "DEMO — EXAMPLE",
  note: "Guest preview. No real customer or financial data is shown.",
} as const;

export const SAMPLE_OPERATING_PICTURE: SampleOperatingPicture = {
  customers: "3",
  overdue: "£1,420",
  dueToday: "5",
  opportunities: "£2,270",
  campaign: "+18%",
  attention: 8,
};

export const SAMPLE_JOURNEY_COUNTS = [3, 2, 2, 1, 1, 1] as const;

export const SAMPLE_JOURNEY_START_INDEX = 3;

export type SampleWorkspaceKind = "sample";

export type SampleWorkspaceRegistryEntry = {
  slug: string;
  kind: SampleWorkspaceKind;
  label: string;
  displayName: string;
  provides: readonly string[];
};

// Future clearly-labelled DEMO/EXAMPLE workspaces will be defined here and
// provisioned from this registry. Today only the signed-out guest preview is
// described; no business with fake customers is created.
export const SAMPLE_WORKSPACES: readonly SampleWorkspaceRegistryEntry[] = [
  {
    slug: "guest-demo",
    kind: "sample",
    label: SAMPLE_WORKSPACE_LABELS.code,
    displayName: "Guest demo workspace",
    provides: ["operating picture", "revenue journey", "module showcase"],
  },
] as const;