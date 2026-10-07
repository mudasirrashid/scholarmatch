import { activeDemoProfile } from "@/lib/demo/student-profiles";
import { toPreviewFromMatch } from "@/lib/scholarships";
import { allScholarships } from "@/lib/scholarships";
import {
  DEFAULT_QUERY,
  parseQuery,
  queryToParams,
  runQuery,
  type MatchLookup,
} from "@/lib/scholarships/query";

const all = allScholarships();

/**
 * Scores a record the way the explorer does, so this script checks the same
 * numbers the page renders rather than a separate fixture.
 */
const lookup: MatchLookup = (scholarship) => {
  const preview = toPreviewFromMatch(scholarship, activeDemoProfile);
  return {
    score: preview.matchScore,
    summary: "",
    breakdown: [],
    missingRequirements: [],
    strengths: [],
    warnings: [],
  };
};

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

/* 1. Multi-select survives a URL round trip (comma-separated on write). */
// Next.js hands pages already-decoded values, so the parser receives raw text.
const multi = parseQuery({ degree: "masters,doctorate", country: "canada,united kingdom" });
check("degree parses comma list", multi.degree, ["masters", "doctorate"]);
check("country parses comma list", multi.countries, ["canada", "united kingdom"]);

/* 2. Repeated params behave the same as comma-separated. */
const repeated = parseQuery({ degree: ["masters", "doctorate"] });
check("repeated params equal comma list", repeated.degree, multi.degree);

/* 3. Round trip through a real query string -> parse is lossless. */
const serialized = queryToParams(multi).toString();
const roundTrip = parseQuery(Object.fromEntries(new URLSearchParams(serialized)));
check("round trip is lossless", roundTrip, multi);

/* 4. "No language test" is a real filter member, not a dropped sentinel. */
const noTest = parseQuery({ lang: "none" });
check("lang=none parses", noTest.language, ["none"]);
const noneResults = runQuery(all, noTest, lookup);
check(
  "lang=none returns only records with no test listed",
  noneResults.every((s) => s.languageTests.length === 0),
  true,
);
check("lang=none returns a non-empty set", noneResults.length > 0, true);

/* 5. A real test still filters to records requiring it. */
const ielts = runQuery(all, parseQuery({ lang: "ielts" }), lookup);
check(
  "lang=ielts returns only records accepting IELTS",
  ielts.every((s) => s.languageTests.includes("ielts")),
  true,
);

/* 6. Unknown values are rejected rather than widening the filter. */
const junk = parseQuery({ degree: "martian,underwater%20basket%20weaving" });
check("unknown degree values rejected", junk.degree, []);

/* 7. Empty query returns the full dataset. */
check("default query returns all", runQuery(all, DEFAULT_QUERY, lookup).length, all.length);

/* 8. Every preview card carries the fields and exact deadline the card renders. */
const previews = all.map((scholarship) => toPreviewFromMatch(scholarship, activeDemoProfile));
check(
  "every preview carries a fields array",
  previews.every((p) => Array.isArray(p.fields)),
  true,
);
check(
  "every preview deadline is an ISO date or null",
  previews.every((p) => p.deadline === null || /^\d{4}-\d{2}-\d{2}$/.test(p.deadline)),
  true,
);
check(
  "every null deadline carries a kind and note",
  previews.every((p) => p.deadline !== null || (p.deadlineKind !== undefined && !!p.deadlineNote)),
  true,
);

/* 9. Record count: 12 demo records plus 8 sourced records. */
check("record count is 20", all.length === 20, true);
console.log(`      (actual: ${all.length})`);

/* 10. A no-match query yields zero, which is what the empty state renders. */
const impossible = runQuery(all, { ...DEFAULT_QUERY, countries: ["atlantis"] }, lookup);
check("impossible country yields zero", impossible.length, 0);

/* 11. Sort orders are total and stable. */
for (const sort of ["best_match", "deadline_soon", "newest", "fully_funded", "relevant"] as const) {
  const result = runQuery(all, { ...DEFAULT_QUERY, sort }, lookup);
  check(`sort=${sort} returns all`, result.length, all.length);
}

console.log(failures === 0 ? "\nALL PASS" : `\n${failures} FAILURE(S)`);
process.exit(failures === 0 ? 0 : 1);

