/**
 * Phase 05 — Real scholarship intelligence (raw authored records).
 *
 * Every value here is transcribed from official provider pages verified in this
 * phase. Records use explicit deadline and GPA shapes, and never invent a
 * deadline, GPA floor or language threshold the provider does not publish.
 */

import type {
  DegreeLevel,
  FundingTier,
  LanguageTest,
  Scholarship,
} from "@/types/scholarship";

export type RawDeadline = {
  kind: "exact";
  date: string;
  note?: string;
} | {
  kind: "rolling" | "varies" | "unknown";
  note: string;
};

export type RawGpa = {
  kind: "none";
} | {
  kind: "scale";
  minimum: 2.5 | 3 | 3.5 | 3.7;
} | {
  kind: "stated";
};

export type RawOfficialSource = {
  provider: string;
  verifiedUrl?: string;
  applicationUrl?: string;
  sourceType?: "provider" | "university" | "government" | "partner";
  lastVerified: string;
  notes?: string;
};

export interface RawScholarship {
  id: string;
  title: string;
  organization: string;
  city: string;
  country: string;
  countryCode: string;
  degreeLevels: readonly DegreeLevel[];
  degree: DegreeLevel;
  degreeLabel: string;
  fields: readonly string[];
  funding: FundingTier;
  fundingLabel: string;
  fundingSummary: string;
  benefits: Scholarship["benefits"];
  deadline: RawDeadline;
  postedAt: string | null;
  gpa: RawGpa;
  gpaLabel: string;
  nationality: string;
  eligibleCountries?: readonly string[];
  excludedCountries?: readonly string[];
  languageTests: readonly LanguageTest[];
  languageRequirements?: Scholarship["languageRequirements"];
  languageNote?: string;
  eligibility: Scholarship["eligibility"];
  documents: Scholarship["documents"];
  howToApply: Scholarship["howToApply"];
  tags: readonly string[];
  studyMode: string;
  duration: string;
  applicationFee: string;
  officialSource: RawOfficialSource;
}

