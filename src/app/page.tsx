"use client";

import { useState, useEffect, useRef, lazy, Suspense, type ReactNode } from "react";
import {
  Mic,
  MicOff,
  PhoneOff,
  Settings,
  Key,
  Home,
  Check,
  ArrowRight,
  Languages,
  Menu,
  ChevronLeft,
  ChevronUp,
  ChevronDown,
  User,
  Volume2,
  Lock,
  X,
  Sparkles,
  Flame,
  Activity,
  History,
  MessageSquare,
  Globe,
  AlertCircle,
  Eye,
  EyeOff,
  RefreshCw,
  Clock,
  PhoneCall,
  Search,
  CheckCircle,
  Database,
  Smile,
  ShieldCheck,
  FlameKindling
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { VOICES_CATALOG } from "../data";
import { AgentState, TranscriptItem, LatencyMetrics, AgentSettings } from "../types";
import { getAgentConfig, updateAgentConfig, getCallLogs } from "./actions";

// ==========================================
// AUDIO CONVERSION UTILITIES
// ==========================================

function float32ToInt16PCM(float32Array: Float32Array): ArrayBuffer {
  const buffer = new ArrayBuffer(float32Array.length * 2);
  const view = new DataView(buffer);
  for (let i = 0; i < float32Array.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    const val = s < 0 ? s * 0x8000 : s * 0x7FFF;
    view.setInt16(i * 2, val, true);
  }
  return buffer;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToFloat32PCM(base64: string): Float32Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  const int16Array = new Int16Array(bytes.buffer);
  const float32Array = new Float32Array(int16Array.length);
  for (let i = 0; i < int16Array.length; i++) {
    float32Array[i] = int16Array[i] / 32768.0;
  }
  return float32Array;
}

export const TELECALLER_ROLES = [
  {
    category: "Real Estate",
    label: "🏢 Real Estate Consultant",
    role: "You are a professional Real Estate Tele-consultant. Your goal is to talk to prospective buyers, explain features of premium residential and commercial properties, understand their location and budget preferences, and book site visits. Keep your tone polite, informative, and inviting."
  },
  {
    category: "Banking & Finance",
    label: "💳 Credit Card Sales Agent",
    role: "You are an expert Credit Card Sales Executive. Your goal is to explain the benefits of cards (e.g. cashback, reward points, airport lounge access), answer questions about fees and interest rates, check customer eligibility criteria, and help them complete their application."
  },
  {
    category: "Banking & Finance",
    label: "💰 Personal & Home Loan Officer",
    role: "You are a Loans & Mortgage Advisor. Your goal is to guide customers through personal, home, and auto loan options, explain current interest rates, tenure schemes, and outline the necessary documents required for approval."
  },
  {
    category: "Insurance",
    label: "🛡️ Life & Health Insurance Advisor",
    role: "You are a dedicated Insurance Tele-Advisor. Your goal is to present life and health insurance plans, explain how the coverage protects their family, answer questions about premium rates and claims settlement processes, and generate leads."
  },
  {
    category: "Education & EdTech",
    label: "🎓 EdTech Course Counselor",
    role: "You are an Academic Counselor for an online learning platform. Your goal is to speak to students and parents, guide them on suitable educational courses, explain learning outcomes, mentorship benefits, job guarantees, and assist with enrollment."
  },
  {
    category: "Healthcare",
    label: "🏥 Health Checkup & Wellness Coordinator",
    role: "You are a Patient Care Relationship Executive. Your goal is to inform clients about preventive medical health checkup packages, explain specific laboratory tests included, and assist in scheduling diagnostic clinic appointments."
  },
  {
    category: "Telecom & Internet",
    label: "📶 Telecom & Broadband Agent",
    role: "You are a Broadband & Fiber Sales Representative. Your goal is to sell high-speed internet connections, introduce current promotional offers, explain data speed options, and record booking information for connection setup."
  },
  {
    category: "Travel & Tourism",
    label: "✈️ Travel & Holiday Consultant",
    role: "You are a Travel Package Consultant. Your goal is to pitch exciting international and domestic holiday tour packages, explain itineraries (hotels, sightseeing, meals), offer special group discounts, and process booking inquiries."
  },
  {
    category: "Automobile",
    label: "🚗 Car Booking & Service Scheduling Agent",
    role: "You are an Automobile Tele-sales Executive. Your goal is to follow up with showroom leads, schedule test drives for new car models, answer questions about features and discounts, or schedule vehicle maintenance services."
  },
  {
    category: "Debt Collection",
    label: "📞 Payment Reminder & Recovery Executive",
    role: "You are a polite yet assertive Payment Follow-up Representative. Your goal is to remind customers of upcoming or overdue bills, explain payment options, negotiate payment timelines, and record payment commitments."
  }
];

const SUCCESS_ANIMATION = {
  v: "5.7.4", fr: 60, ip: 0, op: 72, w: 100, h: 100, nm: "success",
  layers: [{
    ty: 4, nm: "check", ip: 0, op: 72, st: 0,
    ks: {
      o: { a: 1, k: [{ t: 0, s: [0] }, { t: 10, s: [100] }] },
      r: { a: 0, k: 0 }, p: { a: 0, k: [50, 50, 0] },
      a: { a: 0, k: [0, 0, 0] },
      s: { a: 1, k: [{ t: 0, s: [40, 40, 100] }, { t: 22, s: [115, 115, 100] }, { t: 34, s: [100, 100, 100] }] }
    },
    shapes: [
      { ty: "el", p: { a: 0, k: [0, 0] }, s: { a: 0, k: [72, 72] }, nm: "circle" },
      { ty: "fl", c: { a: 0, k: [0.14, 0.62, 0.28, 1] }, o: { a: 0, k: 100 }, r: 1 },
      { ty: "sh", ks: { a: 0, k: { i: [[0, 0], [0, 0], [0, 0]], o: [[0, 0], [0, 0], [0, 0]], v: [[-18, 0], [-5, 14], [22, -16]], c: false } } },
      { ty: "st", c: { a: 0, k: [1, 1, 1, 1] }, o: { a: 0, k: 100 }, w: { a: 0, k: 7 }, lc: 2, lj: 2 }
    ]
  }]
};

const Lottie = lazy(() => import("lottie-react"));

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<"dashboard" | "configure" | "history" | "connect" | "welcome">("dashboard");
  const [agentDbId, setAgentDbId] = useState<string>("");
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    console.log("NORA_HYDRATION_CHECK: Client side hydration completed successfully. Starting on page:", currentScreen);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // --- Call Logs & History State ---
  const [callLogs, setCallLogs] = useState<any[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState<boolean>(false);
  const [selectedCall, setSelectedCall] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDirection, setFilterDirection] = useState<"all" | "inbound" | "outbound">("all");

  const loadCallLogs = async () => {
    setIsLoadingLogs(true);
    try {
      const res = await getCallLogs();
      if (res.success && res.calls) {
        setCallLogs(res.calls);
        console.log("Loaded call logs from database:", res.calls.length);
      }
    } catch (err) {
      console.error("Failed to load call logs:", err);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  useEffect(() => {
    loadCallLogs();
  }, [currentScreen]);

  // --- Load Active Agent Configuration from PostgreSQL ---
  useEffect(() => {
    getAgentConfig().then((res) => {
      if (res.success && res.agent) {
        setAgentDbId(res.agent.id);
        console.log("Loaded active agent ID from PostgreSQL:", res.agent.id);
      }
    }).catch(err => {
      console.error("Failed to load agent on mount:", err);
    });
  }, []);

  // --- Save settings to PostgreSQL ---
  const handleSaveSettings = async () => {
    if (!agentDbId) return;

    let compiledInstruction = "";
    if (settings.language === "Hinglish") {
      compiledInstruction = `
        You are ${settings.name || "Nora"}, an interactive real-time voice assistant built strictly for the Indian market, running inside VoxGemini.
        Your defined character persona role: ${settings.role}.
        Your personality style: ${settings.personality}.
        Your conversation tone: ${settings.tone}.
        
        CRITICAL LANGUAGE DIRECTIONS:
        - Always respond in fluent Hinglish (a mixture of Hindi sentences and common conversational English keywords, written in clean Latin letters - e.g. "Haan bilkul, main help kar sakti hoon!").
        - Understand user voice input in Hinglish, Hindi, or English.
        - ${settings.responseStyle === "Short" ? "Keep responses extremely brief (maximum of 1-2 natural spoken sentences) and highly colloquial. Avoid listing, bullets, and long paragraphs." : "Provide natural, descriptive but conversational replies in Hinglish, under 3 spoken sentences."}
        - Match typical regional Indian context when referencing food, cricket, navigation, or general chat. Keep it beautiful, extremely reassuring, and sweet.
      `.trim();
    } else if (settings.language === "Hindi") {
      compiledInstruction = `
        You are ${settings.name || "Nora"}, a warm conversational AI voice assistant.
        Your defined character persona role: ${settings.role}.
        Your personality style: ${settings.personality}.
        Your conversation tone: ${settings.tone}.
        
        CRITICAL LANGUAGE DIRECTIONS:
        - हमेशा सरल, व्यावहारिक और बोलचाल की हिंदी (Hindi written in Devanagari script) में ही जवाब दें। 
        - शब्दावली को अत्यंत मधुर, व्यावहारिक और पारिवारिक रखें (जैसे कि 'आप', 'जी', 'बिल्कुल भाई')।
        - Understand user voice input in Hindi, English, or Hinglish.
        - ${settings.responseStyle === "Short" ? "जवाबों को बहुत छोटा (अधिकतम 1-2 पंक्तियाँ) रखें। किसी भी सूची, बुलेट पॉइंट्स या बड़ी व्याख्या से बचें क्योंकि इसे बोला जा रहा है।" : "व्यावहारिक, कोमल और थोड़ा विस्तृत उत्तर हिंदी में प्रदान करें, पर बुलेट्स का उपयोग न करें।"}
      `.trim();
    } else {
      compiledInstruction = `
        You are ${settings.name || "Nora"}, professional AI voice assistant.
        Your defined character persona role: ${settings.role}.
        Your personality style: ${settings.personality}.
        Your conversation tone: ${settings.tone}.
        
        CRITICAL LANGUAGE DIRECTIONS:
        - Always respond in simple and helpful conversational English.
        - Understand user voice input in English.
        - ${settings.responseStyle === "Short" ? "Keep responses extremely short and brief (1-2 sentences maximum). Do not structure, do not output bullet points." : "Provide natural, clear, slightly more detailed verbal replies."}
      `.trim();
    }

    if (settings.customInstruction) {
      compiledInstruction += `\nAdditional user guidelines: ${settings.customInstruction}`;
    }

    try {
      console.log("Saving agent settings to PostgreSQL...");
      const res = await updateAgentConfig(agentDbId, {
        name: settings.name,
        systemInstruction: compiledInstruction,
        voice: settings.voice,
        model: settings.model,
        temperature: 0.7
      });
      if (res.success) {
        console.log("Agent settings successfully saved in PostgreSQL database!");
        addSystemNotification("✨ Saved agent configuration to database successfully.");
      } else {
        console.error("Failed to save agent settings in PostgreSQL:", res.error);
        addSystemNotification(`❌ Failed to save: ${res.error}`);
      }
    } catch (err) {
      console.error("Error saving settings via Server Action:", err);
    }
  };

  // --- Extended Agent Settings State ---
  const [settings, setSettings] = useState<AgentSettings & {
    name: string;
    responseStyle: "Short" | "Detailed";
    customInstruction: string;
  }>({
    apiKey: "",
    voice: "Zephyr",
    model: "gemini-3.1-flash-live-preview",
    role: "Helpful AI Assistant",
    personality: "Empathetic",
    tone: "Friendly",
    language: "Hinglish",
    name: "Nora",
    responseStyle: "Short",
    customInstruction: ""
  });

  // Client-side load of settings from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("gemini_voice_settings_indian_v2");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSettings({
          apiKey: parsed.apiKey || "",
          voice: parsed.voice || "Zephyr",
          model: parsed.model || "gemini-3.1-flash-live-preview",
          role: parsed.role || "Helpful AI Assistant",
          personality: parsed.personality || "Empathetic",
          tone: parsed.tone || "Friendly",
          language: parsed.language || "Hinglish",
          name: parsed.name || "Nora",
          responseStyle: parsed.responseStyle || "Short",
          customInstruction: parsed.customInstruction || ""
        });
      } catch (e) {
        // ignore
      }
    }
  }, []);

  const [hasServerKey, setHasServerKey] = useState<boolean>(false);
  const [connectionState, setConnectionState] = useState<AgentState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [transcripts, setTranscripts] = useState<TranscriptItem[]>([]);
  const [micLevel, setMicLevel] = useState<number>(0);
  const [agentLevel, setAgentLevel] = useState<number>(0);
  const [isKeyVisible, setIsKeyVisible] = useState<boolean>(false);
  const [userInterruptedCount, setUserInterruptedCount] = useState<number>(0);

  // --- Live Metrics State ---
  const [metrics, setMetrics] = useState<LatencyMetrics>({
    wsPingMs: [],
    currentPingMs: null,
    timeToFirstByteMs: null,
    userTurnStart: null,
    serverTurnStart: null,
    audioChunksSent: 0,
    audioChunksReceived: 0,
  });

  const settingsRef = useRef<any>(settings);
  const metricsRef = useRef<LatencyMetrics>(metrics);

  useEffect(() => {
    settingsRef.current = settings;
    localStorage.setItem("gemini_voice_settings_indian_v2", JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    metricsRef.current = metrics;
  }, [metrics]);

  // --- Check Backend API Credentials status ---
  useEffect(() => {
    fetch("/api/config")
      .then((res) => res.json())
      .then((data) => {
        setHasServerKey(!!data.hasEnvKey);
      })
      .catch((err) => console.log("Failed to query node config:", err));
  }, []);

  // --- Network Connection Refs ---
  const wsRef = useRef<WebSocket | null>(null);
  const pingIntervalRef = useRef<any>(null);
  const wsSentTimesRef = useRef<Record<string, number>>({});

  // --- Audio Engine Capture/Playback Refs ---
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const activePlaySourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const nextStartTimeRef = useRef<number>(0);

  const lastUserSpeechTimeRef = useRef<number>(0);
  const isAgentSpeakingRef = useRef<boolean>(false);

  const activeUserMessageIdRef = useRef<string | null>(null);
  const activeAgentMessageIdRef = useRef<string | null>(null);

  // ==========================================
  // CLIENT-SIDE MICROPHONE RECORDING
  // ==========================================

  const startMicCapture = async (ws: WebSocket) => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      inputAudioCtxRef.current = audioContext;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const source = audioContext.createMediaStreamSource(stream);
      sourceRef.current = source;

      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      scriptProcessorRef.current = processor;

      source.connect(processor);
      processor.connect(audioContext.destination);

      processor.onaudioprocess = (e) => {
        if (ws.readyState !== WebSocket.OPEN) return;

        const channelData = e.inputBuffer.getChannelData(0);

        let sum = 0;
        for (let i = 0; i < channelData.length; i++) {
          sum += channelData[i] * channelData[i];
        }
        const rms = Math.sqrt(sum / channelData.length);
        setMicLevel(rms);

        if (rms > 0.015) {
          lastUserSpeechTimeRef.current = Date.now();
          setConnectionState("listening");

          if (isAgentSpeakingRef.current) {
            stopAllAgentPlayback();
            isAgentSpeakingRef.current = false;
            setUserInterruptedCount((c) => c + 1);
            addSystemNotification("🔊 Barge-in: You interrupted Nora. Speaking now...");
          }
        }

        const pcmBuffer = float32ToInt16PCM(channelData);
        const base64Audio = arrayBufferToBase64(pcmBuffer);

        ws.send(JSON.stringify({ type: "audio", data: base64Audio }));

        setMetrics((prev) => ({
          ...prev,
          audioChunksSent: prev.audioChunksSent + 1,
        }));
      };
    } catch (err: any) {
      console.error("Mic creation failed:", err);
      setErrorMessage(`Microphone Access Error: ${err.message || String(err)}`);
      disconnectSession();
    }
  };

  const stopMicCapture = () => {
    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.disconnect();
      scriptProcessorRef.current = null;
    }
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (inputAudioCtxRef.current && inputAudioCtxRef.current.state !== "closed") {
      inputAudioCtxRef.current.close().catch(() => {});
      inputAudioCtxRef.current = null;
    }
    setMicLevel(0);
  };

  // ==========================================
  // CLIENT AUDIO PLAYBACK (SPEED STREAMS)
  // ==========================================

  const initPlaybackNode = () => {
    if (!outputAudioCtxRef.current) {
      outputAudioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      nextStartTimeRef.current = 0;
    }
    if (outputAudioCtxRef.current.state === "suspended") {
      outputAudioCtxRef.current.resume().catch(() => {});
    }
  };

  const playIncomingAudioChunk = (base64Audio: string) => {
    try {
      initPlaybackNode();
      const ctx = outputAudioCtxRef.current!;

      const float32Data = base64ToFloat32PCM(base64Audio);
      if (float32Data.length === 0) return;

      let sum = 0;
      for (let i = 0; i < float32Data.length; i++) {
        sum += float32Data[i] * float32Data[i];
      }
      const rms = Math.sqrt(sum / float32Data.length);
      setAgentLevel(rms * 1.8);

      const audioBuffer = ctx.createBuffer(1, float32Data.length, 24000);
      audioBuffer.getChannelData(0).set(float32Data);

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);

      const now = ctx.currentTime;
      if (nextStartTimeRef.current < now) {
        nextStartTimeRef.current = now;
      }

      source.start(nextStartTimeRef.current);
      nextStartTimeRef.current += audioBuffer.duration;

      activePlaySourcesRef.current.push(source);

      isAgentSpeakingRef.current = true;
      setConnectionState("speaking");

      source.onended = () => {
        activePlaySourcesRef.current = activePlaySourcesRef.current.filter((s) => s !== source);
        if (activePlaySourcesRef.current.length === 0) {
          isAgentSpeakingRef.current = false;
          setAgentLevel(0);
          setConnectionState("listening");
        }
      };
    } catch (e) {
      console.error("Audio buffer error:", e);
    }
  };

  const stopAllAgentPlayback = () => {
    activePlaySourcesRef.current.forEach((src) => {
      try {
        src.stop();
      } catch (err) {}
    });
    activePlaySourcesRef.current = [];
    nextStartTimeRef.current = 0;
    setAgentLevel(0);
  };

  // ==========================================
  // REAL-TIME TRANSCRIPTS RECOLLECTION
  // ==========================================

  const updateUserTranscript = (text: string) => {
    setTranscripts((prev) => {
      if (activeUserMessageIdRef.current) {
        return prev.map((item) => {
          if (item.id === activeUserMessageIdRef.current) {
            return { ...item, text: item.text + " " + text };
          }
          return item;
        });
      } else {
        const id = "user-" + Math.random().toString(36).substr(2, 9);
        activeUserMessageIdRef.current = id;
        activeAgentMessageIdRef.current = null;

        const userTime = Date.now();
        setMetrics((m) => ({ ...m, userTurnStart: userTime }));

        return [
          ...prev,
          {
            id,
            sender: "user",
            text,
            timestamp: userTime,
          },
        ];
      }
    });

    lastUserSpeechTimeRef.current = Date.now();
  };

  const updateAgentTranscript = (text: string) => {
    setTranscripts((prev) => {
      if (activeAgentMessageIdRef.current) {
        return prev.map((item) => {
          if (item.id === activeAgentMessageIdRef.current) {
            return { ...item, text: item.text + text };
          }
          return item;
        });
      } else {
        const id = "agent-" + Math.random().toString(36).substr(2, 9);
        activeAgentMessageIdRef.current = id;
        activeUserMessageIdRef.current = null;

        const now = Date.now();
        const turnStart = lastUserSpeechTimeRef.current || now;
        const latency = now - turnStart;

        setMetrics((m) => ({
          ...m,
          serverTurnStart: now,
          timeToFirstByteMs: latency > 100 && latency < 5000 ? latency : m.timeToFirstByteMs || 120,
        }));

        return [
          ...prev,
          {
            id,
            sender: "agent",
            text,
            timestamp: now,
          },
        ];
      }
    });
  };

  const finalizeSpeechTurns = () => {
    activeUserMessageIdRef.current = null;
    activeAgentMessageIdRef.current = null;
  };

  const addSystemNotification = (text: string) => {
    const id = "system-" + Math.random().toString(36).substr(2, 9);
    setTranscripts((prev) => [
      ...prev,
      {
        id,
        sender: "system",
        text,
        timestamp: Date.now(),
      },
    ]);
  };

  // ==========================================
  // LATENCY HARNESS
  // ==========================================

  const startSocketLatencyPing = (ws: WebSocket) => {
    if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);

    pingIntervalRef.current = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        const pingId = "ping-" + Math.random().toString(36).substr(2, 9);
        wsSentTimesRef.current[pingId] = Date.now();
        ws.send(JSON.stringify({ type: "ping", pingId }));
      }
    }, 4500);
  };

  const stopSocketLatencyPing = () => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
    wsSentTimesRef.current = {};
  };

  // ==========================================
  // WEBSOCKET INITIATOR
  // ==========================================

  const initiateVoiceSession = async () => {
    if (connectionState !== "idle" && connectionState !== "error") {
      disconnectSession();
      return;
    }

    setConnectionState("connecting");
    setErrorMessage(null);
    finalizeSpeechTurns();

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.host;

    let customInstruction = "";
    if (settings.language === "Hinglish") {
      customInstruction = `
        You are ${settings.name || "Nora"}, an interactive real-time voice assistant built strictly for the Indian market, running inside VoxGemini.
        Your defined character persona role: ${settings.role}.
        Your personality style: ${settings.personality}.
        Your conversation tone: ${settings.tone}.
        
        CRITICAL LANGUAGE DIRECTIONS:
        - Always respond in fluent Hinglish (a mixture of Hindi sentences and common conversational English keywords, written in clean Latin letters - e.g. "Haan bilkul, main help kar sakti hoon!").
        - Understand user voice input in Hinglish, Hindi, or English.
        - ${settings.responseStyle === "Short" ? "Keep responses extremely brief (maximum of 1-2 natural spoken sentences) and highly colloquial. Avoid listing, bullets, and long paragraphs." : "Provide natural, descriptive but conversational replies in Hinglish, under 3 spoken sentences."}
        - Match typical regional Indian context when referencing food, cricket, navigation, or general chat. Keep it beautiful, extremely reassuring, and sweet.
      `.trim();
    } else if (settings.language === "Hindi") {
      customInstruction = `
        You are ${settings.name || "Nora"}, a warm conversational AI voice assistant.
        Your defined character persona role: ${settings.role}.
        Your personality style: ${settings.personality}.
        Your conversation tone: ${settings.tone}.
        
        CRITICAL LANGUAGE DIRECTIONS:
        - हमेशा सरल, व्यावहारिक और बोलचाल की हिंदी (Hindi written in Devanagari script) में ही जवाब दें। 
        - शब्दावली को अत्यंत मधुर, व्यावहारिक और पारिवारिक रखें (जैसे कि 'आप', 'जी', 'बिल्कुल भाई')।
        - Understand user voice input in Hindi, English, or Hinglish.
        - ${settings.responseStyle === "Short" ? "जवाबों को बहुत छोटा (अधिकतम 1-2 पंक्तियाँ) रखें। किसी भी सूची, बुलेट पॉइंट्स या बड़ी व्याख्या से बचें क्योंकि इसे बोला जा रहा है।" : "व्यावहारिक, कोमल और थोड़ा विस्तृत उत्तर हिंदी में प्रदान करें, पर बुलेट्स का उपयोग न करें।"}
      `.trim();
    } else {
      customInstruction = `
        You are ${settings.name || "Nora"}, professional AI voice assistant.
        Your defined character persona role: ${settings.role}.
        Your personality style: ${settings.personality}.
        Your conversation tone: ${settings.tone}.
        
        CRITICAL LANGUAGE DIRECTIONS:
        - Always respond in simple and helpful conversational English.
        - Understand user voice input in English.
        - ${settings.responseStyle === "Short" ? "Keep responses extremely short and brief (1-2 sentences maximum). Do not structure, do not output bullet points." : "Provide natural, clear, slightly more detailed verbal replies."}
      `.trim();
    }

    if (settings.customInstruction) {
      customInstruction += `\nAdditional user guidelines: ${settings.customInstruction}`;
    }

    const queryParams = new URLSearchParams({
      apiKey: settings.apiKey,
      voice: settings.voice,
      model: settings.model,
      systemInstruction: customInstruction,
    });

    const routeUrl = `${protocol}//${host}/api/live?${queryParams.toString()}`;

    try {
      addSystemNotification(`Connecting as ${settings.name} (${settings.language} voice accent)...`);

      const ws = new WebSocket(routeUrl);
      wsRef.current = ws;

      initPlaybackNode();

      ws.onopen = () => {
        startSocketLatencyPing(ws);
        startMicCapture(ws);
      };

      ws.onmessage = (event) => {
        try {
          const envelope = JSON.parse(event.data);

          if (envelope.type === "pong") {
            const sendTime = wsSentTimesRef.current[envelope.pingId];
            if (sendTime) {
              const rtt = Date.now() - sendTime;
              setMetrics((prev) => ({
                ...prev,
                wsPingMs: [...prev.wsPingMs, rtt].slice(-30),
                currentPingMs: rtt,
              }));
              delete wsSentTimesRef.current[envelope.pingId];
            }
          } else if (envelope.type === "status") {
            if (envelope.text === "connected") {
              setConnectionState("listening");
              addSystemNotification(`⚡ Nora is LIVE in ${settings.language}!`);
            } else {
              addSystemNotification(`System update: ${envelope.details || envelope.text}`);
            }
          } else if (envelope.type === "error") {
            setErrorMessage(envelope.error);
            disconnectSession();
          } else if (envelope.type === "gemini") {
            const payload = envelope.payload;

            if (payload.serverContent?.interrupted) {
              stopAllAgentPlayback();
              finalizeSpeechTurns();
              setUserInterruptedCount((c) => c + 1);
              addSystemNotification("⚡ Interrupted by user barge-in!");
            }

            const modelParts = payload.serverContent?.modelTurn?.parts;
            if (modelParts) {
              let textStreamed = "";

              for (const part of modelParts) {
                if (part.inlineData?.data) {
                  playIncomingAudioChunk(part.inlineData.data);
                  setMetrics((m) => ({ ...m, audioChunksReceived: m.audioChunksReceived + 1 }));
                }

                if (part.text) {
                  textStreamed += part.text;
                }
              }

              if (textStreamed) {
                updateAgentTranscript(textStreamed);
              }
            }

            const userParts = payload.serverContent?.userTurn?.parts;
            if (userParts) {
              let textUserStreamed = "";
              for (const part of userParts) {
                if (part.text) {
                  textUserStreamed += part.text;
                }
              }
              if (textUserStreamed) {
                updateUserTranscript(textUserStreamed);
              }
            }

            if (payload.serverContent?.turnComplete) {
              finalizeSpeechTurns();
            }
          }
        } catch (err: any) {
          console.error("Payload read error:", err);
        }
      };

      ws.onerror = (e) => {
        setErrorMessage("Dual bridge handshake failed. Check your network or API Key.");
        disconnectSession();
      };

      ws.onclose = () => {
        addSystemNotification("Websocket stream closed safely.");
        disconnectSession();
      };
    } catch (err: any) {
      setErrorMessage(`Setup error: ${err.message || String(err)}`);
      setConnectionState("idle");
    }
  };

  const disconnectSession = () => {
    stopSocketLatencyPing();
    stopMicCapture();
    stopAllAgentPlayback();

    if (wsRef.current) {
      if (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING) {
        wsRef.current.close();
      }
      wsRef.current = null;
    }

    setConnectionState("idle");
    setMicLevel(0);
    setAgentLevel(0);
    finalizeSpeechTurns();
  };

  const handleApplySuggestion = (text: string) => {
    updateUserTranscript(text);
    addSystemNotification(`Suggested: "${text}"`);
  };

  useEffect(() => {
    return () => {
      disconnectSession();
    };
  }, []);

  const isKeyReady = hasServerKey || settings.apiKey.trim().length > 10;

  const userTrans = transcripts.filter((t) => t.sender === "user");
  const agentTrans = transcripts.filter((t) => t.sender === "agent");

  const latestUserSaid = userTrans.length > 0 
    ? userTrans[userTrans.length - 1].text 
    : `"Pricing guidelines samjhao"`;

  const latestNoraSaid = agentTrans.length > 0
    ? agentTrans[agentTrans.length - 1].text
    : `"Haan ji, main aapko simplify karke batati hoon."`;

  const latestLatency = metrics.currentPingMs || 120;

  const suggestionsList = settings.language === "Hinglish" 
    ? [
        { label: "🌦️ Weather check", text: "Aaj ka weather kaisa rahega?" },
        { label: "📅 Daily productivity", text: "Time management tips batao." },
        { label: "💡 Motivation", text: "Ek simple productivity quote sunao." }
      ]
    : settings.language === "Hindi"
    ? [
        { label: "🌦️ मौसम", text: "आज का मौसम कैसा रहेगा भाई?" },
        { label: "📅 दिनचर्या", text: "आज के दिन को उत्पादक कैसे बनाएं?" },
        { label: "💡 सुविचार", text: "कोई अच्छा सुविचार सुनाओ।" }
      ]
    : [
        { label: "🌦️ Weather", text: "What is the weather forecast today?" },
        { label: "📅 Focus", text: "Give me some quick productivity tips." },
        { label: "💡 Quote", text: "Share a motivational quote." }
      ];

  // Helper metrics calculations
  const totalCallsCount = callLogs.length;
  const avgCallDuration = totalCallsCount > 0 
    ? Math.round(callLogs.reduce((acc, log) => acc + (log.durationSec || 0), 0) / totalCallsCount)
    : 0;

  // Filter logs for the table
  const filteredCalls = callLogs.filter((log) => {
    const matchesSearch = 
      log.fromNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.toNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.twilioCallSid && log.twilioCallSid.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (filterDirection === "all") return matchesSearch;
    return matchesSearch && log.direction === filterDirection;
  });

  // --- Active Tab Render ---
  const renderActiveTabContent = () => {
    switch (currentScreen) {
      case "dashboard":
        return (
          <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-white font-display">Dashboard Overview</h1>
                <p className="text-sm text-[#8e8b9f] mt-1">Real-time stats and metrics for Nora AI Voice Agents</p>
              </div>
              <button 
                onClick={loadCallLogs}
                className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-white/[0.04] border border-white/10 hover:bg-white/10 active:scale-95 transition"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Refresh Analytics
              </button>
            </div>

            {/* Stat indicators */}
            <div className="stats-grid">
              <div className="glass-card stat-item">
                <div className="stat-icon-wrap green">
                  <PhoneCall className="w-5 h-5" />
                </div>
                <div className="stat-info">
                  <span className="stat-label">Total Calls</span>
                  <span className="stat-value">{totalCallsCount}</span>
                </div>
              </div>
              <div className="glass-card stat-item">
                <div className="stat-icon-wrap blue">
                  <Clock className="w-5 h-5" />
                </div>
                <div className="stat-info">
                  <span className="stat-label">Avg Duration</span>
                  <span className="stat-value">{avgCallDuration}s</span>
                </div>
              </div>
              <div className="glass-card stat-item">
                <div className="stat-icon-wrap">
                  <Activity className="w-5 h-5" />
                </div>
                <div className="stat-info">
                  <span className="stat-label">Live Latency</span>
                  <span className="stat-value">{latestLatency}ms</span>
                </div>
              </div>
              <div className="glass-card stat-item">
                <div className="stat-icon-wrap pink">
                  <Flame className="w-5 h-5" />
                </div>
                <div className="stat-info">
                  <span className="stat-label">Barge-ins</span>
                  <span className="stat-value">{userInterruptedCount}</span>
                </div>
              </div>
            </div>

            {/* Dashboard Split: Recent calls & Sandbox Live Tester */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Recent calls table (Col span 7) */}
              <div className="lg:col-span-7 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-md font-bold text-white font-display">Recent Telephony Calls</h3>
                  <button 
                    onClick={() => setCurrentScreen("history")}
                    className="text-xs text-purple-400 font-semibold hover:underline"
                  >
                    View All Logs
                  </button>
                </div>

                <div className="glass-card p-0 overflow-hidden">
                  <div className="dashboard-table-container">
                    <table className="dashboard-table">
                      <thead>
                        <tr>
                          <th>Direction</th>
                          <th>Call Sid</th>
                          <th>Duration</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {callLogs.slice(0, 5).map((log) => (
                          <tr 
                            key={log.id} 
                            onClick={() => setSelectedCall(log)} 
                            className="cursor-pointer"
                            title="Click to view transcripts"
                          >
                            <td>
                              <span className={`status-badge ${log.direction}`}>
                                {log.direction === "inbound" ? "Inbound" : "Outbound"}
                              </span>
                            </td>
                            <td className="font-mono text-white/55 text-xs truncate max-w-[120px]">
                              {log.twilioCallSid}
                            </td>
                            <td className="font-mono text-xs">{log.durationSec}s</td>
                            <td>
                              <span className={`status-badge ${log.status}`}>
                                {log.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                        {callLogs.length === 0 && (
                          <tr>
                            <td colSpan={4} className="text-center py-10 text-white/30">
                              No calls found in database. Make a telephony call to populate.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Developer testing sandbox (Col span 5) */}
              <div className="lg:col-span-5 space-y-4">
                <h3 className="text-md font-bold text-white font-display">Live Agent Sandbox</h3>
                
                <div className="sandbox-widget">
                  <div className="sandbox-header">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-xs font-mono text-[#8e8b9f]">VoxGemini Bridge</span>
                    </div>
                    <span className="text-[10px] font-mono bg-purple-500/10 text-purple-300 px-2 py-0.5 rounded border border-purple-500/20">
                      {settings.language}
                    </span>
                  </div>

                  <div className="p-6 flex flex-col items-center justify-center space-y-6">
                    {/* Captions */}
                    <div className="text-center">
                      <h4 className="text-sm font-bold text-white leading-none">
                        {connectionState === "idle" && `Chat with ${settings.name}`}
                        {connectionState === "connecting" && "Synchronizing..."}
                        {connectionState === "listening" && "Listening..."}
                        {connectionState === "speaking" && "Nora is speaking"}
                        {connectionState === "error" && "Pipeline error"}
                      </h4>
                      <p className="text-[11px] text-white/40 mt-1">
                        {connectionState === "idle" && "Tap the microphone to sync live session"}
                        {connectionState === "connecting" && "Handshaking with Gemini servers..."}
                        {connectionState === "listening" && "Start speaking into your mic"}
                        {connectionState === "speaking" && "You can interrupt at any point"}
                        {connectionState === "error" && (errorMessage || "Check API configuration")}
                      </p>
                    </div>

                    {/* Central Glowing Orb & Pulse animation */}
                    <div className="relative w-36 h-36 flex items-center justify-center">
                      <AnimatePresence>
                        {(connectionState === "listening" || connectionState === "speaking") && (
                          <motion.div
                            initial={{ scale: 0.9, opacity: 0.4 }}
                            animate={{ 
                              scale: 1.4 + (micLevel + agentLevel) * 1.5, 
                              opacity: [0.3, 0] 
                            }}
                            transition={{ 
                              repeat: Infinity, 
                              duration: 1.5,
                              ease: "easeOut"
                            }}
                            exit={{ opacity: 0 }}
                            className="absolute w-full h-full rounded-full bg-purple-500/20 blur-md pointer-events-none"
                          />
                        )}
                      </AnimatePresence>

                      <div 
                        className={`nora-orb ${connectionState !== "idle" ? "active" : ""}`}
                        onClick={initiateVoiceSession}
                      >
                        <div className="orb-glass">
                          <div className="flex items-center justify-center gap-1.5 h-10 select-none pointer-events-none">
                            {Array.from({ length: 5 }, (_, i) => {
                              const baseHeight = [12, 22, 32, 22, 12][i];
                              return (
                                <motion.div
                                  key={i}
                                  className="w-[3px] rounded-full bg-gradient-to-t from-white to-purple-200 shadow-[0_0_8px_rgba(255,255,255,0.7)]"
                                  style={{ height: baseHeight }}
                                  animate={connectionState !== "idle" ? {
                                    scaleY: [1, 1.3 + (micLevel + agentLevel) * 3, 0.4, 1],
                                  } : {
                                    scaleY: [1, 1.1, 0.9, 1]
                                  }}
                                  transition={{
                                    duration: connectionState !== "idle" ? 0.4 + i * 0.08 : 2.5,
                                    repeat: Infinity,
                                    ease: "easeInOut",
                                    delay: i * 0.08
                                  }}
                                />
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Microphone Mute/Decline Controls */}
                    <div className="flex items-center gap-4">
                      <button
                        onClick={initiateVoiceSession}
                        className={`w-12 h-12 rounded-full flex items-center justify-center transition border ${
                          connectionState === "idle"
                            ? "bg-white/[0.03] border-white/10 hover:bg-white/15 text-white/50"
                            : "bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-900/30"
                        }`}
                      >
                        {connectionState === "idle" ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5 animate-pulse" />}
                      </button>

                      {connectionState !== "idle" && (
                        <button
                          onClick={disconnectSession}
                          className="w-12 h-12 rounded-full flex items-center justify-center bg-rose-600/90 border border-rose-500 text-white hover:bg-rose-500 transition"
                        >
                          <PhoneOff className="w-5 h-5" />
                        </button>
                      )}
                    </div>

                    {/* Suggestion Prompts */}
                    <div className="w-full pt-4 border-t border-white/5 space-y-2">
                      <span className="text-[10px] text-[#8e8b9f] uppercase font-mono tracking-widest font-bold">Suggestions</span>
                      <div className="flex flex-wrap gap-2">
                        {suggestionsList.map((sug) => (
                          <button
                            key={sug.label}
                            onClick={() => handleApplySuggestion(sug.text)}
                            className="px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/5 hover:bg-white/10 text-white/60 hover:text-white transition text-[10px]"
                          >
                            {sug.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Live sandbox mini chat log */}
                    {transcripts.length > 0 && (
                      <div className="w-full max-h-[140px] overflow-y-auto pt-4 border-t border-white/5 space-y-2 text-xs">
                        {transcripts.slice(-4).map((item) => (
                          <div key={item.id} className="flex flex-col gap-0.5">
                            <span className={`text-[9px] uppercase tracking-wider font-bold ${
                              item.sender === "user" ? "text-purple-400" : item.sender === "agent" ? "text-indigo-400" : "text-rose-400"
                            }`}>
                              {item.sender === "user" ? "You" : item.sender === "agent" ? settings.name : "System"}
                            </span>
                            <p className="text-white/80 leading-normal">{item.text}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

            </div>
          </div>
        );

      case "configure":
        return (
          <div className="space-y-8">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-white font-display">Voice Agent Settings</h1>
              <p className="text-sm text-[#8e8b9f] mt-1">Configure Nora's persona, voice selection, and language parameters.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Form columns (Col span 7) */}
              <div className="lg:col-span-7 glass-card space-y-6">
                <div className="form-grid">
                  <div className="form-group">
                    <FieldLabel icon={<User className="w-3.5 h-3.5" />} text="Agent Name" />
                    <input 
                      type="text" 
                      className="form-input" 
                      value={settings.name} 
                      onChange={(e) => setSettings({ ...settings, name: e.target.value })} 
                      placeholder="e.g. Nora"
                    />
                  </div>

                  <div className="form-group">
                    <FieldLabel icon={<Languages className="w-3.5 h-3.5" />} text="Language Settings" />
                    <select 
                      className="form-select"
                      value={settings.language}
                      onChange={(e) => setSettings({ ...settings, language: e.target.value as any })}
                    >
                      <option value="Hinglish">🇮🇳 Hinglish (Hybrid Hindi/English)</option>
                      <option value="Hindi">🇮🇳 Hindi (Devanagari)</option>
                      <option value="English">🇬🇧 English</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <FieldLabel icon={<Volume2 className="w-3.5 h-3.5" />} text="Voice Catalog" />
                  <select 
                    className="form-select"
                    value={settings.voice}
                    onChange={(e) => setSettings({ ...settings, voice: e.target.value })}
                  >
                    {VOICES_CATALOG.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name} ({v.gender}) - {v.description}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Preset roles */}
                <div className="form-group">
                  <FieldLabel icon={<Sparkles className="w-3.5 h-3.5" />} text="Industry Preset Roles" />
                  <div className="pill-group">
                    {TELECALLER_ROLES.slice(0, 5).map((preset) => {
                      const isSelected = settings.role === preset.role;
                      return (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => setSettings({ ...settings, role: preset.role })}
                          className={`pill-item ${isSelected ? "active" : ""}`}
                        >
                          {preset.label.split(" ").slice(0, 2).join(" ")}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="form-group">
                  <FieldLabel icon={<MessageSquare className="w-3.5 h-3.5" />} text="Custom System Persona Guidelines" />
                  <textarea 
                    rows={4}
                    className="form-textarea resize-y" 
                    value={settings.role} 
                    onChange={(e) => setSettings({ ...settings, role: e.target.value })}
                    placeholder="Provide specific guidelines for your agent's behavior, scope, and script instructions..."
                  />
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <FieldLabel icon={<Volume2 className="w-3.5 h-3.5" />} text="Conversation Tone" />
                    <div className="pill-group">
                      {["Friendly", "Professional", "Casual"].map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setSettings({ ...settings, tone: t })}
                          className={`pill-item ${settings.tone === t ? "active" : ""}`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="form-group">
                    <FieldLabel icon={<Activity className="w-3.5 h-3.5" />} text="Agent Response Style" />
                    <div className="pill-group">
                      {["Short", "Detailed"].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setSettings({ ...settings, responseStyle: s as any })}
                          className={`pill-item ${settings.responseStyle === s ? "active" : ""}`}
                        >
                          {s === "Short" ? "Short (Colloquial)" : "Detailed (Explanatory)"}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <FieldLabel icon={<Settings className="w-3.5 h-3.5" />} text="Additional Rules Prompt (Optional)" />
                  <textarea 
                    rows={2}
                    className="form-textarea" 
                    value={settings.customInstruction} 
                    onChange={(e) => setSettings({ ...settings, customInstruction: e.target.value })}
                    placeholder="e.g. Always confirm user mobile number at the end..."
                  />
                </div>

                {/* Save button */}
                <button
                  type="button"
                  onClick={handleSaveSettings}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 font-bold text-sm tracking-wide transition shadow-lg shadow-purple-950/20 active:scale-95 flex items-center justify-center gap-2"
                >
                  <Flame className="w-4 h-4" /> Save &amp; Deploy Settings
                </button>
              </div>

              {/* Compilation view (Col span 5) */}
              <div className="lg:col-span-5 space-y-6">
                <div className="glass-card space-y-4">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#8e8b9f] uppercase tracking-wider">
                    <Database className="w-4 h-4 text-purple-400" />
                    <span>Neon Database Sync Status</span>
                  </div>

                  <div className="flex items-start gap-3 bg-purple-500/5 border border-purple-500/10 p-4 rounded-xl">
                    <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <span className="text-xs font-bold text-white block">PostgreSQL Schema isolated</span>
                      <p className="text-[11px] text-white/50 leading-relaxed">
                        Your configuration changes will dynamically update the default Agent table under Neon, routing Twilio calls dynamically.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="glass-card space-y-3">
                  <span className="text-[10px] text-[#8e8b9f] uppercase font-mono tracking-widest font-bold">Generated Prompt Preview</span>
                  <div className="p-4 bg-black/40 border border-white/5 rounded-xl max-h-[300px] overflow-y-auto font-mono text-[10px] text-white/60 leading-relaxed space-y-2 whitespace-pre-line">
                    <strong>Character Persona:</strong> {settings.role}
                    <br /><br />
                    <strong>Culture/Tone Focus:</strong> speak in {settings.language} accent using {settings.tone} delivery.
                    <br /><br />
                    <strong>System Directives compiled:</strong> {settings.responseStyle === "Short" ? "Keep speech output strictly short (1-2 sentences) and colloquial." : "Provide natural explanatory speech outputs."}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case "history":
        return (
          <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-white font-display">Call Details Records (CDR)</h1>
                <p className="text-sm text-[#8e8b9f] mt-1">Telemetry log data, dialogue recordings, and summaries from PostgreSQL.</p>
              </div>
              <button 
                onClick={loadCallLogs}
                className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-white/[0.04] border border-white/10 hover:bg-white/10 active:scale-95 transition"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Refresh Records
              </button>
            </div>

            {/* Filters grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <input 
                  type="text" 
                  className="form-input pl-9" 
                  placeholder="Search by SID or Phone Number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-white/30" />
              </div>

              <div className="flex items-center gap-2 bg-[#0c0a18]/45 p-1 rounded-xl border border-white/5">
                {["all", "inbound", "outbound"].map((dir) => (
                  <button
                    key={dir}
                    type="button"
                    onClick={() => setFilterDirection(dir as any)}
                    className={`flex-1 py-2 text-center rounded-lg text-xs font-semibold uppercase tracking-wide transition ${
                      filterDirection === dir 
                        ? "bg-purple-600 text-white" 
                        : "text-white/40 hover:text-white"
                    }`}
                  >
                    {dir}
                  </button>
                ))}
              </div>
            </div>

            {/* Logs Table */}
            <div className="glass-card p-0 overflow-hidden">
              <div className="dashboard-table-container">
                <table className="dashboard-table">
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Direction</th>
                      <th>Call Sid</th>
                      <th>Duration</th>
                      <th>Numbers</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCalls.map((log) => {
                      const date = new Date(log.createdAt);
                      const formattedTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                      const formattedDate = date.toLocaleDateString([], { month: 'short', day: 'numeric' });

                      return (
                        <tr 
                          key={log.id} 
                          className="cursor-pointer hover:bg-white/[0.02] transition"
                          onClick={() => setSelectedCall(log)}
                        >
                          <td className="text-white/60 font-mono text-xs">
                            {formattedDate}, {formattedTime}
                          </td>
                          <td>
                            <span className={`status-badge ${log.direction}`}>
                              {log.direction}
                            </span>
                          </td>
                          <td className="font-mono text-xs select-all text-purple-300">
                            {log.twilioCallSid}
                          </td>
                          <td className="font-mono text-xs">{log.durationSec}s</td>
                          <td className="text-xs text-white/70 font-mono">
                            {log.fromNumber} ➔ {log.toNumber}
                          </td>
                          <td>
                            <span className={`status-badge ${log.status}`}>
                              {log.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredCalls.length === 0 && (
                      <tr>
                        <td colSpan={6} className="text-center py-12 text-white/30">
                          {isLoadingLogs ? "Retrieving call logs..." : "No call logs match filter constraints."}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case "connect":
        return (
          <div className="space-y-8">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-white font-display">API Credentials</h1>
              <p className="text-sm text-[#8e8b9f] mt-1">Configure authorization tokens and models for the Gemini Live API.</p>
            </div>

            <div className="max-w-2xl mx-auto glass-card space-y-6 pt-10">
              <div className="flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                  <Key className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white font-display">Gemini Live Authentication</h3>
                  <p className="text-xs text-[#8e8b9f] mt-1 max-w-sm">
                    Your API key is used to authenticate secure WebSocket live streams.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="form-group">
                  <FieldLabel icon={<Key className="w-3.5 h-3.5" />} text="Gemini API Key" />
                  <div className="relative">
                    <input 
                      type={isKeyVisible ? "text" : "password"} 
                      className="form-input pr-12 font-mono"
                      value={settings.apiKey}
                      onChange={(e) => setSettings({ ...settings, apiKey: e.target.value })}
                      placeholder={hasServerKey ? "Using backend configured .env key" : "Paste your Gemini API key (AI Studio)"}
                      disabled={hasServerKey}
                    />
                    {!hasServerKey && (
                      <button
                        type="button"
                        onClick={() => setIsKeyVisible(!isKeyVisible)}
                        className="absolute right-3.5 top-3.5 text-white/30 hover:text-white"
                      >
                        {isKeyVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    )}
                  </div>
                </div>

                <div className={`p-4 rounded-xl border flex items-start gap-3 ${
                  isKeyReady 
                    ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-400" 
                    : "bg-amber-500/5 border-amber-500/20 text-amber-450"
                }`}>
                  {isKeyReady ? (
                    <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-0.5 text-xs">
                    <span className="font-bold text-white block">
                      {isKeyReady ? "Authorization Active" : "Authorization Pending"}
                    </span>
                    <p className="text-white/50 leading-normal">
                      {isKeyReady 
                        ? "Gemini live server endpoints successfully authorized." 
                        : "Please enter an API Key to start live testing."}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-center gap-1.5 text-[10px] text-white/30 pt-4 border-t border-white/5">
                <Lock className="w-3.5 h-3.5 text-purple-400" />
                <span>API Keys are saved in local storage and never exposed in raw client logs.</span>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="admin-container">
      <div className="admin-glow-one" />
      <div className="admin-glow-two" />

      {/* 1. LEFT SIDEBAR NAVIGATION */}
      <aside className="admin-sidebar">
        <div className="brand-container">
          <div className="brand-icon">N</div>
          <div className="brand-text">Nora <span>AI</span></div>
        </div>

        <nav className="nav-group">
          <button
            onClick={() => {
              console.log("NORA_CLICK_CHECK: clicked Dashboard tab");
              setCurrentScreen("dashboard");
            }}
            className={`nav-link ${currentScreen === "dashboard" ? "active" : ""}`}
          >
            <Home /> Dashboard
          </button>

          <button
            onClick={() => {
              console.log("NORA_CLICK_CHECK: clicked Agent Config tab");
              setCurrentScreen("configure");
            }}
            className={`nav-link ${currentScreen === "configure" ? "active" : ""}`}
          >
            <Settings /> Agent Config
          </button>

          <button
            onClick={() => {
              console.log("NORA_CLICK_CHECK: clicked Call Logs tab");
              setCurrentScreen("history");
            }}
            className={`nav-link ${currentScreen === "history" ? "active" : ""}`}
          >
            <History /> Call Logs
          </button>

          <button
            onClick={() => {
              console.log("NORA_CLICK_CHECK: clicked API Credentials tab");
              setCurrentScreen("connect");
            }}
            className={`nav-link ${currentScreen === "connect" ? "active" : ""}`}
          >
            <Key /> API Credentials
          </button>
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-white/5 space-y-3">
          <div className="flex items-center gap-2 text-xs">
            <span className={`w-2 h-2 rounded-full ${isKeyReady ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
            <span className="text-white/60 font-mono text-[11px]">
              {isKeyReady ? "Gemini Live Ready" : "Missing Credentials"}
            </span>
          </div>
          <div className="text-[9px] text-white/30 font-mono uppercase">
            Nora AI Dashboard v2.5
          </div>
        </div>
      </aside>

      {/* 2. MAIN PANEL CONTENT */}
      <main className="admin-main">
        {/* Dynamic header row */}
        <header className="admin-header">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-mono text-white/40">Gateway:</span>
            <span className="text-purple-400 font-mono font-bold bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
              WebClient API
            </span>
          </div>

          <div className="flex items-center gap-3">
            {!isKeyReady && (
              <div className="flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs rounded-lg animate-pulse">
                <AlertCircle className="w-3.5 h-3.5" /> API Key Missing
              </div>
            )}
            <div className="flex items-center gap-2 text-xs text-white/50">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> PostgreSQL Neon Sync Active
            </div>
          </div>
        </header>

        {/* Tab view viewport */}
        <div className="admin-content">
          {renderActiveTabContent()}
        </div>
      </main>

      {/* 3. TRANSCRIPTS SIDEBAR OVERLAY DRAWER */}
      <AnimatePresence>
        {selectedCall && (
          <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedCall(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs"
            />

            {/* Slide drawer */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="details-drawer"
            >
              <div className="details-header">
                <div>
                  <h3 className="text-lg font-bold text-white font-display">Call Transcript</h3>
                  <span className="text-[10px] text-white/40 font-mono">{selectedCall.twilioCallSid}</span>
                </div>
                <button 
                  onClick={() => setSelectedCall(null)}
                  className="w-8 h-8 rounded-full bg-white/[0.04] border border-white/10 hover:bg-white/10 text-white/60 flex items-center justify-center transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="details-body space-y-6">
                {/* AI Summary card */}
                <div className="glass-card bg-purple-950/10 border-purple-500/20 p-4 space-y-2">
                  <span className="text-[10px] text-purple-400 font-bold uppercase tracking-wider block">AI Call Summary</span>
                  <p className="text-xs text-white/80 leading-relaxed font-medium">
                    {selectedCall.summary || "No AI summary has been synthesized for this call log. Telephony triggers will generate summaries automatically."}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-black/30 border border-white/5 rounded-xl p-3">
                    <span className="text-[9px] text-[#8e8b9f] block uppercase tracking-wide">Direction</span>
                    <span className="font-bold text-white capitalize">{selectedCall.direction}</span>
                  </div>
                  <div className="bg-black/30 border border-white/5 rounded-xl p-3">
                    <span className="text-[9px] text-[#8e8b9f] block uppercase tracking-wide">Duration</span>
                    <span className="font-mono font-bold text-white">{selectedCall.durationSec} seconds</span>
                  </div>
                  <div className="bg-black/30 border border-white/5 rounded-xl p-3 col-span-2">
                    <span className="text-[9px] text-[#8e8b9f] block uppercase tracking-wide">Connected Numbers</span>
                    <span className="font-mono text-white/80">{selectedCall.fromNumber} ➔ {selectedCall.toNumber}</span>
                  </div>
                </div>

                {/* Dialogues */}
                <div className="space-y-3">
                  <span className="text-[10px] text-[#8e8b9f] uppercase font-mono tracking-widest font-bold block">Dialogue Transcript</span>
                  
                  <div className="transcript-box pt-2">
                    {/* Parse dynamic call log dialogues JSON if it exists */}
                    {selectedCall.transcript && Array.isArray(selectedCall.transcript) ? (
                      selectedCall.transcript.map((line: any, idx: number) => (
                        <div 
                          key={idx} 
                          className={`chat-bubble ${line.role === "user" ? "user" : "agent"}`}
                        >
                          <div className={`chat-sender ${line.role === "user" ? "user" : "agent"}`}>
                            {line.role === "user" ? "You" : settings.name}
                          </div>
                          <p>{line.text}</p>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-6 text-white/30 border border-white/5 border-dashed rounded-xl">
                        No dialogue transcription JSON details available.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

function FieldLabel({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <label className="form-label">
      <span className="text-purple-400">{icon}</span>
      {text}
    </label>
  );
}
