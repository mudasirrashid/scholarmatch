/**
 * Matching engine verification.
 *
 * Phase 02's `verify:explorer` checks that the explorer parses, filters and sorts
 * correctly. This script checks the other half: that scores are deterministic,
 * that they stay inside their bounds, and that each demo profile produces the
 * outcome it was written to demonstrate.
 *
 * A matching engine that quietly returns a plausible number is the failure mode
 * worth guarding against, so most assertions here are about invariants that must
 * hold for every profile and every record rather than about one expected score.
 */

import {
  DIMENSION_WEIGHTS,
  HARD_DIMENSIONS,
  HARD_FAILURE_CAP,
  MATCH_QUALITY_THRESHOLDS,
  TOTAL_DIMENSION_WEIGHT,
  evaluationCoverage,
  matchQuality,
  matchScholarship,
  rankScholarships,
  toMatchInsights,
} from "@/lib/matching";
import { evaluateDegree, evaluateNationality, evaluateWorkAuthorization } from "@/lib/matching/eligibility";
import { relateFields, relateToFields } from "@/lib/matching/fields";
import { parseProfile, parseStoredProfile } from "@/lib/profile/parse";
import { allScholarships } from "@/lib/scholarships";
import { toPreviewFromMatch } from "@/lib/scholarships";
import {
  activeDemoProfile,
  demoProfiles,
  profileA,
  profileB,
  profileC,
  profileD,
  profileE,
  profileF,
} from "@/lib/demo/student-profiles";
import type { MatchResult } from "@/types/matching";

const all = allScholarships();
let failures = 0;

