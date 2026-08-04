"use client";

import { ArrowRight, Phone, CheckCircle, Sparkles } from "lucide-react";

export default function CtaBanner({ onStartVoice }) {
  return (
    <section className="py-20 bg-[#0D0D0F] relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-[#7B5CFF]/20 blur-[150px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Banner Card */}
        <div className="glass-panel-glow p-10 sm:p-16 rounded-3xl border border-[#7B5CFF]/40 text-center space-y-8 relative overflow-hidden">
          
          {/* Audio Wave Visualizer background accent */}
          <div className="flex items-center justify-center gap-1.5 opacity-25 pointer-events-none mb-4">
            <span className="w-1.5 h-12 bg-[#7B5CFF] rounded-full animate-pulse" />
            <span className="w-1.5 h-20 bg-[#7B5CFF] rounded-full animate-pulse" style={{ animationDelay: '100ms' }} />
            <span className="w-1.5 h-16 bg-[#A78BFA] rounded-full animate-pulse" style={{ animationDelay: '200ms' }} />
            <span className="w-1.5 h-24 bg-[#7B5CFF] rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
            <span className="w-1.5 h-14 bg-[#A78BFA] rounded-full animate-pulse" style={{ animationDelay: '400ms' }} />
          </div>

          <h2 className="text-3xl sm:text-5xl font-black text-white max-w-3xl mx-auto leading-tight">
            Your Next Employee Doesn't Need a Desk. <br />
            It Needs <span className="text-[#A78BFA]">a Phone Number.</span>
          </h2>

          <p className="text-base sm:text-lg text-[#A1A1AA] max-w-xl mx-auto">
            Get started in under 5 minutes. No credit card required. Free tier available.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <button 
              onClick={onStartVoice}
              className="btn-primary px-8 py-4 rounded-xl text-base font-bold flex items-center gap-3 w-full sm:w-auto"
            >
              Create Your AI Agent Free
              <ArrowRight className="w-5 h-5" />
            </button>

            <button 
              onClick={onStartVoice}
              className="btn-secondary px-8 py-4 rounded-xl text-base font-semibold flex items-center gap-2 w-full sm:w-auto"
            >
              <Sparkles className="w-5 h-5 text-[#7B5CFF]" />
              Book a Demo
            </button>
          </div>

          {/* Guarantee Badges */}
          <div className="flex flex-wrap items-center justify-center gap-6 pt-6 text-xs text-[#A1A1AA]">
            <span className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" /> No credit card required
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" /> Go live in 5 minutes
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" /> Cancel anytime
            </span>
          </div>

        </div>

        {/* Footer */}
        <footer className="mt-20 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-xs text-[#A1A1AA] gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white">HeyIra.</span>
            <span>© 2026 HeyIra Technologies Inc. All rights reserved.</span>
          </div>

          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-white transition">Privacy Policy</a>
            <a href="#" className="hover:text-white transition">Terms of Service</a>
            <a href="#" className="hover:text-white transition">Security & HIPAA</a>
            <a href="#" className="hover:text-white transition">Contact Us</a>
          </div>
        </footer>

      </div>
    </section>
  );
}
