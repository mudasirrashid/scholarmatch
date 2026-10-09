"use client";

import Link from "next/link";
import { ArrowUpRight, Compass } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";

import type { AssistantMessage } from "@/lib/assistant";

/**
 * One turn of the conversation.
 *
 * A user turn is the student's question verbatim. An assistant turn is the
 * structured reply: the answer first, then the reasons it is true, then where
 * to go next. Nothing here interprets, reorders or embellishes a reply — the
 * responder already decided what is honest to say, and this component's only
 * job is to present it in reading order.
 *
 * A fallback reply is badged rather than styled as an error: "I don't know
 * that" is a correct answer, not a failure.
 */
export function AssistantTurn({ message }: { message: AssistantMessage }) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <p className="max-w-[85%] rounded-3xl rounded-br-lg border border-hairline bg-tint/[0.07] px-4 py-3 text-[0.9375rem] leading-relaxed text-mist-100 sm:max-w-[70%]">
          <span className="sr-only">You asked: </span>
          {message.question}
        </p>
      </div>
    );
  }

  const reply = message.reply;
  if (!reply) return null;

  const reasons = [...reply.reasons];
  const destinations = [...reply.actions];

  return (
    <article className="surface-glass edge-highlight rounded-3xl p-5 sm:p-6">
      <header className="flex flex-wrap items-center gap-3">
        <span
          aria-hidden="true"
          className="flex size-8 shrink-0 items-center justify-center rounded-full border border-azure-400/25 bg-azure-400/10"
        >
          <Compass className="size-4 text-azure-300" aria-hidden="true" />
        </span>

        <div className="min-w-0">
          <p className="text-[0.9375rem] font-medium text-mist-100">ScholarMatch companion</p>
          <p className="label-micro text-mist-500">Guided reading of your data</p>
        </div>

        {reply.isFallback ? (
          <Badge tone="caution" className="ml-auto">
            Not recorded
          </Badge>
        ) : null}
      </header>

      <p className="mt-4 text-[1.0625rem] leading-relaxed text-pretty text-mist-100">
        {reply.answer}
      </p>

      {reasons.length > 0 ? (
        <div className="mt-4 border-t border-hairline pt-4">
          <p className="label-micro text-mist-500">Why</p>
          <ul className="mt-3 space-y-2.5">
            {reasons.map((reason, index) => (
              <li key={`${index}-${reason}`} className="flex gap-2.5 text-sm leading-relaxed text-mist-400">
                <span
                  aria-hidden="true"
                  className="mt-2 size-1 shrink-0 rounded-full bg-azure-400"
                />
                <span className="min-w-0 text-pretty">{reason}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {destinations.length > 0 ? (
        <div className="mt-4 border-t border-hairline pt-4">
          <p className="label-micro text-mist-500">Next</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {destinations.map((action) => (
              <Link
                key={action.label}
                href={action.href}
                className={cn(
                  "group/act inline-flex items-center gap-1.5 rounded-full border border-hairline bg-tint/[0.05]",
                  "px-3.5 py-2 text-[0.8125rem] font-medium text-mist-100",
                  "transition-colors duration-200 hover:border-hairline-strong hover:bg-tint/[0.09]",
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-azure-300",
                )}
              >
                {action.label}
                <ArrowUpRight
                  className="size-3.5 opacity-50 transition-opacity group-hover/act:opacity-100"
                  aria-hidden="true"
                />
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </article>
  );
}
