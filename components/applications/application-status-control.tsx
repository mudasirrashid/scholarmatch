"use client";

import { APPLICATION_STATUS_LABEL, APPLICATION_STATUS_ORDER } from "@/types/application";

import type { ApplicationStatus } from "@/types/application";

/**
 * A single select for where an application sits.
 *
 * Transitions are unrestricted on purpose (see `types/application.ts`): any
 * status can be reached from any other, so a plain select is the honest
 * control. Wrapped in a label so the control keeps an accessible name.
 */
export function ApplicationStatusControl({
  value,
  onChange,
}: {
  value: ApplicationStatus;
  onChange: (status: ApplicationStatus) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-xs text-mist-400">
      Status
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as ApplicationStatus)}
        className="rounded-lg border border-hairline-strong bg-ink-800 px-2.5 py-1.5 text-[0.8125rem] text-mist-100 transition-colors duration-200 hover:border-hairline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-azure-300"
      >
        {APPLICATION_STATUS_ORDER.map((status) => (
          <option key={status} value={status}>
            {APPLICATION_STATUS_LABEL[status]}
          </option>
        ))}
      </select>
    </label>
  );
}