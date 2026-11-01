import React from "react";
import Link from "next/link";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  separator?: ">" | "/";
  rootLabel?: string;
  className?: string;
}

export function Breadcrumb({
  items,
  separator = "/",
  rootLabel = "Penawaran & tagihan penjualan",
  className = "mb-4",
}: BreadcrumbProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={`text-sm text-slate-600 ${className}`}
    >
      <span>{rootLabel}</span>
      {items.map((item, idx) => {
        const isLast = idx === items.length - 1;
        return (
          <React.Fragment key={`${item.label}-${idx}`}>
            <span className="mx-2 text-slate-400">{separator}</span>
            {item.href && !isLast ? (
              <Link
                href={item.href}
                className="hover:text-slate-900 transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span className="font-semibold text-slate-900">{item.label}</span>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}

