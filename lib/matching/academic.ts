/**
 * Academic standing, normalised to 0-100.
 *
 * Phase 01 hard-coded "91 / 100" in the hero fixture. That number had no
 * definition, which meant it could not be checked against a profile and nothing
 * stopped it drifting away from the real rankings.
 *
 * This is the definition behind it now: a linear scale from 2.0 to 4.0. A GPA
 * below 2.0 floors at 0 and a 4.0 caps at 100. Keeping the function in the
 * engine, rather than in the component that displays it, means the hero and the
 * ranking agree by construction.
 *
 * The scale is deliberately simple and visible. It is a display aid, not an
 * academic judgement.
 */

/** GPA at which the normalised score reaches 0. */
export const ACADEMIC_SCALE_FLOOR = 2;

/** GPA at which the normalised score reaches 100. */
export const ACADEMIC_SCALE_CEILING = 4;

/**
 * Normalises a GPA onto the 0-100 scale.
 *
 * A missing GPA returns `null` rather than a zero: "we do not know" must not
 * render as "this student performed at the bottom of the scale".
 */
export function normaliseGpa(gpa: number | undefined): number | null {
  if (gpa === undefined) return null;

  const span = ACADEMIC_SCALE_CEILING - ACADEMIC_SCALE_FLOOR;
  const normalised = ((gpa - ACADEMIC_SCALE_FLOOR) / span) * 100;
  return Math.round(Math.min(100, Math.max(0, normalised)));
}