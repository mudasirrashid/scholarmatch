/**
 * Minimal class-name composer.
 *
 * The project deliberately avoids a `clsx`/`tailwind-merge` dependency: the
 * components below never merge conflicting Tailwind utilities at runtime, so a
 * simple filter-and-join is sufficient and keeps the client bundle smaller.
 */

export type ClassValue =
  | string
  | number
  | null
  | undefined
  | false
  | ClassValue[];

export function cn(...values: ClassValue[]): string {
  const out: string[] = [];

  for (const value of values) {
    if (!value && value !== 0) continue;

    if (Array.isArray(value)) {
      const nested = cn(...value);
      if (nested) out.push(nested);
      continue;
    }

    out.push(String(value));
  }

  return out.join(" ");
}