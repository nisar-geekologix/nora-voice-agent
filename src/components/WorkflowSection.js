"use client";

import { BUILD_STEPS, CONVERSATION_FLOW } from "../data/brandData";
import { Database, Cpu, Volume2, Zap, Rocket, User, Brain, Sparkles, CheckCircle, ArrowRight } from "lucide-react";

const ICON_MAP = {
  Database, Cpu, Volume2, Zap, Rocket, User, Brain, Sparkles, CheckCircle
};

export default function WorkflowSection() {
  return (
    <section className="py-24 bg-[#0D0D0F] border-t border-white/5 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-24">
        
        {/* Section 1: Build Your AI Employee in Minutes */}
        <div className="space-y-12">
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <div className="inline-block px-3 py-1 rounded-full bg-[#7B5CFF]/15 text-[#A78BFA] text-xs font-bold uppercase tracking-wider">
              Simple 5-Step Setup
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
              Build Your AI Employee in Minutes
            </h2>
            <p className="text-[#A1A1AA] text-base">
              No technical expertise needed. Train your agent, connect integrations, and deploy a phone number immediately.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {BUILD_STEPS.map((step, idx) => {
              const IconComp = ICON_MAP[step.icon] || Zap;
              return (
                <div 
                  key={idx}
                  className="glass-panel p-6 rounded-2xl border border-white/10 hover:border-[#7B5CFF]/50 transition duration-300 space-y-4 relative group"
                >
                  {/* Step Badge */}
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-xl bg-[#7B5CFF]/10 text-[#7B5CFF] group-hover:bg-[#7B5CFF] group-hover:text-white transition duration-300 flex items-center justify-center">
                      <IconComp className="w-6 h-6" />
                    </div>
                    <span className="text-2xl font-black text-white/20 group-hover:text-[#7B5CFF] transition">
                      0{step.step}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-base font-bold text-white mb-1">{step.title}</h4>
                    <p className="text-xs text-[#A1A1AA] leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 2: Human-like Conversations, Powered by AI */}
        <div className="glass-panel-glow p-8 sm:p-14 rounded-3xl border border-[#7B5CFF]/30 space-y-12">
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
              Human-like Conversations, Powered by AI
            </h2>
            <p className="text-[#A1A1AA] text-base">
              HeyIra understands context, accesses your live database, and responds just like a top human employee—with empathy and intelligence.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
            {CONVERSATION_FLOW.map((node, idx) => {
              const IconComp = ICON_MAP[node.icon] || Sparkles;
              return (
                <div key={idx} className="flex flex-col items-center text-center space-y-3 relative group">
                  <div className="w-16 h-16 rounded-2xl bg-[#0D0D0F] border border-[#7B5CFF]/40 flex items-center justify-center text-[#7B5CFF] group-hover:scale-110 group-hover:border-[#7B5CFF] transition duration-300 shadow-lg shadow-[#7B5CFF]/20">
                    <IconComp className="w-7 h-7" />
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-white mb-1">{node.title}</h5>
                    <p className="text-xs text-[#A1A1AA]">{node.desc}</p>
                  </div>

                  {idx < CONVERSATION_FLOW.length - 1 && (
                    <div className="hidden md:block absolute top-8 -right-3 text-[#7B5CFF]/40">
                      <ArrowRight className="w-5 h-5" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </section>
  );
}
