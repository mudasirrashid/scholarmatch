import { useState } from "react";
import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

/**
 * Form primitives for the profile builder.
 *
 * Deliberately plain native elements with the product's existing visual
 * language: real labels tied to real inputs, real radio and checkbox semantics,
 * and the same focus treatment used by the explorer filters.
 *
 * Everything here is presentation only. No component holds profile state, and
 * none of them know anything about matching.
 */

const FIELD_LABEL = "block text-sm font-medium text-mist-200";
const FIELD_HINT = "mt-1.5 text-xs leading-relaxed text-mist-500";

/**
 * Field description wiring.
 *
 * `hint` is passed as described-by rather than rendered as a tooltip, so it
 * reaches assistive technology and is reachable by find-in-page.
 *
 * The label always keeps its `for`. An earlier version dropped the association
 * whenever a hint was present, which left every hinted input unnamed.
 *
 * `invalid` exists because the control has to carry it, not the wrapper: only
 * the focusable element understands `aria-invalid` and `aria-describedby`.
 */
export interface FieldDescription {
  /** Pass to the control's `aria-describedby`. */
  readonly describedBy?: string;
  /** Pass to the control's `aria-invalid`. */
  readonly invalid?: boolean;
}

/** Shared description id plumbing for hint and error text. */
function descriptionIds(...ids: (string | undefined)[]): string | undefined {
  const present = ids.filter((id): id is string => id !== undefined);
  return present.length === 0 ? undefined : present.join(" ");
}

