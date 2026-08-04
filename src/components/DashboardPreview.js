"use client";

import { Phone, CheckCircle2, TrendingUp, Clock, ShieldCheck, Users, BarChart3, ArrowUpRight } from "lucide-react";

export default function DashboardPreview() {
  return (
    <section className="py-20 bg-[#0D0D0F] border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Title */}
        <div className="text-center space-y-4 max-w-3xl mx-auto mb-16">
          <div className="inline-block px-3 py-1 rounded-full bg-[#7B5CFF]/15 text-[#A78BFA] text-xs font-bold uppercase tracking-wider">
            Live Analytics
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
            Real-time Insights, Real Results
          </h2>
          <p className="text-[#A1A1AA] text-base">
            Track performance, monitor live calls, analyze sentiment, and optimize your AI employees in real-time.
          </p>
        </div>

        {/* Dashboard Mockup Container */}
        <div className="glass-panel p-6 sm:p-10 rounded-3xl border border-white/10 space-y-8 shadow-2xl">
          
          {/* Top Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                HeyIra Business Overview
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#7B5CFF]/20 text-[#A78BFA] border border-[#7B5CFF]/30 font-medium">
                  This Week
                </span>
              </h3>
              <p className="text-xs text-[#A1A1AA]">Updated 1 min ago • Live CRM Sync Active</p>
            </div>

            <div className="flex items-center gap-3">
              <button className="btn-secondary px-4 py-2 rounded-xl text-xs font-semibold">
                Export Report
              </button>
              <button className="btn-primary px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1">
                <BarChart3 className="w-3.5 h-3.5" />
                Live Dashboard
              </button>
            </div>
          </div>

          {/* Metric Cards Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-[#0D0D0F]/90 p-5 rounded-2xl border border-white/5 space-y-2">
              <span className="text-xs text-[#A1A1AA] font-medium">Calls Handled</span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-black text-white">2,540</span>
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-0.5">
                  +12.5% <ArrowUpRight className="w-3 h-3" />
                </span>
              </div>
            </div>

            <div className="bg-[#0D0D0F]/90 p-5 rounded-2xl border border-white/5 space-y-2">
              <span className="text-xs text-[#A1A1AA] font-medium">Answered Calls</span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-black text-white">2,123</span>
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-0.5">
                  +8.4% <ArrowUpRight className="w-3 h-3" />
                </span>
              </div>
            </div>

            <div className="bg-[#0D0D0F]/90 p-5 rounded-2xl border border-white/5 space-y-2">
              <span className="text-xs text-[#A1A1AA] font-medium">Direct Meetings</span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-black text-white">532</span>
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-0.5">
                  +18.7% <ArrowUpRight className="w-3 h-3" />
                </span>
              </div>
            </div>

            <div className="bg-[#0D0D0F]/90 p-5 rounded-2xl border border-white/5 space-y-2">
              <span className="text-xs text-[#A1A1AA] font-medium">Revenue Generated</span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-black text-[#A78BFA]">₹4.8L</span>
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-0.5">
                  +26.3% <ArrowUpRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          </div>

          {/* Second Metrics Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-[#0D0D0F]/90 p-4 rounded-xl border border-white/5 flex items-center justify-between">
              <div>
                <p className="text-[11px] text-[#A1A1AA]">Average Sale Time</p>
                <p className="text-lg font-bold text-white">02:46 min</p>
              </div>
              <Clock className="w-5 h-5 text-[#7B5CFF]" />
            </div>

            <div className="bg-[#0D0D0F]/90 p-4 rounded-xl border border-white/5 flex items-center justify-between">
              <div>
                <p className="text-[11px] text-[#A1A1AA]">Response Rate</p>
                <p className="text-lg font-bold text-emerald-400">98.6%</p>
              </div>
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            </div>

            <div className="bg-[#0D0D0F]/90 p-4 rounded-xl border border-white/5 flex items-center justify-between">
              <div>
                <p className="text-[11px] text-[#A1A1AA]">AI Accuracy</p>
                <p className="text-lg font-bold text-white">96.3%</p>
              </div>
              <ShieldCheck className="w-5 h-5 text-[#7B5CFF]" />
            </div>

            <div className="bg-[#0D0D0F]/90 p-4 rounded-xl border border-white/5 flex items-center justify-between">
              <div>
                <p className="text-[11px] text-[#A1A1AA]">Call Success Rate</p>
                <p className="text-lg font-bold text-[#A78BFA]">89.7%</p>
              </div>
              <TrendingUp className="w-5 h-5 text-[#A78BFA]" />
            </div>
          </div>

          {/* Recent Calls Log Table */}
          <div className="bg-[#0D0D0F]/90 rounded-2xl p-5 border border-white/5 space-y-4">
            <h4 className="text-sm font-bold text-white">Recent Completed Calls</h4>
            <div className="space-y-2">
              {[
                { name: "Rahul Sharma", phone: "+91 98765 43210", status: "Booking Confirmed", time: "02:14 PM", outcome: "Retail Order Tracked" },
                { name: "Sneha Iyer", phone: "+91 91234 56789", status: "Lead Qualified", time: "02:07 PM", outcome: "Site Visit Scheduled" },
                { name: "Amit Verma", phone: "+91 99887 76655", status: "Query Resolved", time: "01:55 PM", outcome: "Policy Info Sent" }
              ].map((row, idx) => (
                <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl bg-white/5 text-xs gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#7B5CFF]/20 text-[#7B5CFF] font-bold flex items-center justify-center">
                      {row.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-white">{row.name}</p>
                      <p className="text-[11px] text-[#A1A1AA]">{row.phone}</p>
                    </div>
                  </div>

                  <div className="text-left sm:text-right">
                    <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-semibold mb-1">
                      {row.status}
                    </span>
                    <p className="text-[11px] text-white/50">{row.outcome} • {row.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
