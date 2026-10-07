import { allScholarships } from "@/lib/scholarships";
import { realScholarships } from "@/lib/real";
import { validateAll } from "@/lib/real/validate";

let failures = 0;

function check(label: string, condition: boolean, expected?: unknown) {
  const outcome = expected === undefined ? condition : condition === expected;
  if (outcome) {
    console.log(`  ok ${label}`);
  } else {
    failures += 1;
    console.error(`  FAIL ${label}`);
  }
}

const real = realScholarships();
const all = allScholarships();

console.log("\nReal sourced records");
console.log(`      (count: ${real.length})`);

/* 1. Every sourced record passes the shape validators. */
const issues = validateAll(real);
check(
  "validateAll returns no issues",
  issues.length === 0,
  true,
);
for (const issue of issues) {
  console.error(`      ${issue.id}: ${issue.field} — ${issue.message}`);
}

/* 2. No demo records live in the real layer and vice versa. */
check(
  "real records never use the demo- prefix",
  real.every((s) => !s.id.startsWith("demo-")),
  true,
);
check(
  "all real records are marked as sourced",
  real.every((s) => s.officialSource.isDemo === false),
  true,
);
const realIds = new Set(real.map((s) => s.id));
check(
  "ids are unique across the whole collection",
  all.length === new Set(all.map((s) => s.id)).size,
  true,
);

/* 3. Every sourced record carries a verified provider URL. */
check(
  "every sourced record has a verified provider URL",
  real.every((s) => typeof s.officialSource.verifiedUrl === "string"),
  true,
);

/* 4. Every sourced record states when it was last verified. */
check(
  "every sourced record has a lastVerified date",
  real.every(
    (s) =>
      typeof s.officialSource.lastVerified === "string" &&
      /^\d{4}-\d{2}-\d{2}$/.test(s.officialSource.lastVerified as string),
  ),
  true,
);

/* 5. Every sourced record injects the shared journey and mistakes lists. */
check(
  "sourced records share the application journey",
  real.every((s) => s.journey.length > 0),
  true,
);
check(
  "sourced records share the common mistakes list",
  real.every((s) => s.commonMistakes.length > 0),
  true,
);

/* 6. Language tests listed without a threshold are handled by the engine. */
const untested = real.filter((s) => s.languageRequirements === undefined && s.languageTests.length > 0);
check(
  "language tests without thresholds are part of a recorded note",
  untested.every((s) => s.languageNote !== undefined),
  true,
);

console.log(failures === 0 ? "\nALL PASS" : `\n${failures} FAILURE(S)`);
process.exit(failures === 0 ? 0 : 1);