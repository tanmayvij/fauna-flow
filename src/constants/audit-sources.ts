export type AuditSourceId = "delivery" | "usage" | "inventory";

export interface AuditSource {
  id: AuditSourceId;
  title: string;
  description: string;
  extensions: readonly string[];
}

/** The three inputs the food audit reconciles, one per file format. */
export const AUDIT_SOURCES: readonly AuditSource[] = [
  {
    id: "delivery",
    title: "Deliveries",
    description: "What arrived at the start of the week.",
    extensions: [".txt"],
  },
  {
    id: "usage",
    title: "Usage log",
    description: "Keeper logs recorded throughout the week.",
    extensions: [".csv"],
  },
  {
    id: "inventory",
    title: "Inventory",
    description: "Stock count at the end of the week.",
    extensions: [".json"],
  },
];
