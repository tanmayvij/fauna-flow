import type { AuditSource } from "@/types/audit";

export const AUDIT_SOURCE_IDS = Object.freeze([
  "delivery",
  "usage",
  "inventory",
] as const);

/** The three inputs the food audit reconciles, one per file format. */
export const AUDIT_SOURCES: readonly AuditSource[] = Object.freeze([
  Object.freeze({
    id: "delivery",
    title: "Deliveries",
    description: "What arrived at the start of the week.",
    extensions: Object.freeze([".txt"]),
  }),
  Object.freeze({
    id: "usage",
    title: "Usage log",
    description: "Keeper logs recorded throughout the week.",
    extensions: Object.freeze([".csv"]),
  }),
  Object.freeze({
    id: "inventory",
    title: "Inventory",
    description: "Stock count at the end of the week.",
    extensions: Object.freeze([".json"]),
  }),
]);
