import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export interface BackLinkProps {
  href: string;
  label: string;
}

export function BackLink({ href, label }: BackLinkProps) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-[#19376d] mb-5 group transition-colors"
    >
      <ArrowLeft className="w-4 h-4 text-slate-500 group-hover:text-[#19376d] group-hover:-translate-x-0.5 transition-all" />
      <span>{label}</span>
    </Link>
  );
}

