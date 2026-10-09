"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { RotateCcw } from "lucide-react";

import { AssistantComposer } from "@/components/assistant/assistant-composer";
import { AssistantTurn } from "@/components/assistant/assistant-message";
import { useApplications } from "@/components/applications/use-applications";
import { ProfileProvider, useProfile } from "@/components/profile/profile-provider";
import { useChecklist } from "@/components/scholarships/detail/readiness-tracker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  activeProvider,
  buildAssistantContext,
  focusOf,
  modeFrom,
  starterPrompts,
} from "@/lib/assistant";
import { getScholarship } from "@/lib/scholarships";

import type { AssistantEntry, AssistantMessage, StarterPrompt } from "@/lib/assistant";

/**
 * The companion itself: one conversation, held in component state.
 *
 * Three deliberate constraints shape this file.
 *
 * 1. **Nothing is persisted.** The conversation lives in `useState` and is gone
 *    on reload. A chat log is the most likely place for a student to paste
 *    something private, and Phase 08 adds no storage, no account and no
 *    analytics — so it simply is not written anywhere.
 * 2. **The entry point is read from the URL, not guessed.** `?from=` and
 *    `?scholarship=` decide which starter prompts appear and which award the
 *    first answer is about. It is read as an external store rather than through
 *    `useSearchParams`, which would force a `Suspense` boundary and replace the
 *    heading, disclosure and composer with a fallback in the server HTML.
 * 3. **Personalisation waits for hydration.** Before the URL is read and the
 *    stored profile is available the view renders the same generic state the
 *    server produced — the onboarding prompts and "Reading your saved profile" —
 *    so there is no hydration mismatch and no personalised figure in the HTML.
 *
 * Replies come from `activeProvider`, never composed here. This component
 * gathers context, asks, and renders what comes back.
 */

/** Turn ids only ever exist after a local interaction, so a counter is enough. */
let turnSequence = 0;
function nextTurnId(): string {
  turnSequence += 1;
  return `turn-${turnSequence}`;
}

/*
  The entry point is an external system — the address bar — so it is read the
  same way the localStorage-backed stores are: through `useSyncExternalStore`,
  with a cached snapshot so repeated reads keep one identity.

  The parsed result is cached against the exact search string it came from. A
  fresh object per call would make the store loop forever; a cached one changes
  only when the URL does.

  `serverEntry` is always `null`: the server has no URL to read from here, and
  returning the same value on every server render is what keeps hydration
  honest — the first client render also sees `null`, then the snapshot switches
  once React takes the client's copy.
*/
let cachedSearch: string | undefined;
let cachedEntry: AssistantEntry | null = null;

function readEntry(): AssistantEntry | null {
  if (typeof window === "undefined") return null;

  const search = window.location.search;
  if (search !== cachedSearch) {
    const params = new URLSearchParams(search);
    const requested = params.get("scholarship");
    // An unknown id is dropped rather than trusted: the context builder looks
    // records up again, and a hand-edited URL must not name an award that does
    // not exist.
    const scholarshipId =
      requested !== null && getScholarship(requested) !== null ? requested : null;

    cachedSearch = search;
    cachedEntry = {
      mode: modeFrom(params.get("from"), scholarshipId !== null),
      scholarshipId,
    };
  }

  return cachedEntry;
}

function serverEntry(): AssistantEntry | null {
  return null;
}

function subscribeEntry(listener: () => void): () => void {
  window.addEventListener("popstate", listener);
  return () => window.removeEventListener("popstate", listener);
}

export function AssistantView() {
  return (
    <ProfileProvider>
      <AssistantViewInner />
    </ProfileProvider>
  );
}

function AssistantViewInner() {
  const { profile, isHydrated, isUnreadable } = useProfile();
  const { records: applications } = useApplications();
  const { records: checklist } = useChecklist();

  const entry = useSyncExternalStore(subscribeEntry, readEntry, serverEntry);
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const logRef = useRef<HTMLDivElement>(null);

  const ready = entry !== null && isHydrated;

  const context = useMemo(
    () =>
      ready && entry
        ? buildAssistantContext({ entry, profile, applications, checklist })
        : null,
    [ready, entry, profile, applications, checklist],
  );

  const focus = useMemo(() => (context ? focusOf(context) : null), [context]);

  // Before the URL is read this resolves to the generic onboarding set, which
  // is exactly what the server rendered — so the first client paint matches.
  const prompts = useMemo(
    () => starterPrompts(entry?.mode ?? "general", focus !== null),
    [entry, focus],
  );

  const ask = useCallback(
    (question: string) => {
      if (!context) return;
      const reply = activeProvider.respond(question, context);
      setMessages((previous) => [
        ...previous,
        { id: nextTurnId(), role: "user", question },
        { id: nextTurnId(), role: "assistant", reply },
      ]);
    },
    [context],
  );

  useEffect(() => {
    const node = logRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [messages]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="neutral">Guided reading, not an external AI</Badge>

        {ready ? (
          focus ? (
            <Badge tone="accent">
              About: {focus.isExplicit ? focus.scholarship.title : "your top match"}
            </Badge>
          ) : (
            <Badge tone="neutral">No award in context</Badge>
          )
        ) : null}

        {isUnreadable ? (
          <Badge tone="caution">Saved profile could not be read</Badge>
        ) : null}

        {messages.length > 0 ? (
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto"
            onClick={() => setMessages([])}
          >
            <RotateCcw className="size-4" aria-hidden="true" />
            Clear conversation
          </Button>
        ) : null}
      </div>

      <div
        ref={logRef}
        role="log"
        aria-label="Conversation with the companion"
        className="max-h-[min(58vh,32rem)] space-y-5 overflow-y-auto rounded-3xl"
      >
        {messages.length === 0 ? (
          <EmptyConversation prompts={prompts} onPick={ask} isReady={ready} />
        ) : (
          messages.map((message) => <AssistantTurn key={message.id} message={message} />)
        )}
      </div>

      <AssistantComposer onSend={ask} disabled={!ready} />
    </div>
  );
}

/**
 * The opening turn.
 *
 * Shown before anything has been asked, and again after a clear. The status
 * line is the route's honest first statement: on the server and before
 * hydration it says the stored profile is being read, because that is the only
 * thing that can be true at that point.
 */
function EmptyConversation({
  prompts,
  onPick,
  isReady,
}: {
  prompts: readonly StarterPrompt[];
  onPick: (question: string) => void;
  isReady: boolean;
}) {
  return (
    <div className="surface-glass edge-highlight rounded-3xl p-5 sm:p-6">
      <p className="label-micro text-mist-500">Start here</p>

      <p aria-live="polite" className="mt-3 text-[1.0625rem] leading-relaxed text-mist-100">
        {isReady
          ? "Ask a question in your own words, or pick one of these to begin."
          : "Reading your saved profile."}
      </p>

      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-pretty text-mist-400">
        I read your saved profile, the published award records, your preparation
        checklist and your tracked applications. Anything they do not hold — a
        deadline nobody published, a requirement nobody wrote down — comes back as
        not recorded rather than a guess.
      </p>

      <div className="mt-5 flex flex-wrap gap-2">
        {prompts.map((prompt) => (
          <button
            key={prompt.id}
            type="button"
            onClick={() => onPick(prompt.label)}
            className="rounded-full border border-hairline bg-tint/[0.05] px-4 py-2 text-left text-[0.8125rem] font-medium text-mist-100 transition-colors duration-200 hover:border-hairline-strong hover:bg-tint/[0.09] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-azure-300"
          >
            {prompt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
