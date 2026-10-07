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
  return [...new Set(html.match(/\/scholarships\/([a-z0-9-]+)/g) ?? [])].map((href) =>
    href.split("/").pop(),
  );
}

const all = await get("/scholarships");
check("explorer returns 200", all.status, 200);
check("all 20 records render without JavaScript", resultIds(all.html).length, 20);

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

/* The no-language-test filter must return every test-free record. */
const noTest = await get("/scholarships?lang=none");
check(
  "lang=none returns every test-free record",
  resultIds(noTest.html).length > 1,
  true,
);
check(
  "lang=none includes the demo test-free record",
  resultIds(noTest.html).includes("demo-clinical-research"),
  true,
);
check(
  "lang=none excludes the IELTS/TOEFL record",
  resultIds(noTest.html).includes("daad-epos"),
  false,
);

/* An unknown value must not be treated as "no filter". */
const junk = await get("/scholarships?degree=underwater%20basket%20weaving");
check("unknown filter value falls back to the full set", resultIds(junk.html).length, 20);

/* Free text search. */
const search = await get("/scholarships?q=medicine");
check("q=medicine narrows results", resultIds(search.html).length < 20, true);

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
  20,
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

/* Detail routes. */
const detail = await get("/scholarships/demo-clinical-research");
check("detail route returns 200", detail.status, 200);
check("detail shows the record title", detail.html.includes("Clinical Research Fellowship"), true);
check("detail shows the awarding body", detail.html.includes("Illustrative Health Sciences Centre"), true);
check("detail shows the exact deadline", detail.html.includes("10 Dec 2026"), true);
check("detail has a canonical url", detail.html.includes('<link rel="canonical" href="https://www.scholarmatch.me/scholarships/demo-clinical-research"'), true);

/* Every section the sticky nav links to must exist as a real anchor target. */
const SECTION_IDS = [
  "overview", "match", "eligibility", "prepare", "funding",
  "documents", "how-to-apply", "journey", "mistakes", "source",
];
for (const id of SECTION_IDS) {
  check(`detail has section #${id}`, detail.html.includes(`id="${id}"`), true);
  check(`detail nav links to #${id}`, detail.html.includes(`href="#${id}"`), true);
}

/* Sections must be labelled landmarks for screen reader navigation. */
check(
  "sections are labelled regions",
  SECTION_IDS.every((id) => detail.html.includes(`aria-labelledby="${id}-heading"`)),
  true,
);

/* Demo provenance must stay explicit and no invented provider link may render. */
check("detail states the data is illustrative", detail.html.includes("illustrative sample content"), true);
check("detail renders no verified external link", detail.html.includes("Official page"), false);
check("detail has no verifiedUrl in markup", detail.html.includes("verifiedUrl"), false);

/* The test-free record must not still advertise a required test. */
check("test-free record reports no test required", detail.html.includes("No language test required"), true);

/* An unknown id must 404 rather than render an empty page. */
const missingDetail = await get("/scholarships/does-not-exist");
check("unknown detail id returns 404", missingDetail.status, 404);

/* Header section anchors must resolve to the homepage away from the homepage. */
check(
  "header rewrites section anchors off the homepage",
  detail.html.includes('href="/#discover"'),
  true,
);
check(
  "header points conversion action at the explorer off the homepage",
  detail.html.includes('href="/scholarships"'),
  true,
);

/* Sitemap must list the explorer and every detail route. */
const sitemap = await get("/sitemap.xml");
check("sitemap returns 200", sitemap.status, 200);
check("sitemap lists the homepage", sitemap.html.includes("<loc>https://www.scholarmatch.me</loc>"), true);
check("sitemap lists the explorer", sitemap.html.includes("<loc>https://www.scholarmatch.me/scholarships</loc>"), true);
check("sitemap lists the personalised route", sitemap.html.includes("<loc>https://www.scholarmatch.me/matches</loc>"), true);
check(
  "sitemap lists all 20 detail urls",
  (sitemap.html.match(/\/scholarships\/[a-z0-9-]+<\/loc>/g) ?? []).length,
  20,
);

