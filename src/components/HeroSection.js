"use client";

import { ArrowRight, PhoneCall, Mic, Sparkles, Volume2, CheckCircle2, ShieldCheck } from "lucide-react";

export default function HeroSection({ onStartVoice }) {
  return (
    <section className="relative overflow-hidden pt-12 pb-24 lg:pt-20 lg:pb-32">
      {/* Background ambient radial gradients */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#7B5CFF]/15 blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute top-1/3 right-10 w-[400px] h-[400px] bg-[#A78BFA]/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Hero Text Column */}
          <div className="lg:col-span-7 space-y-8 text-center lg:text-left">
            
            {/* Top Pill Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#7B5CFF]/10 border border-[#7B5CFF]/30 backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-[#7B5CFF] animate-ping" />
              <span className="text-xs font-semibold uppercase tracking-wider text-[#A78BFA]">
                AI Voice Agents For Every Business
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-6xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.1]">
              The AI Employee That <span className="text-white">Answers.</span> <span className="text-white">Sells.</span> <span className="text-white">Books.</span>{" "}
              <span className="bg-gradient-to-r from-[#7B5CFF] to-[#A78BFA] bg-clip-text text-transparent block mt-2">
                Follows Up.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg sm:text-xl text-[#A1A1AA] max-w-2xl mx-auto lg:mx-0 font-normal leading-relaxed">
              Build human-like AI Voice Agents for Sales, Support, Booking, Collections and Follow-ups. No code. Go live in 5 minutes.
            </p>

            {/* CTA Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              <button 
                onClick={onStartVoice}
                className="btn-primary px-8 py-4 rounded-xl text-base font-bold flex items-center justify-center gap-3 w-full sm:w-auto"
              >
                Start Building Free
                <ArrowRight className="w-5 h-5" />
              </button>

              <button 
                onClick={onStartVoice}
                className="btn-secondary px-8 py-4 rounded-xl text-base font-semibold flex items-center justify-center gap-3 w-full sm:w-auto"
              >
                <Mic className="w-5 h-5 text-[#7B5CFF]" />
                Try Interactive Demo
              </button>
            </div>

            {/* Trust Proof Avatars */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <div className="flex -space-x-3">
                <img className="w-10 h-10 rounded-full border-2 border-[#0D0D0F]" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80" alt="User" />
                <img className="w-10 h-10 rounded-full border-2 border-[#0D0D0F]" src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80" alt="User" />
                <img className="w-10 h-10 rounded-full border-2 border-[#0D0D0F]" src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80" alt="User" />
                <img className="w-10 h-10 rounded-full border-2 border-[#0D0D0F]" src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80" alt="User" />
              </div>
              <p className="text-sm text-[#A1A1AA]">
                Loved by <strong className="text-white font-semibold">1200+ businesses</strong> across India & global markets
              </p>
            </div>
          </div>

          {/* Right Phone Mockup Column */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-full max-w-sm">
              {/* Decorative phone outer frame */}
              <div className="glass-panel-glow rounded-[40px] p-4 relative shadow-2xl overflow-hidden border border-[#7B5CFF]/40 bg-[#14131A]">
                
                {/* Phone Notch */}
                <div className="w-32 h-4 bg-black/60 mx-auto rounded-b-xl mb-4" />

                {/* Call Header */}
                <div className="text-center space-y-2 mb-6">
                  <div className="inline-block px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] text-[#A78BFA] font-medium">
                    Incoming Voice Call
                  </div>
                  
                  <div className="flex items-center justify-center gap-3 pt-2">
                    <img className="w-14 h-14 rounded-full border-2 border-[#7B5CFF]" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80" alt="Customer" />
                    <div className="text-left">
                      <h4 className="font-bold text-white text-base">Rahul Sharma</h4>
                      <p className="text-xs text-[#A1A1AA]">Retail Customer</p>
                    </div>
                  </div>
                </div>

                {/* Real-time Voice Waves / Orb Container */}
                <div className="bg-[#0D0D0F]/90 rounded-2xl p-6 border border-white/5 space-y-6 text-center">
                  
                  {/* Spoken bubble */}
                  <div className="bg-[#7B5CFF]/15 border border-[#7B5CFF]/30 p-3.5 rounded-2xl text-left space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-[#A78BFA] font-medium">
                      <span>HeyIra Speaking...</span>
                      <span className="flex items-center gap-1"><Volume2 className="w-3 h-3" /> Live</span>
                    </div>
                    <p className="text-xs text-white leading-relaxed">
                      "Hi Rahul, your order has shipped! Would you like me to send the tracking link to your WhatsApp?"
                    </p>
                  </div>

                  {/* Animated Waveform Visualizer */}
                  <div className="flex items-center justify-center gap-1.5 h-16 py-2">
                    <div className="wave-bar" style={{ animationDelay: '0.1s', height: '24px' }} />
                    <div className="wave-bar" style={{ animationDelay: '0.3s', height: '48px' }} />
                    <div className="wave-bar" style={{ animationDelay: '0.2s', height: '36px' }} />
                    <div className="wave-bar" style={{ animationDelay: '0.5s', height: '56px' }} />
                    <div className="wave-bar" style={{ animationDelay: '0.4s', height: '30px' }} />
                    <div className="wave-bar" style={{ animationDelay: '0.6s', height: '42px' }} />
                    <div className="wave-bar" style={{ animationDelay: '0.2s', height: '20px' }} />
                  </div>

                  {/* Interactive Button inside phone */}
                  <button 
                    onClick={onStartVoice}
                    className="w-full py-3 bg-gradient-to-r from-[#7B5CFF] to-[#6340FF] hover:opacity-90 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-2 shadow-lg shadow-[#7B5CFF]/30"
                  >
                    <Mic className="w-4 h-4 animate-bounce" />
                    Tap to Join Live Session
                  </button>
                </div>

                {/* Bottom Call Controls simulation */}
                <div className="flex items-center justify-around pt-6 pb-2">
                  <div className="w-12 h-12 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 cursor-pointer">
                    <PhoneCall className="w-5 h-5 rotate-[135deg]" />
                  </div>
                  <div className="w-14 h-14 rounded-full bg-emerald-500 flex items-center justify-center text-white cursor-pointer shadow-lg shadow-emerald-500/30 animate-pulse">
                    <PhoneCall className="w-6 h-6" />
                  </div>
                </div>

              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
