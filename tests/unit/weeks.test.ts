import { describe, expect, test } from "vitest";
import { getWeekOptions, toDateKey } from "@/lib/weeks";

function labelsFor(today: Date) {
  return getWeekOptions(today, 3).map((option) => option.label);
}

describe("getWeekOptions", () => {
  test("runs the current week from Sunday to today", () => {
    // Monday, Oct 12 2026
    expect(labelsFor(new Date(2026, 9, 12, 15, 30))).toEqual([
      "This week · Oct 11 – Oct 12",
      "Last week · Oct 4 – Oct 10",
      "2 weeks ago · Sep 27 – Oct 3",
    ]);
  });

  test("shows only today for the current week on a Sunday", () => {
    expect(labelsFor(new Date(2026, 9, 11))).toEqual([
      "This week · Oct 11",
      "Last week · Oct 4 – Oct 10",
      "2 weeks ago · Sep 27 – Oct 3",
    ]);
  });

  test("covers the full current week on a Saturday", () => {
    expect(labelsFor(new Date(2026, 9, 17))[0]).toBe(
      "This week · Oct 11 – Oct 17",
    );
  });

  test("crosses a year boundary", () => {
    // Saturday, Jan 2 2027
    expect(labelsFor(new Date(2027, 0, 2))).toEqual([
      "This week · Dec 27 – Jan 2",
      "Last week · Dec 20 – Dec 26",
      "2 weeks ago · Dec 13 – Dec 19",
    ]);
  });

  test("identifies each week by its Sunday at midnight", () => {
    expect(getWeekOptions(new Date(2026, 9, 12, 23), 2)).toMatchObject([
      {
        id: "2026-10-11",
        start: new Date(2026, 9, 11),
        end: new Date(2026, 9, 12),
      },
      { id: "2026-10-04", end: new Date(2026, 9, 10) },
    ]);
  });

  test("gives each week its date range on its own", () => {
    // Monday, Oct 12 2026
    const ranges = getWeekOptions(new Date(2026, 9, 12), 3).map(
      (option) => option.range,
    );

    expect(ranges).toEqual([
      "Oct 11 – Oct 12",
      "Oct 4 – Oct 10",
      "Sep 27 – Oct 3",
    ]);
  });

  test("gives a single-day current week a single date as its range", () => {
    expect(getWeekOptions(new Date(2026, 9, 11), 1)).toMatchObject([
      { range: "Oct 11" },
    ]);
  });

  test("returns the requested number of weeks", () => {
    expect(getWeekOptions(new Date(2026, 9, 12), 5)).toHaveLength(5);
  });
});

describe("toDateKey", () => {
  test("formats a local date as YYYY-MM-DD", () => {
    expect(toDateKey(new Date(2026, 0, 5))).toBe("2026-01-05");
  });
});
