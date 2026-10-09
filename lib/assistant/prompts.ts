/**
 * Starter prompts.
 *
 * A short, mode-aware set rather than a prompt library: four questions that the
 * responder can always answer from real ScholarMatch data. The set changes with
 * the entry point so the first tap from a scholarship page is about that
 * scholarship, and changes again when there is nothing to ask about yet — an
 * empty profile has no match to explain, so it is offered onboarding instead of
 * a question that would only produce "you have no profile".
 */

import type { AssistantMode } from "@/lib/assistant/types";

export interface StarterPrompt {
  /** Stable id, used as the React key and the message id seed. */
  id: string;
  /** The exact question sent when tapped. */
  label: string;
}

function prompts(idPrefix: string, labels: readonly string[]): StarterPrompt[] {
  return labels.map((label, index) => ({
    id: `${idPrefix}-${index}`,
    label,
  }));
}

/** Shown when there is no award and no profile to read: lead with onboarding. */
const ONBOARDING: readonly string[] = [
  "What can you help with?",
  "How can I improve my profile?",
  "What should I do next?",
  "Why am I a good match?",
];

const BY_MODE: Readonly<Record<AssistantMode, readonly string[]>> = {
  general: [
    "Why am I a good match?",
    "What am I missing?",
    "What should I do next?",
    "How can I improve my profile?",
  ],
  profile: [
    "How can I improve my profile?",
    "What should I do next?",
    "Why am I a good match?",
    "How do I become application-ready?",
  ],
  scholarship: [
    "Explain this scholarship.",
    "Why am I a good match?",
    "What am I missing?",
    "What should I prepare first?",
  ],
  match: [
    "Why did I get this match score?",
    "What am I missing?",
    "What should I do next?",
    "How can I improve my profile?",
  ],
  preparation: [
    "What should I prepare first?",
    "What am I missing?",
    "How close am I to being ready?",
    "What documents do I need?",
  ],
  application: [
    "What is my application status?",
    "What should I do next?",
    "When is the deadline?",
    "How close am I to being ready?",
  ],
};

export function starterPrompts(mode: AssistantMode, hasFocus: boolean): StarterPrompt[] {
  if (!hasFocus) return prompts("onboarding", ONBOARDING);
  return prompts(mode, BY_MODE[mode]);
}
