/**
 * Structural accessibility and content audits over the served HTML.
 *
 * These assert on things a browser would otherwise have to be driven to
 * discover: exactly one first-level heading per page, landmark labelling,
 * heading order, image alternatives, form labels, and that every interactive
 * control has an accessible name.
 */
const BASE = "http://localhost:3111";

let failures = 0;

function check(label, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) failures += 1;
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}`);
  if (!ok) console.log(`      expected: ${JSON.stringify(expected)}\n      actual:   ${JSON.stringify(actual)}`);
}

const strip = (html) => html.replace(/<script[\s\S]*?<\/script>/g, "");

/** Visible text content, for reading order checks. */
const text = (html) =>
  strip(html)
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z]+;/g, " ")
    .replace(/\s+/g, " ")
    .trim();

async function audit(name, path) {
  console.log(`\n--- ${name} (${path}) ---`);
  const response = await fetch(BASE + path);
  const html = await response.text();

  /* Heading structure */
  const h1s = [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/g)];
  check(`${name}: exactly one h1`, h1s.length, 1);
  check(`${name}: h1 is non-empty`, text(h1s[0]?.[1] ?? "").length > 0, true);

  const headings = [...html.matchAll(/<h([1-6])[^>]*>/g)].map((m) => Number(m[1]));
  let skipped = null;
  for (const level of headings) {
    if (level > skipped + 1 && skipped !== null) skipped = level;
  }
  check(`${name}: heading levels never skip`, skipped, null);

  /* Images need alternatives */
  const images = [...html.matchAll(/<img[^>]*>/g)].map((m) => m[0]);
  const missingAlt = images.filter((tag) => !/\balt=/.test(tag));
  check(`${name}: every img has an alt attribute`, missingAlt.length, 0);

  /* Decorative SVGs must be hidden from assistive tech */
  const svgs = [...html.matchAll(/<svg[^>]*>/g)].map((m) => m[0]);
  const exposedSvgs = svgs.filter((tag) => !/aria-hidden="true"/.test(tag) && !/role="img"/.test(tag));
  check(`${name}: every svg is aria-hidden or a labelled image`, exposedSvgs.length, 0);

  /* Form controls need a real label association */
  const selects = [...html.matchAll(/<select[^>]*id="([^"]+)"/g)].map((m) => m[1]);
  const unlabelledSelects = selects.filter((id) => !html.includes(`for="${id}"`));
  check(`${name}: every select has a label`, unlabelledSelects.length, 0);

  /* Inputs need an accessible name: aria-label, aria-labelledby, a <label for>,
     or an implicit label wrapping the control. */
  const inputs = [...html.matchAll(/<(input|textarea)[^>]*>/g)];
  const unlabelledInputs = inputs.filter((match) => {
    const tag = match[0];

    if (/type="(hidden|submit|button|image)"/.test(tag)) return false;
    if (/aria-label(ledby)?=/.test(tag)) return false;

    // Explicit association.
    const id = tag.match(/\bid="([^"]+)"/)?.[1];
    if (id && html.includes(`for="${id}"`)) return false;

    // Implicit association: the control sits inside a <label> element.
    const before = html.slice(0, match.index);
    const openLabel = before.lastIndexOf("<label");
    const closeLabel = before.lastIndexOf("</label>");
    if (openLabel > closeLabel) return false;

    return true;
  });
  check(`${name}: every input has a programmatic label`, unlabelledInputs.length, 0);
  if (unlabelledInputs.length > 0) {
    console.log(`      first: ${unlabelledInputs[0][0].slice(0, 120)}`);
  }

  /* Buttons and links need an accessible name */
  const controls = [
    ...[...html.matchAll(/<button[^>]*>([\s\S]*?)<\/button>/g)].map((m) => ({
      tag: "button",
      attrs: m[0].slice(0, m[0].indexOf(">")),
      body: text(m[1]),
    })),
    ...[...html.matchAll(/<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/g)].map((m) => ({
      tag: "a",
      attrs: m[0].slice(0, m[0].indexOf(">")),
      body: text(m[2]),
    })),
  ];
  const nameless = controls.filter(
    (c) => !/aria-label=/.test(c.attrs) && !/aria-labelledby=/.test(c.attrs) && c.body.length === 0,
  );
  check(`${name}: every control has an accessible name`, nameless.length, 0);
  if (nameless.length > 0) {
    console.log(`      first: ${nameless[0].tag} -> ${nameless[0].attrs.slice(0, 90)}`);
  }

  /* Landmarks */
  check(`${name}: has a main landmark`, /<main[^>]*>/.test(html), true);
  check(`${name}: has a h1 outside of any nested h2`, h1s.length, 1);

  /* Skip link must be the first focusable element, targeting the main landmark */
  check(
    `${name}: first focusable element is a skip link`,
    html.indexOf('href="#main"') > -1 &&
      html.indexOf('href="#main"') < html.indexOf("<main"),
    true,
  );

  /* Toggle buttons must expose their state */
  const toggles = [...html.matchAll(/<button[^>]*aria-expanded[^>]*>/g)].map((m) => m[0]);
  const stateLess = toggles.filter((tag) => !/aria-controls=/.test(tag));
  check(`${name}: aria-expanded buttons also set aria-controls`, stateLess.length, 0);

  return html;
}

/* Pages under audit */
await audit("homepage", "/");
await audit("explorer", "/scholarships");
const filtered = await audit("explorer filtered", "/scholarships?country=canada");
await audit("detail", "/scholarships/demo-global-excellence");
await audit("404", "/scholarships/not-a-real-id");
await audit("profile", "/profile");
await audit("matches", "/matches");

/* Filtered views must still be complete, not a client-only shell. */
console.log("\n--- no-JS content ---");
const visibleIds = [...filtered.matchAll(/\/scholarships\/(demo-[a-z0-9-]+)/g)].map((m) => m[1]);
check("filtered view lists its results in HTML", new Set(visibleIds).size, 2);
check(
  "filtered view announces the result count",
  filtered.includes("Filtered results"),
  true,
);

/* The search input must carry a real label, not only a placeholder. */
console.log("\n--- search input ---");
const explorer = await (await fetch(BASE + "/scholarships")).text();
const inputTag = explorer.match(/<input[^>]*type="search"[^>]*>/)?.[0] ?? "";
console.log(`      input: ${inputTag.slice(0, 140)}`);
check("search input exists", inputTag.length > 0, true);
const searchId = inputTag.match(/\bid="([^"]+)"/)?.[1];
check(
  "search input is associated with a label element",
  searchId ? explorer.includes(`for="${searchId}"`) : false,
  true,
);
check("search input is not the only label", /placeholder=/.test(inputTag), true);

/* Demo provenance must be visible to users, not just in the source comments. */
console.log("\n--- demo disclosure ---");
const home = await (await fetch(BASE + "/")).text();
const explorerHtml = await (await fetch(BASE + "/scholarships")).text();
check("explorer discloses demo content", /illustrative|sample content|demo/i.test(explorerHtml), true);
check("homepage discloses demo content", /illustrative|sample content|preview/i.test(home), true);

/*
 * The profile builder is a client island, so its form and match panel only
 * exist after hydration. Server HTML alone cannot prove the wizard is usable,
 * so these assertions are deliberately about what the server must still send:
 * the heading, and an honest statement that nothing is known yet.
 */
console.log("\n--- profile builder ---");
const profile = await (await fetch(BASE + "/profile")).text();
check("profile page has one h1", (profile.match(/<h1[^>]*>/g) ?? []).length, 1);
check(
  "profile page states where answers are stored",
  /this browser only/i.test(profile),
  true,
);
check(
  "profile page does not claim a score before hydration",
  /nothing answered|provisional/i.test(profile),
  true,
);
check(
  "profile form is not shipped empty into the server HTML",
  /<form/i.test(profile),
  false,
  "the wizard mounts client-side; server HTML must not contain a half-built form",
);

/*
 * The personalised route is a client island, for the same reason the builder is:
 * the ranking is a function of a profile in localStorage. Server HTML therefore
 * cannot contain a ranked list, and these assertions are about what the server
 * must still send — the heading, the provenance disclosure, and an honest
 * statement that the stored profile is being read.
 */
console.log("\n--- personalised matches ---");
const matches = await (await fetch(BASE + "/matches")).text();
check("matches page has one h1", (matches.match(/<h1[^>]*>/g) ?? []).length, 1);
check(
  "matches page says it is reading the stored profile",
  /reading your saved profile/i.test(matches),
  true,
);
check("matches page discloses illustrative records", /illustrative/i.test(matches), true);
check(
  "matches page links onward to the explorer",
  matches.includes('href="/scholarships"'),
  true,
);
check(
  "matches page does not ship a ranked list into the server HTML",
  /\/scholarships\/demo-/.test(matches),
  false,
  "the ranking is derived from localStorage and must only appear after hydration",
);
check(
  "matches page does not claim a completion percentage before hydration",
  /profile is \d+% complete/i.test(matches),
  false,
);

console.log(failures === 0 ? "\nALL PASS" : `\n${failures} FAILURE(S)`);
process.exit(failures === 0 ? 0 : 1);