/**
 * Deterministic, contextual answers for the AI Scholarship Companion.
 *
 * Phase 08 ships no external model, and this module is deliberately honest
 * about that: there is no network call, no inference and no generated prose.
 * A question is matched to one of a small set of intents, and each intent
 * composes a reply out of figures the existing engines already produced —
 * `matchScholarship`, `assessReadiness`, `profileCompletion`, `deadlineReport`,
 * `attentionRank` and `nextAction`.
 *
 * The result is the product behaviour Phase 08 needs — an assistant that can
 * explain a match, list what is missing, say what to prepare first and point at
 * the next step — sitting behind a provider seam (`AssistantProvider`) that a
 * real model can implement later without the UI changing.
 *
 * ## Three rules this file never breaks
 *
 * 1. **Never duplicate an engine.** Every number comes from `lib/matching`,
 *    `lib/preparation`, `lib/applications` or `lib/profile`. Nothing is
 *    rescored, re-ranked or re-derived here.
 * 2. **Unknown is not no.** Where a deadline, requirement or score is not
 *    recorded, the reply says it is not recorded. A missing fact is never
 *    filled in with a plausible one.
 * 3. **Answer, reason, action.** Every reply says something, backs it with data
 *    the product holds, and sends the student somewhere useful.
 */

import { deadlineReport } from "@/lib/applications";
import { READINESS_LEVEL_LABEL } from "@/lib/preparation";
import { focusOf } from "@/lib/assistant/context";
import { APPLICATION_STATUS_LABEL } from "@/types/application";

import type {
  AssistantAction,
  AssistantContext,
  AssistantFocus,
  AssistantReply,
} from "@/lib/assistant/types";
import type { DeadlineState, TrackedRow } from "@/lib/applications";
import type { Scholarship } from "@/types/scholarship";

/* ==========================================================================
   Question handling
   ========================================================================== */

type AssistantIntent =
  | "capabilities"
  | "requirement"
  | "prepare_first"
  | "next_step"
  | "missing"
  | "improve_profile"
  | "why_match"
  | "status"
  | "deadline"
  | "readiness"
  | "documents"
  | "eligibility"
  | "explain"
  | "unanswered";

/**
 * Ordered by specificity, not by convenience.
 *
 * The first pattern that matches wins, so a broad rule must never sit above a
 * narrower one: "what does this requirement mean" has to reach `requirement`
 * before a general "what…" rule could swallow it, and "what should I prepare
 * first" has to reach `prepare_first` before the next-step rule.
 */
const INTENTS: readonly (readonly [AssistantIntent, readonly RegExp[]])[] = [
  [
    "capabilities",
    [
      /^(hi|hey|hello|yo)\b/,
      /\bwhat can you (do|help with)\b/,
      /\bwhat can you help\b/,
      /\bwho are you\b/,
      /\bwhat are you\b/,
      /\bhow do you (work|operate)\b/,
      /\bwhat do you know\b/,
    ],
  ],
  [
    "requirement",
    [/\bwhat does\b/, /\bmeaning of\b/, /\bwhat does .* require\b/, /\bwhat do .* requirements? mean\b/],
  ],
  [
    "prepare_first",
    [
      /\bprepare first\b/,
      /\bwhat should i prepare\b/,
      /\bwhat to prepare first\b/,
      /\bwhere should i start\b/,
      /\bstart (by )?preparing\b/,
      /\bfirst thing\b/,
    ],
  ],
  [
    "next_step",
    [
      /\bwhat should i do\b/,
      /\bwhat do i do\b/,
      /\bnext step\b/,
      /\bnext action\b/,
      /\bwhat.*do today\b/,
      /\bwhat should i work on\b/,
      /\bwhere do i go from here\b/,
      /\bneeds? attention\b/,
      /\bwhich part\b/,
      /\bwhat.*after that\b/,
    ],
  ],
  [
    "missing",
    [
      /\bwhat am i missing\b/,
      /\bwhat.*missing\b/,
      /\bwhat do i lack\b/,
      /\bwhat.*still needed\b/,
      /\bgaps?\b/,
      /\bwhat.*need to (add|fix|provide|submit)\b/,
    ],
  ],
  [
    "improve_profile",
    [
      /\bimprove.*profile\b/,
      /\bprofile.*(improve|better|complete|strengthen)\b/,
      /\bhow can i (improve|grow|strengthen)\b/,
      /\bmake my profile\b/,
      /\bcomplete my profile\b/,
    ],
  ],
  [
    "why_match",
    [
      /\bwhy.*\bmatch\b/,
      /\bmatch score\b/,
      /\bwhy did i get\b/,
      /\bwhy.*score\b/,
      /\bwhy.*ranked\b/,
      /\bwhy.*top match\b/,
      /\bexplain.*match\b/,
    ],
  ],
  [
    "status",
    [
      /\bapplication status\b/,
      /\bstatus of my\b/,
      /\bwhat is my status\b/,
      /\bmy status\b/,
      /\bwhere does my application\b/,
      /\bapplication sitting\b/,
    ],
  ],
  ["deadline", [/\bdeadline\b/, /\bwhen is it due\b/, /\bhow long (do i have|is left)\b/, /\bclosing date\b/, /\bdue date\b/]],
  [
    "readiness",
    [/\bhow close\b/, /\bam i ready\b/, /\breadiness\b/, /\bapplication ready\b/, /\bbecome .*ready\b/, /\bready to apply\b/],
  ],
  [
    "documents",
    [/\bdocuments?\b/, /\bdocs\b/, /\bwhat do i need to (submit|upload|provide)\b/, /\bpaperwork\b/, /\bchecklist\b/],
  ],
  ["eligibility", [/\beligib\b/, /\bcan i apply\b/, /\bam i (eligible|qualified)\b/, /\bwho can apply\b/]],
  ["explain", [/\bexplain\b/, /\btell me about\b/, /\bwhat is this scholarship\b/, /\bin simple terms\b/, /\bsummar/]],
];

