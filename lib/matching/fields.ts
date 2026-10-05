/**
 * Field taxonomy used by the matching engine.
 *
 * The demo records name seven fields, and a student almost never types the exact
 * string a provider used. "Machine learning" should count against "Data Science"
 * or "Artificial Intelligence"; "Molecular biology" should not count against
 * "Business". Rather than let the engine guess from raw strings, Phase 03
 * declares an explicit relatedness relation and looks fields up in it.
 *
 * This table is deliberately small and reviewable. A real deployment would load
 * the equivalent from a schema.org or U-Map-aligned taxonomy; the lookup
 * contract below would not change.
 */

/** Groups of fields that count as interchangeable for matching purposes. */
const FIELD_CLUSTERS: readonly (readonly string[])[] = [
  ["Computer Science", "Data Science", "Artificial Intelligence", "Engineering"],
  ["Medicine", "Health Sciences", "Public Health"],
  ["Business", "Economics", "Finance"],
  ["Social Sciences", "Psychology", "Education"],
  ["Design", "Architecture"],
  ["Law", "Public Policy"],
];

/** Normalises a label for lookup: trimmed, collapsed, lower case. */
function normaliseField(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

/** Pre-built lookup so matching does not rebuild the index on every call. */
const FIELD_TO_CLUSTER: ReadonlyMap<string, string> = (() => {
  const map = new Map<string, string>();
  FIELD_CLUSTERS.forEach((cluster) => {
    const key = cluster[0];
    if (key === undefined) return;
    for (const field of cluster) {
      map.set(normaliseField(field), normaliseField(key));
    }
  });
  return map;
})();

/** True when the value belongs to a cluster the engine knows about. */
export function isKnownField(value: string): boolean {
  return FIELD_TO_CLUSTER.has(normaliseField(value));
}

/** Every field name the taxonomy recognises, for populating profile inputs. */
export function knownFields(): readonly string[] {
  return FIELD_CLUSTERS.flatMap((cluster) => cluster.slice(0, 1));
}

export type FieldRelation = "exact" | "related" | "unrelated" | "unknown";

/**
 * Compares two field labels.
 *
 * `unknown` means the taxonomy has never heard of one of the labels, which is
 * deliberately distinct from `unrelated`: an unrecognised label should lower
 * confidence, not assert a mismatch.
 */
export function relateFields(studentField: string, awardField: string): FieldRelation {
  const student = normaliseField(studentField);
  const award = normaliseField(awardField);

  if (student === award) return "exact";

  const studentCluster = FIELD_TO_CLUSTER.get(student);
  const awardCluster = FIELD_TO_CLUSTER.get(award);
  if (studentCluster === undefined || awardCluster === undefined) return "unknown";

  return studentCluster === awardCluster ? "related" : "unrelated";
}

/** Confidence order used to pick the best relation across a field list. */
const RELATION_RANK: Readonly<Record<FieldRelation, number>> = {
  exact: 3,
  related: 2,
  unknown: 1,
  unrelated: 0,
};

/**
 * Best relation between a student's field and a scholarship's field list.
 *
 * Empty field list means the award is unrestricted, which is reported as
 * `exact` so it never drags a score down.
 */
export function relateToFields(
  studentField: string,
  awardFields: readonly string[],
): FieldRelation {
  if (awardFields.length === 0) return "exact";

  let best: FieldRelation = "unrelated";
  for (const awardField of awardFields) {
    const relation = relateFields(studentField, awardField);
    if (RELATION_RANK[relation] > RELATION_RANK[best]) best = relation;
    if (best === "exact") return best;
  }
  return best;
}