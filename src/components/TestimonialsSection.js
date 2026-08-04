"use client";

import { TESTIMONIALS } from "../data/brandData";
import { Quote, Star } from "lucide-react";

export default function TestimonialsSection() {
  return (
    <section className="py-20 bg-[#0D0D0F]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto mb-16">
          <div className="inline-block px-3 py-1 rounded-full bg-[#7B5CFF]/15 text-[#A78BFA] text-xs font-bold uppercase tracking-wider">
            Customer Stories
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
            Loved by Businesses, Trusted by Thousands
          </h2>
          <p className="text-[#A1A1AA] text-base">
            See how founders, CXOs, and support leaders use HeyIra to automate customer calls effortlessly.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {TESTIMONIALS.map((t, idx) => (
            <div 
              key={idx}
              className="glass-panel p-6 rounded-2xl border border-white/10 hover:border-[#7B5CFF]/40 transition duration-300 flex flex-col justify-between space-y-6"
            >
              <div className="space-y-4">
                <div className="flex items-center gap-1 text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400" />
                  ))}
                </div>
                <p className="text-xs text-white/90 leading-relaxed italic">
                  "{t.quote}"
                </p>
              </div>

              <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                <div>
                  <h5 className="text-xs font-bold text-white">{t.author}</h5>
                  <p className="text-[11px] text-[#A1A1AA]">{t.role}</p>
                </div>
                <span className="text-[11px] font-bold text-[#7B5CFF]">{t.company}</span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
