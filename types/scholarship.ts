/**
 * ScholarMatch domain model.
 *
 * These shapes describe the vocabulary of the product rather than any specific
 * data source. Phase 01 renders them from static demo fixtures; later phases
 * will populate the same shapes from a real matching service, so the UI layer
 * should continue to depend on these types rather than on the fixtures.
 */

export type DegreeLevel =
  | "high_school"
  | "associate"
  | "bachelors"
  | "masters"
  | "doctorate"
  | "postdoctoral";

export type FundingType = "fully_funded" | "partial" | "tuition_only" | "stipend";

/** A single dimension the matcher evaluates, surfaced as a normalised score. */
export interface MatchFactor {
  /** Stable key, useful for icon lookup and analytics later. */
  id: string;
  /** Human-readable dimension name, e.g. "Academic". */
  label: string;
  /** Normalised score from 0 to 100. */
  score: number;
}

/** A reason the opportunity is a fit. */
export interface MatchReason {
  id: string;
  label: string;
}

/** A requirement the student does not yet satisfy. */
export interface MatchRequirement {
  id: string;
  label: string;
  /** Optional short remediation hint. */
  hint?: string;
}

/**
 * Read model for an opportunity as surfaced on discovery surfaces.
 *
 * `matchScore` is denormalised on purpose: list and card views need a single
 * ordering value without evaluating every factor.
 */
export interface ScholarshipPreview {
  id: string;
  title: string;
  /** Awarding body, e.g. a university or foundation. */
  organization: string;
  country: string;
  /** ISO 3166-1 alpha-2, used for the region affordance. */
  countryCode: string;
  degree: DegreeLevel;
  degreeLabel: string;
  /** Academic fields the award is open to. Empty means unrestricted. */
  fields: readonly string[];
  funding: FundingType;
  fundingLabel: string;
  /**
   * Exact closing date as an ISO `YYYY-MM-DD` string, for the visible date.
   *
   * `null` when the provider publishes no single date (rolling, varying by
   * institution, or simply not announced yet); the reason then travels on
   * `deadlineKind`/`deadlineNote` so the card can say why instead of guessing.
   */
  deadline: string | null;
  /** Whole days remaining until the closing date. `null` when there is no date. */
  deadlineInDays: number | null;
  /** Why `deadline` is `null`, when the provider says why. */
  deadlineKind?: DeadlineKind;
  /** The provider's own wording for a non-exact deadline. */
  deadlineNote?: string;
  /** ISO date this record was last checked against the provider's own pages. Set only for sourced records. */
  lastVerified?: string;
  /** Whether this record is illustrative rather than sourced. */
  isDemo: boolean;
  /** Overall fit score, 0 to 100. */
  matchScore: number;
  tags: readonly string[];
  factors: readonly MatchFactor[];
  reasons: readonly MatchReason[];
  requirements: readonly MatchRequirement[];
}

/**
 * Compact profile projection used by the hero visualisation.
 *
 * Deliberately partial: the hero only needs enough to explain the matching
 * concept without inventing personal data.
 */
export interface StudentProfilePreview {
  displayName: string;
  degreeLabel: string;
  fieldLabel: string;
  institutionLabel: string;
  /** Locale tags the student has declared. */
  languages: readonly string[];
  /** Normalised academic standing, 0 to 100. */
  academicScore: number;
}

/** Ordered product capability, presented in the feature showcase. */
export interface FeatureBlock {
  id: string;
  /** Two-digit display index, e.g. "01". */
  index: string;
  title: string;
  description: string;
  /** Points of elaboration shown beneath the description. */
  highlights: readonly string[];
}

/** A stage in the end-to-end student journey. */
export type JourneyStageId =
  | "discover"
  | "check"
  | "prepare"
  | "apply"
  | "track";

export interface JourneyStage {
  id: JourneyStageId;
  label: string;
  description: string;
}

/* ==========================================================================
   Phase 02  Explorer and detail experience
   --------------------------------------------------------------------------
   Everything below is additive. The `ScholarshipPreview` shape above stays
   exactly as Phase 01 consumes it, and `toPreview` in `lib/scholarships`
   projects a full record down to it, so the explorer and the detail page can
   share one source of truth without Phase 01 changing behaviour.
   ========================================================================== */

/** Degree levels offered as explorer filters. */
export type DegreeFilter = "bachelors" | "masters" | "doctorate";

/** Academic standing floor, expressed as a GPA on a 4.0 scale. */
export type GpaRequirement = 0 | 2.5 | 3 | 3.5 | 3.7;

/** Proficiency tests a provider accepts as evidence of language ability. */
export type LanguageTest = "ielts" | "toefl" | "duolingo";

/**
 * A language filter member.
 *
 * `"none"` is a real selection rather than a sentinel: students often want to
 * opportunities that list no test requirement, which is why it is part of the
 * filter union and survives a URL round trip.
 */
export type LanguageFilter = LanguageTest | "none";

