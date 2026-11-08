import React from "react";
import { ChevronDown } from "lucide-react";

export interface FilterSelectOption {
  value: string;
  label?: string;
}

export interface FilterSelectProps {
  id?: string;
  ariaLabel: string;
  value: string;
  onChange: (value: string) => void;
  options?: Array<string | FilterSelectOption>;
  children?: React.ReactNode;
  className?: string;
  selectClassName?: string;
  title?: string;
}

/**
 * FilterSelect: Komponen dropdown filter seragam dan modular untuk toolbar pencarian
 * Digunakan di seluruh halaman katalog, pelanggan, penawaran, dan faktur.
 */
export function FilterSelect({
  id,
  ariaLabel,
  value,
  onChange,
  options,
  children,
  className = "",
  selectClassName = "",
  title,
}: FilterSelectProps) {
  return (
    <div className={`relative shrink-0 ${className}`}>
      <select
        id={id}
        aria-label={ariaLabel}
        title={title || ariaLabel}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full sm:w-auto h-9.5 pl-3 pr-7.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-xs font-medium text-slate-700 outline-none focus:ring-1 focus:ring-[#19376d] cursor-pointer transition-colors appearance-none ${selectClassName}`}
      >
        {options
          ? options.map((opt) => {
              const val = typeof opt === "string" ? opt : opt.value;
              const lbl = typeof opt === "string" ? opt : opt.label ?? opt.value;
              return (
                <option key={val} value={val}>
                  {lbl}
                </option>
              );
            })
          : children}
      </select>
      <ChevronDown
        aria-hidden="true"
        className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
      />
    </div>
  );
}