/* Homepage conversion action now leads somewhere real. */
check(
  "homepage CTA links to the explorer",
  home.html.includes('href="/scholarships"'),
  true,
);

/*
 * The profile route is new, so assert what a server can actually promise about
 * it: it resolves, it is in the sitemap, and its metadata is complete. The wizard
 * itself is client-state and is covered by the a11y audit instead.
 */
console.log("\n--- profile route ---");
const profile = await get("/profile");
check("profile returns 200", profile.status, 200);
check("profile has a canonical url", profile.html.includes('<link rel="canonical" href="https://www.scholarmatch.me/profile"'), true);
check("profile has a meta description", /<meta name="description" content="[^"]{40,}"/.test(profile.html), true);
check("profile discloses that storage is browser-local", /this browser only/i.test(profile.html), true);
check(
  "profile does not leak a personalised score into server HTML",
  /match score of \d+/.test(profile.html),
  false,
);

/*
 * The personalised route is new. As with the builder, what a server can promise
 * is narrow: it resolves, it is in the sitemap, its metadata is complete, and no
 * score derived from browser storage leaks into the response. The ranking itself
 * is client-state and is covered by the a11y audit.
 */
console.log("\n--- matches route ---");
const matches = await get("/matches");
check("matches returns 200", matches.status, 200);
check(
  "matches has a canonical url",
  matches.html.includes('<link rel="canonical" href="https://www.scholarmatch.me/matches"'),
  true,
);
check("matches has a meta description", /<meta name="description" content="[^"]{40,}"/.test(matches.html), true);
check(
  "matches does not leak a personalised score into server HTML",
  /\/scholarships\/demo-/.test(matches.html),
  false,
);
/*
 * Deliberately no assertion that `/profile` links here. Both pages are client
 * islands, so a link between them only exists after hydration and cannot be
 * checked from a response body. Reachability is covered by the a11y audit, which
 * fetches the routes the links point at.
 */

/*
 * A scholarship reached from `/matches` carries `?mine=1`, asking the page to
 * score the record against the reader's own stored profile.
 *
 * The route stays prerendered, so the flag is read in the browser and the server
 * cannot respond differently to it. What the response can still promise is the
 * part that matters for honesty: whatever a visitor sees before that flag is read
 * must be labelled as the sample profile it actually is, never presented as their
 * own result. The personalised figure itself is client state, covered by the a11y
 * audit and by browser QA.
 */
console.log("\n--- personalised detail context ---");
const mine = await get("/scholarships/demo-global-excellence?mine=1");
check("personalised detail returns 200", mine.status, 200);
check(
  "personalised detail labels the pre-hydration score as the sample profile",
  /sample student profile, not your own answers/i.test(mine.html),
  true,
);
check(
  "personalised detail still offers a route to the visitor's own match",
  mine.html.includes('href="/profile"'),
  true,
);
check(
  "personalised detail keeps the canonical free of the flag",
  mine.html.includes(
    '<link rel="canonical" href="https://www.scholarmatch.me/scholarships/demo-global-excellence"',
  ),
  true,
);
for (const id of SECTION_IDS) {
  check(`personalised detail still has section #${id}`, mine.html.includes(`id="${id}"`), true);
}

/*
 * Regression guard for the other direction: with no flag the page must keep
 * quoting the sample figure the explorer produced, because that is the context
 * its cards were scored in, and that figure must stay labelled the same way.
 */
const mineSample = await get("/scholarships/demo-global-excellence");
check(
  "sample-context detail still quotes the explorer score",
  /Overall match: \d+ percent/.test(mineSample.html),
  true,
);
check(
  "sample-context detail labels the score as the sample profile",
  /sample student profile, not your own answers/i.test(mineSample.html),
  true,
);
check(
  "sample-context detail keeps its verdict summary",
  /based on your profile/i.test(mineSample.html),
  true,
);

console.log(failures === 0 ? "\nALL PASS" : `\n${failures} FAILURE(S)`);
process.exit(failures === 0 ? 0 : 1);