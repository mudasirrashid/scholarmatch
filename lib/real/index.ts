import type { Scholarship } from "@/types/scholarship";
import { normalizeAll } from "./normalize";
import { validateAll } from "./validate";

let cache: Scholarship[] | null = null;

export function realScholarships(): Scholarship[] {
  if (cache === null) {
    const list = normalizeAll();
    const issues = validateAll(list);
    if (issues.length > 0) {
      console.error("Real scholarships validation failed:", issues);
    }
    cache = list;
  }
  return cache;
}

export function clearRealScholarshipCache(): void {
  cache = null;
}
