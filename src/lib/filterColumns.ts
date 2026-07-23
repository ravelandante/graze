import type { Recording, RecordingColumn } from "@types";

export type FilterType = "text" | "number" | "duration" | "date" | "select";

export type FilterOperator =
  // text + select
  | "contains"
  | "does_not_contain"
  | "is"
  | "is_not"
  // number
  | "eq"
  | "neq"
  | "gt"
  | "lt"
  | "gte"
  | "lte"
  // date
  | "date_is"
  | "before"
  | "after"
  | "on_or_before"
  | "on_or_after"
  // unary (any type)
  | "is_empty"
  | "is_not_empty";

export interface OperatorDef {
  id: FilterOperator;
  label: string;
  /** Unary operators take no value. */
  unary?: boolean;
}

export const OPERATORS_BY_TYPE: Record<FilterType, OperatorDef[]> = {
  text: [
    { id: "contains", label: "contains" },
    { id: "does_not_contain", label: "does not contain" },
    { id: "is", label: "is" },
    { id: "is_not", label: "is not" },
    { id: "is_empty", label: "is empty", unary: true },
    { id: "is_not_empty", label: "is not empty", unary: true },
  ],
  number: [
    { id: "eq", label: "=" },
    { id: "neq", label: "≠" },
    { id: "gt", label: ">" },
    { id: "lt", label: "<" },
    { id: "gte", label: "≥" },
    { id: "lte", label: "≤" },
    { id: "is_empty", label: "is empty", unary: true },
    { id: "is_not_empty", label: "is not empty", unary: true },
  ],
  duration: [
    { id: "eq", label: "=" },
    { id: "neq", label: "≠" },
    { id: "gt", label: ">" },
    { id: "lt", label: "<" },
    { id: "gte", label: "≥" },
    { id: "lte", label: "≤" },
    { id: "is_empty", label: "is empty", unary: true },
    { id: "is_not_empty", label: "is not empty", unary: true },
  ],
  date: [
    { id: "date_is", label: "is" },
    { id: "before", label: "before" },
    { id: "after", label: "after" },
    { id: "on_or_before", label: "on or before" },
    { id: "on_or_after", label: "on or after" },
    { id: "is_empty", label: "is empty", unary: true },
    { id: "is_not_empty", label: "is not empty", unary: true },
  ],
  select: [
    { id: "is", label: "is" },
    { id: "is_not", label: "is not" },
    { id: "is_empty", label: "is empty", unary: true },
  ],
};

export interface SelectOption {
  value: string;
  label: string;
}

export interface FilterColumnConfig {
  id: RecordingColumn;
  label: string;
  type: FilterType;
  options?: SelectOption[];
  tableColumn: boolean;
}

export const FILTER_COLUMNS: FilterColumnConfig[] = [
  { id: "title", label: "Title", type: "text", tableColumn: true },
  { id: "fileName", label: "Filename", type: "text", tableColumn: true },
  { id: "originator", label: "Device", type: "text", tableColumn: true },
  {
    id: "durationSeconds",
    label: "Duration",
    type: "duration",
    tableColumn: true,
  },
  { id: "channels", label: "Channels", type: "number", tableColumn: true },
  {
    id: "format",
    label: "Format",
    type: "select",
    options: [
      { value: "wav", label: "WAV" },
      { value: "mp3", label: "MP3" },
    ],
    tableColumn: true,
  },
  { id: "bitDepth", label: "Bit Depth", type: "number", tableColumn: true },
  { id: "sampleRate", label: "Sample Rate", type: "number", tableColumn: true },
  { id: "recordedAt", label: "Recorded At", type: "date", tableColumn: true },
  { id: "importedAt", label: "Imported At", type: "date", tableColumn: true },
  {
    id: "status",
    label: "Status",
    type: "select",
    options: [
      { value: "present", label: "Present" },
      { value: "missing", label: "Missing" },
    ],
    tableColumn: false,
  },
];

export function getColumnConfig(
  column: RecordingColumn,
): FilterColumnConfig | undefined {
  return FILTER_COLUMNS.find((c) => c.id === column);
}

/**
 * parse an "hh:mm:ss" / "mm:ss" / "ss" duration into total seconds
 * returns null for empty, negative, or malformed input
 */
export function parseDuration(input: string): number | null {
  const trimmed = input.trim();
  if (trimmed === "" || trimmed.includes("-")) return null;
  const parts = trimmed.split(":");
  if (parts.length > 3) return null;
  let seconds = 0;
  for (const part of parts) {
    if (!/^\d+(\.\d+)?$/.test(part)) return null;
    seconds = seconds * 60 + Number(part);
  }
  return seconds;
}

