"use client";

import { X } from "lucide-react";

import { FILTER_GROUP_TITLES, filterValueLabel, type FilterGroupId } from "@/lib/scholarships/filters";
import { fieldLabel } from "@/lib/scholarships";
import type { ExplorerQuery } from "@/types/scholarship";

/** One removable chip. */
function Chip({
  group,
  value,
  onRemove,
}: {
  group: FilterGroupId;
  value: string | number;
  onRemove: () => void;
}) {
  const label = filterValueLabel(group, value, fieldLabel);

  return (
    <button
      type="button"
      onClick={onRemove}
      aria-label={`Remove filter ${FILTER_GROUP_TITLES[group]}: ${label}`}
      className="group/chip inline-flex items-center gap-1.5 rounded-full border border-azure-400/25 bg-azure-400/10 py-1 pr-1.5 pl-3 text-[0.8125rem] text-azure-100 transition-[background-color,border-color,color] duration-200 hover:border-azure-400/45 hover:bg-azure-400/18 hover:text-azure-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-azure-300"
    >
      <span className="text-azure-200/70">{FILTER_GROUP_TITLES[group]}</span>
      <span className="text-azure-50">{label}</span>
      <span
        className="grid size-4 place-items-center rounded-full text-azure-200 transition-colors duration-200 group-hover/chip:bg-azure-400/25 group-hover/chip:text-white"
        aria-hidden="true"
      >
        <X className="size-3" />
      </span>
    </button>
  );
}

/**
 * Active filters as removable chips, with a single "clear all" escape hatch.
 *
 * Each chip carries its group in the accessible name so a screen reader user
 * hears "Remove filter Country: Canada" rather than an unlabelled cross.
 */
export function ActiveFilterChips({
  query,
  onChange,
}: {
  query: ExplorerQuery;
  onChange: (next: ExplorerQuery) => void;
}) {
  const remove = (group: FilterGroupId, value: string | number) => {
    switch (group) {
      case "degree":
        onChange({ ...query, degree: query.degree.filter((v) => v !== value) });
        break;
      case "field":
        onChange({ ...query, fields: query.fields.filter((v) => v !== value) });
        break;
      case "country":
        onChange({ ...query, countries: query.countries.filter((v) => v !== value) });
        break;
      case "funding":
        onChange({ ...query, funding: query.funding.filter((v) => v !== value) });
        break;
      case "deadline":
        onChange({ ...query, deadlines: query.deadlines.filter((v) => v !== value) });
        break;
      case "gpa":
        onChange({ ...query, gpa: query.gpa.filter((v) => v !== Number(value)) });
        break;
      case "language":
        onChange({ ...query, language: query.language.filter((v) => v !== value) });
        break;
    }
  };

  const chips: { group: FilterGroupId; value: string | number }[] = [
    ...query.degree.map((value) => ({ group: "degree" as const, value })),
    ...query.fields.map((value) => ({ group: "field" as const, value })),
    ...query.countries.map((value) => ({ group: "country" as const, value })),
    ...query.funding.map((value) => ({ group: "funding" as const, value })),
    ...query.deadlines.map((value) => ({ group: "deadline" as const, value })),
    ...query.gpa.map((value) => ({ group: "gpa" as const, value })),
    ...query.language.map((value) => ({ group: "language" as const, value })),
  ];

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="label-micro text-mist-600">Active</span>

      {chips.map((chip) => (
        <Chip
          key={`${chip.group}-${chip.value}`}
          group={chip.group}
          value={chip.value}
          onRemove={() => remove(chip.group, chip.value)}
        />
      ))}

      <button
        type="button"
        onClick={() =>
          onChange({
            q: "",
            degree: [],
            fields: [],
            countries: [],
            funding: [],
            deadlines: [],
            gpa: [],
            language: [],
            sort: query.sort,
          })
        }
        className="ml-1 text-[0.8125rem] text-mist-400 underline decoration-white/20 underline-offset-4 transition-colors duration-200 hover:text-mist-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-azure-300"
      >
        Clear all
      </button>
    </div>
  );
}