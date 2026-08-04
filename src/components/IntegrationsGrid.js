"use client";

import { INTEGRATIONS } from "../data/brandData";
import { ArrowRight, Layers } from "lucide-react";

export default function IntegrationsGrid() {
  return (
    <section className="py-20 bg-[#0D0D0F] border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div className="space-y-3">
            <div className="inline-block px-3 py-1 rounded-full bg-[#7B5CFF]/15 text-[#A78BFA] text-xs font-bold uppercase tracking-wider">
              Ecosystem
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
              Seamless Integrations
            </h2>
            <p className="text-[#A1A1AA] text-base max-w-xl">
              Connect HeyIra to your existing CRMs, payment gateways, messaging channels, and calendars with zero code.
            </p>
          </div>

          <button className="text-sm font-semibold text-[#7B5CFF] hover:text-[#A78BFA] flex items-center gap-2 self-start md:self-auto transition">
            View all 50+ integrations
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* 10 Integrations Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {INTEGRATIONS.map((item, idx) => (
            <div
              key={idx}
              className="glass-panel p-5 rounded-2xl border border-white/10 hover:border-[#7B5CFF]/40 transition duration-300 flex items-center gap-4 group"
            >
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm text-white shrink-0 shadow-md"
                style={{ backgroundColor: `${item.color}25`, border: `1px solid ${item.color}50` }}
              >
                <span style={{ color: item.color }}>{item.name.charAt(0)}</span>
              </div>

              <div>
                <h5 className="text-sm font-bold text-white group-hover:text-[#A78BFA] transition">{item.name}</h5>
                <span className="text-[11px] text-[#A1A1AA]">{item.category}</span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
