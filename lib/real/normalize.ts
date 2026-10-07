import type { Scholarship } from "@/types/scholarship";
import { SHARED_JOURNEY, SHARED_MISTAKES } from "@/lib/demo/data";
import { RAW_REAL_SCHOLARSHIPS, type RawScholarship } from "./raw";

function mapDeadline(source: RawScholarship["deadline"]): Pick<Scholarship, "deadline" | "deadlineKind" | "deadlineNote"> {
  if (source.kind === "exact") {
    return { deadline: source.date, deadlineKind: undefined, deadlineNote: source.note };
  }
  return { deadline: null, deadlineKind: source.kind, deadlineNote: source.note };
}

function mapGpa(source: RawScholarship["gpa"]): Pick<Scholarship, "gpa"> {
  if (source.kind === "none") return { gpa: 0 };
  if (source.kind === "scale") return { gpa: source.minimum };
  return { gpa: null };
}

export function normalize(raw: RawScholarship): Scholarship {
  const deadline = mapDeadline(raw.deadline);
  const gpa = mapGpa(raw.gpa);

  return {
    id: raw.id,
    title: raw.title,
    organization: raw.organization,
    city: raw.city,
    country: raw.country,
    countryCode: raw.countryCode,
    degreeLevels: raw.degreeLevels,
    degree: raw.degree,
    degreeLabel: raw.degreeLabel,
    fields: raw.fields,
    funding: raw.funding,
    fundingLabel: raw.fundingLabel,
    fundingSummary: raw.fundingSummary,
    benefits: raw.benefits,
    deadline: deadline.deadline,
    deadlineKind: deadline.deadlineKind,
    deadlineNote: deadline.deadlineNote,
    postedAt: raw.postedAt,
    gpa: gpa.gpa,
    gpaLabel: raw.gpaLabel,

    nationality: raw.nationality,
    eligibleCountries: raw.eligibleCountries,
    excludedCountries: raw.excludedCountries,
    languageTests: raw.languageTests,
    languageRequirements: raw.languageRequirements,
    languageNote: raw.languageNote,
    eligibility: raw.eligibility,
    documents: raw.documents,
    howToApply: raw.howToApply,
    journey: SHARED_JOURNEY,
    commonMistakes: SHARED_MISTAKES,
    tags: raw.tags,
    studyMode: raw.studyMode,
    duration: raw.duration,
    applicationFee: raw.applicationFee,
    officialSource: {
      provider: raw.officialSource.provider,
      verifiedUrl: raw.officialSource.verifiedUrl,
      isDemo: false,
      sourceType: raw.officialSource.sourceType,
      applicationUrl: raw.officialSource.applicationUrl,
      lastVerified: raw.officialSource.lastVerified,
      notes: raw.officialSource.notes,
    },
  };
}

export function normalizeAll(): Scholarship[] {
  return RAW_REAL_SCHOLARSHIPS.map(normalize);
}
