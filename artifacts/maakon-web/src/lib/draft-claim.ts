/**
 * Carries the draft claim result from email-link sign-in to the My posts banner.
 */
const DRAFT_CLAIM_KEY = "draftClaimOutcome";

export type DraftClaimOutcome = "need_submitted" | "offer_published" | "failed";

const OUTCOMES: readonly string[] = ["need_submitted", "offer_published", "failed"];

function isDraftClaimOutcome(value: unknown): value is DraftClaimOutcome {
  return typeof value === "string" && OUTCOMES.includes(value);
}

export function getDraftClaimOutcome(claimedPost: { postType: string } | undefined): DraftClaimOutcome {
  if (!claimedPost) return "failed";
  return claimedPost.postType === "offer" ? "offer_published" : "need_submitted";
}

export function saveDraftClaimOutcome(outcome: DraftClaimOutcome): void {
  try {
    sessionStorage.setItem(DRAFT_CLAIM_KEY, outcome);
  } catch {
    // A browser may disable session storage. The post itself is unaffected.
  }
}

export function takeDraftClaimOutcome(): DraftClaimOutcome | null {
  try {
    const outcome = sessionStorage.getItem(DRAFT_CLAIM_KEY);
    sessionStorage.removeItem(DRAFT_CLAIM_KEY);
    return isDraftClaimOutcome(outcome) ? outcome : null;
  } catch {
    return null;
  }
}

/** Reads the outcome passed to /my-posts through history state (see AuthCallback). */
export function readDraftClaimState(): DraftClaimOutcome | null {
  const outcome: unknown = window.history.state?.draftClaim;
  return isDraftClaimOutcome(outcome) ? outcome : null;
}