export function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
  className,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  /**
   * Validation message for this control.
   *
   * Rendered as ordinary text and wired through `aria-describedby` rather than as
   * a live region: an alert that re-announces on every keystroke while a number
   * is being typed is worse than none. `aria-invalid` on the control is what tells
   * assistive technology the field needs attention, and it is read when focus
   * reaches the input.
   */
  error?: string;
  /**
   * Either the control itself, or a function receiving the description wiring
   * for it. The function form exists because `aria-describedby` only takes
   * effect on the focusable element, not on a wrapper.
   */
  children: ReactNode | ((field: FieldDescription) => ReactNode);
  className?: string;
}) {
  const hintId = hint === undefined ? undefined : `${htmlFor}-hint`;
  const errorId = error === undefined ? undefined : `${htmlFor}-error`;
  const describedBy = descriptionIds(hintId, errorId);
  const control =
    typeof children === "function"
      ? children({ describedBy, invalid: error !== undefined })
      : children;

  return (
    <div className={cn("min-w-0", className)}>
      <label htmlFor={htmlFor} className={FIELD_LABEL}>
        {label}
      </label>

      {control}

      {hint ? (
        <p id={hintId} className={FIELD_HINT}>
          {hint}
        </p>
      ) : null}

      {error ? (
        <p id={errorId} className="mt-1.5 text-xs leading-relaxed text-rose-200">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/** Shared classes for text-like inputs, so fields stay visually consistent. */
export const INPUT_CLASSES =
  "w-full rounded-xl border border-hairline bg-tint/[0.04] px-4 py-3 text-[0.9375rem] " +
  "text-mist-100 placeholder:text-mist-600 transition-colors duration-200 " +
  "hover:border-hairline-strong focus:border-azure-400/70 focus:bg-tint/[0.06] " +
  "focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-azure-300";

export function TextInput({
  id,
  value,
  onChange,
  placeholder,
  type = "text",
  inputMode,
  min,
  max,
  step,
  autoComplete,
  describedBy,
  invalid,
}: {
  id: string;
  /** Empty string clears the value, which is how a student opts out. */
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: "text" | "number";
  inputMode?: "text" | "decimal" | "numeric";
  min?: number;
  max?: number;
  step?: number;
  autoComplete?: string;
  describedBy?: string;
  invalid?: boolean;
}) {
  return (
    <input
      id={id}
      type={type}
      value={value}
      inputMode={inputMode}
      min={min}
      max={max}
      step={step}
      autoComplete={autoComplete}
      placeholder={placeholder}
      aria-describedby={describedBy}
      aria-invalid={invalid || undefined}
      onChange={(event) => onChange(event.target.value)}
      className={INPUT_CLASSES}
    />
  );
}

/**
 * A text field that only ever stores a value the profile will accept.
 *
 * Several questions here have a real scale rather than a free-text answer: a GPA
 * lives on a 4.0 scale, IELTS on a 9-point one, citizenship is a two-letter ISO
 * code. Writing each keystroke straight into the profile caused two defects that
 * this exists to prevent:
 *
 * 1. The engine scored values its own parser would reject. A GPA of 9.5 was read
 *    as a strong academic record for the rest of the session.
 * 2. The value then vanished on the next page load, because `parseStoredProfile`
 *    discards anything out of range. The student was told their answer was saved
 *    and then lost it, with no explanation.
 *
 * So the keystrokes are held here while the field has focus, and `onCommit` is
 * called only for values `isValid` accepts. The profile keeps the last valid
 * answer, which is also what gets scored, and a rejected keystroke stays in the
 * box with the reason underneath instead of vanishing.
 *
 * Holding the raw text while focused is not incidental. A controlled input whose
 * value is re-rendered from the parsed number drops the trailing dot in "3." and
 * turns the next keystroke into "37".
 */
export function DraftField({
  id,
  label,
  hint,
  committed,
  onCommit,
  isValid,
  errorMessage,
  placeholder,
  inputMode,
  autoComplete,
}: {
  id: string;
  label: string;
  hint?: string;
  /** The stored value, already rendered for display. */
  committed: string;
  /** Receives the value once, when the student leaves the field, clearing included. */
  onCommit: (value: string) => void;
  isValid: (raw: string) => boolean;
  /** Shown under the field while a rejected keystroke is in it. */
  errorMessage: string;
  placeholder?: string;
  inputMode?: "text" | "decimal" | "numeric";
  autoComplete?: string;
}) {
  const [draft, setDraft] = useState(committed);
  const [isEditing, setIsEditing] = useState(false);

  // While the field has focus the student is the source of truth. Once they
  // leave, the stored value takes over, so a demo profile loaded from elsewhere on
  // the page or a profile cleared from another tab is reflected here.
  const shown = isEditing ? draft : committed;
  const error = isEditing && !isValid(draft) ? errorMessage : undefined;

  return (
    <Field label={label} htmlFor={id} hint={hint} error={error}>
      {(field) => (
        <input
          id={id}
          type="text"
          value={shown}
          inputMode={inputMode}
          autoComplete={autoComplete}
          placeholder={placeholder}
          aria-describedby={field.describedBy}
          aria-invalid={field.invalid || undefined}
          onFocus={() => {
            // Re-read the store on entry, so a value replaced while this field was
            // unfocused is picked up rather than overwritten by a stale draft.
            setDraft(committed);
            setIsEditing(true);
          }}
          onChange={(event) => {
            setDraft(event.target.value);
          }}
          onBlur={() => {
            // Commit once, on the way out, and only if the whole entry is
            // acceptable. Committing per keystroke persisted whichever valid
            // prefix happened to precede the mistake: typing 9.5 into a 0-9 band
            // stored a 9, so the rejection banner was describing a value the
            // profile already held and the engine already scored, and it had
            // overwritten a real score with it. One commit per visit leaves an
            // invalid entry as the student's text plus its error, which is what
            // this component was written to do.
            if (!isValid(draft)) return;

            if (draft !== committed) onCommit(draft);
            setIsEditing(false);
          }}
          className={INPUT_CLASSES}
        />
      )}
    </Field>
  );
}

/**
 * A select with a neutral first option.
 *
 * The empty option is what makes "unknown" expressible, which the engine needs:
 * a student who has not decided their funding preference is a different fact
 * from one who wants only partial funding.
 */
export function SelectInput({
  id,
  value,
  onChange,
  options,
  placeholder,
  describedBy,
  invalid,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly { value: string; label: string }[];
  placeholder: string;
  describedBy?: string;
  invalid?: boolean;
}) {
  return (
    <div className="relative">
      <select
        id={id}
        value={value}
        aria-describedby={describedBy}
        aria-invalid={invalid || undefined}
        onChange={(event) => onChange(event.target.value)}
        className={cn(INPUT_CLASSES, "appearance-none pr-11")}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <svg
        className="pointer-events-none absolute top-1/2 right-4 size-3.5 -translate-y-1/2 text-mist-500"
        viewBox="0 0 12 12"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M3 4.5L6 7.5L9 4.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

/**
 * Radio group in a fieldset.
 *
 * A `fieldset` with a `legend` rather than a `div` with `role="radiogroup"`,
 * so the question is announced before the options and arrow-key navigation comes
 * from the browser.
 */
export function RadioGroup<T extends string>({
  legend,
  name,
  value,
  onChange,
  options,
  hint,
  columns = 2,
}: {
  legend: string;
  name: string;
  value: T | undefined;
  onChange: (value: T) => void;
  options: readonly { value: T; label: string; hint?: string }[];
  hint?: string;
  columns?: 1 | 2;
}) {
  const hintId = hint === undefined ? undefined : `${name}-hint`;

  return (
    <fieldset className="min-w-0" aria-describedby={hintId}>
      <legend className={FIELD_LABEL}>{legend}</legend>
      {hint ? (
        <p id={hintId} className={FIELD_HINT}>
          {hint}
        </p>
      ) : null}

      <div
        className={cn(
          "mt-2.5 grid gap-2",
          columns === 2 ? "sm:grid-cols-2" : "grid-cols-1",
        )}
      >
        {options.map((option) => {
          const id = `${name}-${option.value}`;
          const checked = value === option.value;

          return (
            <label
              key={option.value}
              htmlFor={id}
              className={cn(
                "group/radio flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3",
                "transition-colors duration-200",
                checked
                  ? "border-azure-400/50 bg-azure-400/10"
                  : "border-hairline bg-tint/[0.03] hover:border-hairline-strong hover:bg-tint/[0.06]",
                "focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-azure-300",
              )}
            >
              <input
                id={id}
                type="radio"
                name={name}
                value={option.value}
                checked={checked}
                onChange={() => onChange(option.value)}
                className="mt-0.5 size-4 shrink-0 appearance-none rounded-full border border-hairline-strong bg-tint/[0.04] transition-colors duration-200 checked:border-azure-400 checked:bg-azure-400"
              />

              <span className="min-w-0 flex-1">
                <span
                  className={cn(
                    "block text-sm transition-colors duration-200",
                    checked ? "text-mist-50" : "text-mist-300",
                  )}
                >
                  {option.label}
                </span>
                {option.hint ? (
                  <span className="mt-0.5 block text-xs leading-relaxed text-mist-500">
                    {option.hint}
                  </span>
                ) : null}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

/** Checkbox group for multi-select questions such as destinations. */
export function CheckboxGroup<T extends string>({
  legend,
  name,
  values,
  onToggle,
  options,
  hint,
}: {
  legend: string;
  name: string;
  values: readonly T[];
  onToggle: (value: T) => void;
  options: readonly { value: T; label: string }[];
  hint?: string;
}) {
  const hintId = hint === undefined ? undefined : `${name}-hint`;

  return (
    <fieldset className="min-w-0" aria-describedby={hintId}>
      <legend className={FIELD_LABEL}>{legend}</legend>
      {hint ? (
        <p id={hintId} className={FIELD_HINT}>
          {hint}
        </p>
      ) : null}

      <div className="mt-2.5 grid gap-2 sm:grid-cols-2">
        {options.map((option) => {
          const id = `${name}-${option.value}`;
          const checked = values.includes(option.value);

          return (
            <label
              key={option.value}
              htmlFor={id}
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-2.5",
                "transition-colors duration-200",
                checked
                  ? "border-azure-400/50 bg-azure-400/10"
                  : "border-hairline bg-tint/[0.03] hover:border-hairline-strong hover:bg-tint/[0.06]",
                "focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-azure-300",
              )}
            >
              <input
                id={id}
                type="checkbox"
                checked={checked}
                onChange={() => onToggle(option.value)}
                className="size-4 shrink-0 appearance-none rounded-[0.25rem] border border-hairline-strong bg-tint/[0.04] transition-colors duration-200 checked:border-azure-400 checked:bg-azure-400"
              />
              <span
                className={cn(
                  "text-sm transition-colors duration-200",
                  checked ? "text-mist-50" : "text-mist-300",
                )}
              >
                {option.label}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}