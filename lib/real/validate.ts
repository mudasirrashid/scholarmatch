import type { Scholarship } from "@/types/scholarship";

function isIso2(code?: string): boolean {
  return typeof code === "string" && code.length === 2 && /^[A-Z]{2}$/.test(code);
}

function isMultiCountry(s: Scholarship): boolean {
  return typeof s.country === "string" && s.country.toLowerCase() === "multiple countries";
}

export type ValidationIssue = {
  id: string;
  field: string;
  message: string;
};

export function validateScholarship(s: Scholarship): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (!isIso2(s.countryCode) && !(isMultiCountry(s) && s.countryCode === "")) {
    issues.push({ id: s.id, field: "countryCode", message: "countryCode must be ISO 3166-1 alpha-2 (2 uppercase letters) or empty for multi-country records" });
  }

  if (s.officialSource.isDemo === false && !s.officialSource.lastVerified) {
    issues.push({ id: s.id, field: "officialSource.lastVerified", message: "sourced record must have lastVerified" });
  }

  if (s.deadline === null && s.deadlineKind === undefined) {
    issues.push({ id: s.id, field: "deadlineKind", message: "deadlineKind required when deadline is null" });
  }

  if (s.deadline !== null && s.deadlineKind !== undefined) {
    issues.push({ id: s.id, field: "deadlineKind", message: "deadlineKind must be undefined when deadline is exact" });
  }

  (s.eligibleCountries ?? []).forEach((c) => {
    if (!isIso2(c)) {
      issues.push({ id: s.id, field: "eligibleCountries", message: `invalid ISO code: ${c}` });
    }
  });
  (s.excludedCountries ?? []).forEach((c) => {
    if (!isIso2(c)) {
      issues.push({ id: s.id, field: "excludedCountries", message: `invalid ISO code: ${c}` });
    }
  });

  return issues;
}

export function validateAll(list: Scholarship[]): ValidationIssue[] {
  return list.flatMap(validateScholarship);
}
