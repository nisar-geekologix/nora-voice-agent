"use client";

import { useState } from "react";
import { Mic, Sparkles, ChevronDown, Menu, X, Settings } from "lucide-react";

export default function Navbar({ activeTab, setActiveTab, onOpenSettings }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-[#0D0D0F]/80 backdrop-blur-xl border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* Brand Logo - HeyIra. Waveform */}
        <div 
          onClick={() => setActiveTab("home")}
          className="flex items-center gap-3 cursor-pointer group"
        >
          {/* Logo Mark: Purple Audio Waveform */}
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7B5CFF] to-[#A78BFA] flex items-center justify-center gap-1 shadow-lg shadow-[#7B5CFF]/25 group-hover:scale-105 transition-transform duration-300">
            <span className="w-1 h-5 bg-white rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
            <span className="w-1 h-7 bg-white rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
            <span className="w-1 h-4 bg-white rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
            <span className="w-1 h-6 bg-white rounded-full animate-pulse" style={{ animationDelay: '450ms' }} />
          </div>

          <div className="flex items-baseline">
            <span className="text-2xl font-black tracking-tight text-white">Hey</span>
            <span className="text-2xl font-black tracking-tight text-[#7B5CFF]">Ira</span>
            <span className="text-2xl font-black text-[#A78BFA]">.</span>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-8">
          <button 
            onClick={() => setActiveTab("home")}
            className={`text-sm font-medium transition ${activeTab === "home" ? "text-white font-semibold" : "text-[#A1A1AA] hover:text-white"}`}
          >
            Product
          </button>
          <button 
            onClick={() => setActiveTab("solutions")}
            className={`text-sm font-medium transition ${activeTab === "solutions" ? "text-white font-semibold" : "text-[#A1A1AA] hover:text-white"}`}
          >
            Solutions
          </button>
          <button 
            onClick={() => setActiveTab("playground")}
            className={`text-sm font-medium flex items-center gap-1.5 transition ${activeTab === "playground" ? "text-[#7B5CFF] font-semibold" : "text-[#A1A1AA] hover:text-white"}`}
          >
            <Mic className="w-4 h-4 text-[#7B5CFF]" />
            Live Voice Playground
            <span className="px-2 py-0.5 text-[10px] uppercase font-bold rounded-full bg-[#7B5CFF]/20 text-[#A78BFA] border border-[#7B5CFF]/30">
              Live
            </span>
          </button>
          <button 
            onClick={() => setActiveTab("dashboard")}
            className={`text-sm font-medium transition ${activeTab === "dashboard" ? "text-white font-semibold" : "text-[#A1A1AA] hover:text-white"}`}
          >
            Dashboard
          </button>
        </nav>

        {/* Right Actions */}
        <div className="hidden md:flex items-center gap-4">
          <button 
            onClick={onOpenSettings}
            className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-white/80 hover:text-white hover:bg-white/10 transition"
            title="Configure HeyIra API Key & Persona Settings"
          >
            <Settings className="w-4 h-4" />
          </button>

          <button 
            onClick={() => setActiveTab("playground")}
            className="btn-primary px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            Talk to HeyIra
          </button>
        </div>

        {/* Mobile Menu Button */}
        <div className="flex md:hidden items-center gap-2">
          <button 
            onClick={onOpenSettings}
            className="p-2 rounded-lg bg-white/5 text-white/80"
          >
            <Settings className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-white/80 hover:text-white"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#0D0D0F] border-b border-white/10 px-6 py-6 space-y-4">
          <button 
            onClick={() => { setActiveTab("home"); setMobileMenuOpen(false); }}
            className="block w-full text-left py-2 text-base text-white/90"
          >
            Product
          </button>
          <button 
            onClick={() => { setActiveTab("solutions"); setMobileMenuOpen(false); }}
            className="block w-full text-left py-2 text-base text-white/90"
          >
            Solutions
          </button>
          <button 
            onClick={() => { setActiveTab("playground"); setMobileMenuOpen(false); }}
            className="block w-full text-left py-2 text-base text-[#7B5CFF] font-semibold flex items-center gap-2"
          >
            <Mic className="w-4 h-4" /> Live Voice Playground
          </button>
          <button 
            onClick={() => { setActiveTab("dashboard"); setMobileMenuOpen(false); }}
            className="block w-full text-left py-2 text-base text-white/90"
          >
            Dashboard
          </button>
          
          <div className="pt-4 border-t border-white/10 flex flex-col gap-3">
            <button 
              onClick={() => { setActiveTab("playground"); setMobileMenuOpen(false); }}
              className="btn-primary w-full py-3 rounded-xl text-center text-sm font-semibold flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" /> Talk to HeyIra
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
