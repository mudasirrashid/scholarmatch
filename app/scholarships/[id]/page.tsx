import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, Info } from "lucide-react";

import { EligibilityList } from "@/components/scholarships/detail/eligibility-list";
import { MatchBreakdown } from "@/components/scholarships/detail/match-breakdown";
import { QuickFacts } from "@/components/scholarships/detail/quick-facts";
import {
  ApplySteps,
  DocumentChecklist,
  FundingBreakdown,
  JourneyStages,
  MistakeList,
} from "@/components/scholarships/detail/sections";
import { DetailSection } from "@/components/scholarships/detail/section";
import { DetailSectionNav } from "@/components/scholarships/detail/section-nav";
import { MatchRing } from "@/components/ui/match-ring";
import { SaveButton } from "@/components/scholarships/save-button";
import { SavedProvider } from "@/components/scholarships/saved-provider";
import { AmbientField } from "@/components/ui/ambient-field";
import { Badge } from "@/components/ui/badge";
import { Container } from "@/components/ui/container";
import { Eyebrow } from "@/components/ui/badge";
import { activeDemoProfile } from "@/lib/demo/student-profiles";
import { matchScholarship, toMatchInsights } from "@/lib/matching";
import { allScholarships, getScholarship } from "@/lib/scholarships";
import { matchTone } from "@/lib/format";

/**
 * Every record is prebuilt.
 *
 * The dataset is a static module, so the ids are known at build time. Declaring
 * `dynamicParams = false` means an unknown id is routed to the 404 page by
 * Next.js itself, which keeps the response server-rendered and correct instead
 * of rendering the page only to throw. `notFound()` below remains as the
 * guard for a record that somehow disappears at runtime.
 */
export const dynamicParams = false;

