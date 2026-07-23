"use client";

import { Info, X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export function Header() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <header className="animate-header-rise absolute inset-x-0 top-0 z-[5] flex items-start justify-between px-6 py-4 pointer-events-none">
      <div className="pointer-events-auto rounded-lg border border-[var(--border)]/50 bg-[var(--surface)]/80 px-4 py-2 shadow-lg backdrop-blur-md">
        <h1 className="text-xs font-bold tracking-widest uppercase text-[var(--text-primary)]">
          Infocreon <span className="ml-1 text-[var(--primary)]">Internship</span>
        </h1>
      </div>

      <button
        onClick={() => setIsOpen(true)}
        className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--border)]/70 bg-[var(--surface)]/85 text-[var(--text-muted)] shadow-lg backdrop-blur-md transition-colors hover:border-[var(--primary)]/60 hover:text-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/70"
        aria-label="About this dashboard"
        aria-haspopup="dialog"
      >
        <Info size={18} />
      </button>

      {isOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-[#030712]/70 p-5 animate-fade-in"
            role="presentation"
            onMouseDown={() => setIsOpen(false)}
          >
          <section
            className="w-full max-w-md rounded-2xl border border-[#36D6FF]/25 bg-[#0D1C28] p-6 shadow-2xl shadow-black/60"
            role="dialog"
            aria-modal="true"
            aria-labelledby="project-information-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#36D6FF]">Project information</p>
                <h2 id="project-information-title" className="text-xl font-semibold text-[#F1F5F9]">Submarine Cable Dependency Map</h2>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-md p-1.5 text-[#94A3B8] transition-colors hover:bg-[#1D3446] hover:text-[#F1F5F9] focus:outline-none focus:ring-2 focus:ring-[#36D6FF]/70"
                aria-label="Close project information"
              >
                <X size={18} />
              </button>
            </div>

            <dl className="space-y-4 text-sm">
              <div className="grid grid-cols-[100px_1fr] gap-4 border-b border-[#1D3446] pb-4">
                <dt className="text-xs font-bold uppercase tracking-wider text-[#94A3B8]">Architect</dt>
                <dd className="font-medium text-[#F1F5F9]">Karthik L</dd>
              </div>
              <div className="grid grid-cols-[100px_1fr] gap-4 border-b border-[#1D3446] pb-4">
                <dt className="text-xs font-bold uppercase tracking-wider text-[#94A3B8]">Cohort</dt>
                <dd className="font-medium text-[#F1F5F9]">Batch 5 Interns</dd>
              </div>
              <div>
                <dt className="mb-2 text-xs font-bold uppercase tracking-wider text-[#94A3B8]">Technology</dt>
                <dd className="flex flex-wrap gap-2">
                  {['Next.js', 'FastAPI', 'Tailwind CSS', 'Leaflet'].map((technology) => (
                    <span key={technology} className="rounded border border-[#36D6FF]/20 bg-[#36D6FF]/10 px-2 py-1 text-xs font-medium text-[#36D6FF]">
                      {technology}
                    </span>
                  ))}
                </dd>
              </div>
            </dl>
          </section>
          </div>,
          document.body
        )}
    </header>
  );
}
