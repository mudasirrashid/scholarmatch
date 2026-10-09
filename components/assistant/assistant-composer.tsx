"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * The question field.
 *
 * One textarea, one submit, one honest footer line. The form is a real form
 * with a real label association rather than a placeholder pretending to be one,
 * and Enter sends while Shift+Enter inserts the newline a multi-line question
 * needs.
 *
 * The composer is always mounted — including in the server HTML — because a
 * route whose entire purpose is a conversation must offer one before any
 * JavaScript runs.
 */
export function AssistantComposer({
  onSend,
  disabled = false,
}: {
  onSend: (question: string) => void;
  disabled?: boolean;
}) {
  const [text, setText] = useState("");
  const canSend = text.trim().length > 0 && !disabled;

  function send() {
    if (!canSend) return;
    onSend(text.trim());
    setText("");
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        send();
      }}
      className="surface-glass edge-highlight rounded-3xl p-4 sm:p-5"
    >
      <label htmlFor="assistant-question" className="label-micro text-mist-500">
        Your question
      </label>

      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
        <textarea
          id="assistant-question"
          rows={2}
          value={text}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              send();
            }
          }}
          placeholder="Ask about a match, a deadline, a document or what to prepare first."
          className="min-h-[4.75rem] w-full rounded-2xl border border-hairline bg-tint/[0.04] px-4 py-3 text-[0.9375rem] leading-relaxed text-mist-100 placeholder:text-mist-500 focus:border-azure-400/50 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-azure-300"
        />

        <Button type="submit" variant="accent" size="md" disabled={!canSend}>
          Ask
          <ArrowRight className="size-4" aria-hidden="true" />
        </Button>
      </div>

      <p className="mt-3 text-xs leading-relaxed text-mist-500">
        Answers are read from the records already on ScholarMatch. Nothing you type
        leaves this browser, and nothing outside those records is invented.
      </p>
    </form>
  );
}
