/**
 * DEMO DATA — illustrative sample content only.
 *
 * ---------------------------------------------------------------------------
 * Nothing in this file describes a real programme:
 *
 *   - every organisation is fictional (e.g. "Illustrative University") or a
 *     clearly generic placeholder name, and no entry corresponds to a live
 *     scholarship,
 *   - match scores and breakdowns are authored, not computed by any engine,
 *   - `officialSource.verifiedUrl` is deliberately undefined everywhere, so the
 *     UI cannot render a link to a provider URL that was invented here,
 *   - `isDemo: true` on every record is the flag the UI uses to label
 *     illustrative content,
 *   - no figure here should be presented to users as a statistic.
 *
 * Phase 01's homepage fixtures are derived from these records by `toPreview`,
 * so the marketing page and the explorer can never disagree about an
 * opportunity. When the real service lands, delete this module and hydrate the
 * same `Scholarship` shape from the API.
 *
 * Phase 03 note: these records no longer carry a `match` field. Every score in
 * the product comes from `lib/matching`, evaluated against
 * `activeDemoProfile`, so there is exactly one place a match is computed.
 */

import { normaliseGpa } from "@/lib/matching/academic";
import { toPreviewFromMatch } from "@/lib/scholarships/preview";
import { activeDemoProfile } from "@/lib/demo/student-profiles";
import type {
  ApplicationStage,
  CommonMistake,
  FeatureBlock,
  FundingBenefit,
  JourneyStage,
  RequiredDocument,
  Scholarship,
  ScholarshipPreview,
  StudentProfilePreview,
} from "@/types/scholarship";

/* ==========================================================================
   Shared building blocks
   --------------------------------------------------------------------------
   The application journey and mistake list are genuinely common to every
   scholarship, so they are defined once and referenced. The real matching
   engine will supply per-opportunity overrides instead.
   ========================================================================== */

/** ScholarMatch-side preparation stages, identical across opportunities. */
export const SHARED_JOURNEY: readonly ApplicationStage[] = [
  {
    index: "01",
    title: "Check eligibility",
    description:
      "Confirm every requirement below against your own record before spending time on documents.",
  },
  {
    index: "02",
    title: "Prepare documents",
    description:
      "Request transcripts and references early — they depend on other people and take the longest.",
  },
  {
    index: "03",
    title: "Create application",
    description:
      "Register on the official provider portal. ScholarMatch never submits applications for you.",
  },
  {
    index: "04",
    title: "Complete forms",
    description: "Enter personal and academic details exactly as they appear on your official records.",
  },
  {
    index: "05",
    title: "Upload documents",
    description: "Check file format, size limits and naming rules before you upload anything.",
  },
  {
    index: "06",
    title: "Review",
    description: "Read every answer back. Most rejections are clerical rather than academic.",
  },
  {
    index: "07",
    title: "Submit",
    description: "Submit well before the deadline, then keep the confirmation reference.",
  },
];

export const SHARED_MISTAKES: readonly CommonMistake[] = [
  {
    id: "late-documents",
    title: "Leaving documents to the last week",
    consequence:
      "Transcripts and reference letters depend on other people. Request them first.",
  },
  {
    id: "wrong-format",
    title: "Uploading the wrong file format",
    consequence:
      "Portals frequently reject PDFs above a size limit or with photo quality below their scanner threshold.",
  },
  {
    id: "inconsistent-records",
    title: "Inconsistent academic information",
    consequence:
      "A mismatch between your form entries and your transcript is one of the most common rejection reasons.",
  },
  {
    id: "ignoring-restrictions",
    title: "Ignoring nationality restrictions",
    consequence:
      "Some awards are limited by citizenship or residency. Check this before anything else.",
  },
  {
    id: "missing-references",
    title: "Missing a required reference",
    consequence:
      "Two referees are often required. Confirm both have agreed before you submit.",
  },
  {
    id: "no-review",
    title: "Not reviewing the final application",
    consequence:
      "A single mistyped digit in a passport number can invalidate an otherwise strong application.",
  },
];

/** Tuition, stipend and insurance package shared by the "fully funded" awards. */
function fullyFundedBenefits(overrides: Partial<Record<string, FundingBenefit>> = {}) {
  const base: FundingBenefit[] = [
    {
      id: "tuition",
      label: "Full Tuition",
      value: "All tuition fees",
      note: "Covers the full published programme fee for the award period.",
    },
    {
      id: "stipend",
      label: "Monthly Stipend",
      value: "€1,200 / month",
      note: "Paid monthly for the duration of the programme.",
    },
    {
      id: "accommodation",
      label: "Accommodation",
      value: "University residence",
      note: "Allocated on application, subject to availability.",
    },
    {
      id: "insurance",
      label: "Health Insurance",
      value: "Full coverage",
      note: "Included for the award period.",
    },
  ];

  return base.map((benefit) => overrides[benefit.id] ?? benefit);
}

/** Core document set nearly every postgraduate application requires. */
function coreDocuments(
  overrides: Partial<Record<string, RequiredDocument>> = {},
): RequiredDocument[] {
  const base: RequiredDocument[] = [
    {
      id: "passport",
      label: "Passport / National ID",
      requirement: "required",
      note: "Usually needs to be valid for six months beyond the start date.",
    },
    {
      id: "transcripts",
      label: "Academic Transcripts",
      requirement: "required",
      note: "Issued copies, not informal screenshots.",
    },
    {
      id: "degree-certificate",
      label: "Degree Certificate",
      requirement: "required",
      note: "Or an official enrolment letter if you have not yet graduated.",
    },
    {
      id: "cv",
      label: "CV / Resume",
      requirement: "required",
    },
    {
      id: "sop",
      label: "Statement of Purpose",
      requirement: "required",
      note: "Usually word-counted. Check the limit before writing.",
    },
    {
      id: "references",
      label: "Recommendation Letters",
      requirement: "required",
      note: "Two academic referees, submitted directly where the portal allows.",
    },
    {
      id: "language",
      label: "English Proficiency Certificate",
      requirement: "conditional",
      note: "Required only if your earlier study was not in English.",
    },
  ];

  return base.map((document) => overrides[document.id] ?? document);
}