/**
 * Minimum scores a provider accepts, per test.
 *
 * Phase 02 carried these thresholds only inside the human-readable
 * `EligibilityCriterion.value` strings, which is fine for display but cannot be
 * evaluated. Phase 03 transcribes them into machine-readable form so the
 * matching engine can compare real numbers instead of parsing English.
 *
 * The relationship to `languageTests` is deliberate:
 * `languageTests` lists which tests a provider accepts, this object lists the
 * minimum score for each. A test can be accepted with no published minimum, in
 * which case the key is absent and the engine reports the threshold as unknown
 * rather than inventing one.
 */
export interface LanguageRequirement {
  /** Minimum IELTS band, 0-9. */
  ielts?: number;
  /** Minimum TOEFL score, 0-120. */
  toefl?: number;
  /** Minimum Duolingo English Test score, 0-160. */
  duolingo?: number;
}

/** How the award is paid out. Ordered from most to least comprehensive. */
export type FundingTier =
  | "fully_funded"
  | "tuition_and_partial"
  | "tuition_coverage"
  | "partial"
  | "stipend"
  | "research_funding";

/** Deadline proximity buckets, evaluated against a fixed reference date. */
export type DeadlineWindow = "closing_soon" | "this_month" | "next_three_months" | "later";

/**
 * Why a record carries no exact closing date, as the provider states it.
 *
 * Only meaningful alongside `deadline === null`: an exact date never needs a
 * kind, because the date explains itself.
 */
export type DeadlineKind = "rolling" | "varies" | "unknown";

/** Sort orders offered on the explorer. */
export type SortKey = "best_match" | "deadline_soon" | "newest" | "fully_funded" | "relevant";

/**
 * Outcome of comparing one requirement against one student.
 *
 * Phase 02 shipped these as authored demo values so the vocabulary was settled
 * before any evaluation logic existed. Phase 03 produces them from
 * `lib/matching`; no hand-written status survives in the demo data.
 */
export type EligibilityStatus =
  | "strong_match"
  | "meets"
  | "review"
  | "not_specified"
  | "not_eligible";

/** One evaluated dimension of fit, rendered in the "Why this matches" panel. */
export interface MatchBreakdownItem {
  id: string;
  /** Dimension name, e.g. "Academic". */
  label: string;
  /** Short verdict, e.g. "Excellent" or "Exact match". */
  verdict: string;
  status: EligibilityStatus;
  /** Optional line explaining the verdict for the student. */
  detail?: string;
}

/**
 * Everything the real matching engine will eventually hand the UI.
 *
 * Grouped deliberately so Phase 03 can populate a single object without the
 * presentation layer changing.
 */
export interface MatchInsights {
  /** Overall fit, 0 to 100. */
  score: number;
  /** One-line read on the score, shown beneath the ring. */
  summary: string;
  breakdown: readonly MatchBreakdownItem[];
  /** Dimensions where the student is short of the requirement. */
  missingRequirements: readonly string[];
  /** Dimensions that make this opportunity stand out. */
  strengths: readonly string[];
  /** Cautions worth reviewing before applying. */
  warnings: readonly string[];
}

/** A single money or in-kind component of an award. */
export interface FundingBenefit {
  id: string;
  label: string;
  /** Amount as written by the provider, e.g. "€1,200 / month". */
  value: string;
  /** One line on what it covers or any condition attached. */
  note?: string;
}

/** Whether a document must be supplied to apply. */
export type DocumentRequirement = "required" | "optional" | "conditional";

/** A document the provider asks for. */
export interface RequiredDocument {
  id: string;
  label: string;
  requirement: DocumentRequirement;
  /** Practical guidance, e.g. "Certified copy, not a scan of an original". */
  note?: string;
}

/** A named requirement block shown in "Who can apply". */
export interface EligibilityCriterion {
  id: string;
  /** Dimension name, e.g. "Nationality". */
  label: string;
  /** The requirement as the provider states it. */
  value: string;
  /**
   * Whether a profile appears to satisfy it.
   *
   * Authored only on demo records, where the illustrative profile's verdict was
   * written by hand. Sourced records omit it and the UI renders no badge, so a
   * real provider's requirement is never shown carrying a verdict no student
   * produced.
   */
  status?: EligibilityStatus;
  /** Optional remediation hint shown when `status` is `review`. */
  detail?: string;
}

/** A step the student performs on the official provider's own portal. */
export interface HowToApplyStep {
  /** Two-digit display index, e.g. "01". */
  index: string;
  title: string;
  description: string;
  /** A caution that commonly causes applications to fail. */
  caution?: string;
}

/** A stage in the ScholarMatch-side application journey. */
export interface ApplicationStage {
  index: string;
  title: string;
  description: string;
}

/** A mistake that causes applications to be rejected. */
export interface CommonMistake {
  id: string;
  title: string;
  /** What goes wrong, and what to do instead. */
  consequence: string;
}

/**
 * Provenance of an opportunity.
 *
 * Phase 02 only ever marks records as demo data, and never presents an
 * unverified external URL as authoritative.
 */