export const RAW_REAL_SCHOLARSHIPS: readonly RawScholarship[] = [
  {
    id: "commonwealth-masters",
    title: "Commonwealth Master's Scholarships",
    organization: "Commonwealth Scholarship Commission in the UK",
    city: "Various",
    country: "United Kingdom",
    countryCode: "GB",
    degreeLevels: ["masters"],
    degree: "masters",
    degreeLabel: "Master's",
    fields: [],
    funding: "fully_funded",
    fundingLabel: "Fully Funded",
    fundingSummary:
      "Full tuition, a monthly stipend of £1,712 (£2,000 in the London metropolitan area), return airfare, a study travel grant and, where eligible, child allowances.",
    benefits: [
      { id: "tuition", label: "Tuition fees", value: "Full fees covered", note: "Agreed between the CSC and the UK university; no part is payable by the scholar." },
      { id: "stipend", label: "Living stipend", value: "£1,712 / month", note: "£2,000 / month at universities in the London metropolitan area." },
      { id: "airfare", label: "Return airfare", value: "Approved airfare", note: "Home country to the UK and return at the end of the award." },
      { id: "travel", label: "Study travel grant", value: "Available", note: "Towards study-related travel within the UK or overseas." },
      { id: "child", label: "Child allowance", value: "£622 / £154 per month", note: "Only for widowed, divorced or single-parent scholars with children in the UK." },
    ],
    deadline: { kind: "exact", date: "2026-10-20", note: "Closes 16:00 BST on Tuesday 20 October 2026." },
    postedAt: "2026-09-08",
    gpa: { kind: "stated" },
    gpaLabel: "Upper second-class (2:1) honours degree by September 2027",
    nationality:
      "Citizen of, or refugee in, one of 43 eligible Commonwealth countries (or a British Protected Person), and permanently resident in an eligible country.",
    eligibleCountries: [
      "BD", "BZ", "BW", "DM", "SZ", "FJ", "GA", "GM", "GH", "GD", "GY", "IN", "JM",
      "KE", "KI", "LS", "MW", "MY", "MV", "MU", "MS", "MZ", "NA", "NR", "NG", "PK",
      "PG", "RW", "SH", "LC", "VC", "WS", "SL", "SB", "ZA", "LK", "TZ", "TG", "TO",
      "TV", "UG", "VU", "ZM",
    ],
    languageTests: [],
    languageNote:
      "The CSC does not require candidates to take an IELTS test, but the host university may set its own English requirement.",
    eligibility: [
      { id: "nationality", label: "Nationality", value: "Citizen of, or refugee in, an eligible Commonwealth country, or a British Protected Person." },
      { id: "residence", label: "Residence", value: "Permanently resident in an eligible Commonwealth country." },
      { id: "academic", label: "Academic", value: "Upper second-class (2:1) honours degree by September 2027, or a lower second-class degree plus a relevant postgraduate qualification." },
      { id: "timing", label: "Availability", value: "Available to start academic studies in the UK by September 2027." },
      { id: "financial", label: "Financial need", value: "Unable to afford to study in the UK without this scholarship." },
      { id: "nomination", label: "Nomination", value: "Must also apply to a national nominating agency or participating NGO; the CSC does not accept direct applications." },
      { id: "field", label: "Field", value: "Full-time taught master's at a part-funded UK university; one-year programmes only (no MBA)." },
    ],
    documents: [
      { id: "passport", label: "Proof of citizenship or refugee status", requirement: "required", note: "Valid passport or national ID showing photograph, date of birth and country of citizenship." },
      { id: "transcripts", label: "Full transcripts of all higher education", requirement: "required", note: "Including to-date transcripts for courses in progress; certified translations if not in English." },
      { id: "references", label: "References from at least two individuals", requirement: "required", note: "Signed, on institutional letterhead or from a clearly identified email, uploaded as PDFs by the deadline." },
    ],
    howToApply: [
      { index: "01", title: "Check your nominator's rules", description: "Contact your national nominating agency or a participating NGO and confirm their own criteria and internal deadline.", caution: "Nominators may set closing dates earlier than the CSC deadline." },
      { index: "02", title: "Apply to your UK universities", description: "Apply for admission to up to three preferred courses in advance; courses often have strict admission deadlines." },
      { index: "03", title: "Register on CSC Central", description: "Create an account on the CSC online application system; two-factor authentication is required.", caution: "The system is very busy near the deadline and cannot accept late submissions." },
      { index: "04", title: "Complete the application form", description: "List qualifications, employment history and three referees, and write the four-part Development Impact statement." },
      { index: "05", title: "Upload supporting documents", description: "Upload your passport, full transcripts and at least two references in PDF format." },
      { index: "06", title: "Submit before 16:00 BST", description: "Submit through CSC Central and keep your reference and passcode email safe.", caution: "Applications cannot be edited after submitting." },
    ],
    tags: ["Fully Funded", "Commonwealth", "United Kingdom", "No IELTS"],
    studyMode: "On campus, full time",
    duration: "12 months",
    applicationFee: "None",
    officialSource: {
      provider: "Commonwealth Scholarship Commission in the UK",
      verifiedUrl: "https://cscuk.fcdo.gov.uk/scholarships/commonwealth-masters-scholarships/",
      applicationUrl: "https://portal.csccentralonline.org.uk/application",
      sourceType: "government",
      lastVerified: "2026-10-06",
      notes: "Agency-nominated Master's programme for study beginning September/October 2027. Nominating agencies may set earlier internal deadlines.",
    },
  },
  {
    id: "jj-wbgsp",
    title: "Joint Japan / World Bank Graduate Scholarship Program (JJ/WBGSP)",
    organization: "World Bank Group",
    city: "Various",
    country: "Multiple countries",
    countryCode: "",
    degreeLevels: ["masters"],
    degree: "masters",
    degreeLabel: "Master's",
    fields: [],
    funding: "fully_funded",
    fundingLabel: "Fully Funded",
    fundingSummary:
      "Full tuition and basic medical insurance, a monthly subsistence allowance that varies by host country, and economy-class travel between your home country and the host university with a US$600 travel allowance per trip.",
    benefits: [
      { id: "tuition", label: "Tuition", value: "Full tuition", note: "Plus basic medical insurance obtained through the university." },
      { id: "stipend", label: "Subsistence allowance", value: "Varies by host country", note: "Covers accommodation, food, books and other living expenses while on campus." },
      { id: "airfare", label: "Travel", value: "Economy class + US$600 per trip", note: "Between home country and host university at the start and end of the scholarship period." },
    ],
    deadline: {
      kind: "exact",
      date: "2027-02-26",
      note: "Window 2 programmes: 29 March – 21 May 2027. Apply only to the window under which your programme is listed.",
    },
    postedAt: null,
    gpa: { kind: "none" },
    gpaLabel: "No minimum GPA published",
    nationality:
      "National of a World Bank member developing country on the programme's eligible-country list (87 countries), without dual citizenship of a developed country.",
    eligibleCountries: [
      "AF", "AO", "BD", "BZ", "BJ", "BT", "BO", "BF", "BI", "KH", "CM", "CV", "CF",
      "TD", "KM", "CD", "CG", "CI", "DJ", "DM", "EG", "ER", "SZ", "ET", "FJ", "GM",
      "GH", "GD", "GN", "GW", "HT", "HN", "IN", "IQ", "KE", "KI", "XK", "KG", "LA",
      "LB", "LS", "LR", "LY", "MG", "MW", "MV", "ML", "MH", "MR", "MA", "MZ", "MM",
      "NA", "NP", "NI", "NE", "NG", "PK", "PG", "RW", "ST", "SN", "SL", "SB", "SO",
      "SS", "LC", "VC", "SD", "SR", "SY", "TJ", "TZ", "TL", "TG", "TO", "TN", "TV",
      "UG", "UA", "UZ", "VU", "VE", "PS", "YE", "ZM", "ZW",
    ],
    languageTests: [],
    languageNote:
      "Language requirements are not published centrally; the application is written in English or the language of the master's programme.",
    eligibility: [
      { id: "nationality", label: "Nationality", value: "National of a World Bank member developing country on the eligible-country list; no dual citizenship of a developed country." },
      { id: "academic", label: "Academic", value: "Bachelor's degree earned at least three years before the application deadline." },
      { id: "experience", label: "Experience", value: "Currently in paid, full-time development-related work, with at least three years of such work within the past six years." },
      { id: "admission", label: "Admission", value: "Unconditionally admitted (except for financing) to a participating master's programme outside your country of citizenship and residence." },
      { id: "field", label: "Programme", value: "One of the listed participating master's programmes only (44 programmes at 24 universities)." },
      { id: "status", label: "Status", value: "Individuals currently studying in a JJ/WBGSP participating programme are not eligible." },
    ],
    documents: [
      { id: "form", label: "JJ/WBGSP application form", requirement: "required", note: "Written in English or the language of the master's programme." },
      { id: "recommendations", label: "Two recommendation letters", requirement: "required", note: "Submitted online by people with direct knowledge of your professional work; exactly two are permitted." },
      { id: "employment", label: "Proof of development-related employment", requirement: "required", note: "Documentation covering the number of years of recent development-related work." },
      { id: "diploma", label: "Bachelor's degree diploma", requirement: "required", note: "Plus the diploma of your most advanced graduate degree if applicable; transcripts are not a substitute." },
      { id: "cv", label: "C.V. in the programme format", requirement: "required", note: "Using the format provided in the guidelines; unpaid work must be listed separately." },
      { id: "admission", label: "Unconditional letter of admission", requirement: "required", note: "From a participating master's programme located outside your country of citizenship and residence." },
      { id: "passport", label: "Passport identification page", requirement: "conditional", note: "Requested from finalists when a scholarship is offered." },
      { id: "medical", label: "Medical certificate", requirement: "conditional", note: "Requested from finalists less than three months before the programme starts." },
    ],
    howToApply: [
      { index: "01", title: "Gain admission to a participating programme", description: "Apply to and be admitted unconditionally (except for financing) to one of the listed participating master's programmes." },
      { index: "02", title: "Receive your application link", description: "The participating programme communicates the online application link to applicants it has shortlisted as eligible.", caution: "You cannot start the application until you have an unconditional admission letter." },
      { index: "03", title: "Submit the recommendation request form", description: "Add two professional referees online, then confirm their email addresses.", caution: "Each application must include exactly two professional recommendations." },
      { index: "04", title: "Complete and submit the application", description: "Upload your employment proof, diplomas, CV and admission letter, then submit before the deadline.", caution: "Use a computer; the portal is not designed for mobile phones, and submitting more than one application disqualifies you." },
    ],
    tags: ["Fully Funded", "World Bank", "Master's", "Development"],
    studyMode: "On campus, full time",
    duration: "Up to 2 years (or the programme length, whichever is shorter)",
    applicationFee: "Not stated on official page",
    officialSource: {
      provider: "World Bank Group",
      verifiedUrl: "https://www.worldbank.org/en/programs/scholarships/jj-wbgsp",
      sourceType: "provider",
      lastVerified: "2026-10-06",
      notes: "Window 1 opened 18 January 2027 and closes 26 February 2027; Window 2 runs 29 March – 21 May 2027. The application link is sent only to candidates shortlisted by a participating programme.",
    },
  },
  {
    id: "turkiye-burslari",
    title: "Türkiye Scholarships (Türkiye Bursları)",
    organization: "Türkiye Scholarships (YTB)",
    city: "Various",
    country: "Türkiye",
    countryCode: "TR",
    degreeLevels: ["associate", "bachelors", "masters", "doctorate"],
    degree: "bachelors",
    degreeLabel: "Bachelor's",
    fields: [],
    funding: "fully_funded",
    fundingLabel: "Fully Funded",
    fundingSummary:
      "Tuition, a one-year Turkish language course, accommodation, a once-off flight ticket, general health insurance and a monthly stipend that rises with the level of study.",
    benefits: [
      { id: "tuition", label: "Tuition", value: "Covered", note: "For the placed university and department." },
      { id: "language", label: "Turkish language course", value: "1 year", note: "Awardees below C1 Turkish must attend and reach C1." },
      { id: "accommodation", label: "Accommodation", value: "Provided", note: "Housing allowance after the first graduate year of 6,000 TL in Istanbul/Ankara or 5,000 TL elsewhere." },
      { id: "airfare", label: "Flight ticket", value: "Once-off", note: "To and from Türkiye." },
      { id: "insurance", label: "Health insurance", value: "General health insurance", note: "During the programme." },
      { id: "stipend", label: "Monthly stipend", value: "6,500 / 9,500 / 13,000 TL", note: "Associate–bachelor's / master's / PhD per month; successful students may receive up to twice this amount." },
    ],
    deadline: {
      kind: "unknown",
      note: "The 2027 round has not been announced yet. Applications are received every year from 10 January to 20 February.",
    },
    postedAt: null,
    gpa: { kind: "stated" },
    gpaLabel: "Minimum 70% (bachelor's), 75% (master's) or 90% (health sciences) depending on level",
    nationality: "Open to international applicants; Turkish citizens are not eligible.",
    excludedCountries: ["TR"],
    languageTests: [],
    languageNote:
      "International language results (for example TOEFL or DELF) may be required by the chosen programme; there is no single universal test requirement.",
    eligibility: [
      { id: "nationality", label: "Nationality", value: "Open to international applicants; Turkish citizens are not eligible." },
      { id: "academic", label: "Academic", value: "Minimum 70% academic average for bachelor's, 75% for master's or 90% for health sciences programmes." },
      { id: "age", label: "Age", value: "Under 21 (bachelor's), under 30 (master's), under 35 (doctorate) or under 50 (research)." },
      { id: "field", label: "Field", value: "Programmes offered across Turkish universities; up to 12 choices can be selected in the application." },
      { id: "language", label: "Language", value: "Programmes are taught in Turkish or English; awardees below C1 Turkish must complete a preparatory language year." },
    ],
    documents: [
      { id: "id", label: "Valid identity document", requirement: "required", note: "ID card or passport." },
      { id: "photo", label: "Photograph taken within the last year", requirement: "required" },
      { id: "diploma", label: "Diploma or temporary graduation certificate", requirement: "required" },
      { id: "transcript", label: "Transcript", requirement: "required" },
      { id: "national-exam", label: "National exam results (if any)", requirement: "optional" },
      { id: "intl-exam", label: "International exam results where required", requirement: "conditional", note: "For example GRE, GMAT or SAT, if the chosen programme requires them." },
      { id: "language-exam", label: "International language test results where required", requirement: "conditional", note: "For example TOEFL or DELF." },
      { id: "proposal", label: "Research proposal and writing sample", requirement: "conditional", note: "PhD applicants only." },
    ],
    howToApply: [
      { index: "01", title: "Create a TBBS account", description: "Register on the Türkiye Scholarships Application System (TBBS) during the application window." },
      { index: "02", title: "Select your programmes", description: "Choose up to 12 programmes in the order you prefer them." },
      { index: "03", title: "Upload your documents", description: "Upload your ID, photograph, diploma, transcript and any exam or language results." },
      { index: "04", title: "Submit before the window closes", description: "Complete the online application free of charge within the 10 January – 20 February window." },
      { index: "05", title: "Interview stage", description: "Shortlisted candidates may be called to an interview; final placement decisions follow." },
    ],
    tags: ["Fully Funded", "Türkiye", "All Levels", "No Application Fee"],
    studyMode: "On campus, full time",
    duration: "Varies with level (2–4 years)",
    applicationFee: "None",
    officialSource: {
      provider: "Türkiye Scholarships (YTB)",
      verifiedUrl: "https://www.turkiyeburslari.gov.tr/",
      applicationUrl: "https://tbbs.turkiyeburslari.gov.tr/",
      sourceType: "government",
      lastVerified: "2026-10-06",
      notes: "Applications are received free of charge through TBBS every year between 10 January and 20 February; the 2027 round dates are still to be announced.",
    },
  },
  {
    id: "icdf-scholarship",
    title: "TaiwanICDF Scholarship",
    organization: "Taiwan International Cooperation and Development Fund (TaiwanICDF)",
    city: "Various",
    country: "Taiwan",
    countryCode: "TW",
    degreeLevels: ["bachelors", "masters", "doctorate"],
    degree: "masters",
    degreeLabel: "Master's",
    fields: [],
    funding: "fully_funded",
    fundingLabel: "Fully Funded",
    fundingSummary:
      "Round-trip airfare, dormitory housing, tuition and credit fees, insurance, textbook costs and a monthly allowance that is higher at master's and PhD level.",
    benefits: [
      { id: "airfare", label: "Airfare", value: "Round-trip economy", note: "Most-direct flights to and from Taiwan." },
      { id: "housing", label: "Housing", value: "Student dormitory", note: "All scholarship students must reside in the student dormitories." },
      { id: "tuition", label: "Tuition and credit fees", value: "Covered", note: "As required by the university." },
      { id: "insurance", label: "Insurance", value: "Covered", note: "Accident and necessary medical coverage for the duration of the programme." },
      { id: "books", label: "Textbook costs", value: "Covered", note: "Subject to approval by the institute director." },
      { id: "allowance", label: "Monthly allowance", value: "NT$15,000 / 18,000 / 20,000", note: "Bachelor's / master's / PhD per month, deposited into a local bank account." },
    ],
    deadline: { kind: "exact", date: "2027-03-15", note: "Applications open 1 December 2026." },
    postedAt: null,
    gpa: { kind: "stated" },
    gpaLabel: "Applicants must satisfy the admission requirements of the partner university",
    nationality:
      "Citizen of a country on the TaiwanICDF eligible-country list; applicants from countries without diplomatic relations with Taiwan cannot apply to bachelor's programmes.",
    eligibleCountries: [
      "FJ", "IN", "ID", "LA", "MY", "MH", "MM", "PW", "PG", "PH", "LK", "TH", "TL", "TV", "VN",
      "JO", "MN", "RU", "TR",
      "AL", "BA", "HU", "XK", "LV", "ME", "MK", "PL", "RS",
      "CI", "DJ", "SZ", "ET", "KE", "SN", "ZA", "TZ", "UG",
      "HT", "KN", "LC", "VC",
      "BZ", "GT", "MX",
      "AR", "BO", "BR", "CO", "EC", "PY", "PE", "UY",
    ],
    languageTests: [],
    languageNote:
      "The TaiwanICDF requires no English proficiency test, though the partner programme may set academic or language requirements of its own.",
    eligibility: [
      { id: "nationality", label: "Nationality", value: "Citizen of a country on the eligible list, and able to satisfy any criteria set by that country's government." },
      { id: "nationality", label: "Diplomatic relations", value: "Bachelor's programmes are exclusively available to applicants from countries that maintain diplomatic relations with Taiwan." },
      { id: "academic", label: "Academic", value: "Must satisfy the admission requirements of the partner university and programme applied to." },
      { id: "admission", label: "Admission", value: "Must be able to meet the requirements for a Resident Visa (Code: FS) and an Alien Resident Certificate." },
      { id: "exclusivity", label: "Exclusivity", value: "Cannot hold another ROC (Taiwan) government scholarship in the same academic year, and cannot apply for more than one programme." },
      { id: "record", label: "Record", value: "No previous ROC government scholarship may have been revoked, and applicants must not have been expelled from a Taiwanese university." },
    ],
    documents: [
      { id: "online", label: "TaiwanICDF online application", requirement: "required", note: "Completed before the 15 March deadline; only one programme may be chosen." },
      { id: "university", label: "University programme documents", requirement: "required", note: "Submit the documents the partner university and programme require before its admissions deadline." },
      { id: "diploma", label: "Highest-level diploma", requirement: "required", note: "Must be provided before the date stated in the current guidebook." },
      { id: "embassy", label: "Documents for the ROC embassy or office", requirement: "conditional", note: "Whether hard or soft copies are required depends on the individual representative office." },
      { id: "recommendations", label: "Recommendation letters", requirement: "optional", note: "The scholarship itself does not require them, but a partner programme may." },
    ],
    howToApply: [
      { index: "01", title: "Apply through the online system", description: "Complete the TaiwanICDF Scholarship online application and choose a single programme.", caution: "Each applicant may apply to only one programme at a time." },
      { index: "02", title: "Apply to the partner university", description: "Submit the university's own application documents before its admissions deadline." },
      { index: "03", title: "Contact the ROC embassy or office", description: "Submit any documents the local ROC (Taiwan) Embassy, Consulate General or Representative Office requires." },
      { index: "04", title: "First review", description: "The ROC embassy or office reviews applicants and forwards its recommended list to the TaiwanICDF by 31 March." },
      { index: "05", title: "Second review", description: "A committee at the partner university reviews qualified applicants together with TaiwanICDF representatives." },
      { index: "06", title: "Announcement and reply", description: "Recipients are announced in principle by 10 June and return a signed consent form through the embassy or office." },
    ],
    tags: ["Fully Funded", "Taiwan", "No Test Required", "Dormitory"],
    studyMode: "On campus, full time",
    duration: "Bachelor's up to 4 years, master's up to 2 years, PhD up to 4 years",
    applicationFee: "None",
    officialSource: {
      provider: "Taiwan International Cooperation and Development Fund (TaiwanICDF)",
      verifiedUrl: "https://www.icdf.org.tw/wSite/ct?ctNode=31563&mp=2&xItem=69337",
      applicationUrl: "https://www.icdf.org.tw/wSite/ct?ctNode=31566&mp=2&xItem=69338",
      sourceType: "provider",
      lastVerified: "2026-10-06",
      notes:
        "The 2027 window runs 1 December 2026 – 15 March 2027. Somaliland appears on the official eligible list but has no ISO 3166-1 code, so it is not encoded in the country list. Bachelor's programmes are limited to countries with diplomatic relations with Taiwan.",
    },
  },
  {
    id: "daad-epos",
    title: "DAAD Development-Related Postgraduate Courses (EPOS)",
    organization: "German Academic Exchange Service (DAAD)",
    city: "Various",
    country: "Germany",
    countryCode: "DE",
    degreeLevels: ["masters", "doctorate"],
    degree: "masters",
    degreeLabel: "Master's",
    fields: [],
    funding: "fully_funded",
    fundingLabel: "Fully Funded",
    fundingSummary:
      "A monthly stipend of €992 for graduates (€1,400 for doctoral candidates from February 2026), contributions to health, accident and personal liability insurance, and a travel allowance.",
    benefits: [
      { id: "stipend", label: "Monthly stipend", value: "€992 (graduates)", note: "€1,300, rising to €1,400 from February 2026, for doctoral candidates." },
      { id: "insurance", label: "Insurance", value: "Health, accident and personal liability", note: "Contributions paid by DAAD." },
      { id: "travel", label: "Travel allowance", value: "Available", note: "Unless these expenses are covered by the home country or another source of funding." },
      { id: "family", label: "Rent and family allowances", value: "Available if eligible", note: "Monthly rent subsidy and allowance for accompanying family members where applicable." },
    ],
    deadline: {
      kind: "varies",
      note: "Depending on the chosen study programme — check the scholarship brochure or the website of your chosen study programme.",
    },
    postedAt: null,
    gpa: { kind: "stated" },
    gpaLabel: "Above-average academic performance; degrees normally not more than six years old",
    nationality:
      "Nationals of the DAC list of developing countries and territories eligible for EPOS. Applicants resident in Germany for more than 15 months at the deadline cannot be considered.",
    eligibleCountries: [
      "AL", "BY", "BA", "XK", "MD", "ME", "RS", "TR", "UA", "MK",
      "DZ", "EG", "LY", "MA", "TN",
      "AO", "BJ", "BW", "BF", "BI", "CM", "CV", "CF", "TD", "KM", "CG", "CD", "CI", "DJ",
      "GQ", "ER", "SZ", "ET", "GA", "GM", "GH", "GN", "GW", "KE", "LS", "LR", "MG", "MW",
      "ML", "MR", "MU", "MZ", "NA", "NE", "NG", "RW", "ST", "SN", "SL", "SO", "ZA", "SD",
      "SS", "SH", "TZ", "TG", "UG", "ZM", "ZW",
      "IQ", "IR", "JO", "LB", "PS", "SY", "YE",
      "AF", "AM", "AZ", "BD", "BT", "GE", "IN", "KZ", "KG", "MV", "MM", "NP", "PK", "LK",
      "TJ", "TM", "UZ",
      "KH", "CN", "ID", "KP", "LA", "MY", "MN", "PH", "TH", "TL", "VN",
      "BZ", "CR", "CU", "DM", "DO", "SV", "GD", "GT", "HT", "HN", "JM", "MX", "MS", "NI",
      "PA", "LC", "VC",
      "AR", "BO", "BR", "CO", "EC", "GY", "PY", "PE", "SR", "VE",
      "FJ", "KI", "MH", "FM", "NR", "NU", "PG", "WS", "SB", "TK", "TO", "TV", "VU", "WF",
    ],
    languageTests: ["ielts", "toefl"],
    languageRequirements: {},
    languageNote:
      "English-taught courses ask for proof of language skills such as IELTS or TOEFL, and German-taught courses require German at B1 level at application; no single numeric threshold is published.",
    eligibility: [
      { id: "nationality", label: "Nationality", value: "National of a country on the EPOS DAC list; applicants resident in Germany for more than 15 months at the deadline cannot be considered." },
      { id: "academic", label: "Academic", value: "A bachelor's degree (usually a four-year course), normally not more than six years old, with above-average academic performance." },
      { id: "experience", label: "Experience", value: "At least two years of relevant professional experience after the first degree." },
      { id: "admission", label: "Admission", value: "Apply directly to the chosen postgraduate course, which conducts its own selection." },
      { id: "language", label: "Language", value: "English-taught courses require IELTS or TOEFL; German-taught courses require German at B1 level at application." },
      { id: "field", label: "Field", value: "One of the EPOS development-related postgraduate courses; up to three courses may be applied to." },
    ],
    documents: [
      { id: "checklist", label: "Completed and signed checklist", requirement: "required" },
      { id: "form", label: "EPOS application form", requirement: "required" },
      { id: "cv", label: "Curriculum vitae in reverse chronological order", requirement: "required", note: "Without unexplained gaps; the Europass template is recommended." },
      { id: "motivation", label: "Letter of motivation", requirement: "required" },
      { id: "recommendation", label: "Letter of recommendation from your current employer", requirement: "required", note: "On letterhead, signed, stamped and dated." },
      { id: "employment", label: "Certificate(s) of employment", requirement: "required", note: "Showing at least two years of relevant work experience after the bachelor's degree." },
      { id: "language", label: "Proof of language skills", requirement: "required", note: "IELTS or TOEFL for English-taught courses; German for German-taught courses." },
      { id: "degrees", label: "Degree certificates and transcripts", requirement: "required", note: "Copies of higher education degree certificates and the full transcript of records." },
      { id: "aps", label: "APS certificate", requirement: "conditional", note: "Applicants from the People's Republic of China only." },
    ],
    howToApply: [
      { index: "01", title: "Choose your course", description: "Pick from the EPOS development-related postgraduate courses and check its own deadline and requirements.", caution: "Deadlines are set by each course, so the date differs from course to course." },
      { index: "02", title: "Send your application to the course", description: "Submit a complete application directly to the postgraduate course — not to DAAD.", caution: "Applications sent to DAAD will not be forwarded." },
      { index: "03", title: "Course selection committee", description: "The course's selection committee suggests potential candidates for a DAAD scholarship." },
      { index: "04", title: "Upload to the DAAD portal", description: "Suggested candidates are contacted by DAAD and upload their complete application to the DAAD portal." },
      { index: "05", title: "Final selection", description: "The selection process is finalised and candidates are informed of the outcome." },
    ],
    tags: ["Fully Funded", "Germany", "Development", "Work Experience"],
    studyMode: "On campus, full time",
    duration: "12 to 42 months, depending on the study programme",
    applicationFee: "Not stated on official page",
    officialSource: {
      provider: "German Academic Exchange Service (DAAD)",
      verifiedUrl: "https://www.daad.de/epos/",
      sourceType: "government",
      lastVerified: "2026-10-06",
      notes:
        "Applications go directly to each course. The official deadline list gives 'see website of the course' for every entry, and the next DAAD selection date is still to be announced.",
    },
  },
  {
    id: "erasmus-mundus-jm",
    title: "Erasmus Mundus Joint Masters (EMJM)",
    organization: "European Education and Culture Executive Agency (EACEA)",
    city: "Various",
    country: "Multiple countries",
    countryCode: "",
    degreeLevels: ["masters"],
    degree: "masters",
    degreeLabel: "Master's",
    fields: [],
    funding: "fully_funded",
    fundingLabel: "Fully Funded",
    fundingSummary:
      "A scholarship of €1,400 per month for the duration of the programme covering travel, visa, installation and subsistence costs, and consortia cannot charge tuition or mandatory participation costs to scholarship holders.",
    benefits: [
      { id: "grant", label: "Monthly scholarship", value: "€1,400 / month", note: "Covers travel, visa, installation and subsistence costs; awarded for 12, 18 or 24 months." },
      { id: "tuition", label: "Tuition", value: "Not charged to scholarship holders", note: "Selected projects cannot charge tuition or other mandatory participation costs to Erasmus Mundus scholarship holders." },
      { id: "special-needs", label: "Special-needs top-up", value: "€3,000–60,000", note: "For scholarship holders with special needs, where applicable." },
    ],
    deadline: {
      kind: "varies",
      note: "Set by each consortium — most programmes accept applications between October and January.",
    },
    postedAt: null,
    gpa: { kind: "stated" },
    gpaLabel: "Admission requirements differ by consortium",
    nationality: "Open to students worldwide.",
    languageTests: [],
    languageNote:
      "Language requirements are set by each consortium; most programmes are taught in English.",
    eligibility: [
      { id: "nationality", label: "Nationality", value: "Open to students worldwide; each consortium may award no more than 10% of scholarships to students of the same nationality." },
      { id: "academic", label: "Academic", value: "A bachelor's degree (or equivalent) satisfying the consortium's admission requirements." },
      { id: "admission", label: "Admission", value: "Selection, recruitment and monitoring of students are the sole responsibility of the EMJM consortium." },
      { id: "mobility", label: "Mobility", value: "Compulsory physical mobility: at least two study periods in two different countries." },
      { id: "field", label: "Field", value: "The subject is defined by each joint master's programme; students apply directly to the consortium." },
      { id: "record", label: "Record", value: "Students who have previously obtained an EMJM scholarship are not eligible for an additional one." },
    ],
    documents: [
      { id: "form", label: "Programme application form", requirement: "required", note: "Each consortium publishes its own application form and instructions." },
      { id: "degree", label: "Degree certificate and transcripts", requirement: "required", note: "As specified by the consortium on its programme page." },
      { id: "language", label: "Language evidence", requirement: "conditional", note: "Where the consortium requires proof of English or another language." },
    ],
    howToApply: [
      { index: "01", title: "Find a programme", description: "Search the Erasmus Mundus course catalogue for a joint master's that fits your field." },
      { index: "02", title: "Check the consortium's requirements", description: "Review the programme page for entry requirements, documents and its own deadline." },
      { index: "03", title: "Apply directly to the consortium", description: "Students apply directly to the institution running the chosen programme — there is no central application portal." },
      { index: "04", title: "Consortium selection", description: "The consortium selects students and awards the Erasmus Mundus scholarships." },
    ],
    tags: ["Fully Funded", "Europe", "Joint Degree", "Mobility"],
    studyMode: "On campus, full time with multi-country mobility",
    duration: "1 to 2 years (60, 90 or 120 ECTS credits)",
    applicationFee: "None for scholarship holders",
    officialSource: {
      provider: "European Education and Culture Executive Agency (EACEA)",
      verifiedUrl: "https://erasmus-plus.ec.europa.eu/opportunities/individuals/students/erasmus-mundus-joint-masters",
      sourceType: "government",
      lastVerified: "2026-10-06",
      notes: "Students apply directly to the institution running their chosen programme; each consortium sets its own application window.",
    },
  },
  {
    id: "swiss-excellence",
    title: "Swiss Government Excellence Scholarships",
    organization: "Swiss State Secretariat for Education, Research and Innovation (SERI)",
    city: "Various",
    country: "Switzerland",
    countryCode: "CH",
    degreeLevels: ["masters", "doctorate"],
    degree: "doctorate",
    degreeLabel: "Doctorate",
    fields: [],
    funding: "fully_funded",
    fundingLabel: "Fully Funded",
    fundingSummary:
      "CHF 2,450 per month to cover basic living expenses, health insurance premiums for holders from non-EU/EFTA countries, a one-time CHF 600 rental deposit grant, a Half-Fare Travelcard and a return flight allowance. Tuition and semester fees are not covered.",
    benefits: [
      { id: "stipend", label: "Monthly allowance", value: "CHF 2,450 / month", note: "For research fellowships, PhD scholarships and art scholarships." },
      { id: "insurance", label: "Health insurance", value: "Premiums covered", note: "For scholarship holders from non-EU/EFTA countries." },
      { id: "deposit", label: "Rental deposit grant", value: "CHF 600 (one-time)", note: "Paid once where applicable." },
      { id: "travelcard", label: "Half-Fare Travelcard", value: "Included", note: "For public transport in Switzerland." },
      { id: "flight", label: "Return flight allowance", value: "Country-dependent", note: "For non-EU/EFTA holders; amount determined by country of origin." },
      { id: "tuition", label: "Tuition and semester fees", value: "Not covered", note: "SERI states fees (about CHF 600–2,000 per semester) are not covered; ETH Zurich states it waives its own fees for holders." },
    ],
    deadline: {
      kind: "varies",
      note: "Country-specific deadlines with the latest on 30 November 2026 at 11:59 pm Swiss time; applications can be prepared from 20 August 2026.",
    },
    postedAt: null,
    gpa: { kind: "stated" },
    gpaLabel: "Master's degree or equivalent completed by 31 July 2027 (30 June 2027 for ETH Zurich)",
    nationality:
      "Open to foreign researchers from abroad; Swiss citizens are not eligible, and no scholarship offer is available for applicants from France.",
    excludedCountries: ["CH", "FR"],
    languageTests: [],
    languageNote:
      "No language test threshold is published with the scholarship terms; expectations are set by the host institution and academic supervisor.",
    eligibility: [
      { id: "nationality", label: "Nationality", value: "Foreign nationals; Swiss citizens are not eligible, and applicants from France have no scholarship offer available." },
      { id: "age", label: "Age", value: "Date of birth after 31 December 1991." },
      { id: "academic", label: "Academic", value: "Master's degree or equivalent completed by 31 July 2027 (30 June 2027 for ETH Zurich)." },
      { id: "supervision", label: "Supervision", value: "Applications without an academic supervisor at a Swiss higher education institution will not be considered." },
      { id: "field", label: "Field", value: "Research fellowships and PhD scholarships across disciplines, plus art scholarships at certain institutions." },
      { id: "record", label: "Record", value: "Applicants must not already hold a doctoral degree where a research fellowship is sought." },
    ],
    documents: [
      { id: "cv", label: "Complete CV", requirement: "required" },
      { id: "motivation", label: "Letter of motivation", requirement: "required", note: "Maximum two pages." },
      { id: "proposal", label: "Research proposal", requirement: "required", note: "On the ESKAS form, maximum five pages including a summary for non-specialists." },
      { id: "supervisor", label: "Letter of support from a Swiss academic supervisor", requirement: "required", note: "With the supervisor's own short CV (maximum two pages)." },
      { id: "recommendations", label: "Two recommendation letters", requirement: "required", note: "Submitted through the ESKAS form by two different professors." },
      { id: "degrees", label: "Certificates and transcripts", requirement: "required", note: "From previous universities; certified translations if not in English, French, Italian or German." },
      { id: "passport", label: "Passport copy", requirement: "required" },
    ],
    howToApply: [
      { index: "01", title: "Check your country's deadline", description: "Review the A–Z list of countries for the scholarships and deadlines that apply to you." },
      { index: "02", title: "Find an academic supervisor", description: "Identify a professor at a Swiss higher education institution who agrees to supervise you and issues an invitation letter.", caution: "Applications without a confirmed supervisor are not considered." },
      { index: "03", title: "Register in GO ESKAS", description: "Create an account in the online application platform, available from 20 August 2026." },
      { index: "04", title: "Prepare your application", description: "Complete the ESKAS forms and upload your CV, research proposal, supervisor's support letter and references." },
      { index: "05", title: "Submit before the deadline", description: "Submit through GO ESKAS only; applications are free of charge.", caution: "Do not send your application by email or in paper form." },
    ],
    tags: ["Fully Funded", "Switzerland", "Research", "Doctorate"],
    studyMode: "On campus, full-time research in Switzerland",
    duration: "Research fellowship 6–12 months; PhD scholarship renewable up to 36 months",
    applicationFee: "None",
    officialSource: {
      provider: "Swiss State Secretariat for Education, Research and Innovation (SERI)",
      verifiedUrl: "https://www.sbfi.admin.ch/en/swiss-government-excellence-scholarships",
      applicationUrl: "https://www.go.eskas.ch/",
      sourceType: "government",
      lastVerified: "2026-10-06",
      notes:
        "EU citizens are eligible in general; France is listed as having no scholarship offer available. Applications are made through GO ESKAS from 20 August 2026.",
    },
  },
  {
    id: "nl-scholarship",
    title: "NL Scholarship",
    organization: "Nuffic (Dutch organisation for internationalisation in education)",
    city: "Various",
    country: "Netherlands",
    countryCode: "NL",
    degreeLevels: ["bachelors", "masters"],
    degree: "bachelors",
    degreeLabel: "Bachelor's",
    fields: [],
    funding: "partial",
    fundingLabel: "Partial Funding",
    fundingSummary:
      "A one-time grant of €5,000 awarded in the first year of study; it is not a full-tuition scholarship.",
    benefits: [
      { id: "grant", label: "One-time grant", value: "€5,000", note: "Paid in the first year of studies; not a full-tuition scholarship." },
    ],
    deadline: {
      kind: "varies",
      note: "Set by each participating institution — check the website of the institution you want to apply to for its specific deadline.",
    },
    postedAt: null,
    gpa: { kind: "stated" },
    gpaLabel: "Applicants must meet the specific requirements of the institution of their choice",
    nationality: "Open to non-EEA students only.",
    excludedCountries: [
      "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU",
      "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES", "SE",
      "IS", "LI", "NO",
    ],
    languageTests: [],
    languageNote:
      "Language requirements are set by each participating institution.",
    eligibility: [
      { id: "nationality", label: "Nationality", value: "Non-EEA nationality." },
      { id: "enrolment", label: "Enrolment", value: "Applying for a full-time bachelor's or master's programme at a participating Dutch higher education institution." },
      { id: "requirements", label: "Institution requirements", value: "Must meet the specific requirements of the institution of your choice." },
      { id: "record", label: "Record", value: "Must not already hold a degree from an education institution in the Netherlands." },
    ],
    documents: [
      { id: "form", label: "Institution application form", requirement: "required", note: "The scholarship application is made through the participating institution's own procedure." },
      { id: "admission", label: "Programme admission documents", requirement: "required", note: "As required by the institution for admission to the bachelor's or master's programme." },
    ],
    howToApply: [
      { index: "01", title: "Choose a participating institution", description: "Check the list of participating Dutch higher education institutions published for your academic year." },
      { index: "02", title: "Apply for admission", description: "Apply for a full-time bachelor's or master's programme at your chosen institution." },
      { index: "03", title: "Apply for the scholarship", description: "Submit the scholarship application through the institution's own website and process." },
      { index: "04", title: "Meet the institution's deadline", description: "Deadlines differ by institution, so confirm the exact date on the institution's site." },
    ],
    tags: ["Partial Funding", "Netherlands", "Non-EEA"],
    studyMode: "On campus, full time",
    duration: "First year of the programme",
    applicationFee: "Not stated on official page",
    officialSource: {
      provider: "Nuffic",
      verifiedUrl: "https://www.studyinnl.org/finances/nl-scholarship",
      sourceType: "government",
      lastVerified: "2026-10-06",
      notes:
        "Financed by the Dutch Ministry of Education, Culture and Science with participating Dutch institutions. Applications go through the institution you apply to, and each sets its own deadline.",
    },
  },
];
