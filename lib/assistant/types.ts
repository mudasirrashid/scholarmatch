/**
 * AI Scholarship Companion — the product contract (Phase 08).
 *
 * The companion is a *reader* of ScholarMatch, never a second source of truth.
 * Everything it can say is derived from the same records and the same engines
 * the rest of the product already trusts:
 *
 * - `lib/matching`      still owns matching and match explanations;
 * - `lib/preparation`   still owns readiness and the preparation plan;
 * - `lib/applications`  still owns tracking, deadline state and next actions;
 * - `lib/profile`       still owns completion;
 * - `lib/scholarships`  still owns scholarship facts.
 *
 * Nothing in `lib/assistant` re-implements any of those. It composes their
 * public output into an answer, a reason and a next action.
 *
 * ## Why the reply is structured
 *
 * A free-form paragraph would be impossible to verify and easy to pad with
 * filler. Splitting a reply into `answer` / `reasons` / `actions` forces every
 * response to say something, back it with data the product actually holds, and
 * send the student somewhere. It is also the shape a future AI provider would
 * be asked to fill, so swapping the deterministic provider for a model does not
 * require touching the UI.
 */

import type { ReadinessAssessment } from "@/lib/preparation";
import type { ProfileCompletion } from "@/lib/profile/completion";
import type { TrackedRow } from "@/lib/applications";
import type { MatchResult } from "@/types/matching";
import type { Scholarship } from "@/types/scholarship";
import type { StudentProfile } from "@/types/student";

/**
 * Where the student was when they opened the companion.
 *
 * Derived only from the entry point's URL (`/ai-assistant?from=…`), never
 * guessed from the question, so a prompt list can be relevant without the
 * responder pretending to know more than it does. A mode with no data behind it
 * simply falls back to the general answers — context is a courtesy, not a
 * claim.
 */
export type AssistantMode =
  | "general"
  | "profile"
  | "scholarship"
  | "match"
  | "preparation"
  | "application";

/** One suggested destination, rendered as an actionable link. */
export interface AssistantAction {
  label: string;
  /** Internal route. Every action leads somewhere real. */
  href: string;
}

/**
 * One answer, in the order a student should read it:
 * the answer, then why it is true, then what to do about it.
 */
export interface AssistantReply {
  /** The direct answer, in one or two sentences. */
  answer: string;
  /** Supporting facts, each one traceable to existing ScholarMatch data. */
  reasons: readonly string[];
  /** Where to go next. Derived from existing state, never invented. */
  actions: readonly AssistantAction[];
  /**
   * True when nothing ScholarMatch holds could answer the question.
   *
   * The fallback is a first-class reply rather than an error: saying "I don't
   * have that" is the honest outcome whenever a deadline, requirement or score
   * is simply not recorded.
   */
  isFallback?: boolean;
}

export type AssistantRole = "user" | "assistant";

/** One turn of the conversation. Held in component state only. */
export interface AssistantMessage {
  id: string;
  role: AssistantRole;
  /** The student's verbatim question. Present for `user` messages only. */
  question?: string;
  /** The composed reply. Present for `assistant` messages only. */
  reply?: AssistantReply;
}

/**
 * Everything the responder is allowed to read.
 *
 * Assembled by `buildAssistantContext` from the same browser-local stores the
 * rest of the product uses, so the companion sees exactly what the student sees
 * and nothing leaves the browser.
 */
export interface AssistantContext {
  mode: AssistantMode;
  profile: StudentProfile;
  completion: ProfileCompletion;
  /** The scholarship named by the entry point, when there is one. */
  scholarship: Scholarship | null;
  /**
   * The engine's own result for `scholarship` against `profile`.
   *
   * Never recomputed with different rules: this is `matchScholarship`, the same
   * function the explorer, the detail page and `/matches` call.
   */
  match: MatchResult | null;
  /** The Phase 06 readiness assessment for the same three inputs. */
  readiness: ReadinessAssessment | null;
  /** Tracking record for the focused scholarship, when one exists. */
  tracked: TrackedRow | null;
  /** Every tracked application, ordered most-urgent first. */
  rows: readonly TrackedRow[];
}

/**
 * The scholarship an answer is about.
 *
 * Explicit when the student arrived from a scholarship or preparation entry
 * point; implicit (their current top match) when they asked a question that
 * needs an award but did not name one. `isExplicit` exists so the answer can
 * always name its subject — an implicit focus must never read as if the student
 * had selected it.
 */
export interface AssistantFocus {
  scholarship: Scholarship;
  match: MatchResult;
  readiness: ReadinessAssessment;
  tracked: TrackedRow | null;
  isExplicit: boolean;
}

/**
 * The response provider seam.
 *
 * Phase 08 ships exactly one implementation, a deterministic reader of
 * ScholarMatch data (`lib/assistant/respond`). A future model-backed provider
 * implements this same interface and receives the same `AssistantContext`, so
 * the UI, the conversation state and the entry points do not change. No API
 * key, network client or infrastructure is introduced here — the abstraction is
 * deliberately one function wide.
 */
export interface AssistantProvider {
  /** Stable identifier, useful for logging which provider answered. */
  id: string;
  /** Whether this provider calls an external service. Always false in Phase 08. */
  usesExternalModel: boolean;
  respond(question: string, context: AssistantContext): AssistantReply;
}