/** Lower-cases and strips punctuation so "what's missing?" matches "whats missing". */
function normalise(question: string): string {
  return question
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function detectIntent(question: string): AssistantIntent {
  const text = normalise(question);
  if (text.length === 0) return "unanswered";

  for (const [intent, patterns] of INTENTS) {
    if (patterns.some((pattern) => pattern.test(text))) return intent;
  }

  return "unanswered";
}

/* ==========================================================================
   Shared pieces
   ========================================================================== */

function detailHref(scholarship: Scholarship): string {
  return `/scholarships/${scholarship.id}`;
}

/** The subject of an answer. An implicit focus always names itself. */
function subject(focus: AssistantFocus): string {
  return focus.isExplicit ? focus.scholarship.title : `your top match, ${focus.scholarship.title}`;
}

/** Question asked with nothing to answer it from. */
function nothingToRead(context: AssistantContext, what: string): AssistantReply {
  return {
    answer:
      context.completion.answeredCount === 0
        ? "Your profile has no answers yet, so there is nothing personalised to read that from."
        : "There is no scholarship in context for that question yet.",
    reasons: [
      `ScholarMatch reports ${what} only from data that is actually recorded — an absent fact is reported as absent rather than guessed.`,
    ],
    actions: [
      { label: "Build my profile", href: "/profile" },
      { label: "Browse scholarships", href: "/scholarships" },
    ],
  };
}

/** Deduplicates by label so an action is never offered twice. */
function actions(...candidates: readonly (AssistantAction | null | undefined)[]): AssistantAction[] {
  const seen = new Set<string>();
  const result: AssistantAction[] = [];
  for (const candidate of candidates) {
    if (!candidate || seen.has(candidate.label)) continue;
    seen.add(candidate.label);
    result.push(candidate);
  }
  return result;
}

/* ==========================================================================
   Intent handlers
   ========================================================================== */

function capabilities(context: AssistantContext, focus: AssistantFocus | null): AssistantReply {
  const subjectLine = focus
    ? `Right now I am reading ${subject(focus)}.`
    : "There is no scholarship in context yet, so I am reading your profile as it stands.";

  return {
    answer: `I am the ScholarMatch companion. I explain what ScholarMatch already knows about your journey — I do not guess at anything it does not. ${subjectLine}`,
    reasons: [
      "Every figure I quote comes from the same matching, readiness, deadline and tracking engines the rest of the site uses, so nothing I say can disagree with a page you have just read.",
      "Where a deadline, requirement or score is not recorded, I say it is not recorded instead of filling the gap.",
      context.completion.answeredCount === 0
        ? "Your profile has no answers yet, so almost nothing can be personalised until you build it."
        : `Your profile is ${context.completion.percent}% complete and ${context.rows.length} application${context.rows.length === 1 ? " is" : "s are"} tracked in this browser.`,
    ],
    actions: actions(
      { label: "Build my profile", href: "/profile" },
      { label: "See my matches", href: "/matches" },
      { label: "Browse scholarships", href: "/scholarships" },
    ),
  };
}

function whyMatch(context: AssistantContext, focus: AssistantFocus | null): AssistantReply {
  if (context.completion.answeredCount === 0) {
    return {
      answer: "Your profile has no answers yet, so there is no match of yours to explain.",
      reasons: [
        "A match score is the engine comparing your answers with a record's published requirements. With nothing answered there is nothing to compare.",
        "The figures shown on the explorer and on a scholarship page are scored against ScholarMatch's sample profile, and they are labelled that way.",
      ],
      actions: actions(
        { label: "Build my profile", href: "/profile" },
        { label: "See the sample context", href: "/scholarships" },
      ),
    };
  }

  if (!focus) return nothingToRead(context, "a match explanation");

  const { match, scholarship } = focus;
  const opening = focus.isExplicit
    ? `${scholarship.title} scores ${match.score} out of 100.`
    : `Your strongest match right now is ${scholarship.title}, at ${match.score} out of 100.`;

  if (!match.eligibility.isEligible) {
    return {
      answer: `${opening} It is not a valid application for you as your profile stands, which is what caps the score.`,
      reasons: match.warnings.slice(0, 3),
      actions: actions(
        { label: "Review who can apply", href: `${detailHref(scholarship)}#eligibility` },
        { label: "Adjust my profile", href: "/profile" },
        { label: "See other matches", href: "/matches" },
      ),
    };
  }

  const reasons = [...match.strengths.slice(0, 3)];
  if (match.missingInformation[0] !== undefined) reasons.push(match.missingInformation[0]);

  return {
    answer: `${opening} ${match.summary}`,
    reasons,
    actions: actions(
      { label: "Open the full breakdown", href: `${detailHref(scholarship)}#match` },
      { label: "Sharpen this match", href: "/profile" },
      { label: "See every match", href: "/matches" },
    ),
  };
}

function missing(context: AssistantContext, focus: AssistantFocus | null): AssistantReply {
  if (!focus) return nothingToRead(context, "what is missing");

  const { readiness, scholarship } = focus;
  const attention = readiness.requirements.filter(
    (requirement) => requirement.requirement === "required" && (requirement.status === "unknown" || requirement.status === "not_met"),
  );

  if (attention.length === 0) {
    return {
      answer: `Nothing required is still outstanding on ${scholarship.title}. ${readiness.summary}`,
      reasons: [
        `Readiness is ${readiness.percent}% — ${READINESS_LEVEL_LABEL[readiness.level].toLowerCase()}.`,
        `${readiness.deadline.label}.`,
      ],
      actions: actions(
        { label: "Open the preparation checklist", href: `${detailHref(scholarship)}#prepare` },
        { label: "See my matches", href: "/matches" },
      ),
    };
  }

  return {
    answer: `${attention.length} required item${attention.length === 1 ? "" : "s"} still need${attention.length === 1 ? "s" : ""} attention on ${scholarship.title}.`,
    reasons: attention.slice(0, 3).map((requirement) => `${requirement.label} — ${requirement.detail ?? "No further detail is recorded."}`),
    actions: actions(
      { label: "Open the preparation checklist", href: `${detailHref(scholarship)}#prepare` },
      { label: "Fill the gaps in my profile", href: "/profile" },
    ),
  };
}

function prepareFirst(context: AssistantContext, focus: AssistantFocus | null): AssistantReply {
  if (!focus) return nothingToRead(context, "a preparation order");

  const { readiness, scholarship } = focus;
  const first = readiness.plan[0];

  if (!first) {
    return {
      answer: `There is no preparation step left to order for ${scholarship.title}.`,
      reasons: [readiness.summary],
      actions: actions({ label: "Open the preparation checklist", href: `${detailHref(scholarship)}#prepare` }),
    };
  }

  const priority =
    first.priority === "critical" ? "critical" : first.priority === "high" ? "high" : "lower";

  return {
    answer: `Start with: ${first.title}. ${first.detail}`,
    reasons: [
      `It leads the preparation plan for this award because it is ${priority} priority, and the plan is ordered by what would stop you applying.`,
      `Readiness is ${readiness.percent}% — ${READINESS_LEVEL_LABEL[readiness.level].toLowerCase()} — with ${readiness.attention} item${readiness.attention === 1 ? "" : "s"} still needing attention.`,
      `${readiness.deadline.label}.`,
    ],
    actions: actions(
      { label: "Open the preparation checklist", href: `${detailHref(scholarship)}#prepare` },
      { label: "Update my profile", href: "/profile" },
    ),
  };
}

/**
 * The next action, derived from existing state rather than a new rules engine.
 *
 * The order follows the journey the product already teaches: an unanswered
 * profile first (nothing else can be personalised), then tracked applications
 * that need attention today (deadline pressure is time-critical), then the
 * focused award's preparation plan, then simply the strongest match.
 */
function nextStep(context: AssistantContext, focus: AssistantFocus | null): AssistantReply {
  if (context.completion.answeredCount === 0) {
    return {
      answer: "Build your profile first. Everything else on ScholarMatch — matching, readiness, the next step — is derived from it.",
      reasons: [
        "With no answers stored, every score would be scored against the sample profile rather than yours, and any advice would be about someone else.",
      ],
      actions: actions(
        { label: "Build my profile", href: "/profile" },
        { label: "Browse scholarships", href: "/scholarships" },
      ),
    };
  }

  const essential = context.completion.gaps.filter((gap) => gap.tier === "essential");
  if (essential.length > 0) {
    return {
      answer: `Answer ${essential.length} essential field${essential.length === 1 ? "" : "s"} in your profile: ${essential.map((gap) => gap.label).join(", ")}.`,
      reasons: essential.slice(0, 3).map((gap) => `${gap.label} — ${gap.reason}`),
      actions: actions(
        { label: "Open the profile builder", href: "/profile" },
        { label: "See how it changes my matches", href: "/matches" },
      ),
    };
  }

  const urgent = context.rows.find((row) => row.needsAttention);
  if (urgent?.scholarship && urgent.nextAction) {
    return trackedRowReply(urgent, "One of your tracked applications needs attention first.");
  }

  if (focus) {
    const first = focus.readiness.plan[0];
    if (first) {
      return {
        answer: `${first.title}. ${first.detail}`,
        reasons: [
          `Readiness for ${focus.scholarship.title} is ${focus.readiness.percent}% — ${READINESS_LEVEL_LABEL[focus.readiness.level].toLowerCase()}.`,
          `${focus.readiness.deadline.label}.`,
        ],
        actions: actions(
          { label: "Open the preparation checklist", href: `${detailHref(focus.scholarship)}#prepare` },
          { label: "Update my profile", href: "/profile" },
        ),
      };
    }
  }

  const top = context.rows[0];
  if (top?.scholarship && top.nextAction) {
    return trackedRowReply(top, "Your tracked applications are in hand, so the next move is on the most pressing one.");
  }

  if (context.rows.length > 0) {
    return {
      answer: `You are tracking ${context.rows.length} application${context.rows.length === 1 ? "" : "s"} and none of them needs action today.`,
      reasons: ["Nothing is overdue, due soon or waiting on an unfinished checklist."],
      actions: actions(
        { label: "Open your tracker", href: "/applications" },
        { label: "See more matches", href: "/matches" },
      ),
    };
  }

  return {
    answer: focus
      ? `Nothing is outstanding on ${focus.scholarship.title} right now. The next useful move is to widen the search.`
      : "Nothing needs action today: your profile is complete and nothing is tracked yet.",
    reasons: focus
      ? [focus.readiness.summary, `${focus.readiness.deadline.label}.`]
      : ["Every field the ranking reads is answered, so results are not damped for missing information."],
    actions: actions(
      { label: "See my matches", href: "/matches" },
      { label: "Track an application", href: "/scholarships" },
    ),
  };
}

function trackedRowReply(row: TrackedRow, framing: string): AssistantReply {
  if (!row.scholarship || !row.nextAction) {
    return {
      answer: "One of your tracked applications points at a record that is no longer in the collection.",
      reasons: ["The status you saved is kept; only the award behind it has gone."],
      actions: actions({ label: "Open your tracker", href: "/applications" }),
    };
  }

  return {
    answer: `${framing} ${row.scholarship.title}: ${row.nextAction.title}.`,
    reasons: [
      row.nextAction.detail,
      `${row.deadline.label}.`,
      `${row.progress.marked} of ${row.progress.total} preparation step${row.progress.total === 1 ? "" : "s"} marked in this browser.`,
    ],
    actions: actions(
      row.nextAction.href ? { label: row.nextAction.title, href: row.nextAction.href } : null,
      { label: "Open your tracker", href: "/applications" },
    ),
  };
}

function improveProfile(context: AssistantContext): AssistantReply {
  const completion = context.completion;

  if (completion.answeredCount === 0) {
    const essential = completion.gaps.filter((gap) => gap.tier === "essential");
    return {
      answer: `Your profile has no answers yet. Start with ${essential.length} essential fields: ${essential.map((gap) => gap.label).join(", ")}.`,
      reasons: essential.map((gap) => `${gap.label} — ${gap.reason}`),
      actions: actions(
        { label: "Open the profile builder", href: "/profile" },
        { label: "See what the sample profile produces", href: "/matches" },
      ),
    };
  }

  if (completion.gaps.length === 0) {
    return {
      answer: `Your profile is ${completion.percent}% complete — every field the ranking reads is answered.`,
      reasons: [
        "Nothing the engine depends on is blank, so match scores are not damped for missing information.",
        `${completion.essentialAnswered} of ${completion.essentialTotal} essential fields are answered.`,
      ],
      actions: actions(
        { label: "See my matches", href: "/matches" },
        { label: "Review my answers", href: "/profile" },
      ),
    };
  }

  return {
    answer: `Your profile is ${completion.percent}% complete. ${completion.gaps.length} field${completion.gaps.length === 1 ? "" : "s"} the ranking reads ${completion.gaps.length === 1 ? "is" : "are"} still blank.`,
    reasons: completion.gaps.slice(0, 3).map((gap) => `${gap.label} — ${gap.reason}`),
    actions: actions(
      { label: "Open the profile builder", href: "/profile" },
      { label: "Watch the ranking move", href: "/matches" },
    ),
  };
}

function applicationStatus(context: AssistantContext, focus: AssistantFocus | null): AssistantReply {
  if (!focus) {
    if (context.rows.length === 0) {
      return {
        answer: "You are not tracking any applications yet, so there is no status to read.",
        reasons: [
          "Tracking starts from a scholarship page. A status is only ever recorded by you, in this browser.",
        ],
        actions: actions(
          { label: "Browse scholarships", href: "/scholarships" },
          { label: "Open the tracker", href: "/applications" },
        ),
      };
    }
    const first = context.rows[0];
    if (first?.scholarship && first.nextAction) return trackedRowReply(first, "Your leading tracked application:");
    return {
      answer: `You are tracking ${context.rows.length} application${context.rows.length === 1 ? "" : "s"}.`,
      reasons: ["Open the tracker to read each status, deadline and note."],
      actions: actions({ label: "Open your tracker", href: "/applications" }),
    };
  }

  const row = focus.tracked;
  if (!row || !row.tracked) {
    return {
      answer: `You are not tracking an application for ${focus.scholarship.title} yet.`,
      reasons: [
        "Tracking records where an application sits and what to do next. It is stored in this browser only and never changes your readiness figure.",
      ],
      actions: actions(
        { label: "Open the scholarship", href: detailHref(focus.scholarship) },
        { label: "Open your tracker", href: "/applications" },
      ),
    };
  }

  const { tracked, deadline, progress, nextAction: action } = row;

  return {
    answer: `${focus.scholarship.title} is tracked as ${APPLICATION_STATUS_LABEL[tracked.status]}.`,
    reasons: [
      `${deadline.label}.${deadline.note ? ` ${deadline.note}` : ""}`,
      `${progress.marked} of ${progress.total} preparation step${progress.total === 1 ? "" : "s"} marked in this browser.`,
      action ? action.detail : "No next step is recorded for this status.",
    ],
    actions: actions(
      action?.href ? { label: action.title, href: action.href } : null,
      { label: "Open your tracker", href: "/applications" },
    ),
  };
}

function deadlineAnswer(context: AssistantContext, focus: AssistantFocus | null): AssistantReply {
  if (!focus) return nothingToRead(context, "a deadline");

  const { scholarship, tracked } = focus;
  const read = tracked
    ? tracked.deadline
    : deadlineReport(scholarship, "interested");

  const READING: Readonly<Record<DeadlineState, string>> = {
    upcoming: "The closing date is not close yet, so nothing needs doing on the date today.",
    due_soon: "The closing date is close enough to act on now.",
    today: "The closing date is today.",
    overdue: "The closing date has passed and this application has not been submitted.",
    closed: "The closing date has passed and the application was already submitted.",
    rolling: "The provider reviews applications as they arrive, so there is no single closing date.",
    varies: "The provider publishes no single date and says why in its own wording.",
    unknown: "No closing date is published, so ScholarMatch does not estimate one.",
  };

  const reasons = [READING[read.state]];
  if (read.note) reasons.push(read.note);
  reasons.push("The published record is what this reads from. Requirements change, so confirm anything you rely on with the awarding body.");

  const apply = scholarship.officialSource.applicationUrl;

  return {
    answer: `${scholarship.title}: ${read.label}.`,
    reasons,
    actions: actions(
      apply ? { label: "Apply on the official portal", href: apply } : { label: "See how to apply", href: `${detailHref(scholarship)}#how-to-apply` },
      { label: "Open the record", href: detailHref(scholarship) },
    ),
  };
}

function readinessAnswer(context: AssistantContext, focus: AssistantFocus | null): AssistantReply {
  if (!focus) return nothingToRead(context, "readiness");

  const { readiness, scholarship } = focus;

  return {
    answer: `${scholarship.title} is ${readiness.percent}% ready — ${READINESS_LEVEL_LABEL[readiness.level].toLowerCase()}.`,
    reasons: [
      readiness.summary,
      readiness.attention === 0
        ? "Nothing applicable is still waiting on you."
        : `${readiness.attention} applicable item${readiness.attention === 1 ? "" : "s"} still need${readiness.attention === 1 ? "s" : ""} attention.`,
      `${readiness.deadline.label}.`,
    ],
    actions: actions(
      { label: "Work through the checklist", href: `${detailHref(scholarship)}#prepare` },
      { label: "Sharpen the inputs", href: "/profile" },
    ),
  };
}

function documentsAnswer(context: AssistantContext, focus: AssistantFocus | null): AssistantReply {
  if (!focus) return nothingToRead(context, "a document list");

  const { readiness, scholarship } = focus;
  const required = scholarship.documents.filter((document) => document.requirement === "required");
  const others = scholarship.documents.length - required.length;

  const outstanding = readiness.requirements.filter(
    (requirement) => requirement.id.startsWith("doc:") && requirement.requirement === "required" &&
      (requirement.status === "unknown" || requirement.status === "not_met"),
  );

  const reasons: string[] = [];
  if (required.length === 0) {
    reasons.push("This record lists no required document, so the provider publishes none.");
  } else {
    reasons.push(
      outstanding.length > 0
        ? `${outstanding.length} of them ${outstanding.length === 1 ? "is" : "are"} not evidenced by your profile yet: ${outstanding
            .slice(0, 3)
            .map((requirement) => requirement.label)
            .join(", ")}.`
        : "Every required document your profile can evidence is accounted for.",
    );
  }
  if (others > 0) reasons.push(`${others} further document${others === 1 ? " is" : "s are"} listed as optional or conditional.`);
  reasons.push("A document marked optional or conditional never counts against your readiness.");

  return {
    answer:
      required.length > 0
        ? `${scholarship.title} lists ${required.length} required document${required.length === 1 ? "" : "s"}: ${required.map((document) => document.label).join(", ")}.`
        : `${scholarship.title} publishes no required document list.`,
    reasons,
    actions: actions(
      { label: "Open the document checklist", href: `${detailHref(scholarship)}#documents` },
      { label: "Open preparation", href: `${detailHref(scholarship)}#prepare` },
    ),
  };
}

function eligibilityAnswer(context: AssistantContext, focus: AssistantFocus | null): AssistantReply {
  if (!focus) return nothingToRead(context, "an eligibility verdict");

  const { readiness, match, scholarship } = focus;
  const criteria = scholarship.eligibility;

  const reasons: string[] = [`Against your profile: ${readiness.eligibilityLabel}.`];
  if (!match.eligibility.isEligible) reasons.push(...match.warnings.slice(0, 2));
  reasons.push(...criteria.slice(0, 3).map((criterion) => `${criterion.label}: ${criterion.value}`));

  return {
    answer: `${scholarship.title} checks ${criteria.length} published requirement${criteria.length === 1 ? "" : "s"}. ${readiness.eligibilityLabel} for your profile.`,
    reasons,
    actions: actions(
      { label: "Read who can apply", href: `${detailHref(scholarship)}#eligibility` },
      { label: "Open the record", href: detailHref(scholarship) },
    ),
  };
}

/**
 * "What does this requirement mean?"
 *
 * The provider's own wording is reproduced, and a criterion published without
 * further explanation is reported as exactly that rather than being interpreted
 * into something the provider never said.
 */
function requirementMeaning(context: AssistantContext, focus: AssistantFocus | null): AssistantReply {
  if (!focus) return nothingToRead(context, "a requirement");

  const { scholarship } = focus;
  const criteria = scholarship.eligibility;

  return {
    answer: `${scholarship.title} states its requirements in the provider's own words. Here they are, with whatever explanation the record carries.`,
    reasons: criteria.slice(0, 5).map((criterion) =>
      criterion.detail
        ? `${criterion.label}: ${criterion.value} — ${criterion.detail}`
        : `${criterion.label}: ${criterion.value}. The provider publishes no further explanation, so confirm it on the official page.`,
    ),
    actions: actions(
      { label: "Read who can apply", href: `${detailHref(scholarship)}#eligibility` },
      { label: "Ask about my eligibility", href: `${detailHref(scholarship)}#match` },
    ),
  };
}

function explain(context: AssistantContext, focus: AssistantFocus | null): AssistantReply {
  if (!focus) return nothingToRead(context, "a scholarship");

  const { scholarship, readiness } = focus;
  const required = scholarship.documents.filter((document) => document.requirement === "required").length;

  return {
    answer: focus.isExplicit
      ? `${scholarship.title}, at ${scholarship.organization}. ${scholarship.fundingSummary}`
      : `Your top match is ${scholarship.title}, at ${scholarship.organization}. ${scholarship.fundingSummary}`,
    reasons: [
      `${scholarship.fundingLabel} for ${scholarship.degreeLabel} study in ${scholarship.country}.`,
      `${readiness.deadline.label}.`,
      `${required} required document${required === 1 ? "" : "s"}; ${scholarship.studyMode}, ${scholarship.duration}.`,
    ],
    actions: actions(
      { label: "Open the full record", href: detailHref(scholarship) },
      { label: "See where I stand", href: `${detailHref(scholarship)}#match` },
    ),
  };
}

function unanswered(): AssistantReply {
  return {
    answer: "I don't have enough verified information to answer that yet.",
    reasons: [
      "I only read your saved profile, the published scholarship records, your preparation checklist and your tracked applications. Anything outside that is not something I can know.",
      "For a definitive requirement, check the awarding body's own page — the official source stays authoritative.",
    ],
    actions: actions(
      { label: "Browse scholarships", href: "/scholarships" },
      { label: "See my matches", href: "/matches" },
    ),
    isFallback: true,
  };
}

/* ==========================================================================
   Dispatch
   ========================================================================== */

export function respond(question: string, context: AssistantContext): AssistantReply {
  const intent = detectIntent(question);
  const focus = focusOf(context);

  switch (intent) {
    case "capabilities":
      return capabilities(context, focus);
    case "requirement":
      return requirementMeaning(context, focus);
    case "prepare_first":
      return prepareFirst(context, focus);
    case "next_step":
      return nextStep(context, focus);
    case "missing":
      return missing(context, focus);
    case "improve_profile":
      return improveProfile(context);
    case "why_match":
      return whyMatch(context, focus);
    case "status":
      return applicationStatus(context, focus);
    case "deadline":
      return deadlineAnswer(context, focus);
    case "readiness":
      return readinessAnswer(context, focus);
    case "documents":
      return documentsAnswer(context, focus);
    case "eligibility":
      return eligibilityAnswer(context, focus);
    case "explain":
      return explain(context, focus);
    case "unanswered":
    default:
      return unanswered();
  }
}
