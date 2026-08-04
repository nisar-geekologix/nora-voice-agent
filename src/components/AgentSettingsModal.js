"use client";

import { useState } from "react";
import { X, Save, Key, Mic, Globe, Sparkles, UserCheck } from "lucide-react";

export default function AgentSettingsModal({ isOpen, onClose, settings, onSaveSettings }) {
  const [formData, setFormData] = useState(settings);

  if (!isOpen) return null;

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSaveSettings(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="glass-panel-glow rounded-3xl w-full max-w-xl border border-[#7B5CFF]/40 bg-[#14131A] overflow-hidden shadow-2xl space-y-6 p-6 sm:p-8">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#7B5CFF]/20 border border-[#7B5CFF]/40 flex items-center justify-center text-[#7B5CFF]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">HeyIra Agent Settings</h3>
              <p className="text-xs text-[#A1A1AA]">Configure persona, voice accent, API key, & instructions</p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-2 text-white/60 hover:text-white rounded-lg hover:bg-white/5 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-5 text-xs">
          
          {/* Gemini API Key */}
          <div className="space-y-1.5">
            <label className="font-semibold text-white/90 flex items-center gap-2">
              <Key className="w-3.5 h-3.5 text-[#7B5CFF]" /> Gemini API Key
            </label>
            <input 
              type="password"
              value={formData.apiKey || ""}
              onChange={(e) => handleChange("apiKey", e.target.value)}
              placeholder="Leave blank to use server environment default key"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:border-[#7B5CFF] focus:outline-none transition"
            />
            <p className="text-[11px] text-[#A1A1AA]">
              Optional. If not specified, HeyIra will use the key configured in the server <code className="text-[#A78BFA]">.env</code>.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Voice Accent */}
            <div className="space-y-1.5">
              <label className="font-semibold text-white/90 flex items-center gap-2">
                <Mic className="w-3.5 h-3.5 text-[#7B5CFF]" /> Voice Accent
              </label>
              <select
                value={formData.voice || "Zephyr"}
                onChange={(e) => handleChange("voice", e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0D0D0F] border border-white/10 text-white focus:border-[#7B5CFF] focus:outline-none transition"
              >
                <option value="Zephyr">Zephyr (Warm & Professional)</option>
                <option value="Puck">Puck (Energetic & Friendly)</option>
                <option value="Charon">Charon (Deep & Authoritative)</option>
                <option value="Kore">Kore (Soft & Empathetic)</option>
                <option value="Fenrir">Fenrir (Clear & Confident)</option>
                <option value="Aoede">Aoede (Expressive & Melodic)</option>
              </select>
            </div>

            {/* Language Mode */}
            <div className="space-y-1.5">
              <label className="font-semibold text-white/90 flex items-center gap-2">
                <Globe className="w-3.5 h-3.5 text-[#7B5CFF]" /> Spoken Language
              </label>
              <select
                value={formData.language || "Hinglish"}
                onChange={(e) => handleChange("language", e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0D0D0F] border border-white/10 text-white focus:border-[#7B5CFF] focus:outline-none transition"
              >
                <option value="Hinglish">Hinglish (Hindi + English colloquial)</option>
                <option value="Hindi">Hindi (Devanagari conversational)</option>
                <option value="English">English (Global professional)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Agent Name */}
            <div className="space-y-1.5">
              <label className="font-semibold text-white/90">Agent Display Name</label>
              <input 
                type="text"
                value={formData.name || "HeyIra"}
                onChange={(e) => handleChange("name", e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:border-[#7B5CFF] focus:outline-none"
              />
            </div>

            {/* Agent Role */}
            <div className="space-y-1.5">
              <label className="font-semibold text-white/90">Agent Persona Role</label>
              <input 
                type="text"
                value={formData.role || "Sales & Support AI Employee"}
                onChange={(e) => handleChange("role", e.target.value)}
                placeholder="e.g. Credit Card Sales Executive"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:border-[#7B5CFF] focus:outline-none"
              />
            </div>
          </div>

          {/* Custom Instruction */}
          <div className="space-y-1.5">
            <label className="font-semibold text-white/90">Custom Business System Prompt</label>
            <textarea
              rows={3}
              value={formData.customInstruction || ""}
              onChange={(e) => handleChange("customInstruction", e.target.value)}
              placeholder="e.g. You are an expert retail executive for Snapdeal. Answer order status questions and confirm deliveries."
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:border-[#7B5CFF] focus:outline-none resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary px-5 py-2.5 rounded-xl font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary px-6 py-2.5 rounded-xl font-semibold flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save Configuration
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