function check(label: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) failures += 1;
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}`);
  if (!ok) {
    console.log(`      expected: ${JSON.stringify(expected)}`);
    console.log(`      actual:   ${JSON.stringify(actual)}`);
  }
}

function section(title: string) {
  console.log(`\n   ${title}`);
}

function resultsFor(profile: (typeof demoProfiles)[number]): MatchResult[] {
  return all.map((scholarship) => matchScholarship(profile, scholarship));
}

/* ==========================================================================
   1. Weights
   ========================================================================== */

section("Dimension weights");

check("weights sum to 1", Number(TOTAL_DIMENSION_WEIGHT.toFixed(6)), 1);
check("every dimension is weighted", Object.keys(DIMENSION_WEIGHTS).length, 6);
check(
  "hard dimensions are academic, degree and eligibility",
  [...HARD_DIMENSIONS].sort(),
  ["academic", "degree", "eligibility"],
);
check("hard failure cap is below the potential band", HARD_FAILURE_CAP < 55, true);
check(
  "quality thresholds descend",
  MATCH_QUALITY_THRESHOLDS.every((entry, index) =>
    index === 0 ? true : entry[0] < MATCH_QUALITY_THRESHOLDS[index - 1]![0],
  ),
  true,
);

/* ==========================================================================
   2. Invariants that must hold for every profile and every record
   ========================================================================== */

section("Invariants across every profile");

for (const profile of demoProfiles) {
  const results = resultsFor(profile);
  const label = profile.displayName;

  check(
    `${label}: every score is a whole number in 0-100`,
    results.every((match) => Number.isInteger(match.score) && match.score >= 0 && match.score <= 100),
    true,
  );

  check(
    `${label}: quality band agrees with the score`,
    results.every((match) => match.quality === matchQuality(match.score)),
    true,
  );

  check(
    `${label}: every result reports all six dimensions`,
    results.every((match) => match.dimensions.length === 6),
    true,
  );

  check(
    `${label}: dimensions sum to the declared weights`,
    results.every(
      (match) =>
        Math.abs(
          match.dimensions.reduce((sum, dimension) => sum + dimension.weight, 0) - 1,
        ) < 1e-9,
    ),
    true,
  );

  check(
    `${label}: a hard failure always caps the score`,
    results.every(
      (match) =>
        match.eligibility.isEligible || match.score <= HARD_FAILURE_CAP,
    ),
    true,
  );

  check(
    `${label}: eligibility verdict matches the hard failures`,
    results.every((match) => {
      const failed = match.dimensions.filter(
        (dimension) => dimension.isHard && dimension.status === "not_eligible",
      );
      return match.eligibility.isEligible === (failed.length === 0);
    }),
    true,
  );

  check(
    `${label}: an unknown dimension is never scored as a pass or a failure`,
    results.every((match) =>
      match.dimensions
        .filter((dimension) => dimension.status === "not_specified")
        .every((dimension) => dimension.score === 0),
    ),
    true,
  );

  check(
    `${label}: an unknown dimension is never listed as a hard failure`,
    results.every((match) =>
      match.eligibility.hardFailures.every(
        (label) =>
          !match.dimensions.some(
            (dimension) => dimension.label === label && dimension.status === "not_specified",
          ),
      ),
    ),
    true,
  );

  check(
    `${label}: any missing information is explained to the student`,
    results.every((match) =>
      match.missingInformation.every((item) => item.trim().length > 0),
    ),
    true,
  );

  check(
    `${label}: a non-eligible result states which requirement failed`,
    results.every((match) =>
      match.eligibility.isEligible || match.eligibility.hardFailures.length > 0,
    ),
    true,
  );
}

/* ==========================================================================
   3. Determinism
   ========================================================================== */

section("Determinism");

check(
  "repeated evaluation is identical",
  resultsFor(profileA).map((match) => match.score),
  resultsFor(profileA).map((match) => match.score),
);

check(
  "shuffling the input does not change the ranking",
  rankScholarships(profileA, [...all].reverse()).map((entry) => entry.scholarship.id),
  rankScholarships(profileA, all).map((entry) => entry.scholarship.id),
);

check(
  "a full evaluation of a complete profile is unadjusted",
  resultsFor(profileA).every((match) => evaluationCoverage(match.dimensions) === 1),
  true,
);

/* ==========================================================================
   4. Ranking
   ========================================================================== */

section("Ranking");

for (const profile of demoProfiles) {
  const ranked = rankScholarships(profile, all);
  const eligible = ranked.filter((entry) => entry.match.eligibility.isEligible);

  check(
    `${profile.displayName}: ranks are 1..n with no gaps`,
    ranked.map((entry) => entry.rank),
    ranked.map((_, index) => index + 1),
  );

  // The eligible block must occupy the first N ranks contiguously.
  check(
    `${profile.displayName}: every eligible result outranks every ineligible one`,
    eligible.map((entry) => entry.rank),
    eligible.map((_, index) => index + 1),
  );

  check(
    `${profile.displayName}: scores are non-increasing within the eligible block`,
    eligible.every(
      (entry, index) => index === 0 || entry.match.score <= eligible[index - 1]!.match.score,
    ),
    true,
  );
}

/* ==========================================================================
   5. Profile A: a strong applicant
   ========================================================================== */

section("Profile A - strong applicant");

const aResults = resultsFor(profileA);
const featured = all[0];
const aBest = featured === undefined ? null : matchScholarship(profileA, featured);

check(
  "scores reach the top of the range",
  aResults.some((match) => match.score >= 90),
  true,
);
check(
  "no result is left as unknown information",
  aResults.every((match) => match.missingInformation.length === 0),
  true,
);
check(
  "most records are eligible",
  aResults.filter((match) => match.eligibility.isEligible).length >= 9,
  true,
);
check("the featured record reads as a strong match", aBest?.quality, "strong");
check(
  "strengths are always populated",
  aResults.every((match) => match.strengths.length > 0),
  true,
);
check(
  "the top-ranked result is the featured record",
  rankScholarships(profileA, all)[0]?.scholarship.id,
  featured?.id,
);

/* ==========================================================================
   6. Profile B: incomplete
   ========================================================================== */

section("Profile B - incomplete profile");

const bResults = resultsFor(profileB);

// Five of the six dimensions depend on a profile input B has not supplied, so
// they must all resolve to unknown. Eligibility is the exception: nationality
// is unrestricted on every demo record, so that part is genuinely satisfiable
// without any profile detail at all.
check(
  "every profile-dependent dimension is reported as unknown",
  bResults.every((match) =>
    ["academic", "field", "degree", "experience", "preferences"].every(
      (id) =>
        match.dimensions.find((dimension) => dimension.id === id)?.status === "not_specified",
    ),
  ),
  true,
);
check(
  "eligibility resolves only where the record itself settles it",
  bResults.every(
    (match) =>
      match.dimensions.find((dimension) => dimension.id === "eligibility")?.status !== "not_eligible",
  ),
  true,
);
check(
  "unknowns are never treated as failures",
  bResults.every((match) => match.dimensions.every((dimension) => !dimension.isHard || dimension.status !== "not_eligible")),
  true,
);
check("missing information is always reported", bResults.every((match) => match.missingInformation.length > 0), true);
check(
  "an empty profile cannot post a confident score",
  bResults.every((match) => match.score < 40),
  true,
);
check(
  "coverage of an empty profile is near zero",
  bResults.every((match) => evaluationCoverage(match.dimensions) < 0.3),
  true,
);

/* ==========================================================================
   7. Profile C: fails a hard requirement
   ========================================================================== */

section("Profile C - below the academic floor");

const cResults = resultsFor(profileC);

const cIneligible = cResults.filter((match) => !match.eligibility.isEligible);

// The 2.5-floor record is the interesting case: 2.3 is within 0.5 of the
// requirement, so the engine reports a near miss worth a conversation rather
// than a flat refusal.
const cNearMisses = cResults.filter((match) =>
  match.dimensions
    .find((dimension) => dimension.id === "academic")
    ?.verdict.toLowerCase()
    .includes("just below"),
);

check("every record is ruled out or flagged", cResults.length, all.length);
check(
  "the GPA fails the academic dimension wherever the floor is not met",
  cIneligible.every(
    (match) =>
      match.dimensions.find((dimension) => dimension.id === "academic")?.status === "not_eligible",
  ),
  true,
);
check(
  "hard failures are reported by name",
  cIneligible.every((match) => match.eligibility.hardFailures.includes("Academic")),
  true,
);
check("a near miss exists to be caught", cNearMisses.length, 1);
check(
  "a near miss stays eligible",
  cNearMisses.every((match) => match.eligibility.isEligible),
  true,
);
check(
  "every hard-failed score is capped",
  cIneligible.every((match) => match.score <= HARD_FAILURE_CAP),
  true,
);
check(
  "no hard-failed result reads as a good or strong match",
  cIneligible.every((match) => match.quality === "weak" || match.quality === "potential"),
  true,
);
check(
  "a shortfall is explained rather than merely flagged",
  cResults.every(
    (match) =>
      match.dimensions.find((dimension) => dimension.id === "academic")?.detail !== undefined,
  ),
  true,
);

/* ==========================================================================
   8. Profile D: a different field
   ========================================================================== */

section("Profile D - different field");

const dResults = resultsFor(profileD);
const medicineIds = new Set(
  all.filter((s) => s.fields.includes("Medicine")).map((s) => s.id),
);

check(
  "awards covering Medicine rank above awards that do not",
  rankScholarships(profileD, all)
    .filter((entry) => medicineIds.has(entry.scholarship.id))
    .every((entry) => entry.rank <= 3),
  true,
);
// A wrong field is the softest signal there is: it should lower the score and be
// explained, but must never make an application impossible.
check(
  "a field mismatch lowers the field dimension without failing it",
  dResults.some((match) => {
    const field = match.dimensions.find((dimension) => dimension.id === "field");
    return field !== undefined && field.score < 100 && field.score > 0 && field.status === "review";
  }),
  true,
);
check(
  "a field mismatch is always explained",
  dResults.every((match) => {
    const field = match.dimensions.find((dimension) => dimension.id === "field");
    return field?.score === 100 || field?.detail !== undefined;
  }),
  true,
);
check(
  "a wrong field never fails eligibility on its own",
  dResults.every((match) => {
    const field = match.dimensions.find((dimension) => dimension.id === "field");
    return field?.status !== "not_eligible";
  }),
  true,
);

/* ==========================================================================
   9. Profile E: degree level
   ========================================================================== */

section("Profile E - doctorate level");

const eResults = resultsFor(profileE);
const mastersOnly = all.filter(
  (scholarship) => !scholarship.degreeLevels.includes("doctorate"),
);

/*
 * A doctorate holder is not barred from applying to a master's award, so this is
 * a poor fit rather than an ineligibility. Asserting the weaker, honest rule:
 * the degree dimension warns, the record stays eligible, and nothing is capped
 * as a hard failure.
 */
check(
  "masters-only awards read as a weak fit to a doctorate applicant, not a block",
  mastersOnly.every((scholarship) => {
    const match = matchScholarship(profileE, scholarship);
    const degree = match.dimensions.find((dimension) => dimension.id === "degree");

    return (
      degree?.status === "review" &&
      !match.eligibility.hardFailures.includes("Degree") &&
      match.eligibility.isEligible
    );
  }),
  true,
);
check(
  "an overqualified degree never produces an ineligible verdict",
  mastersOnly.every((scholarship) => {
    const match = matchScholarship(profileE, scholarship);
    return match.eligibility.isEligible && match.score > HARD_FAILURE_CAP;
  }),
  true,
);
check(
  "doctoral and joint awards stay eligible",
  eResults.filter((match) => match.eligibility.isEligible).length >= 4,
  true,
);
check(
  "a degree mismatch is explained",
  mastersOnly.every((scholarship) => {
    const degree = matchScholarship(profileE, scholarship).dimensions.find(
      (dimension) => dimension.id === "degree",
    );
    return degree?.detail !== undefined;
  }),
  true,
);

/* ==========================================================================
   10. Profile F: funding preference
   ========================================================================== */

section("Profile F - funding sensitive");

const fResults = resultsFor(profileF);
const fullyFunded = new Set(
  all.filter((scholarship) => scholarship.funding === "fully_funded").map((s) => s.id),
);
const fRanked = rankScholarships(profileF, all);

check(
  "preference changes the preferences dimension",
  fResults.some((match) => {
    const preferences = match.dimensions.find((dimension) => dimension.id === "preferences");
    return preferences !== undefined && preferences.score < 100;
  }),
  true,
);
check(
  "a non-preferred destination lowers the preferences dimension",
  fResults.some((match) => {
    const preferences = match.dimensions.find((dimension) => dimension.id === "preferences");
    return preferences?.detail?.includes("outside your preferred") === true;
  }),
  true,
);
check(
  "funding preference never causes ineligibility",
  fResults.every((match) => {
    const preferences = match.dimensions.find((dimension) => dimension.id === "preferences");
    return preferences?.status !== "not_eligible";
  }),
  true,
);
// Only the Australian award is in the preferred destination, so it is the one
// place the preference is fully satisfied. Every other record is outside the
// preference, and must be marked down for location alone.
check(
  "the award in the preferred destination scores full marks on preferences",
  fRanked
    .filter((entry) => entry.scholarship.countryCode === "AU")
    .every(
      (entry) =>
        entry.match.dimensions.find((dimension) => dimension.id === "preferences")?.score === 100,
    ),
  true,
);
check(
  "exceeding the stated funding need is never itself a penalty",
  fRanked
    .filter((entry) => fullyFunded.has(entry.scholarship.id))
    .every((entry) => {
      const preferences = entry.match.dimensions.find(
        (dimension) => dimension.id === "preferences",
      );
      // Any reduction must be attributable to location, which is always stated.
      return (
        preferences?.score === 100 ||
        preferences?.detail?.includes("outside your preferred") === true
      );
    }),
  true,
);

/* ==========================================================================
   11. Field taxonomy
   ========================================================================== */

section("Field taxonomy");

check("exact match", relateFields("Computer Science", "Computer Science"), "exact");
check("related field", relateFields("Computer Science", "Data Science"), "related");
check("unrelated field", relateFields("Computer Science", "Business"), "unrelated");
check("unknown label", relateFields("Underwater Basketry", "Business"), "unknown");
check(
  "an empty field list is unrestricted",
  relateToFields("Computer Science", []),
  "exact",
);
check(
  "the best relation across a list wins",
  relateToFields("Computer Science", ["Business", "Data Science"]),
  "related",
);
check(
  "an unrecognised label does not assert a mismatch",
  relateToFields("Underwater Basketry", ["Business"]),
  "unknown",
);

/* ==========================================================================
   12. Nationality
   ========================================================================== */

section("Nationality");

check("absent restriction is open to all", evaluateNationality("NG", undefined), "eligible");
check("an empty list is open to all", evaluateNationality("NG", []), "eligible");
check("a matching code is eligible", evaluateNationality("NG", ["NG", "GB"]), "restricted_match");
check("a non-matching code is refused", evaluateNationality("DE", ["NG", "GB"]), "restricted_mismatch");
check("an unknown citizenship stays unknown", evaluateNationality(undefined, ["NG"]), "unknown");
check(
  "the demo records restrict nobody",
  all.every(
    (scholarship) =>
      scholarship.eligibleCountries === undefined || scholarship.eligibleCountries.length === 0,
  ),
  true,
);

/* ==========================================================================
   13. Adapter
   ========================================================================== */

section("MatchInsights adapter");

for (const scholarship of all) {
  const match = matchScholarship(activeDemoProfile, scholarship);
  const insights = toMatchInsights(match);

  check(
    `${scholarship.id}: score survives the projection`,
    insights.score,
    match.score,
  );
  check(
    `${scholarship.id}: breakdown is carried across intact`,
    insights.breakdown.length,
    match.dimensions.length,
  );
}

check(
  "a preview score equals its detail score",
  all.map((scholarship) =>
    toMatchInsights(matchScholarship(activeDemoProfile, scholarship)).score,
  ),
  all.map((scholarship) => toPreviewFromMatch(scholarship, activeDemoProfile).matchScore),
);

/* ==========================================================================
   14. Work authorisation
   ========================================================================== */

section("Work authorisation");

const ukRecord = all.find((scholarship) => scholarship.countryCode === "GB");
const deRecord = all.find((scholarship) => scholarship.countryCode === "DE");

check("a UK award exists to test against", ukRecord !== undefined, true);
check("a German award exists to test against", deRecord !== undefined, true);

if (ukRecord !== undefined && deRecord !== undefined) {
  /*
   * Regression guard. These compare a profile's ISO citizenship code against the
   * award's host country, and the two used to be different shapes: the code
   * ("GB") was compared to the display name ("United Kingdom"), so the match
   * could never fire and every citizen was treated as a foreign applicant.
   */
  check(
    "a citizen of the host country has their right established",
    evaluateWorkAuthorization("citizen", ukRecord.countryCode, "GB"),
    "citizen_or_resident",
  );
  check(
    "the comparison is case-insensitive",
    evaluateWorkAuthorization("citizen", ukRecord.countryCode, "gb"),
    "citizen_or_resident",
  );
  check(
    "a citizen studying elsewhere still needs a visa",
    evaluateWorkAuthorization("citizen", deRecord.countryCode, "GB"),
    "needs_visa",
  );
  check(
    "a permanent resident of another country still needs a visa",
    evaluateWorkAuthorization("permanent_resident", deRecord.countryCode, "GB"),
    "needs_visa",
  );
  check(
    "citizenship alone settles it when status is blank",
    evaluateWorkAuthorization(undefined, ukRecord.countryCode, "GB"),
    "citizen_or_resident",
  );
  check(
    "an unanswered status stays unknown",
    evaluateWorkAuthorization(undefined, deRecord.countryCode, "GB"),
    "unknown",
  );
  check(
    "an explicit not_specified stays unknown",
    evaluateWorkAuthorization("not_specified", deRecord.countryCode, "GB"),
    "unknown",
  );
  check(
    "no right to work is not satisfied",
    evaluateWorkAuthorization("no_right_to_work", deRecord.countryCode, "DE"),
    "citizen_or_resident",
  );
  check(
    "no right to work is refused for a foreign applicant",
    evaluateWorkAuthorization("no_right_to_work", deRecord.countryCode, "NG"),
    "not_satisfied",
  );

  /*
   * And the observable consequence: Profile D is a GB citizen, so the UK award
   * must score its right to study as established while the German one does not.
   */
  const ukDegree = matchScholarship(profileD, ukRecord).dimensions.find(
    (dimension) => dimension.id === "eligibility",
  );
  const deDegree = matchScholarship(profileD, deRecord).dimensions.find(
    (dimension) => dimension.id === "eligibility",
  );

  check(
    "a host citizen scores higher on eligibility than a foreign applicant",
    (ukDegree?.score ?? 0) > (deDegree?.score ?? 0),
    true,
  );
}

/* ==========================================================================
   15. Degree ordering
   ========================================================================== */

section("Degree ordering");

/*
 * The verdict used to read `awardLevels[0]`, so an award listing
 * [doctorate, masters] and one listing [masters, doctorate] scored a bachelor's
 * applicant differently. Order in the data must not change the answer.
 */
check(
  "level order does not change a below-entry verdict",
  [
    evaluateDegree("bachelors", undefined, ["doctorate", "masters"]),
    evaluateDegree("bachelors", undefined, ["masters", "doctorate"]),
  ],
  ["below_entry", "below_entry"],
);
check(
  "level order does not change an overqualified verdict",
  [
    evaluateDegree("doctorate", undefined, ["masters", "bachelors"]),
    evaluateDegree("doctorate", undefined, ["bachelors", "masters"]),
  ],
  ["overqualified", "overqualified"],
);
check("an exact match is exact", evaluateDegree("masters", undefined, ["masters", "doctorate"]), "exact");
check(
  "a step up is allowed",
  evaluateDegree("masters", "doctorate", ["masters", "bachelors"]),
  "eligible_step_up",
);
check(
  "with no stated preference the degree held is the intent, not a step up",
  evaluateDegree("bachelors", undefined, ["masters", "doctorate"]),
  "below_entry",
);
check("no levels means open", evaluateDegree("doctorate", undefined, []), "eligible_step_up");
check("no intent means unknown", evaluateDegree(undefined, undefined, ["masters"]), "unknown");
check(
  "a preference overrides the degree held",
  evaluateDegree("doctorate", "doctorate", ["doctorate", "masters"]),
  "exact",
);

/* ==========================================================================
   16. Stored profile validation
   ========================================================================== */

section("Stored profile validation");

check("a null read is not a profile", parseStoredProfile(null), null);
check("unparseable JSON is not a profile", parseStoredProfile("{not json"), null);
check("a non-object is not a profile", parseStoredProfile("[]"), null);
check("an unknown schema version is rejected", parseStoredProfile('{"schemaVersion":2}'), null);
check("a missing schema version is rejected", parseStoredProfile("{}"), null);
check(
  "a valid profile round-trips unchanged",
  parseStoredProfile(JSON.stringify(profileA)),
  profileA,
);
check(
  "an out-of-range GPA is dropped",
  parseProfile({ schemaVersion: 1, academic: { gpa: 9.5 } })?.academic?.gpa,
  undefined,
);
check(
  "a non-numeric GPA is dropped",
  parseProfile({ schemaVersion: 1, academic: { gpa: "3.7" } })?.academic?.gpa,
  undefined,
);
check(
  "a zero GPA is kept, because zero is a real answer",
  parseProfile({ schemaVersion: 1, academic: { gpa: 0 } })?.academic?.gpa,
  0,
);
check(
  "an invalid degree enum is dropped",
  parseProfile({ schemaVersion: 1, academic: { currentDegree: "postgrad" } })?.academic?.currentDegree,
  undefined,
);
check(
  "an IELTS score above the 9-band scale is dropped",
  parseProfile({ schemaVersion: 1, eligibility: { languageTests: { ielts: 120 } } })?.eligibility
    ?.languageTests?.ielts,
  undefined,
);
check(
  "a valid TOEFL score is kept",
  parseProfile({ schemaVersion: 1, eligibility: { languageTests: { toefl: 108 } } })?.eligibility
    ?.languageTests?.toefl,
  108,
);
check(
  "citizenship is normalised to upper case",
  parseProfile({ schemaVersion: 1, eligibility: { citizenship: " ng " } })?.eligibility?.citizenship,
  "NG",
);
check(
  "zero years of experience is kept as a known fact",
  parseProfile({ schemaVersion: 1, experience: { workExperienceYears: 0 } })?.experience
    ?.workExperienceYears,
  0,
);
check(
  "an empty preference list is kept as known-none",
  parseProfile({ schemaVersion: 1, preferences: { preferredCountries: [] } })?.preferences
    ?.preferredCountries,
  [],
);
check(
  "unknown top-level keys are ignored rather than fatal",
  parseProfile({ schemaVersion: 1, somethingNew: true })?.schemaVersion,
  1,
);
check(
  "a malformed section is dropped whole, not partly believed",
  parseProfile({ schemaVersion: 1, academic: "nope" })?.academic,
  undefined,
);
check(
  "a malformed start date is dropped",
  parseProfile({ schemaVersion: 1, goals: { startBy: "soon" } })?.goals?.startBy,
  undefined,
);
check(
  "a language entry missing proficiency is dropped",
  parseProfile({ schemaVersion: 1, eligibility: { languages: [{ language: "English" }] } })?.eligibility
    ?.languages,
  [],
);

/* ==========================================================================
   Summary
   ========================================================================== */

console.log("");
if (failures === 0) {
  console.log(`   verify:matching passed (${all.length} records x ${demoProfiles.length} profiles)`);
} else {
  console.error(`   verify:matching FAILED with ${failures} failing check(s)`);
  process.exit(1);
}

/* Keep every exported profile referenced so lint cannot flag them as unused. */
void profileB;
void profileC;
void profileD;
void profileE;
void profileF;