export interface OfficialSource {
  /** Display name of the awarding body. */
  provider: string;
  /**
   * Set only when a genuine, verified provider URL exists. Demo records leave
   * this undefined so the UI can decline to render a fabricated link.
   */
  verifiedUrl?: string;
  /** Whether this record is illustrative rather than sourced. */
  isDemo: boolean;
  /** What kind of body published the source page. Sourced records only. */
  sourceType?: "provider" | "university" | "government" | "partner";
  /**
   * Where the student actually submits, when it differs from `verifiedUrl`.
   * Sourced records only; the UI offers it as the "Apply now" link.
   */
  applicationUrl?: string;
  /** ISO date the record was last checked against the provider's own pages. Set only for sourced records. */
  lastVerified?: string;
  /** Provider wording that could not be reduced to a field, e.g. country notes. */
  notes?: string;
}

/**
 * Full scholarship record.
 *
 * This is the shape a real scholarship database will map into. Nested objects
 * are always present (never optional) so detail sections can render without
 * defensive checks; absence is expressed as an empty array or an explicit
 * `undefined` on the source, not as a missing branch.
 */
export interface Scholarship {
  id: string;
  title: string;
  organization: string;
  city: string;
  country: string;
  /** ISO 3166-1 alpha-2, used for the region affordance. */
  countryCode: string;

  /** Degree levels the award is open to. */
  degreeLevels: readonly DegreeLevel[];
  /** Primary degree this listing is filed under. */
  degree: DegreeLevel;
  degreeLabel: string;

  /** Study fields the award covers. */
  fields: readonly string[];

  funding: FundingTier;
  fundingLabel: string;
  /** Human summary of the financial package. */
  fundingSummary: string;
  benefits: readonly FundingBenefit[];

  /** ISO date the applications close, or `null` when no single date exists. */
  deadline: string | null;
  /** Why `deadline` is `null`, taken from the provider's own wording. */
  deadlineKind?: DeadlineKind;
  /** The provider's own note alongside the deadline, e.g. a closing time or why no date exists. Shown next to the visible deadline on the card. */
  deadlineNote?: string;
  /** ISO date the award was first published, used by the "Newest" sort. */
  postedAt: string | null;

  /**
   * Academic floor on the 4.0 scale, or `null` when the provider states its
   * own requirement in its own terms ("2:1", "upper third", "%70") rather than
   * a number the engine could compare honestly. `0` means no floor exists.
   */
  gpa: GpaRequirement | null;
  /** Rendered eligibility floor, e.g. "3.5+ GPA" or the provider's own wording. */
  gpaLabel: string;

  /**
 * Eligibility as the provider states it, for display.
 *
 * Prose, because providers publish prose and because it carries conditions a
 * code cannot ("financial means are assessed", "mobility rule applies"). Never
 * parse this for eligibility decisions; read `eligibleCountries` instead.
 */
  nationality: string;
  /**
   * ISO 3166-1 alpha-2 codes the award restricts eligibility to.
   *
   * Absent or empty means open to all nationalities. Phase 03 adds this
   * alongside `nationality` for the same reason as `languageRequirements`: the
   * prose is for humans, this field is for the engine.
   */
  eligibleCountries?: readonly string[];
  /**
   * ISO 3166-1 alpha-2 codes the award excludes explicitly, e.g. home-country
   * or "no offer available" lists. Checked before `eligibleCountries`.
   */
  excludedCountries?: readonly string[];
  languageTests: readonly LanguageTest[];
  /** Minimum scores the provider accepts, per test. */
  languageRequirements?: LanguageRequirement;
  /** Fields that accept a waiver in place of a language test. */
  languageNote?: string;

  eligibility: readonly EligibilityCriterion[];
  documents: readonly RequiredDocument[];
  howToApply: readonly HowToApplyStep[];
  journey: readonly ApplicationStage[];
  commonMistakes: readonly CommonMistake[];
  tags: readonly string[];

  studyMode: string;
  duration: string;
  applicationFee: string;

  /**
   * No `match` field by design.
   *
   * Phase 02 authored a score, breakdown, strengths and warnings onto each of
   * the twelve demo records so the vocabulary existed before any evaluation
   * logic did. Phase 03 replaces those hand-written values with output from
   * `lib/matching`, which keeps exactly one score per scholarship in the system.
   * Leaving a second, hand-maintained copy here is what previously allowed the
   * list and the detail page to disagree.
   */

  officialSource: OfficialSource;
}

/** Aggregated facet counts, used to label filter groups with totals. */
export type FacetCounts = Readonly<Record<string, number>>;

/**
 * Explorer query state.
 *
 * Mirrors the URL search params one-to-one so any view of the explorer is
 * shareable and survives a refresh without extra client state.
 */
export interface ExplorerQuery {
  /** Free-text term matched against title, provider, country and field. */
  q: string;
  degree: readonly DegreeFilter[];
  fields: readonly string[];
  countries: readonly string[];
  funding: readonly FundingTier[];
  deadlines: readonly DeadlineWindow[];
  gpa: readonly GpaRequirement[];
  language: readonly LanguageFilter[];
  sort: SortKey;
}