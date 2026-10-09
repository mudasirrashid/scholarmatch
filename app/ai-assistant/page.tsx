import type { Metadata } from "next";

import { AssistantView } from "@/components/assistant/assistant-view";
import { Eyebrow } from "@/components/ui/badge";
import { AmbientField } from "@/components/ui/ambient-field";
import { Container } from "@/components/ui/container";

const TITLE = "AI Scholarship Companion";
const DESCRIPTION =
  "Ask about your matches, deadlines, documents, readiness and next steps. The companion answers from the records already on ScholarMatch and says when something is not recorded.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/ai-assistant" },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "/ai-assistant",
  },
};

/**
 * AI Scholarship Companion — Phase 08.
 *
 * The heading, the disclosure and the canonical URL are rendered here on the
 * server, so the route is complete and honest before any JavaScript runs. The
 * conversation below is one client island, for the same reason `/profile` and
 * `/matches` are: everything it can say is derived from a profile, a checklist
 * and tracked records that live in `localStorage`.
 *
 * The disclosure is deliberately the second thing on the page. This is not an
 * external model, there is no API key and no network call — it is a guided
 * reading of ScholarMatch's own records. Saying so in the server HTML, rather
 * than only in the client, is what keeps the claim true for a reader with
 * JavaScript off.
 */
export default function AiAssistantPage() {
  return (
    <>
      <section className="relative isolate overflow-hidden pt-32 pb-10 sm:pt-36 lg:pt-40">
        <AmbientField />
        <Container size="wide" className="relative">
          <Eyebrow>AI scholarship companion</Eyebrow>

          <h1 className="mt-6 max-w-3xl font-display text-[2.25rem] leading-[1.08] font-normal tracking-[-0.02em] text-balance text-mist-50 sm:text-5xl lg:text-[3.75rem]">
            Ask anything about your scholarship journey.
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-pretty text-mist-400">
            Match scores, deadlines, required documents, readiness and the one next
            step worth taking — answered from the records already on this site.
          </p>

          <p className="mt-4 max-w-xl text-[0.9375rem] leading-relaxed text-pretty text-mist-500">
            This is a guided reading of ScholarMatch, not an external AI. It reads your
            saved profile, the published award records, your preparation checklist and
            your tracked applications — all stored in this browser — and it never
            invents an answer. Anything those records do not hold comes back as
            not recorded.
          </p>
        </Container>
      </section>

      <Container size="wide" className="pb-24">
        <AssistantView />
      </Container>
    </>
  );
}
