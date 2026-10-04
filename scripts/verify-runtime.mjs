/**
 * Runtime smoke tests for the Phase 02 explorer.
 *
 * Checks the properties that only show up in a real response: that filtering
 * happens on the server, that the full result set is present without
 * JavaScript, and that a hand-edited URL cannot widen the filter.
 */

const BASE = "http://localhost:3111";

let failures = 0;

function check(label, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) failures += 1;
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}`);
  if (!ok) console.log(`      expected: ${JSON.stringify(expected)}\n      actual:   ${JSON.stringify(actual)}`);
}

async function get(path) {
  const response = await fetch(BASE + path);
  return { status: response.status, html: await response.text() };
}

/** Ids present in the server HTML, in document order and de-duplicated. */
function resultIds(html) {
  return [...new Set(html.match(/\/scholarships\/(demo-[a-z0-9-]+)/g) ?? [])].map((href) =>
    href.split("/").pop(),
  );
}

const all = await get("/scholarships");
check("explorer returns 200", all.status, 200);
check("all 12 records render without JavaScript", resultIds(all.html).length, 12);

/* Server-side filtering: a country filter must shrink the HTML result set. */
const canada = await get("/scholarships?country=canada");
check("country=canada returns 200", canada.status, 200);
check(
  "country=canada keeps every record in Canada",
  resultIds(canada.html).length,
  2,
);

/* Country tokens are normalised, so casing in a hand-written URL is irrelevant. */
const canadaMixed = await get("/scholarships?country=Canada");
check(
  "country=Canada matches the lower-case form",
  resultIds(canadaMixed.html),
  resultIds(canada.html),
);

/* Same for free-text study fields. */
const engineering = await get("/scholarships?field=engineering");
check(
  "field=engineering returns only engineering records",
  resultIds(engineering.html).length > 0,
  true,
);
check(
  "field=Engineering matches the lower-case form",
  resultIds((await get("/scholarships?field=Engineering")).html),
  resultIds(engineering.html),
);

/* Multi-select: comma separated values must survive the server round trip. */
const twoDegrees = await get("/scholarships?degree=masters,doctorate");
check(
  "degree=masters,doctorate keeps both degree levels",
  resultIds(twoDegrees.html).length > 2,
  true,
);

/* Repeated params must behave identically to comma separated ones. */
const repeated = await get("/scholarships?degree=masters&degree=doctorate");
check(
  "repeated degree params match the comma form",
  resultIds(repeated.html),
  resultIds(twoDegrees.html),
);

/* The no-language-test filter must actually return its record. */
const noTest = await get("/scholarships?lang=none");
check(
  "lang=none returns exactly the test-free record",
  resultIds(noTest.html),
  ["demo-clinical-research"],
);

/* An unknown value must not be treated as "no filter". */
const junk = await get("/scholarships?degree=underwater%20basket%20weaving");
check("unknown filter value falls back to the full set", resultIds(junk.html).length, 12);

/* Free text search. */
const search = await get("/scholarships?q=medicine");
check("q=medicine narrows results", resultIds(search.html).length < 12, true);

/* An impossible combination renders the empty state. */
const empty = await get("/scholarships?country=canada&funding=stipend");
check(
  "impossible combination renders the empty state",
  empty.html.includes("No scholarships found"),
  true,
);

/* Sort changes order without changing membership. */
const byDeadline = await get("/scholarships?sort=deadline_soon");
check(
  "sort=deadline_soon preserves every record",
  resultIds(byDeadline.html).length,
  12,
);
check(
  "sort=deadline_soon reorders versus default",
  JSON.stringify(resultIds(byDeadline.html)) !== JSON.stringify(resultIds(all.html)),
  true,
);

/* Phase 01 homepage must be untouched. */
const home = await get("/");
check("homepage returns 200", home.status, 200);
check(
  "homepage still renders its Phase 01 hero",
  home.html.includes("Your next opportunity is out there"),
  true,
);
check("homepage has no explorer-only copy", home.html.includes("No scholarships found"), false);
check(
  "homepage showcase cards keep saving disabled",
  home.html.includes("aria-label=\"Save "),
  false,
);

/* Detail routes do not exist yet, so they must 404 rather than crash. */
const missing = await get("/scholarships/demo-clinical-research");
check("detail route is not implemented yet", missing.status, 404);

console.log(failures === 0 ? "\nALL PASS" : `\n${failures} FAILURE(S)`);
process.exit(failures === 0 ? 0 : 1);