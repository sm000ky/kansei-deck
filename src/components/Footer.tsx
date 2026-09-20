import React from 'react';
import { Heart, Github, ExternalLink, Cpu } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-[#242d42] bg-[#090c13] mt-8 py-6 px-4 text-slate-400 text-xs">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Left: Brand & Credit */}
        <div className="text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-2 text-white font-medium mb-1">
            <span>KANSEI DECK // 感性</span>
            <span className="text-slate-600">•</span>
            <span className="text-[#ff2a5f] flex items-center gap-1">
              sm000ky × Zero Two <Heart className="w-3 h-3 fill-current" />
            </span>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed flex items-center justify-center sm:justify-start gap-1.5">
            <Cpu className="w-3 h-3 text-cyan-400" />
            <span>Pure Client-Side Web Audio API • 100% Real-Time Synthesizer • Anti-LMK Safe</span>
          </p>
        </div>

        {/* Right: GitHub Repo */}
        <div className="flex items-center gap-3">
          <a
            href="https://github.com/sm000ky/kansei-deck"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#161b29] hover:bg-[#20273b] border border-[#242d42] text-white font-mono text-xs transition-all"
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
