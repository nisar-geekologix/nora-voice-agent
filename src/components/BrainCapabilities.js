"use client";

import { BRAIN_CAPABILITIES } from "../data/brandData";
import { Brain, Zap, Wrench, Globe, Heart, ArrowUpRight } from "lucide-react";

const ICON_MAP = {
  Brain, Zap, Wrench, Globe, Heart
};

export default function BrainCapabilities() {
  return (
    <section className="py-20 bg-[#0D0D0F]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto mb-16">
          <div className="inline-block px-3 py-1 rounded-full bg-[#7B5CFF]/15 text-[#A78BFA] text-xs font-bold uppercase tracking-wider">
            AI Brain Technology
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
            Powered by an Advanced AI Brain
          </h2>
          <p className="text-[#A1A1AA] text-base">
            Our AI brain understands, remembers, reasons, and takes action like a top human employee.
          </p>
        </div>

        {/* 5 Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {BRAIN_CAPABILITIES.map((item) => {
            const IconComp = ICON_MAP[item.icon] || Brain;
            return (
              <div 
                key={item.id}
                className="glass-panel p-6 rounded-2xl border border-white/10 hover:border-[#7B5CFF]/50 transition duration-300 flex flex-col justify-between space-y-6 group"
              >
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-xl bg-[#7B5CFF]/10 border border-[#7B5CFF]/20 text-[#7B5CFF] group-hover:bg-[#7B5CFF] group-hover:text-white transition duration-300 flex items-center justify-center">
                    <IconComp className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-white mb-2">{item.title}</h4>
                    <p className="text-xs text-[#A1A1AA] leading-relaxed">{item.desc}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-xs text-[#7B5CFF] font-semibold group-hover:translate-x-1 transition duration-200">
                  <span>Explore Feature</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