/* ==========================================================================
   Records
   ========================================================================== */

const RAW_SCHOLARSHIPS: readonly Scholarship[] = [
  {
    id: "demo-global-excellence",
    title: "Global Excellence Scholarship",
    organization: "Illustrative University",
    city: "Munich",
    country: "Germany",
    countryCode: "DE",
    degreeLevels: ["masters"],
    degree: "masters",
    degreeLabel: "Master's",
    fields: ["Computer Science", "Data Science", "Engineering"],
    funding: "fully_funded",
    fundingLabel: "Fully Funded",
    fundingSummary:
      "Full tuition, a monthly stipend, university accommodation and health insurance for the full programme.",
    benefits: fullyFundedBenefits(),
    deadline: "2026-11-15",
    postedAt: "2026-09-02",
    gpa: 3.5,
    gpaLabel: "3.5+ GPA",
    nationality: "Open to all nationalities",
    languageTests: ["ielts", "toefl"],
    languageRequirements: { ielts: 6.5, toefl: 90 },
    languageNote: "Waived if your previous three years of study were taught in English.",
    eligibility: [
      {
        id: "nationality",
        label: "Nationality",
        value: "Open to all nationalities",
        status: "meets",
      },
      {
        id: "degree",
        label: "Degree",
        value: "Bachelor's completed before the programme start date",
        status: "meets",
      },
      {
        id: "academic",
        label: "Academic",
        value: "Minimum 3.5 GPA or equivalent",
        status: "strong_match",
      },
      {
        id: "field",
        label: "Field",
        value: "Computer Science, Data Science or a related engineering discipline",
        status: "strong_match",
      },
      {
        id: "language",
        label: "Language",
        value: "IELTS 6.5+ or TOEFL 90+ unless a waiver applies",
        status: "review",
      },
      {
        id: "experience",
        label: "Experience",
        value: "Not required",
        status: "not_specified",
      },
    ],
    documents: coreDocuments(),
    howToApply: [
      {
        index: "01",
        title: "Visit the official scholarship portal",
        description:
          "Open the provider's own application portal and locate this scholarship cycle.",
      },
      {
        index: "02",
        title: "Create or sign into your account",
        description: "Registration requires a verified email address.",
      },
      {
        index: "03",
        title: "Complete your academic profile",
        description: "Enter your degree, GPA and institution exactly as your transcript states them.",
      },
      {
        index: "04",
        title: "Upload the required documents",
        description: "Transcripts, certificate, CV, statement of purpose and references.",
        caution: "Reference letters are often submitted by your referees directly, not by you.",
      },
      {
        index: "05",
        title: "Review every field",
        description: "Check your passport number and degree dates character by character.",
      },
      {
        index: "06",
        title: "Submit before the deadline",
        description: "Save your confirmation reference. ScholarMatch does not submit for you.",
      },
    ],
    journey: SHARED_JOURNEY,
    commonMistakes: SHARED_MISTAKES,
    tags: ["International Students", "No Application Fee", "STEM"],
    studyMode: "On campus, full time",
    duration: "24 months",
    applicationFee: "None",
    officialSource: { provider: "Illustrative University", isDemo: true },
  },

  {
    id: "demo-urban-systems",
    title: "Urban Systems & Mobility Grant",
    organization: "Illustrative Institute of Technology",
    city: "Delft",
    country: "Netherlands",
    countryCode: "NL",
    degreeLevels: ["masters"],
    degree: "masters",
    degreeLabel: "Master's",
    fields: ["Engineering", "Data Science"],
    funding: "tuition_and_partial",
    fundingLabel: "Tuition Coverage / Partial",
    fundingSummary:
      "Full tuition fee plus a partial living stipend. Travel and accommodation are not covered.",
    benefits: [
      {
        id: "tuition",
        label: "Full Tuition",
        value: "All tuition fees",
      },
      {
        id: "stipend",
        label: "Partial Stipend",
        value: "€600 / month",
        note: "A reduced living allowance, not a full subsistence amount.",
      },
      {
        id: "travel",
        label: "Travel Allowance",
        value: "Not included",
      },
    ],
    deadline: "2026-10-22",
    postedAt: "2026-08-24",
    gpa: 3,
    gpaLabel: "3.0+ GPA",
    nationality: "Open to all nationalities",
    languageTests: ["ielts", "toefl"],
    languageRequirements: { ielts: 6.5, toefl: 90 },
    eligibility: [
      { id: "nationality", label: "Nationality", value: "Open to all nationalities", status: "meets" },
      { id: "degree", label: "Degree", value: "Bachelor's in a technical discipline", status: "meets" },
      { id: "academic", label: "Academic", value: "Minimum 3.0 GPA", status: "strong_match" },
      {
        id: "field",
        label: "Field",
        value: "Civil, transport or systems engineering; or data science",
        status: "strong_match",
      },
      {
        id: "language",
        label: "Language",
        value: "IELTS 6.5+ or TOEFL 90+",
        status: "review",
      },
      {
        id: "portfolio",
        label: "Portfolio",
        value: "Two written case studies on prior work",
        status: "review",
        detail: "Two written case studies would strengthen this.",
      },
    ],
    documents: coreDocuments({
      portfolio: {
        id: "portfolio",
        label: "Portfolio of Prior Work",
        requirement: "required",
        note: "Two written case studies. PDF only.",
      },
    }),
    howToApply: [
      {
        index: "01",
        title: "Open the faculty application portal",
        description: "The grant is administered by the faculty, not the central university system.",
      },
      {
        index: "02",
        title: "Register an account",
        description: "Use an email address you check daily during the application window.",
      },
      {
        index: "03",
        title: "Complete the academic section",
        description: "Your transcript details must match your uploaded documents exactly.",
      },
      {
        index: "04",
        title: "Upload documents and your portfolio",
        description: "Include the two case studies in a single PDF.",
        caution: "The portal accepts a maximum file size that smaller PDFs will exceed.",
      },
      {
        index: "05",
        title: "Review and submit",
        description: "Confirm the reference section lists two referees who have agreed.",
      },
    ],
    journey: SHARED_JOURNEY,
    commonMistakes: SHARED_MISTAKES,
    tags: ["Engineering", "Urban Planning", "No Application Fee"],
    studyMode: "On campus, full time",
    duration: "24 months",
    applicationFee: "None",
    officialSource: { provider: "Illustrative Institute of Technology", isDemo: true },
  },

  {
    id: "demo-clinical-research",
    title: "Clinical Research Fellowship",
    organization: "Illustrative Health Sciences Centre",
    city: "Manchester",
    country: "United Kingdom",
    countryCode: "GB",
    degreeLevels: ["doctorate"],
    degree: "doctorate",
    degreeLabel: "Doctorate",
    fields: ["Medicine", "Social Sciences"],
    funding: "fully_funded",
    fundingLabel: "Fully Funded",
    fundingSummary:
      "Full tuition plus an indexed stipend for three years, including conference travel allowance.",
    benefits: fullyFundedBenefits({
      stipend: {
        id: "stipend",
        label: "Monthly Stipend",
        value: "£2,100 / month",
        note: "Indexed annually and reviewed each October.",
      },
      travel: {
        id: "travel",
        label: "Travel Allowance",
        value: "£1,500 per year",
        note: "Toward conference attendance.",
      },
    }),
    deadline: "2026-12-10",
    postedAt: "2026-07-30",
    gpa: 3.5,
    gpaLabel: "3.5+ GPA",
    nationality: "Open to all nationalities",
    // Intentionally empty: this route admits clinical MBBS holders whose prior
    // study was already in English, so no proficiency test is required. This is
    // the record the "No language test listed" filter resolves to.
    languageTests: [],
    languageNote: "No language test required for applicants who hold a clinical MBBS.",
    eligibility: [
      { id: "nationality", label: "Nationality", value: "Open to all nationalities", status: "meets" },
      {
        id: "degree",
        label: "Degree",
        value: "Master's completed, or a clinical MBBS with research experience",
        status: "review",
        detail: "Doctorate entry requires a prior master's, or equivalent clinical experience.",
      },
      { id: "academic", label: "Academic", value: "Minimum 3.5 GPA", status: "strong_match" },
      {
        id: "field",
        label: "Field",
        value: "Medicine, public health or a related health science",
        status: "meets",
      },
      {
        id: "experience",
        label: "Experience",
        value: "Research experience strongly expected",
        status: "review",
      },
      {
        id: "language",
        label: "Language",
        value: "No test required for clinical MBBS holders",
        status: "meets",
        detail: "Applicants without a clinical MBBS need an IELTS 7.0+ or TOEFL 100+ result.",
      },
    ],
    documents: coreDocuments({
      references: {
        id: "references",
        label: "Recommendation Letters",
        requirement: "required",
        note: "Two referees, at least one from a clinical setting.",
      },
      sop: {
        id: "sop",
        label: "Research Proposal",
        requirement: "required",
        note: "Maximum 2,000 words, including methodology.",
      },
    }),
    howToApply: [
      {
        index: "01",
        title: "Check the fellowship call",
        description: "The call opens annually and lists the specific research themes for that year.",
      },
      {
        index: "02",
        title: "Register on the research portal",
        description: "You will need an ORCID iD, which the portal will request during registration.",
      },
      {
        index: "03",
        title: "Name your proposed supervisor",
        description: "Applications without a named supervisor are not considered.",
      },
      {
        index: "04",
        title: "Submit your research proposal",
        description: "2,000 words maximum, addressing the methodology and timeline.",
        caution: "Proposals over the word limit are returned without being marked.",
      },
      {
        index: "05",
        title: "Arrange clinical referees",
        description: "One referee must be able to speak to your clinical experience.",
      },
      {
        index: "06",
        title: "Review and submit",
        description: "Attach a language certificate only if you do not hold a clinical MBBS.",
      },
    ],
    journey: SHARED_JOURNEY,
    commonMistakes: SHARED_MISTAKES,
    tags: ["Medicine", "Research", "Stipend", "International Students"],
    studyMode: "On campus with clinical placement",
    duration: "36 months",
    applicationFee: "None",
    officialSource: { provider: "Illustrative Health Sciences Centre", isDemo: true },
  },

  {
    id: "demo-ai-research-fellowship",
    title: "Artificial Intelligence Research Fellowship",
    organization: "Illustrative Institute for Advanced Study",
    city: "Toronto",
    country: "Canada",
    countryCode: "CA",
    degreeLevels: ["doctorate", "masters"],
    degree: "doctorate",
    degreeLabel: "Doctorate",
    fields: ["Artificial Intelligence", "Computer Science", "Data Science"],
    funding: "fully_funded",
    fundingLabel: "Fully Funded",
    fundingSummary:
      "Full funding including tuition, stipend, computing resources and one year of paid research leave.",
    benefits: fullyFundedBenefits({
      stipend: {
        id: "stipend",
        label: "Monthly Stipend",
        value: "CA$3,400 / month",
      },
      research: {
        id: "research",
        label: "Research Support",
        value: "CA$12,000 research budget",
        note: "For compute, conference travel and dataset access.",
      },
    }),
    deadline: "2026-11-30",
    postedAt: "2026-09-18",
    gpa: 3.7,
    gpaLabel: "3.7+ GPA",
    nationality: "Open to all nationalities",
    languageTests: ["ielts", "toefl"],
    languageRequirements: { ielts: 7.5, toefl: 105 },
    languageNote: "Waived where your doctoral application was submitted in English.",
    eligibility: [
      { id: "nationality", label: "Nationality", value: "Open to all nationalities", status: "meets" },
      {
        id: "degree",
        label: "Degree",
        value: "Master's completed, or a direct-entry bachelor's with honours",
        status: "meets",
      },
      { id: "academic", label: "Academic", value: "Minimum 3.7 GPA or equivalent", status: "meets" },
      {
        id: "field",
        label: "Field",
        value: "Machine learning, NLP, computer vision or adjacent areas",
        status: "strong_match",
      },
      {
        id: "experience",
        label: "Experience",
        value: "Prior research output expected",
        status: "strong_match",
      },
      {
        id: "language",
        label: "Language",
        value: "IELTS 7.5+ or TOEFL 105+",
        status: "review",
      },
    ],
    documents: coreDocuments({
      sop: {
        id: "sop",
        label: "Research Statement",
        requirement: "required",
        note: "Three pages, describing prior work and the proposed direction.",
      },
      publications: {
        id: "publications",
        label: "Publications or Preprints",
        requirement: "conditional",
        note: "Required where you have prior research output.",
      },
      references: {
        id: "references",
        label: "Recommendation Letters",
        requirement: "required",
        note: "Three referees, at least two from research environments.",
      },
    }),
    howToApply: [
      {
        index: "01",
        title: "Review the research theme list",
        description: "Each cycle funds a small number of named themes. Apply only to a listed theme.",
      },
      {
        index: "02",
        title: "Create a portal account",
        description: "The portal integrates with ORCID and will prompt for your iD.",
      },
      {
        index: "03",
        title: "Name two referees",
        description: "Three referees are required; at least two must be from research environments.",
      },
      {
        index: "04",
        title: "Upload your research statement",
        description: "Three pages maximum, and it is enforced by the portal.",
        caution: "Applications are scored blind, so do not include identifying detail.",
      },
      {
        index: "05",
        title: "Confirm your language certificate",
        description: "It must be dated within the accepted validity window.",
      },
      {
        index: "06",
        title: "Submit and retain the reference",
        description: "Keep the confirmation number — referees contact you through it.",
      },
    ],
    journey: SHARED_JOURNEY,
    commonMistakes: SHARED_MISTAKES,
    tags: ["Artificial Intelligence", "Research", "STEM", "No Application Fee"],
    studyMode: "On campus, full time",
    duration: "48 months",
    applicationFee: "CA$25",
    officialSource: { provider: "Illustrative Institute for Advanced Study", isDemo: true },
  },

  {
    id: "demo-sustainable-design",
    title: "Sustainable Design Scholarship",
    organization: "Illustrative College of Arts",
    city: "Lund",
    country: "Sweden",
    countryCode: "SE",
    degreeLevels: ["bachelors", "masters"],
    degree: "bachelors",
    degreeLabel: "Bachelor's",
    fields: ["Social Sciences", "Business"],
    funding: "tuition_coverage",
    fundingLabel: "Tuition Coverage",
    fundingSummary:
      "Covers tuition fees for the programme. Living costs are the student's responsibility.",
    benefits: [
      {
        id: "tuition",
        label: "Tuition Coverage",
        value: "All tuition fees",
        note: "Paid directly to the institution.",
      },
      {
        id: "accommodation",
        label: "Accommodation",
        value: "Priority allocation",
        note: "Priority rather than a guarantee — apply early.",
      },
    ],
    deadline: "2026-11-05",
    postedAt: "2026-08-11",
    gpa: 3,
    gpaLabel: "3.0+ GPA",
    nationality: "Open to all nationalities",
    languageTests: ["ielts", "toefl", "duolingo"],
    languageRequirements: { ielts: 6, toefl: 80, duolingo: 110 },
    languageNote: "Duolingo English Test accepted for this award.",
    eligibility: [
      { id: "nationality", label: "Nationality", value: "Open to all nationalities", status: "meets" },
      {
        id: "degree",
        label: "Degree",
        value: "Upper-secondary completion",
        status: "meets",
      },
      { id: "academic", label: "Academic", value: "Minimum 3.0 GPA", status: "strong_match" },
      {
        id: "field",
        label: "Field",
        value: "Design, sustainability, development studies or business",
        status: "review",
      },
      {
        id: "language",
        label: "Language",
        value: "IELTS 6.0+, TOEFL 80+ or Duolingo 110+",
        status: "meets",
      },
      {
        id: "portfolio",
        label: "Portfolio",
        value: "Visual portfolio for design-track applicants",
        status: "not_specified",
      },
    ],
    documents: coreDocuments({
      degree: {
        id: "degree-certificate",
        label: "Upper Secondary Certificate",
        requirement: "required",
        note: "Or an equivalent qualification from your home country.",
      },
      sop: {
        id: "sop",
        label: "Personal Statement",
        requirement: "required",
        note: "400 words on why sustainable practice matters to you.",
      },
      language: {
        id: "language",
        label: "English Proficiency Certificate",
        requirement: "optional",
        note: "Optional if your upper-secondary instruction was in English.",
      },
    }),
    howToApply: [
      {
        index: "01",
        title: "Read the scholarship criteria",
        description: "The award is limited to specific programme tracks listed on the call page.",
      },
      {
        index: "02",
        title: "Apply through the national portal",
        description: "Applications route through the national service, not the institution directly.",
      },
      {
        index: "03",
        title: "Select your programme track",
        description: "Choosing the wrong track is the most common reason for an invalid application.",
        caution: "You can only submit one track per cycle.",
      },
      {
        index: "04",
        title: "Write the personal statement",
        description: "400 words. The panel reads every one, so specificity matters more than polish.",
      },
      {
        index: "05",
        title: "Submit before the national deadline",
        description: "The portal closes at a fixed time and does not accept late applications.",
      },
    ],
    journey: SHARED_JOURNEY,
    commonMistakes: SHARED_MISTAKES,
    tags: ["Sustainability", "Design", "Tuition Coverage"],
    studyMode: "On campus, full time",
    duration: "36 months",
    applicationFee: "None",
    officialSource: { provider: "Illustrative College of Arts", isDemo: true },
  },

  {
    id: "demo-medicine-scholarship",
    title: "Medicine & Health Policy Scholarship",
    organization: "Illustrative School of Public Health",
    city: "Istanbul",
    country: "Türkiye",
    countryCode: "TR",
    degreeLevels: ["masters"],
    degree: "masters",
    degreeLabel: "Master's",
    fields: ["Medicine", "Social Sciences"],
    funding: "partial",
    fundingLabel: "Partial Funding",
    fundingSummary:
      "Covers 50% of tuition and provides a small monthly stipend. Living costs remain your responsibility.",
    benefits: [
      { id: "tuition", label: "Tuition Coverage", value: "50% of tuition fees" },
      {
        id: "stipend",
        label: "Monthly Stipend",
        value: "₺9,000 / month",
        note: "A modest allowance intended for travel to campus.",
      },
    ],
    deadline: "2027-01-20",
    postedAt: "2026-06-15",
    gpa: 3,
    gpaLabel: "3.0+ GPA",
    nationality: "Open to all nationalities",
    languageTests: ["ielts", "toefl"],
    languageRequirements: { ielts: 6, toefl: 75 },
    languageNote: "English-taught programme; a waiver applies for degrees taught in English.",
    eligibility: [
      { id: "nationality", label: "Nationality", value: "Open to all nationalities", status: "meets" },
      {
        id: "degree",
        label: "Degree",
        value: "Bachelor's in medicine, health sciences or a related field",
        status: "meets",
      },
      { id: "academic", label: "Academic", value: "Minimum 3.0 GPA", status: "strong_match" },
      {
        id: "field",
        label: "Field",
        value: "Medicine, health policy or health economics",
        status: "meets",
      },
      {
        id: "language",
        label: "Language",
        value: "IELTS 6.0+ or TOEFL 75+",
        status: "meets",
      },
    ],
    documents: coreDocuments({
      degree: {
        id: "degree-certificate",
        label: "Degree Certificate",
        requirement: "required",
        note: "Or an enrolment letter if still completing your degree.",
      },
    }),
    howToApply: [
      {
        index: "01",
        title: "Check the programme language requirement",
        description: "The programme is taught in English with Turkish support available.",
      },
      {
        index: "02",
        title: "Register through the international office",
        description: "Scholarship applications route through the international office portal.",
      },
      {
        index: "03",
        title: "Complete the health sciences section",
        description: "This section is specific to the programme and not present on other forms.",
      },
      {
        index: "04",
        title: "Upload documents",
        description: "Transcripts, certificate, CV and statement of purpose.",
      },
      {
        index: "05",
        title: "Submit and await the funding decision",
        description: "Funding decisions are confirmed separately from admission.",
      },
    ],
    journey: SHARED_JOURNEY,
    commonMistakes: SHARED_MISTAKES,
    tags: ["Medicine", "Health Policy", "Partial Funding"],
    studyMode: "On campus, full time",
    duration: "24 months",
    applicationFee: "None",
    officialSource: { provider: "Illustrative School of Public Health", isDemo: true },
  },

  {
    id: "demo-business-leadership",
    title: "Business Leadership Programme Grant",
    organization: "Illustrative Business School",
    city: "Paris",
    country: "France",
    countryCode: "FR",
    degreeLevels: ["masters"],
    degree: "masters",
    degreeLabel: "Master's",
    fields: ["Business"],
    funding: "tuition_and_partial",
    fundingLabel: "Tuition Coverage / Partial",
    fundingSummary:
      "Covers 70% of tuition and provides a placement allowance. Living costs are not covered.",
    benefits: [
      { id: "tuition", label: "Tuition Coverage", value: "70% of tuition fees" },
      {
        id: "research",
        label: "Placement Allowance",
        value: "€2,000",
        note: "Toward a compulsory internship placement.",
      },
    ],
    deadline: "2026-12-01",
    postedAt: "2026-08-05",
    gpa: 3,
    gpaLabel: "3.0+ GPA",
    nationality: "Open to all nationalities",
    languageTests: ["ielts", "toefl", "duolingo"],
    languageRequirements: { ielts: 6.5, toefl: 90 },
    eligibility: [
      { id: "nationality", label: "Nationality", value: "Open to all nationalities", status: "meets" },
      {
        id: "degree",
        label: "Degree",
        value: "Bachelor's degree with at least one year of work experience",
        status: "review",
        detail: "One year of relevant work experience is expected.",
      },
      { id: "academic", label: "Academic", value: "Minimum 3.0 GPA", status: "strong_match" },
      {
        id: "field",
        label: "Field",
        value: "Business, management, economics or finance",
        status: "review",
      },
      {
        id: "language",
        label: "Language",
        value: "IELTS 6.5+ or TOEFL 90+",
        status: "meets",
      },
      {
        id: "experience",
        label: "Experience",
        value: "One year of professional work experience",
        status: "review",
      },
    ],
    documents: coreDocuments({
      sop: {
        id: "sop",
        label: "Leadership Statement",
        requirement: "required",
        note: "Address a leadership moment you influenced, and its outcome.",
      },
    }),
    howToApply: [
      {
        index: "01",
        title: "Review the programme structure",
        description: "The compulsory internship determines part of your schedule.",
      },
      {
        index: "02",
        title: "Create your application account",
        description: "Registration is separate from the admissions application.",
      },
      {
        index: "03",
        title: "Document your work experience",
        description: "Include dates and responsibilities, as the cohort review panel reads them.",
      },
      {
        index: "04",
        title: "Write the leadership statement",
        description: "One clear example with a measurable outcome works better than several vague ones.",
      },
      {
        index: "05",
        title: "Submit before the funding deadline",
        description: "Funding and admission decisions are released on different dates.",
      },
    ],
    journey: SHARED_JOURNEY,
    commonMistakes: SHARED_MISTAKES,
    tags: ["Business", "Partial Funding", "Leadership"],
    studyMode: "On campus with placement",
    duration: "18 months",
    applicationFee: "€120",
    officialSource: { provider: "Illustrative Business School", isDemo: true },
  },

  {
    id: "demo-japan-graduate",
    title: "International Graduate Scholarship",
    organization: "Illustrative National Institute of Technology",
    city: "Kyoto",
    country: "Japan",
    countryCode: "JP",
    degreeLevels: ["masters", "doctorate"],
    degree: "masters",
    degreeLabel: "Master's",
    fields: ["Engineering", "Computer Science", "Artificial Intelligence"],
    funding: "fully_funded",
    fundingLabel: "Fully Funded",
    fundingSummary:
      "Full tuition waiver, monthly stipend, dormitory accommodation and airfare contribution.",
    benefits: fullyFundedBenefits({
      stipend: {
        id: "stipend",
        label: "Monthly Stipend",
        value: "¥110,000 / month",
        note: "Standard award rate for research students.",
      },
      accommodation: {
        id: "accommodation",
        label: "Accommodation",
        value: "University dormitory",
        note: "Guaranteed for the first year, subject to renewal.",
      },
      travel: {
        id: "travel",
        label: "Travel Allowance",
        value: "Round-trip airfare",
        note: "Contribution toward economy airfare from your home country.",
      },
    }),
    deadline: "2026-11-08",
    postedAt: "2026-07-14",
    gpa: 3,
    gpaLabel: "3.0+ GPA",
    nationality: "Open to all nationalities",
    languageTests: ["ielts", "toefl"],
    languageRequirements: { ielts: 6, toefl: 80 },
    languageNote: "Japanese proficiency may be required for some research groups.",
    eligibility: [
      { id: "nationality", label: "Nationality", value: "Open to all nationalities", status: "meets" },
      { id: "degree", label: "Degree", value: "Bachelor's degree by the enrolment date", status: "meets" },
      { id: "academic", label: "Academic", value: "Minimum 3.0 GPA", status: "strong_match" },
      {
        id: "field",
        label: "Field",
        value: "Engineering, computer science or a related discipline",
        status: "strong_match",
      },
      {
        id: "language",
        label: "Language",
        value: "IELTS 6.0+ or TOEFL 80+; Japanese may be required",
        status: "review",
      },
      {
        id: "research",
        label: "Research Plan",
        value: "A research plan agreed with a supervising professor",
        status: "review",
      },
    ],
    documents: coreDocuments({
      sop: {
        id: "sop",
        label: "Research Plan",
        requirement: "required",
        note: "Must be agreed with your supervising professor before submission.",
      },
      language: {
        id: "language",
        label: "English Proficiency Certificate",
        requirement: "required",
        note: "Required even where your prior study was in English.",
      },
    }),
    howToApply: [
      {
        index: "01",
        title: "Secure a supervising professor",
        description: "Contact a potential supervisor before anything else. Applications without one are rejected.",
        caution: "Professors are contacted by the university, so approach them directly first.",
      },
      {
        index: "02",
        title: "Register on the national scholarship portal",
        description: "The government portal handles the application; the university endorses it later.",
      },
      {
        index: "03",
        title: "Submit your research plan",
        description: "In the format requested by your supervisor.",
      },
      {
        index: "04",
        title: "Upload documents",
        description: "Including your certificate of graduation and English test results.",
      },
      {
        index: "05",
        title: "Await university endorsement",
        description: "The institute must endorse your application before it is considered.",
      },
    ],
    journey: SHARED_JOURNEY,
    commonMistakes: SHARED_MISTAKES,
    tags: ["Engineering", "Fully Funded", "International Students", "Research"],
    studyMode: "On campus, full time",
    duration: "24 months",
    applicationFee: "None",
    officialSource: { provider: "Illustrative National Institute of Technology", isDemo: true },
  },

  {
    id: "demo-data-science-fellowship",
    title: "Data Science Fellowship",
    organization: "Illustrative University",
    city: "Munich",
    country: "Germany",
    countryCode: "DE",
    degreeLevels: ["masters"],
    degree: "masters",
    degreeLabel: "Master's",
    fields: ["Data Science", "Artificial Intelligence"],
    funding: "stipend",
    fundingLabel: "Stipend",
    fundingSummary:
      "A monthly stipend only. Tuition is charged at the standard rate and is not waived.",
    benefits: [
      {
        id: "stipend",
        label: "Monthly Stipend",
        value: "€1,400 / month",
        note: "Paid for twelve months, extendable by assessment.",
      },
      { id: "tuition", label: "Tuition", value: "Not covered", note: "Charged at standard rate." },
    ],
    deadline: "2026-10-14",
    postedAt: "2026-09-25",
    gpa: 3.5,
    gpaLabel: "3.5+ GPA",
    nationality: "Open to all nationalities",
    languageTests: ["toefl"],
    languageRequirements: { toefl: 95 },
    languageNote: "TOEFL accepted for this award; IELTS scores are not accepted.",
    eligibility: [
      { id: "nationality", label: "Nationality", value: "Open to all nationalities", status: "meets" },
      { id: "degree", label: "Degree", value: "Bachelor's with a quantitative degree", status: "meets" },
      { id: "academic", label: "Academic", value: "Minimum 3.5 GPA", status: "strong_match" },
      {
        id: "field",
        label: "Field",
        value: "Data science, statistics or machine learning",
        status: "strong_match",
      },
      {
        id: "language",
        label: "Language",
        value: "TOEFL 95+ (IELTS not accepted)",
        status: "review",
        detail: "This award accepts TOEFL only.",
      },
    ],
    documents: coreDocuments({
      language: {
        id: "language",
        label: "TOEFL Score Report",
        requirement: "required",
        note: "An IELTS certificate is not accepted for this award.",
      },
    }),
    howToApply: [
      {
        index: "01",
        title: "Confirm the test requirement",
        description: "Only TOEFL is accepted. An IELTS certificate will not satisfy this award.",
      },
      {
        index: "02",
        title: "Create your applicant account",
        description: "Standard registration on the faculty system.",
      },
      {
        index: "03",
        title: "Select the fellowship track",
        description: "It is listed separately from the master's programme application.",
      },
      {
        index: "04",
        title: "Upload your TOEFL report",
        description: "Direct upload is not available; a code must be sent to the provider.",
        caution: "Allow three days for score verification.",
      },
      {
        index: "05",
        title: "Submit before the short deadline",
        description: "This window is unusually short compared with other awards.",
      },
    ],
    journey: SHARED_JOURNEY,
    commonMistakes: SHARED_MISTAKES,
    tags: ["Data Science", "Stipend", "STEM", "International Students"],
    studyMode: "On campus, full time",
    duration: "12 months",
    applicationFee: "None",
    officialSource: { provider: "Illustrative University", isDemo: true },
  },

  {
    id: "demo-social-impact",
    title: "Social Impact & Development Grant",
    organization: "Illustrative Foundation for Public Good",
    city: "Toronto",
    country: "Canada",
    countryCode: "CA",
    degreeLevels: ["masters"],
    degree: "masters",
    degreeLabel: "Master's",
    fields: ["Social Sciences"],
    funding: "partial",
    fundingLabel: "Partial Funding",
    fundingSummary:
      "A one-off grant toward tuition and travel to a field placement. No stipend is provided.",
    benefits: [
      {
        id: "tuition",
        label: "Tuition Contribution",
        value: "CA$5,000 one-off",
        note: "Paid directly to the institution on your behalf.",
      },
      {
        id: "travel",
        label: "Travel Allowance",
        value: "CA$1,200",
        note: "Toward travel for the required field placement.",
      },
    ],
    deadline: "2027-02-15",
    postedAt: "2026-05-20",
    gpa: 2.5,
    gpaLabel: "2.5+ GPA",
    nationality: "Open to students from low-income backgrounds",
    languageTests: ["ielts", "toefl", "duolingo"],
    languageRequirements: { ielts: 6, toefl: 75, duolingo: 100 },
    eligibility: [
      {
        id: "nationality",
        label: "Nationality",
        value: "Open to all nationalities; financial means are assessed",
        status: "review",
        detail: "Financial circumstances are assessed as part of the application.",
      },
      {
        id: "degree",
        label: "Degree",
        value: "Bachelor's in a social science or development discipline",
        status: "meets",
      },
      { id: "academic", label: "Academic", value: "Minimum 2.5 GPA", status: "meets" },
      {
        id: "field",
        label: "Field",
        value: "Development studies, sociology, economics or public policy",
        status: "meets",
      },
      {
        id: "language",
        label: "Language",
        value: "IELTS 6.0+, TOEFL 75+ or Duolingo 100+",
        status: "meets",
      },
      {
        id: "income",
        label: "Financial Circumstances",
        value: "Evidence of financial need",
        status: "review",
      },
    ],
    documents: coreDocuments({
      sop: {
        id: "sop",
        label: "Impact Statement",
        requirement: "required",
        note: "Describe work you have done that affected other people, and how.",
      },
      income: {
        id: "income",
        label: "Financial Circumstances Evidence",
        requirement: "required",
        note: "Submitted confidentially and reviewed separately from your academic file.",
      },
    }),
    howToApply: [
      {
        index: "01",
        title: "Read the eligibility statement",
        description: "The award assesses financial circumstances as well as academic record.",
      },
      {
        index: "02",
        title: "Register with the foundation",
        description: "Separate from any university application you may also submit.",
      },
      {
        index: "03",
        title: "Submit the impact statement",
        description: "Concrete outcomes matter more than stated intentions.",
      },
      {
        index: "04",
        title: "Provide financial evidence",
        description: "Handled confidentially by a separate panel.",
        caution: "Do not include this in a shared application folder.",
      },
      {
        index: "05",
        title: "Submit before the foundation deadline",
        description: "This cycle closes later than most university deadlines.",
      },
    ],
    journey: SHARED_JOURNEY,
    commonMistakes: SHARED_MISTAKES,
    tags: ["Social Sciences", "Development", "Partial Funding", "Need-Based"],
    studyMode: "On campus with field placement",
    duration: "24 months",
    applicationFee: "None",
    officialSource: { provider: "Illustrative Foundation for Public Good", isDemo: true },
  },

  {
    id: "demo-doctoral-consortium",
    title: "Doctoral Consortium Placement",
    organization: "Illustrative European Research Consortium",
    city: "Uppsala",
    country: "Sweden",
    countryCode: "SE",
    degreeLevels: ["doctorate"],
    degree: "doctorate",
    degreeLabel: "Doctorate",
    fields: ["Computer Science", "Artificial Intelligence", "Data Science"],
    funding: "fully_funded",
    fundingLabel: "Fully Funded",
    fundingSummary:
      "Full salary, relocation support, family allowance and funded research travel across four host institutions.",
    benefits: fullyFundedBenefits({
      stipend: {
        id: "stipend",
        label: "Monthly Salary",
        value: "€3,600 / month",
        note: "Employment salary, not a scholarship, with full social insurance.",
      },
      accommodation: {
        id: "accommodation",
        label: "Relocation Support",
        value: "€4,000",
        note: "Toward moving costs to the host city.",
      },
      insurance: {
        id: "insurance",
        label: "Family Allowance",
        value: "Monthly supplement",
        note: "Additional allowance where dependants relocate with you.",
      },
    }),
    deadline: "2026-12-15",
    postedAt: "2026-09-08",
    gpa: 3.5,
    gpaLabel: "3.5+ GPA",
    nationality: "Open to all nationalities; mobility rule applies",
    languageTests: ["ielts", "toefl"],
    languageRequirements: { ielts: 6.5, toefl: 90 },
    eligibility: [
      {
        id: "nationality",
        label: "Nationality",
        value: "Open to all nationalities; the EU mobility rule applies",
        status: "review",
        detail: "Time spent abroad in the preceding three years is assessed.",
      },
      {
        id: "degree",
        label: "Degree",
        value: "Master's completed, or enrolment in a doctoral programme",
        status: "meets",
      },
      { id: "academic", label: "Academic", value: "Minimum 3.5 GPA", status: "strong_match" },
      {
        id: "field",
        label: "Field",
        value: "Computer science, AI or data science",
        status: "strong_match",
      },
      {
        id: "mobility",
        label: "Mobility Rule",
        value: "Limited time outside the participating countries in the last three years",
        status: "review",
        detail: "Mobility history is checked and can affect eligibility.",
      },
      {
        id: "language",
        label: "Language",
        value: "IELTS 6.5+ or TOEFL 90+",
        status: "meets",
      },
    ],
    documents: coreDocuments({
      sop: {
        id: "sop",
        label: "Research Proposal",
        requirement: "required",
        note: "Four pages, and you must name at least two host supervisors.",
      },
      references: {
        id: "references",
        label: "Recommendation Letters",
        requirement: "required",
        note: "Three referees, at least one from outside your current institution.",
      },
      publications: {
        id: "publications",
        label: "Publications",
        requirement: "conditional",
        note: "Where you have prior publications.",
      },
    }),
    howToApply: [
      {
        index: "01",
        title: "Check the mobility rule first",
        description: "Confirm your time abroad in the last three years before investing effort.",
        caution: "The mobility rule excludes more applicants than any other requirement.",
      },
      {
        index: "02",
        title: "Choose two host supervisors",
        description: "Applications must be aligned with at least two of the four host institutions.",
      },
      {
        index: "03",
        title: "Write the research proposal",
        description: "Four pages maximum, structured as a standalone document.",
      },
      {
        index: "04",
        title: "Arrange three references",
        description: "One must be external to your current institution.",
      },
      {
        index: "05",
        title: "Submit through the consortium portal",
        description: "A single application is routed to all four institutions.",
      },
    ],
    journey: SHARED_JOURNEY,
    commonMistakes: SHARED_MISTAKES,
    tags: ["Artificial Intelligence", "Research", "Fully Funded", "STEM"],
    studyMode: "Relocating, full time",
    duration: "48 months",
    applicationFee: "None",
    officialSource: { provider: "Illustrative European Research Consortium", isDemo: true },
  },

  {
    id: "demo-australia-postgraduate",
    title: "Postgraduate Research Award",
    organization: "Illustrative Institute of Technology",
    city: "Sydney",
    country: "Australia",
    countryCode: "AU",
    degreeLevels: ["masters", "doctorate"],
    degree: "masters",
    degreeLabel: "Master's",
    fields: ["Data Science", "Social Sciences"],
    funding: "stipend",
    fundingLabel: "Stipend",
    fundingSummary:
      "A fortnightly stipend for the research component only, with a separate fee offset each semester.",
    benefits: [
      {
        id: "stipend",
        label: "Fortnightly Stipend",
        value: "A$700 / fortnight",
        note: "Paid during the research component of the programme.",
      },
      {
        id: "tuition",
        label: "Fee Offset",
        value: "Fee offset each semester",
        note: "Applied automatically once the award is confirmed.",
      },
    ],
    deadline: "2026-10-27",
    postedAt: "2026-09-12",
    gpa: 3,
    gpaLabel: "3.0+ GPA",
    nationality: "Open to international and domestic students",
    languageTests: ["ielts", "toefl", "duolingo"],
    eligibility: [
      {
        id: "nationality",
        label: "Nationality",
        value: "Open to international and domestic students",
        status: "meets",
      },
      { id: "degree", label: "Degree", value: "Bachelor's with honours or equivalent", status: "meets" },
      { id: "academic", label: "Academic", value: "Minimum 3.0 GPA, or H2A equivalent", status: "strong_match" },
      {
        id: "field",
        label: "Field",
        value: "Data science or a quantitative social science",
        status: "strong_match",
      },
      {
        id: "enrolment",
        label: "Enrolment",
        value: "Offered a place in a research programme",
        status: "review",
        detail: "An unconditional offer is usually required before applying.",
      },
    ],
    documents: coreDocuments({
      sop: {
        id: "sop",
        label: "Research Statement",
        requirement: "required",
        note: "Maximum two pages.",
      },
      language: {
        id: "language",
        label: "English Proficiency Certificate",
        requirement: "optional",
        note: "Not required where your prior study was entirely in English.",
      },
    }),
    howToApply: [
      {
        index: "01",
        title: "Accept your offer",
        description: "You need an accepted offer before the award can be applied for.",
      },
      {
        index: "02",
        title: "Accept the offer by the published date",
        description: "Acceptance dates are earlier than the scholarship deadline.",
        caution: "Missing the offer acceptance date forfeits the award regardless of scholarship deadline.",
      },
      {
        index: "03",
        title: "Submit the research statement",
        description: "Two pages, describing your intended research direction.",
      },
      {
        index: "04",
        title: "Confirm your enrolment details",
        description: "The award is tied to a specific programme code.",
      },
      {
        index: "05",
        title: "Submit the award application",
        description: "Before the closing date on the awards page.",
      },
    ],
    journey: SHARED_JOURNEY,
    commonMistakes: SHARED_MISTAKES,
    tags: ["Data Science", "Stipend", "Research", "International Students"],
    studyMode: "On campus with research component",
    duration: "24 months",
    applicationFee: "A$100",
    officialSource: { provider: "Illustrative Institute of Technology", isDemo: true },
  },
];

