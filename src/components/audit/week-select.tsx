"use client";

import { useId, useMemo, useSyncExternalStore } from "react";
import { AUDIT_WEEK_COUNT } from "@/constants/audit-weeks";
import { getWeekOptions } from "@/lib/weeks";
import type { WeekOption } from "@/types/weeks";

interface WeekSelectProps {
  value: string | null;
  onChange: (weekId: string) => void;
}

export function WeekSelect({ value, onChange }: WeekSelectProps) {
  const selectId = useId();
  const today = useToday();

  const options = useMemo(
    () =>
      today === null ? [] : getWeekOptions(new Date(today), AUDIT_WEEK_COUNT),
    [today],
  );

  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={selectId}
        className="text-sm font-medium text-zinc-900 dark:text-zinc-50"
      >
        Week
      </label>
      <select
        id={selectId}
        value={value ?? options[0]?.id ?? ""}
        onChange={(event) => onChange(event.target.value)}
        disabled={options.length === 0}
        className="h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 text-zinc-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:text-zinc-400 sm:w-80 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
      >
        {options.length === 0 && <option value="">Loading weeks…</option>}
        {options.map((option: WeekOption) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

/**
 * Local midnight of today in the viewer's time zone, as a timestamp: a number
 * stays equal all day, as `useSyncExternalStore` requires of a snapshot. It is
 * null while prerendering, because the build server's clock and time zone are
 * not the viewer's.
 */
function useToday(): number | null {
  return useSyncExternalStore(
    subscribeToNothing,
    () => new Date().setHours(0, 0, 0, 0),
    () => null,
  );
}

function subscribeToNothing() {
  return () => {};
}
