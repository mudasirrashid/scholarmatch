/**
 * The one next step a tracked application is pointing at.
 *
 * A deterministic function of exactly three inputs — where the application
 * sits (`status`), what the deadline is doing (`DeadlineRead`), and how much
 * preparation is marked in this browser (`PreparationProgress`) — so two
 * students looking at the same state always get the same advice, and the
 * dashboard and the detail-page card can only agree.
 *
 * The engine never scores anything and never asserts a fact about the student:
 * it moves the application forward, or points a finished application somewhere
 * useful. An official-application step links out only when a real submission
 * URL exists on the record; otherwise it points back at the detail page, so
 * nothing ever implies a portal that was not verified.
 */

import type { DeadlineRead } from "@/lib/applications/deadline";
import type { PreparationProgress } from "@/lib/applications/progress";
import type { ApplicationStatus } from "@/types/application";
import type { Scholarship } from "@/types/scholarship";

export type NextActionTone = "neutral" | "positive" | "accent" | "caution";

export interface NextAction {
  /** Stable semantic id, asserted by verification and useful for analytics. */
  id: string;
  title: string;
  tone: NextActionTone;
  /**
   * Where the step leads. External when it is a verified submission URL,
   * internal otherwise; surfaces render the two differently.
   */
  href?: string;
  /** One supporting line explaining the step. */
  detail: string;
  /** The action is complete; only `detail` offers a route onward. */
  terminal?: boolean;
}

/**
 * The destination for an official-application step: the verified submission
 * portal when one exists, the detail page otherwise. Never a bare `/matches`
 * or a fabricated link.
 */
function submissionHref(scholarship: Scholarship, detailHref: string): string {
  return scholarship.officialSource.applicationUrl ?? detailHref;
}

export function nextAction(inputs: {
  scholarship: Scholarship;
  status: ApplicationStatus;
  deadline: DeadlineRead;
  progress: PreparationProgress;
}): NextAction {
  const { scholarship, status, deadline, progress } = inputs;
  const detailHref = `/scholarships/${scholarship.id}`;
  const prepareHref = `${detailHref}#prepare`;

  switch (status) {
    case "interested": {
      if (deadline.urgent) {
        return {
          id: "start-preparation-urgent",
          title: "Start preparing now — the deadline is close",
          tone: "caution",
          href: prepareHref,
          detail: `${deadline.label}. Start the checklist this week; documents move slower than deadlines do.`,
        };
      }
      return {
        id: "start-preparation",
        title: "Start preparing",
        tone: "neutral",
        href: prepareHref,
        detail: "Open the preparation checklist for this award and tick what you have in hand.",
      };
    }

    case "preparing": {
      if (deadline.state === "overdue") {
        return {
          id: "confirm-deadline",
          title: "Confirm the deadline",
          tone: "caution",
          href: detailHref,
          detail: `${deadline.label}. Check the official page for the next application cycle.`,
        };
      }
      if (progress.marked < progress.total) {
        return {
          id: "continue-preparation",
          title: "Complete your preparation checklist",
          tone: "neutral",
          href: prepareHref,
          detail: `${progress.marked} of ${progress.total} preparation steps are marked in this browser.`,
        };
      }
      if (deadline.urgent) {
        return {
          id: "submit-before-deadline",
          title: "Submit before the deadline",
          tone: "caution",
          href: submissionHref(scholarship, detailHref),
          detail: `${deadline.label}. Your checklist is complete — submit now.`,
        };
      }
      return {
        id: "start-official-application",
        title: "Start your official application",
        tone: "accent",
        href: submissionHref(scholarship, detailHref),
        detail: "Your checklist is complete. Submissions happen on the awarding body's own portal.",
      };
    }

    case "ready_to_apply": {
      if (deadline.state === "overdue") {
        return {
          id: "confirm-deadline",
          title: "Confirm the deadline",
          tone: "caution",
          href: detailHref,
          detail: `${deadline.label}. Check the official page for the next application cycle.`,
        };
      }
      if (deadline.state === "today") {
        return {
          id: "submit-today",
          title: "Submit today",
          tone: "caution",
          href: submissionHref(scholarship, detailHref),
          detail: `${deadline.label}. Do not wait for the portal to be busy at closing time.`,
        };
      }
      if (deadline.urgent) {
        return {
          id: "submit-before-deadline",
          title: "Submit before the deadline",
          tone: "caution",
          href: submissionHref(scholarship, detailHref),
          detail: `${deadline.label}. Your preparation is complete; submission is the only step left.`,
        };
      }
      return {
        id: "start-official-application",
        title: "Start your official application",
        tone: "accent",
        href: submissionHref(scholarship, detailHref),
        detail: "Your preparation is complete. Submissions happen on the awarding body's own portal.",
      };
    }

    case "applied":
      return {
        id: "wait-for-review",
        title: "Wait for the review",
        tone: "neutral",
        detail:
          "Tracked as applied. Watch the official portal if the provider publishes review windows, and keep your reference number safe.",
      };

    case "under_review":
      return {
        id: "monitor-status",
        title: "Monitor your application status",
        tone: "neutral",
        detail: "Tracked as under review. Nothing further is needed unless the provider asks for more information.",
      };

    case "interview":
      return {
        id: "prepare-interview",
        title: "Prepare for your interview",
        tone: "accent",
        detail: "Interviews decide the award. Re-read your application and the award's priorities before the call.",
      };

    case "accepted":
      return {
        id: "review-next-steps",
        title: "Review your next steps",
        tone: "positive",
        detail: "The award has been offered. Follow the provider's acceptance steps inside their stated window.",
        terminal: true,
      };

    case "rejected":
      return {
        id: "explore-others",
        title: "Explore other matching scholarships",
        tone: "neutral",
        href: "/matches",
        detail: "This one did not work out. Your profile still matches other awards in the collection.",
        terminal: true,
      };

    case "withdrawn":
      return {
        id: "explore-others",
        title: "Explore other matching scholarships",
        tone: "neutral",
        href: "/matches",
        detail: "Tracked as withdrawn. Other awards in the collection still match your profile.",
        terminal: true,
      };
  }
}