/**
 * AI Scholarship Companion — public surface (Phase 08).
 *
 * Everything the UI needs from `lib/assistant` is re-exported here so a page
 * imports one module instead of reaching into its internals. The internals —
 * intent matching, reply composition, focus selection — stay free to change.
 */

export { activeProvider, contextualProvider } from "@/lib/assistant/provider";
export { buildAssistantContext, focusOf, modeFrom } from "@/lib/assistant/context";
export { starterPrompts } from "@/lib/assistant/prompts";

export type { AssistantEntry } from "@/lib/assistant/context";
export type { StarterPrompt } from "@/lib/assistant/prompts";
export type {
  AssistantAction,
  AssistantContext,
  AssistantFocus,
  AssistantMessage,
  AssistantMode,
  AssistantProvider,
  AssistantReply,
  AssistantRole,
} from "@/lib/assistant/types";
