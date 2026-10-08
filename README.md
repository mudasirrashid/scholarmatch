# ScholarMatch

Scholarship discovery with an explainable matching engine. Every score in the
product is produced by one deterministic function, and the inputs that produced
it are shown to the user.

Live at [scholarmatch.me](https://www.scholarmatch.me).

## What it does

A student builds a profile, and each scholarship is scored against it across six
dimensions. Three are **hard** — academic, degree and eligibility — because a
provider will not waive them. Three are **soft** — field, experience and
preferences — because they shape whether applying is worthwhile rather than
whether it is permitted.

```
academic      30%   hard
field         25%   soft
degree        15%   hard
eligibility   15%   hard
experience     5%   soft
preferences   10%   soft
```

A hard failure caps the score at 45 and names the requirement that failed, so an
ineligible option can never outrank an eligible one or read as a good match.

## Design rules

**Unknown is not the same as none.** This is the most important rule in
`types/student.ts`. An omitted property means "we do not know"; an explicit
empty value means "known to be none". A blank GPA is never treated as a failing
one, and `workExperienceYears: 0` is a real answer rather than missing data.
Unknown dimensions are excluded from the weighted total and reported in
`missingInformation` instead of being guessed at.

**Incomplete profiles are damped.** Re-weighting over known dimensions stops a
partial profile being punished twice for being partial. Taken alone it would let
a near-empty profile post a flattering score, so the result is also multiplied by
a confidence factor reflecting how much of the profile actually contributed.

**Scores come from structure, not prose.** Eligibility reads structured fields —
`languageRequirements`, `eligibleCountries`, `degreeLevels` — rather than parsing
the human-readable requirement text. That prose was written for display, and
adjectival forms like "Nigerian" never match a country name like "Nigeria".

**One seam into the UI.** `toMatchInsights(match)` projects the engine's output
onto the shape the existing components already render. No component knows the
engine's vocabulary, so Explorer cards, detail pages and the homepage cannot
disagree about a score.

## Project layout

```
app/                 routes. /scholarships filters and sorts on the server via
                     URL params, so results are shareable and indexable.
components/          UI. components/ui is the design system; the rest is product.
lib/matching/        The engine. Pure and deterministic.
  weights.ts           Every number that turns facts into a score.
  eligibility.ts       Rules; return data, perform no scoring.
  engine.ts            Dimension evaluation, scoring, explanations.
  rank.ts              Eligibility-first ordering.
  recommendations.ts   Groups a finished ranking into display bands. Scores
                       nothing.
lib/profile/         Stored-profile validation and completion. Completion
                     counts only the fields the engine reads.
lib/applications/    Application-tracking math: tolerant storage parsing,
                     deadline readings, the next-action engine, preparation
                     progress and attention ordering. Pure and deterministic.
lib/demo/             Twelve illustrative scholarship records and six demo
                      profiles. The data is invented and labelled as such
                      everywhere it surfaces.
scripts/             Verification. See below.
types/               Data contracts.
```

## Personalised matches

`/matches` ranks the whole collection against the profile a visitor saved in
`/profile`, then groups the result into bands: strong, good, potential, and not
eligible yet. Nothing on that page scores anything — `rankScholarships` produces
the order, `groupRecommendations` reshapes that order, and the existing card and
breakdown components render the output through the same `toMatchInsights` seam
the explorer uses.

It is a client island for the same reason `/profile` is: the ranking is a function
of `localStorage`, which the server cannot read. The server still sends the
heading, the provenance disclosure and the metadata, and it asserts in
`verify:a11y` that no ranked list or completion percentage leaks into the response
body.

Completion is measured by `lib/profile/completion.ts` rather than read off a
score. It counts the fields the engine acts on, weights the three hard dimensions
highest, and reports the specific unanswered fields holding the ranking back, so
the percentage a student sees always corresponds to something that would sharpen
their results.

## Application readiness

Each detail page ends with an "Application readiness" section. `lib/preparation`
turns the same canonical record, the visitor's profile and the engine's own
`MatchResult` into a preparation checklist, a readiness figure and a
deterministic action plan. It never recomputes eligibility with different rules,
and it never claims more than the profile evidences: an unanswered field is
"preparation status not provided", not "missing". A strong match and a finished
application are different things, and the section says so.

On top of that sits the visitor's own preparation tracker — checkboxes recorded
in `localStorage` (the same store pattern as bookmarks and the profile), so a
returning visitor's marks reappear on the same device. A mark is a claim the
visitor makes about their own preparation, so it is never folded into the
figure, the level or the plan, and the copy around it says exactly that.

## Application tracking

From a scholarship's detail page a visitor can start tracking an application,
then watch it move through nine statuses — interested, preparing, ready to
apply, applied, under review, interview, accepted, rejected, withdrawn. Each
detail page and the `/applications` dashboard then derive, from the record and
the status alone:

- a **deadline reading** (`lib/applications/deadline.ts`) — upcoming, due soon,
  today, overdue before submission, closed after it, or the provider's own
  wording for no single date. It reuses the shared reference date and format
  helpers, so a label is always a real date, never a fabricated countdown;
- a **next step** (`lib/applications/next-action.ts`) — a deterministic function
  of status, deadline and preparation marks. An official-application step links
  out only when a verified submission URL exists; otherwise it points back at
  the detail page;
- a **preparation progress figure** — the share of the Phase 06 tracker rows
  marked in this browser, never a readiness score;
- an **attention rank** (`lib/applications/priority.ts`) that leads the
  dashboard with urgent work and keeps awaiting-decision rows after it.

Tracking never feeds back into matching or readiness: a status change cannot
move a match score, and `lib/applications` is a separate store
(`scholarmatch:applications`) beside bookmarks, the profile and the checklist.
The `/applications` route is a client island for the same reason `/matches` is,
so statuses and notes never ship in the server HTML, and `verify:a11y` asserts
exactly that.

## Verification

Matching is where a plausible-looking wrong answer does real damage to a student,
so the checks are mostly invariants that must hold for every profile and every
record, rather than a handful of golden scores.

```bash
npm run verify         # typecheck, lint, query behaviour, matching engine, preparation, application tracking
npm run verify:all     # the above plus a11y and runtime, against a live server
```

| Script | Checks |
| --- | --- |
| `verify:query` | URL filtering, sorting, and that filters work without JavaScript |
| `verify:matching` | Score determinism and bounds, hard-failure capping, unknown-is-not-none, work authorisation, degree ordering, stored-profile validation, profile completion and personalisation |
| `verify:preparation` | Readiness status honesty (never claims more than the profile evidences), allowed bands, deadline arithmetic, ordered action plan, and that checklist tracker rows stay identical to the readiness checklist across every record |
| `verify:applications` | Tolerant storage parsing, idempotent tracking, deadline states and labels, next-action determinism with and without a verified submission URL, progress derivation, attention ordering |
| `verify:a11y` | Landmarks, heading order, form labels, control names, over served HTML |
| `verify:runtime` | Routes, metadata, canonicals, sitemap, URL state |

`verify:a11y` and `verify:runtime` need a server on port 3111:

```bash
npm run build && npm start -- -p 3111
```

## Current scope

Built: profile builder, matching engine, personalised matches, explorer, detail
pages, application readiness with a per-record in-browser tracker, application
tracking with deadlines and next steps, bookmarking.

Not built, and deliberately out of scope so far: accounts, a database,
server-side profile persistence, submitting an application on a student's
behalf, payments, notifications, admin tooling.

**Profiles live in `localStorage`.** Explorer and detail pages therefore score
against a demo profile rather than the visitor's own — `localStorage` is
invisible during server rendering, and reading it would make hydration disagree
with the server HTML. `/matches` is where a stored profile drives the ranking;
making the explorer and detail pages personalised needs an API and belongs to a
later phase.

## Development

```bash
npm run dev
```