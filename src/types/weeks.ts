export interface WeekOption {
  /** Local date of the week's Sunday, as `YYYY-MM-DD`. */
  id: string;
  label: string;
  /** Just the dates, e.g. `Oct 4 – Oct 10`. */
  range: string;
  start: Date;
  end: Date;
}
