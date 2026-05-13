"use client";
import { cn } from "@/lib/utils";

const STEPS = [
  { n: 1, label: "Candidate Details" },
  { n: 2, label: "Compensation" },
  { n: 3, label: "Editor & Preview" },
  { n: 4, label: "Download" },
];

export default function Stepper({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {STEPS.map((s, i) => (
        <div key={s.n} className="flex items-center">
          {/* Circle */}
          <div className="flex flex-col items-center">
            <div
              className={cn(
                "w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-all",
                current === s.n
                  ? "bg-brand border-brand text-white shadow-lg shadow-brand/30"
                  : current > s.n
                  ? "bg-brand border-brand text-white"
                  : "bg-white border-gray-300 text-gray-400"
              )}
            >
              {current > s.n ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              ) : s.n}
            </div>
            <span
              className={cn(
                "text-xs mt-1.5 font-medium whitespace-nowrap",
                current === s.n ? "text-brand" : current > s.n ? "text-brand" : "text-gray-400"
              )}
            >
              {s.label}
            </span>
          </div>
          {/* Connector */}
          {i < STEPS.length - 1 && (
            <div
              className={cn(
                "w-16 h-0.5 mx-1 mb-5 transition-all",
                current > s.n ? "bg-brand" : "bg-gray-200"
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}
