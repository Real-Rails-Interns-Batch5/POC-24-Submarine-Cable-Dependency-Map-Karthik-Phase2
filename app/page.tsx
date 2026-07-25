"use client";

import dynamic from 'next/dynamic';
import { useAppState } from '@/components/providers/AppStateProvider';
import { IntelligenceSidebar } from '@/components/layout/IntelligenceSidebar';
import { LandingPointPanel } from '@/components/layout/LandingPointPanel';
import { Header } from '@/components/layout/Header';
import { X } from 'lucide-react';

const LeafletCableMap = dynamic(() => import('@/components/map/LeafletCableMap'), { 
  ssr: false,
  loading: () => <div className="w-full h-full bg-[#08131B] flex items-center justify-center text-[#36D6FF]">Loading geographic data...</div>
});

export default function Home() {
  const { state, closePanel } = useAppState();

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[var(--background)] text-[var(--text-primary)] relative">
      <Header />
      
      {/* Immersive Full-Screen Map Visualization */}
      <main className="w-full h-full relative z-0">
        <LeafletCableMap />
      </main>

      {/* Slide-over Intelligence Panel */}
      <div 
        className={`absolute top-0 right-0 h-full w-[380px] sm:w-[520px] z-10 bg-[var(--surface)] shadow-2xl border-l border-[var(--border)] will-change-transform transition-transform duration-[350ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
          state.panelOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Close button — pops in when panel opens */}
        {state.panelOpen && (
          <button 
            onClick={closePanel}
            className="animate-pop-in absolute top-4 right-4 z-20 p-1.5 bg-[var(--background)] border border-[var(--border)] rounded text-[var(--text-muted)] hover:text-[#36D6FF] hover:border-[#36D6FF]/40 transition-colors duration-150"
            aria-label="Close panel"
          >
            <X size={18} />
          </button>
        )}

        {/* Content — keyed on selection so React remounts and triggers animation on every swap */}
        <div className="h-full overflow-y-auto sidebar-scroll">
          {state.selectedCable && (
            <div key={`cable-${state.selectedCable}`} className="animate-panel-content">
              <IntelligenceSidebar />
            </div>
          )}
          {state.selectedLandingPoint && !state.selectedCable && (
            <div key={`lp-${state.selectedLandingPoint}`} className="animate-panel-content">
              <LandingPointPanel landingPointId={state.selectedLandingPoint} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
