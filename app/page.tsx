import { FeatureShowcase } from "@/components/home/feature-showcase";
import { FinalCta } from "@/components/home/final-cta";
import { Hero } from "@/components/home/hero";
import { JourneySection } from "@/components/home/journey-section";
import { MatchingPreview } from "@/components/home/matching-preview";
import { Narrative } from "@/components/home/narrative";
import { OpportunitiesShowcase } from "@/components/home/opportunities-showcase";
import { Trust } from "@/components/home/trust";
import { featureBlocks } from "@/lib/demo/data";

/**
 * Marketing homepage.
 *
 * A server component: every animated region is an isolated client island, so
 * the page ships close to zero JavaScript beyond those islands.
 */
export default function Home() {
  return (
    <>
      <Hero />
      <Narrative />
      <MatchingPreview />
      <OpportunitiesShowcase />
      <FeatureShowcase features={featureBlocks} />
      <JourneySection />
      <Trust />
      <FinalCta />
    </>
  );
}