export function generateStaticParams() {
  return allScholarships().map((scholarship) => ({ id: scholarship.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const scholarship = getScholarship(id);

  if (!scholarship) {
    return { title: "Scholarship not found" };
  }

  // Same engine call the page body uses, so the search description quotes the
  // verdict a visitor actually sees.
  const match = toMatchInsights(matchScholarship(activeDemoProfile, scholarship));
  const description = `${scholarship.fundingLabel} for ${scholarship.degreeLabel} study in ${scholarship.country}. ${match.summary}`;

  return {
    title: `${scholarship.title} at ${scholarship.organization}`,
    description,
    alternates: { canonical: `/scholarships/${scholarship.id}` },
    openGraph: {
      title: scholarship.title,
      description,
      url: `/scholarships/${scholarship.id}`,
    },
  };
}

/** Anchors the sticky nav targets, in document order. */
const SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "match", label: "Your match" },
  { id: "eligibility", label: "Who can apply" },
  { id: "funding", label: "Funding" },
  { id: "documents", label: "Documents" },
  { id: "how-to-apply", label: "How to apply" },
  { id: "journey", label: "Your journey" },
  { id: "mistakes", label: "Common mistakes" },
  { id: "source", label: "Source" },
] as const;

export default async function ScholarshipDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const scholarship = getScholarship(id);

  if (!scholarship) notFound();

  // Evaluated once, then reused for the ring, the breakdown and the metadata.
  // The explorer calls the same function with the same profile, which is what
  // keeps the list score and the detail score identical.
  const match = toMatchInsights(matchScholarship(activeDemoProfile, scholarship));
  const score = match.score;

  return (
    <SavedProvider>
      {/* Hero */}
      <section className="relative isolate overflow-hidden pt-28 pb-8 sm:pt-32 lg:pt-36">
        <AmbientField />
        <Container size="wide" className="relative">
          <Link
            href="/scholarships"
            className="inline-flex items-center gap-2 text-sm text-mist-400 transition-colors duration-200 hover:text-mist-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-azure-300"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            All scholarships
          </Link>

          <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-16">
            <div className="min-w-0">
              <Eyebrow>{scholarship.organization}</Eyebrow>

              <h1 className="mt-6 max-w-3xl font-display text-[2.25rem] leading-[1.1] font-normal tracking-[-0.02em] text-balance text-mist-50 sm:text-5xl">
                {scholarship.title}
              </h1>

              <p className="mt-5 max-w-xl text-lg leading-relaxed text-pretty text-mist-400">
                {scholarship.fundingSummary}
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-2">
                <Badge tone={matchTone(score)}>{scholarship.fundingLabel}</Badge>
                <Badge>{scholarship.degreeLabel}</Badge>
                {scholarship.fields.map((field) => (
                  <Badge key={field}>{field}</Badge>
                ))}
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <SaveButton
                  id={scholarship.id}
                  title={scholarship.title}
                  variant="labelled"
                />

                {scholarship.officialSource.verifiedUrl ? (
                  <a
                    href={scholarship.officialSource.verifiedUrl}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="inline-flex h-11 items-center gap-2 rounded-full border border-hairline bg-white/[0.04] px-5 text-[0.9375rem] text-mist-100 transition-colors duration-200 hover:border-hairline-strong hover:bg-white/[0.07] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-azure-300"
                  >
                    Official page
                    <ExternalLink className="size-4" aria-hidden="true" />
                  </a>
                ) : null}
              </div>
            </div>

            {/* Match ring */}
            <div className="flex items-start">
              <div className="surface-glass edge-highlight relative rounded-3xl p-7 text-center">
                <MatchRing score={score} size="lg" label="Overall match" />

                <p className="mt-4 max-w-[13rem] text-pretty text-[0.8125rem] text-mist-400">
                  {match.summary}
                </p>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Body */}
      <Container size="wide" className="pb-24">
        <div className="mt-8 gap-10 lg:grid lg:grid-cols-[11rem_minmax(0,1fr)] lg:gap-14">
          <DetailSectionNav sections={SECTIONS} />

          <div className="min-w-0">
            <DetailSection
              id="overview"
              title="Overview"
              description={`Everything about ${scholarship.title} at a glance.`}
            >
              <QuickFacts scholarship={scholarship} />

              <dl className="mt-8 grid gap-5 border-t border-hairline pt-8 sm:grid-cols-2">
                <div>
                  <dt className="text-xs text-mist-500">Study mode</dt>
                  <dd className="mt-1 text-sm text-mist-200">{scholarship.studyMode}</dd>
                </div>

                <div>
                  <dt className="text-xs text-mist-500">Academic requirement</dt>
                  <dd className="mt-1 text-sm text-mist-200">{scholarship.gpaLabel}</dd>
                </div>

                <div>
                  <dt className="text-xs text-mist-500">Nationality</dt>
                  <dd className="mt-1 text-sm text-mist-200">{scholarship.nationality}</dd>
                </div>

                <div>
                  <dt className="text-xs text-mist-500">Language</dt>
                  <dd className="mt-1 text-sm text-mist-200">
                    {scholarship.languageTests.length > 0
                      ? scholarship.languageTests
                          .map((test) => test.toUpperCase())
                          .join(", ")
                      : "No language test required"}
                  </dd>
                </div>

                {scholarship.languageNote ? (
                  <div className="col-span-full">
                    <dt className="text-xs text-mist-500">Language note</dt>
                    <dd className="mt-1 text-sm text-pretty text-mist-200">
                      {scholarship.languageNote}
                    </dd>
                  </div>
                ) : null}
              </dl>
            </DetailSection>

            <DetailSection
              id="match"
              title="Your match"
              description="Where you stand against each requirement, and what to fix before you apply."
            >
              <MatchBreakdown match={match} />

              {match.missingRequirements.length > 0 ? (
                <div className="surface-glass mt-6 rounded-2xl p-5">
                  <h3 className="text-sm font-medium text-mist-100">
                    Still needed before you apply
                  </h3>
                  <ul className="mt-3 space-y-2">
                    {match.missingRequirements.map((requirement) => (
                      <li key={requirement} className="flex gap-2.5 text-sm text-mist-300">
                        <span
                          className="mt-2 size-1 shrink-0 rounded-full bg-amber-400"
                          aria-hidden="true"
                        />
                        {requirement}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </DetailSection>

            <DetailSection
              id="eligibility"
              title="Who can apply"
              description="Every requirement as the provider states it, with how your profile compares."
            >
              <EligibilityList criteria={scholarship.eligibility} />
            </DetailSection>

            <DetailSection
              id="funding"
              title="Funding"
              description="What the award actually pays for."
            >
              <FundingBreakdown
                summary={scholarship.fundingSummary}
                benefits={scholarship.benefits}
              />
            </DetailSection>

            <DetailSection
              id="documents"
              title="Documents"
              description="What to prepare before you start the application."
            >
              <DocumentChecklist documents={scholarship.documents} />
            </DetailSection>

            <DetailSection
              id="how-to-apply"
              title="How to apply"
              description="The sequence, performed on the awarding body's own portal."
            >
              <ApplySteps steps={scholarship.howToApply} />
            </DetailSection>

            <DetailSection
              id="journey"
              title="Your journey"
              description="Where ScholarMatch tracks you between now and the decision."
            >
              <JourneyStages stages={scholarship.journey} />
            </DetailSection>

            <DetailSection
              id="mistakes"
              title="Common mistakes"
              description="What causes rejections on applications like this one."
            >
              <MistakeList mistakes={scholarship.commonMistakes} />
            </DetailSection>

            <DetailSection
              id="source"
              title="Source"
              description="Where this record came from, and what that means."
            >
              <div className="surface-glass relative rounded-2xl p-5">
                <div className="flex items-start gap-3">
                  <Info className="mt-0.5 size-4 shrink-0 text-mist-500" aria-hidden="true" />

                  <div className="min-w-0">
                    <p className="text-sm text-mist-200">
                      Listed provider:{" "}
                      <span className="text-mist-50">{scholarship.officialSource.provider}</span>
                    </p>

                    <p className="mt-3 text-[0.8125rem] leading-relaxed text-pretty text-mist-400">
                      This is illustrative sample content. No official provider link is shown
                      because none has been verified, so always confirm requirements on the
                      awarding body&apos;s own site before you invest time in an application.
                    </p>
                  </div>
                </div>
              </div>
            </DetailSection>
          </div>
        </div>
      </Container>
    </SavedProvider>
  );
}