/** format total seconds as "h:mm:ss" (or "m:ss" under an hour) */
export function formatDuration(totalSeconds: number): string {
  const t = Math.floor(totalSeconds);
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const s = t % 60;
  const ss = String(s).padStart(2, "0");
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${ss}`;
  return `${m}:${ss}`;
}

export const DURATION_ZERO = "00:00:00";

/**
 * Coerce arbitrary input into a strict "hh:mm:ss" mask. Digits fill from the
 * right (typing shifts left), minutes and seconds are clamped to 59.
 */
export function maskDuration(input: string): string {
  const digits = input.replace(/\D/g, "").slice(-6).padStart(6, "0");
  const hh = digits.slice(0, 2);
  const mm = Math.min(59, Number(digits.slice(2, 4)));
  const ss = Math.min(59, Number(digits.slice(4, 6)));
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${hh}:${pad(mm)}:${pad(ss)}`;
}

export interface ColumnFilter {
  column: RecordingColumn;
  operator: FilterOperator;
  value: string;
}

export function isUnary(op: FilterOperator): boolean {
  return op === "is_empty" || op === "is_not_empty";
}

export function newFilter(column: RecordingColumn): ColumnFilter {
  const col = getColumnConfig(column)!;
  return {
    column,
    operator: OPERATORS_BY_TYPE[col.type][0].id,
    value: col.type === "duration" ? DURATION_ZERO : "",
  };
}

/** filter narrows results only when it has a usable value or is unary */
export function isFilterActive(f: ColumnFilter): boolean {
  if (isUnary(f.operator)) return true;
  if (f.value.trim() === "") return false;
  // An incomplete duration (e.g. "1:") shouldn't filter until it parses.
  if (getColumnConfig(f.column)?.type === "duration") {
    return parseDuration(f.value) !== null;
  }
  return true;
}

export function matchesFilter(r: Recording, f: ColumnFilter): boolean {
  const raw = r[f.column] as string | number | null;
  const isEmpty = raw === null || raw === undefined || raw === "";

  // durations parse from hh:mm:ss, others as floats.
  const target =
    getColumnConfig(f.column)?.type === "duration"
      ? parseDuration(f.value)
      : Number.isNaN(parseFloat(f.value))
        ? null
        : parseFloat(f.value);

  switch (f.operator) {
    case "is_empty":
      return isEmpty;
    case "is_not_empty":
      return !isEmpty;

    // text + select
    case "contains":
      return (
        !isEmpty && String(raw).toLowerCase().includes(f.value.toLowerCase())
      );
    case "does_not_contain":
      return (
        isEmpty || !String(raw).toLowerCase().includes(f.value.toLowerCase())
      );
    case "is":
      return !isEmpty && String(raw).toLowerCase() === f.value.toLowerCase();
    case "is_not":
      return isEmpty || String(raw).toLowerCase() !== f.value.toLowerCase();

    // number + duration
    case "eq":
      return target === null || (!isEmpty && Number(raw) === target);
    case "neq":
      return target === null || isEmpty || Number(raw) !== target;
    case "gt":
      return target === null || (!isEmpty && Number(raw) > target);
    case "lt":
      return target === null || (!isEmpty && Number(raw) < target);
    case "gte":
      return target === null || (!isEmpty && Number(raw) >= target);
    case "lte":
      return target === null || (!isEmpty && Number(raw) <= target);

    // date — day granularity; YYYY-MM-DD strings compare lexicographically
    case "date_is":
    case "before":
    case "after":
    case "on_or_before":
    case "on_or_after": {
      if (isEmpty) return false;
      const day = String(raw).slice(0, 10);
      switch (f.operator) {
        case "date_is":
          return day === f.value;
        case "before":
          return day < f.value;
        case "after":
          return day > f.value;
        case "on_or_before":
          return day <= f.value;
        case "on_or_after":
          return day >= f.value;
      }
    }
  }
}

export function describeFilter(f: ColumnFilter): string {
  const col = getColumnConfig(f.column);
  const label = col?.label ?? f.column;
  const opLabel =
    (col &&
      OPERATORS_BY_TYPE[col.type].find((o) => o.id === f.operator)?.label) ??
    f.operator;

  if (isUnary(f.operator)) return `${label} ${opLabel}`;
  if (f.value.trim() === "") return `${label} ${opLabel} …`;

  let displayValue: string = f.value;
  if (col?.type === "select") {
    displayValue =
      col.options?.find((o) => o.value === f.value)?.label ?? f.value;
  } else if (col?.type === "duration") {
    const secs = parseDuration(f.value);
    displayValue = secs === null ? f.value : formatDuration(secs);
  }
  return `${label} ${opLabel} ${displayValue}`;
}
