import { Check } from "lucide-react";
import {
  OPERATORS_BY_TYPE,
  getColumnConfig,
  isUnary,
  maskDuration,
  type ColumnFilter,
  type FilterOperator,
} from "@lib/filterColumns";
import { MenuSeparator } from "@components/common/menu";
import { FilterBackButton } from "./FilterBackButton";

export function FilterColumnView({
  filter,
  onBack,
  onChange,
}: {
  filter: ColumnFilter;
  onBack: () => void;
  onChange: (next: ColumnFilter) => void;
}) {
  const col = getColumnConfig(filter.column)!;
  const operators = OPERATORS_BY_TYPE[col.type];
  const showValue = !isUnary(filter.operator);

  function setOperator(operator: FilterOperator) {
    onChange({
      ...filter,
      operator,
      value: isUnary(operator) ? "" : filter.value,
    });
  }

  function setValue(value: string) {
    onChange({ ...filter, value });
  }

  return (
    <>
      <FilterBackButton label={col.label} onBack={onBack} />
      <MenuSeparator />
      <div className="px-2.5 py-1 flex flex-col gap-1.5">
        <select
          value={filter.operator}
          onChange={(e) => setOperator(e.target.value as FilterOperator)}
          className="w-full bg-zinc-900 border border-zinc-700 rounded text-sm text-zinc-200 px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-zinc-500"
        >
          {operators.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </select>

        {showValue &&
          (col.type === "select" ? (
            <div className="flex flex-col">
              {col.options?.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setValue(opt.value)}
                  className="w-full text-left px-1.5 py-1 text-sm text-zinc-200 hover:bg-zinc-700 rounded flex items-center justify-between gap-2"
                >
                  <span>{opt.label}</span>
                  {filter.value === opt.value && (
                    <Check
                      size={12}
                      strokeWidth={2}
                      className="shrink-0 text-zinc-400"
                    />
                  )}
                </button>
              ))}
            </div>
          ) : col.type === "duration" ? (
            <input
              autoFocus
              type="text"
              inputMode="numeric"
              value={filter.value}
              onChange={(e) => setValue(maskDuration(e.target.value))}
              className="w-full bg-zinc-900 border border-zinc-700 rounded text-sm text-zinc-200 tabular-nums px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-zinc-500"
            />
          ) : (
            <input
              autoFocus
              type={
                col.type === "number"
                  ? "number"
                  : col.type === "date"
                    ? "date"
                    : "text"
              }
              min={col.type === "number" ? 0 : undefined}
              value={filter.value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={col.type === "text" ? "Value…" : undefined}
              className="w-full bg-zinc-900 border border-zinc-700 rounded text-sm text-zinc-200 px-1.5 py-1 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 scheme-dark"
            />
          ))}
      </div>
    </>
  );
}
