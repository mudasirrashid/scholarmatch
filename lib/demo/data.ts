/**
 * DEMO DATA — Phase 01 only.
 *
 * ---------------------------------------------------------------------------
 * Every value in this file is illustrative sample content used to demonstrate
 * interface concepts. None of it is real:
 *
 *   - the scholarship entries do not correspond to live programmes,
 *   - the match scores are illustrative, not computed,
 *   - the profile is fictional,
 *   - no figure here should be presented to users as a statistic.
 *
 * When the matching service lands, delete this module and hydrate
 * `ScholarshipPreview` / `StudentProfilePreview` from the API instead. The
 * consuming components must not import from this file directly; they should
 * receive the models as props or via a future data-access layer.
 */

import type {
  FeatureBlock,
  JourneyStage,
  ScholarshipPreview,
  StudentProfilePreview,
} from "@/types/scholarship";

/** Opportunity featured in the hero visualisation and matching preview. */
export const featuredScholarship: ScholarshipPreview = {
  id: "demo-global-excellence",
  title: "Global Excellence Scholarship",
  organization: "Illustrative University",
  country: "Germany",
  countryCode: "DE",
  degree: "masters",
  degreeLabel: "Master's",
  funding: "fully_funded",
  fundingLabel: "Fully Funded",
  deadlineInDays: 42,
  matchScore: 96,
  tags: ["STEM", "Research", "No tuition"],
  factors: [
    { id: "academic", label: "Academic", score: 100 },
    { id: "field", label: "Field", score: 100 },
    { id: "degree", label: "Degree", score: 100 },
    { id: "language", label: "Language", score: 80 },
  ],
  reasons: [
    { id: "degree-eligible", label: "Your degree level is eligible" },
    { id: "field-match", label: "Your field of study matches" },
    { id: "academic-fit", label: "Your academic profile fits the cohort" },
  ],
  requirements: [
    {
      id: "language-proof",
      label: "Language requirement needs verification",
      hint: "An accepted proficiency certificate would complete this.",
    },
  ],
};

/** Additional sample entries used to demonstrate the reusable card at varied states. */
export const additionalScholarships: readonly ScholarshipPreview[] = [
  {
    id: "demo-urban-systems",
    title: "Urban Systems & Mobility Grant",
    organization: "Illustrative Institute of Technology",
    country: "Netherlands",
    countryCode: "NL",
    degree: "masters",
    degreeLabel: "Master's",
    funding: "partial",
    fundingLabel: "Partial Funding",
    deadlineInDays: 18,
    matchScore: 88,
    tags: ["Engineering", "Urban Planning"],
    factors: [
      { id: "academic", label: "Academic", score: 92 },
      { id: "field", label: "Field", score: 95 },
      { id: "degree", label: "Degree", score: 100 },
      { id: "language", label: "Language", score: 60 },
    ],
    reasons: [
      { id: "field-match", label: "Your field of study matches" },
      { id: "academic-fit", label: "Your academic profile fits the cohort" },
    ],
    requirements: [
      {
        id: "portfolio",
        label: "Portfolio of prior work required",
        hint: "Two written case studies would strengthen this.",
      },
    ],
  },
  {
    id: "demo-clinical-research",
    title: "Clinical Research Fellowship",
    organization: "Illustrative Health Sciences Centre",
    country: "United Kingdom",
    countryCode: "GB",
    degree: "doctorate",
    degreeLabel: "Doctorate",
    funding: "fully_funded",
    fundingLabel: "Fully Funded",
    deadlineInDays: 67,
    matchScore: 74,
    tags: ["Medicine", "Research", "Stipend"],
    factors: [
      { id: "academic", label: "Academic", score: 88 },
      { id: "field", label: "Field", score: 70 },
      { id: "degree", label: "Degree", score: 60 },
      { id: "language", label: "Language", score: 90 },
    ],
    reasons: [
      { id: "academic-fit", label: "Your academic profile fits the cohort" },
    ],
    requirements: [
      {
        id: "degree-step",
        label: "Doctorate entry requires a prior masters",
        hint: "Relevant research experience may be assessed instead.",
      },
    ],
  },
];

/** Fictional student used to illustrate the matching concept. */
export const demoProfile: StudentProfilePreview = {
  displayName: "A. Rahman",
  degreeLabel: "Master's candidate",
  fieldLabel: "Data Science",
  institutionLabel: "Illustrative University",
  languages: ["English", "German (B2)"],
  academicScore: 91,
};

export const featureBlocks: readonly FeatureBlock[] = [
  {
    id: "matching",
    index: "01",
    title: "Personalised Matching",
    description:
      "Scholarships selected around your profile instead of a keyword you happened to type.",
    highlights: [
      "Weighted across degree, field and standing",
      "Ranked by fit, not by deadline pressure",
    ],
  },
  {
    id: "eligibility",
    index: "02",
    title: "Eligibility Intelligence",
    description:
      "Understand why an opportunity fits you — and where you fall short — before you invest time in it.",
    highlights: [
      "Plain-language requirement breakdown",
      "Missing criteria surfaced up front",
    ],
  },
  {
    id: "guidance",
    index: "03",
    title: "Application Guidance",
    description:
      "Know exactly what to prepare, in what order, before a deadline catches you unprepared.",
    highlights: [
      "Document checklists per opportunity",
      "Requirement-by-requirement guidance",
    ],
  },
  {
    id: "tracking",
    index: "04",
    title: "Application Tracking",
    description:
      "Keep every opportunity, deadline and document in one organised view.",
    highlights: [
      "One timeline across all applications",
      "Deadline and document status at a glance",
    ],
  },
];

export const journeyStages: readonly JourneyStage[] = [
  {
    id: "discover",
    label: "Discover",
    description:
      "Your profile is matched against open opportunities, so you see what genuinely fits.",
  },
  {
    id: "check",
    label: "Check",
    description:
      "Every requirement is laid out in plain language, including the ones you do not meet yet.",
  },
  {
    id: "prepare",
    label: "Prepare",
    description:
      "Build the documents and references this specific opportunity asks for.",
  },
  {
    id: "apply",
    label: "Apply",
    description:
      "Follow the real submission path with deadlines and instructions kept in one place.",
  },
  {
    id: "track",
    label: "Track",
    description:
      "See where each application stands, so nothing is left to memory.",
  },
];