/* ==========================================================================
   Exports
   ========================================================================== */

/** The full Phase 02 collection. */
export const scholarships: readonly Scholarship[] = RAW_SCHOLARSHIPS;

/**
 * Phase 01 fixtures, derived so the marketing page cannot drift from the
 * explorer. The record ids below match the originals exactly.
 *
 * Phase 03 routes each preview through the matching engine against
 * `activeDemoProfile`, so the marketing surfaces show the same scores the
 * explorer and detail pages show for the same records.
 */
export const featuredScholarship: ScholarshipPreview = toPreviewFromMatch(
  requireRecord(RAW_SCHOLARSHIPS[0]),
  activeDemoProfile,
);

/** The two additional cards shown in the homepage showcase. */
export const additionalScholarships: readonly ScholarshipPreview[] = [
  toPreviewFromMatch(requireRecord(RAW_SCHOLARSHIPS[1]), activeDemoProfile),
  toPreviewFromMatch(requireRecord(RAW_SCHOLARSHIPS[2]), activeDemoProfile),
];

/**
 * Fictional student used to illustrate the matching concept.
 *
 * `academicScore` is no longer hand-written: it is derived from the same profile
 * the engine scores with, so the number in the hero cannot drift from the
 * rankings on the other pages.
 */
export const demoProfile: StudentProfilePreview = {
  displayName: "A. Rahman",
  degreeLabel: "Master's candidate",
  fieldLabel: "Data Science",
  institutionLabel: "Illustrative University",
  languages: ["English", "German (B2)"],
  academicScore: normaliseGpa(activeDemoProfile.academic?.gpa) ?? 0,
};

/**
 * Index-safe accessor for the homepage fixtures.
 *
 * `RAW_SCHOLARSHIPS[i]` is typed as possibly undefined under `noUncheckedIndexedAccess`,
 * and these indexes are fixed and asserted by the record-count check in
 * `scripts/verify-explorer.ts`. Throwing here turns a silent bad preview into a
 * loud build failure.
 */
function requireRecord(scholarship: Scholarship | undefined): Scholarship {
  if (scholarship === undefined) {
    throw new Error("Demo record missing: RAW_SCHOLARSHIPS is shorter than the homepage fixtures expect.");
  }
  return scholarship;
}

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
