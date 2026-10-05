"use client";

import { useEffect, useId, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

import type { ButtonSize, ButtonVariant } from "@/components/ui/button";

/**
 * Two-step confirmation for an action that destroys data.
 *
 * A profile lives in one browser's `localStorage` and there is no server copy, so
 * overwriting it with a demo profile or clearing it is not recoverable by any
 * other means. Both of those were single clicks, which is not a real decision.
 *
 * This asks in place rather than in a modal: the consequence is stated in the
 * student's own terms, both answers stay reachable, and nothing has to be
 * dismissed before the question is answered.
 *
 * Focus is moved to the confirming button, because it replaces the trigger, and
 * returned to the trigger when the prompt closes, so keyboard and screen reader
 * users are not left at the top of the document.
 */
export function ConfirmAction({
  label,
  confirmLabel,
  question,
  onConfirm,
  variant = "ghost",
  size = "md",
  className,
}: {
  /** The action that opens the prompt. */
  label: string;
  /** The button that performs the action. */
  confirmLabel?: string;
  /** What happens, stated plainly rather than as "are you sure?". */
  question: string;
  onConfirm: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}) {
  const [isPending, setIsPending] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const shouldRestoreFocus = useRef(false);
  const questionId = useId();

  // Only after the prompt has been answered: on the way in, focus is moving
  // forwards to the confirming button instead.
  useEffect(() => {
    if (!shouldRestoreFocus.current) return;
    shouldRestoreFocus.current = false;
    triggerRef.current?.focus();
  }, [isPending]);

  function close() {
    shouldRestoreFocus.current = true;
    setIsPending(false);
  }

  if (!isPending) {
    return (
      <Button
        ref={triggerRef}
        variant={variant}
        size={size}
        className={className}
        onClick={() => setIsPending(true)}
      >
        {label}
      </Button>
    );
  }

  return (
    <div
      role="group"
      aria-label={`Confirm: ${label}`}
      className={cn("flex flex-wrap items-center gap-x-3 gap-y-2", className)}
    >
      {/*
        Described rather than announced. A live region would read the consequence
        out loud, then the focused button would read itself, so the student hears
        the question twice.
      */}
      <p id={questionId} className="w-full text-sm leading-relaxed text-pretty text-mist-300 sm:w-auto sm:flex-1 sm:min-w-0">
        {question}
      </p>

      <Button
        size={size}
        autoFocus
        aria-describedby={questionId}
        onClick={() => {
          close();
          onConfirm();
        }}
      >
        {confirmLabel ?? "Confirm"}
      </Button>

      <Button variant="ghost" size={size} onClick={close}>
        Cancel
      </Button>
    </div>
  );
}