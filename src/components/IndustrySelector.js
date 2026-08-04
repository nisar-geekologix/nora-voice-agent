"use client";

import { useState } from "react";
import { INDUSTRIES } from "../data/brandData";
import { 
  PhoneIncoming, ShoppingBag, Volume2, Ticket, MessageSquare, 
  Calendar, CheckCircle2, Send, GraduationCap, Database, Mic, 
  CalendarCheck, Home, Search, DollarSign, UserCheck, Car, 
  Layers, ShieldCheck, Bell, Bed, Grid, Key, Mail, CreditCard, 
  Cpu, Zap, Shield, Activity, ArrowRight 
} from "lucide-react";

// Icon mapping helper
const ICON_MAP = {
  PhoneIncoming, ShoppingBag, Volume2, Ticket, MessageSquare,
  Calendar, CheckCircle2, Send, GraduationCap, Database, Mic,
  CalendarCheck, Home, Search, DollarSign, UserCheck, Car,
  Layers, ShieldCheck, Bell, Bed, Grid, Key, Mail, CreditCard,
  Cpu, Zap, Shield, Activity
};

export default function IndustrySelector() {
  const [selectedId, setSelectedId] = useState("retail");

  const currentIndustry = INDUSTRIES.find((item) => item.id === selectedId) || INDUSTRIES[0];

  return (
    <section className="py-20 bg-[#0D0D0F]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto mb-12">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
            Choose Your Industry
          </h2>
          <p className="text-[#A1A1AA] text-base">
            See how HeyIra automates phone calls, handles inquiries, and drives revenue across industries.
          </p>
        </div>

        {/* Industry Pill Tabs */}
        <div className="flex items-center justify-center flex-wrap gap-2 sm:gap-3 mb-12">
          {INDUSTRIES.map((ind) => {
            const isActive = ind.id === selectedId;
            return (
              <button
                key={ind.id}
                onClick={() => setSelectedId(ind.id)}
                className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? "bg-[#7B5CFF] text-white shadow-lg shadow-[#7B5CFF]/30 scale-105"
                    : "bg-[#14131A] text-[#A1A1AA] hover:text-white border border-white/5 hover:border-white/20"
                }`}
              >
                {ind.label}
              </button>
            );
          })}
        </div>

        {/* Active Industry Showcase Card */}
        <div className="glass-panel p-8 sm:p-12 rounded-3xl border border-white/10 relative overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Left Details */}
            <div className="lg:col-span-4 space-y-6">
              <div className="inline-block px-3 py-1 rounded-full bg-[#7B5CFF]/15 text-[#A78BFA] text-xs font-bold uppercase tracking-wider">
                {currentIndustry.label} AI Voice Agent
              </div>

              <h3 className="text-2xl sm:text-3xl font-bold text-white leading-tight">
                {currentIndustry.title}
              </h3>

              <p className="text-sm text-[#A1A1AA] leading-relaxed">
                {currentIndustry.description}
              </p>

              <ul className="space-y-3 pt-2">
                {currentIndustry.bullets.map((bullet, idx) => (
                  <li key={idx} className="flex items-center gap-3 text-sm text-white/90">
                    <CheckCircle2 className="w-4 h-4 text-[#7B5CFF] shrink-0" />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Right Interactive Workflow Cards */}
            <div className="lg:col-span-8 bg-[#0D0D0F]/90 p-6 sm:p-8 rounded-2xl border border-white/5">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#A78BFA] mb-6">
                Automated End-to-End Execution Flow
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 relative">
                {currentIndustry.flow.map((item, idx) => {
                  const IconComp = ICON_MAP[item.icon] || Mic;
                  return (
                    <div key={idx} className="flex flex-col items-center text-center space-y-3 relative group">
                      
                      {/* Step Circle Icon */}
                      <div className="w-14 h-14 rounded-2xl bg-[#14131A] border border-[#7B5CFF]/30 flex items-center justify-center text-[#7B5CFF] group-hover:border-[#7B5CFF] group-hover:bg-[#7B5CFF]/15 transition duration-300 shadow-md">
                        <IconComp className="w-6 h-6" />
                      </div>

                      {/* Content */}
                      <div className="space-y-1">
                        <h5 className="text-xs font-bold text-white">{item.title}</h5>
                        <p className="text-[11px] text-[#A1A1AA] leading-tight">{item.subtitle}</p>
                      </div>

                      {/* Arrow Divider (Desktop) */}
                      {idx < currentIndustry.flow.length - 1 && (
                        <div className="hidden sm:block absolute top-7 -right-3 text-white/20">
                          <ArrowRight className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
}
