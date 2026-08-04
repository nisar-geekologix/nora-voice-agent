"use client";

import { useState } from "react";
import Navbar from "../components/Navbar";
import HeroSection from "../components/HeroSection";
import LogoCloud from "../components/LogoCloud";
import IndustrySelector from "../components/IndustrySelector";
import WorkflowSection from "../components/WorkflowSection";
import BrainCapabilities from "../components/BrainCapabilities";
import IntegrationsGrid from "../components/IntegrationsGrid";
import LiveVoiceAgent from "../components/LiveVoiceAgent";
import DashboardPreview from "../components/DashboardPreview";
import TestimonialsSection from "../components/TestimonialsSection";
import CtaBanner from "../components/CtaBanner";
import AgentSettingsModal from "../components/AgentSettingsModal";

export default function Home() {
  const [activeTab, setActiveTab] = useState("home");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settings, setSettings] = useState({
    name: "HeyIra",
    role: "AI Sales & Support Employee",
    voice: "Zephyr",
    model: "gemini-3.1-flash-live-preview",
    language: "Hinglish",
    tone: "Friendly & Professional",
    apiKey: "",
    customInstruction: ""
  });

  return (
    <div className="min-h-screen bg-[#0D0D0F] text-[#F5F5F7] relative selection:bg-[#7B5CFF]/30">
      
      {/* Background Ambient Radial Glows */}
      <div className="fixed top-0 left-1/4 w-[500px] h-[500px] bg-[#7B5CFF]/10 blur-[160px] rounded-full pointer-events-none z-0" />
      <div className="fixed bottom-10 right-1/4 w-[500px] h-[500px] bg-[#A78BFA]/10 blur-[160px] rounded-full pointer-events-none z-0" />

      <div className="relative z-10">
        {/* Navigation Bar */}
        <Navbar 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          onOpenSettings={() => setIsSettingsOpen(true)} 
        />

        {/* Dynamic Views based on activeTab */}
        {activeTab === "home" && (
          <main className="space-y-4">
            <HeroSection onStartVoice={() => setActiveTab("playground")} />
            <LogoCloud />
            <IndustrySelector />
            <WorkflowSection />
            <BrainCapabilities />
            <IntegrationsGrid />
            <TestimonialsSection />
            <CtaBanner onStartVoice={() => setActiveTab("playground")} />
          </main>
        )}

        {activeTab === "solutions" && (
          <main className="pt-8 space-y-12">
            <IndustrySelector />
            <WorkflowSection />
            <BrainCapabilities />
            <CtaBanner onStartVoice={() => setActiveTab("playground")} />
          </main>
        )}

        {activeTab === "playground" && (
          <main className="pt-8 space-y-8">
            <LiveVoiceAgent 
              settings={settings} 
              onOpenSettings={() => setIsSettingsOpen(true)} 
            />
            <WorkflowSection />
          </main>
        )}

        {activeTab === "dashboard" && (
          <main className="pt-8 space-y-12">
            <DashboardPreview />
            <IntegrationsGrid />
          </main>
        )}

        {/* Modal for Agent Settings & API Key Configuration */}
        <AgentSettingsModal 
          isOpen={isSettingsOpen} 
          onClose={() => setIsSettingsOpen(false)} 
          settings={settings} 
          onSaveSettings={(updated) => setSettings(updated)} 
        />
      </div>

    </div>
  );
}
