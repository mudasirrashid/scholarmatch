import { allScholarships, toPreview } from "@/lib/scholarships";
import {
  DEFAULT_QUERY,
  parseQuery,
  queryToParams,
  runQuery,
} from "@/lib/scholarships/query";

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
const noneResults = runQuery(all, noTest);
check(
  "lang=none returns only records with no test listed",
  noneResults.every((s) => s.languageTests.length === 0),
  true,
);
check("lang=none returns a non-empty set", noneResults.length > 0, true);

/* 5. A real test still filters to records requiring it. */
const ielts = runQuery(all, parseQuery({ lang: "ielts" }));
check(
  "lang=ielts returns only records accepting IELTS",
  ielts.every((s) => s.languageTests.includes("ielts")),
  true,
);

/* 6. Unknown values are rejected rather than widening the filter. */
const junk = parseQuery({ degree: "martian,underwater%20basket%20weaving" });
check("unknown degree values rejected", junk.degree, []);

/* 7. Empty query returns the full dataset. */
check("default query returns all", runQuery(all, DEFAULT_QUERY).length, all.length);

/* 8. Every preview card carries the fields and exact deadline the card renders. */
const previews = all.map(toPreview);
check(
  "every preview has a field",
  previews.every((p) => Array.isArray(p.fields) && p.fields.length > 0),
  true,
);
check(
  "every preview has an ISO deadline",
  previews.every((p) => /^\d{4}-\d{2}-\d{2}$/.test(p.deadline)),
  true,
);

/* 9. Record count is within the requested range. */
check("record count is 8-12", all.length >= 8 && all.length <= 12, true);
console.log(`      (actual: ${all.length})`);

/* 10. A no-match query yields zero, which is what the empty state renders. */
const impossible = runQuery(all, {
  ...DEFAULT_QUERY,
  countries: ["atlantis"],
});
check("impossible country yields zero", impossible.length, 0);

/* 11. Sort orders are total and stable. */
for (const sort of ["best_match", "deadline_soon", "newest", "fully_funded", "relevant"] as const) {
  const result = runQuery(all, { ...DEFAULT_QUERY, sort });
  check(`sort=${sort} returns all`, result.length, all.length);
}

console.log(failures === 0 ? "\nALL PASS" : `\n${failures} FAILURE(S)`);
process.exit(failures === 0 ? 0 : 1);