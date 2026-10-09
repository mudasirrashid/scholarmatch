/**
 * The provider actually in use.
 *
 * Phase 08 has exactly one — the deterministic reader in `lib/assistant/respond`
 * — and it is wired here rather than inside the responder so that swapping it
 * for a model-backed provider is a one-line change with no UI or conversation
 * code touched.
 *
 * `usesExternalModel` is what the interface exists to declare: the UI states
 * honestly whether something outside ScholarMatch is answering. It must read
 * `false` for as long as this file wires up the contextual provider, and it is
 * asserted by the runtime verification so it cannot drift by accident.
 */

import { respond } from "@/lib/assistant/respond";

import type { AssistantProvider } from "@/lib/assistant/types";

/** The deterministic, local, key-free provider. */
export const contextualProvider: AssistantProvider = {
  id: "scholarmatch-contextual",
  usesExternalModel: false,
  respond,
};

/** Single swap point. Import this, not `contextualProvider`, from the UI. */
export const activeProvider: AssistantProvider = contextualProvider;
