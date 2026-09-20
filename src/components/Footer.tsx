import React from 'react';
import { Heart, Github, ExternalLink, Shield } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-[#242d42] bg-[#090c13] mt-12 py-8 px-4 text-slate-400 text-xs">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Left Column: Credit & Persona */}
        <div className="text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-1.5 text-white font-medium mb-1">
            <span>KANSEI DECK // 感性</span>
            <span className="text-slate-600">•</span>
            <span className="text-[#ff2a5f] flex items-center gap-1">
              sm000ky × Zero Two <Heart className="w-3 h-3 fill-current" />
            </span>
          </div>
          <p className="text-[11px] text-slate-500 max-w-md leading-relaxed">
            Pure client-side Web Audio API synthesizer. Zero server overhead, zero audio streaming bandwidth, 100% resilient against Android LMK.
          </p>
        </div>

        {/* Center: The 6 Pillars Journey Links */}
        <div className="flex flex-wrap items-center justify-center gap-2 font-mono text-[11px]">
          <a
            href="https://github.com/sm000ky/finora"
            target="_blank"
            rel="noreferrer"
            className="px-2 py-1 rounded bg-[#121624] border border-[#1e2536] hover:text-white transition-colors"
          >
            Day 1: finora
          </a>
          <a
            href="https://github.com/sm000ky/fiscalia"
            target="_blank"
            rel="noreferrer"
            className="px-2 py-1 rounded bg-[#121624] border border-[#1e2536] hover:text-white transition-colors"
          >
            Day 2: fiscalia
          </a>
          <a
            href="https://github.com/sm000ky/sedot-cli"
            target="_blank"
            rel="noreferrer"
            className="px-2 py-1 rounded bg-[#121624] border border-[#1e2536] hover:text-white transition-colors"
          >
            Day 3: sedot-cli
          </a>
          <a
            href="https://github.com/sm000ky/komorebi-studio"
            target="_blank"
            rel="noreferrer"
            className="px-2 py-1 rounded bg-[#121624] border border-[#1e2536] hover:text-white transition-colors"
          >
            Day 4: komorebi
          </a>
          <a
            href="https://github.com/sm000ky/sm0kade"
            target="_blank"
            rel="noreferrer"
            className="px-2 py-1 rounded bg-[#121624] border border-[#1e2536] hover:text-white transition-colors"
          >
            Day 5: sm0kade
          </a>
          <span className="px-2 py-1 rounded bg-[#ff2a5f]/15 border border-[#ff2a5f]/40 text-[#ff2a5f] font-bold">
            Day 6: kansei-deck 🚀
          </span>
        </div>

        {/* Right Column: GitHub Repository */}
        <div className="flex items-center gap-3">
          <a
            href="https://github.com/sm000ky/kansei-deck"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#161b29] hover:bg-[#20273b] border border-[#242d42] text-white font-mono text-xs transition-all"
          >
            <Github className="w-3.5 h-3.5" />
            <span>sm000ky/kansei-deck</span>
            <ExternalLink className="w-3 h-3 text-slate-500" />
          </a>
        </div>
      </div>
    </footer>
  );
};
