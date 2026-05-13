"use client";
import { useHRStore } from "@/lib/store";
import { useRouter, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import Stepper from "./Stepper";

const NAV = [
  { step: 1, path: "/form",         icon: "📋", label: "Candidate Details" },
  { step: 2, path: "/compensation",  icon: "💰", label: "Compensation" },
  { step: 3, path: "/editor",        icon: "✏️",  label: "Editor & Preview" },
  { step: 4, path: "/export",        icon: "📥", label: "Download" },
];

export default function Layout({ children, step }: { children: React.ReactNode; step: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const { employmentType } = useHRStore();

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-60 bg-gradient-to-b from-brand to-brand-dark flex flex-col fixed h-screen z-20">
        {/* Logo */}
        <div className="px-6 py-6 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="text-white text-xl font-bold tracking-tight">⇒ Tericsoft</span>
          </div>
          <p className="text-white/50 text-xs mt-1">HR Portal</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map((item) => (
            <button
              key={item.step}
              onClick={() => router.push(item.path)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left",
                pathname === item.path
                  ? "bg-white/20 text-white"
                  : step >= item.step
                  ? "text-white/80 hover:bg-white/10"
                  : "text-white/30 cursor-not-allowed"
              )}
              disabled={step < item.step}
            >
              <span className="text-base">{item.icon}</span>
              <span>{item.label}</span>
              {step > item.step && (
                <span className="ml-auto text-green-400 text-xs">✓</span>
              )}
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-white/10">
          <p className="text-white/30 text-xs">
            {employmentType === "fulltime" ? "🏢 Full-Time" : "🎓 Internship"}
          </p>
          <p className="text-white/20 text-xs mt-0.5">CIN: U72900TG2018PTC125275</p>
        </div>
      </aside>

      {/* Main */}
      <main className="ml-60 flex-1 min-h-screen">
        {/* Top bar */}
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-gray-100 px-8 py-3">
          <Stepper current={step} />
        </div>

        {/* Content */}
        <div className="px-8 py-6">{children}</div>
      </main>
    </div>
  );
}
