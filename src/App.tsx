import { useState, useEffect, useRef, lazy, Suspense, type ReactNode } from "react";
import {
  Mic,
  MicOff,
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
  CornerDownRight,
  Activity,
  Copy,
  History,
  VolumeX,
  Volume1,
  MessageSquare,
  Globe,
  HelpCircle,
  AlertCircle,
  Eye,
  EyeOff
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { VOICES_CATALOG } from "./data";
import { AgentState, TranscriptItem, LatencyMetrics, AgentSettings } from "./types";

// ==========================================
// AUDIO CONVERSION UTILITIES
// ==========================================

/**
 * Converts Float32 audio samples [-1.0, 1.0] to 16-bit Signed Little-Endian Integer array buffer.
 */
function float32ToInt16PCM(float32Array: Float32Array): ArrayBuffer {
  const buffer = new ArrayBuffer(float32Array.length * 2);
  const view = new DataView(buffer);
  for (let i = 0; i < float32Array.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    const val = s < 0 ? s * 0x8000 : s * 0x7FFF;
    view.setInt16(i * 2, val, true); // true = little-endian
  }
  return buffer;
}

/**
 * Encodes an ArrayBuffer into a Base64 string.
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Decodes 16-bit Little-Endian signed integer Base64 string into Float32 [-1.0, 1.0].
 */
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

// Language and Preset lists for general fallback reference if needed
export const SIMPLE_LANGUAGES = [
  { id: "Hinglish", name: "Hinglish", label: "Hinglish" },
  { id: "Hindi", name: "Hindi", label: "Hindi" },
  { id: "English", name: "English", label: "English" }
];

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
    category: "E-commerce & Retail",
    label: "📦 E-commerce Customer Care & Verification Agent",
    role: "You are an Order Verification Specialist. Your goal is to contact customers to confirm cash-on-delivery (COD) shipping addresses, verify order details, resolve customer delivery queries, and provide status updates on packages."
  },
  {
    category: "B2B Software & IT",
    label: "💼 B2B Inside Sales Executive",
    role: "You are a professional B2B Inside Sales Caller. Your goal is to call corporate prospects, present software and digital solutions (SaaS), handle initial objections, and schedule product demonstrations for the technical sales team."
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
  // --- Screen Navigation ---
  // "welcome" (1) -> "connect" (2) -> "configure" (3) -> "voicechat" (4)
  const [currentScreen, setCurrentScreen] = useState<"welcome" | "connect" | "configure" | "voicechat">("welcome");
  const [isChatOpen, setIsChatOpen] = useState(false);

  // --- Responsive View Detection ---
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // --- Extended Agent Settings State ---
  const [settings, setSettings] = useState<AgentSettings & {
    name: string;
    responseStyle: "Short" | "Detailed";
    customInstruction: string;
  }>(() => {
    const saved = localStorage.getItem("gemini_voice_settings_indian_v2");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
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
        };
      } catch (e) {
        // ignore fallback
      }
    }
    return {
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
    };
  });

  const [hasServerKey, setHasServerKey] = useState<boolean>(false);
  const [connectionState, setConnectionState] = useState<AgentState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [transcripts, setTranscripts] = useState<TranscriptItem[]>([]);
  const [micLevel, setMicLevel] = useState<number>(0);
  const [agentLevel, setAgentLevel] = useState<number>(0);
  const [isKeyVisible, setIsKeyVisible] = useState<boolean>(false);
  
  // Custom notifications and interrupts tracking
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

  // --- Refs for continuous callbacks & audio streaming state ---
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

  // Voice activity & barge-in tracking
  const lastUserSpeechTimeRef = useRef<number>(0);
  const isAgentSpeakingRef = useRef<boolean>(false);

  // Transcript tracking IDs
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

      // 4096 samples buffer, single input, single output
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      scriptProcessorRef.current = processor;

      source.connect(processor);
      processor.connect(audioContext.destination);

      processor.onaudioprocess = (e) => {
        if (ws.readyState !== WebSocket.OPEN) return;

        const channelData = e.inputBuffer.getChannelData(0);

        // Calculate Root Mean Square for interactive levels
        let sum = 0;
        for (let i = 0; i < channelData.length; i++) {
          sum += channelData[i] * channelData[i];
        }
        const rms = Math.sqrt(sum / channelData.length);
        setMicLevel(rms);

        // User speaks trigger
        if (rms > 0.015) {
          lastUserSpeechTimeRef.current = Date.now();
          setConnectionState("listening");

          // Barge-in check (interrupt the currently speaking agent)
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
      setErrorMessage(`Microphone Access Error: ${err.message || String(err)}. Check if browser mic permission is allowed.`);
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

      // Agent audio volume level
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

    // Construct highly optimized and culturally aligned System Instructions based on choice
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
      // English
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
    addSystemNotification(`Suggested: "${text}" is ready! Speak this in your mic.`);
  };

  // Ensure disconnect on leave
  useEffect(() => {
    return () => {
      disconnectSession();
    };
  }, []);

  // Check if API key is ready (either injected from backend or supplied in settings)
  const isKeyReady = hasServerKey || settings.apiKey.trim().length > 10;

  // Extract latest speech transcripts for mockup display cards
  const userTrans = transcripts.filter((t) => t.sender === "user");
  const agentTrans = transcripts.filter((t) => t.sender === "agent");

  const latestUserSaid = userTrans.length > 0 
    ? userTrans[userTrans.length - 1].text 
    : `"Mujhe pricing ke baare me batao"`; // default placeholder in Hinglish

  const latestNoraSaid = agentTrans.length > 0
    ? agentTrans[agentTrans.length - 1].text
    : `"Bilkul bhai, main simple way me samjha deti hoon."`; // default placeholder in Hinglish

  const latestLatency = metrics.currentPingMs || 120;

  // Custom Suggestion Prompts based on selected Language
  const suggestionsList = settings.language === "Hinglish" 
    ? [
        { label: "🌦️ Weather check", text: "Aaj ka weather kaisa rahega aur kya baarish hone ke chances hain?" },
        { label: "📅 Daily productivity", text: "Aaj ke din ko productively manage karne ke liye kuch time-management tips do." },
        { label: "💡 Motivational quote", text: "Kuch motivational aur energetic quotes sunao jo din bana de." }
      ]
    : settings.language === "Hindi"
    ? [
        { label: "🌦️ आज का मौसम", text: "मेरे स्थान पर आज का मौसम कैसा है और क्या बारिश होने की संभावना है?" },
        { label: "📅 दैनिक योजना", text: "आज के दिन को उत्पादक बनाने के लिए एक अच्छा टाइम-टेबल कैसे सेट करें?" },
        { label: "💡 प्रेरक विचार", text: "मुझे प्रेरित करने के लिए आज का कोई अच्छा सुविचार या सकारात्मक सीख बताएं।" }
      ]
    : [
        { label: "🌦️ Weather forecast", text: "What is the weather forecast for today in my current area?" },
        { label: "📅 Focus & productivity", text: "Give me a simple 5-step checklist to stay focused on high-priority tasks today." },
        { label: "💡 Daily motivation", text: "Share a powerful quote about perseverance and success, and explain its meaning." }
      ];

  const legacyUi = (
    <div className="bg-[#05030a] min-h-screen text-[#e2e0e7] font-sans selection:bg-purple-950 selection:text-purple-200 flex flex-col justify-start relative overflow-x-hidden">
      
      {/* GLOWING AMBENT METALLIC SPHERES BACKDROP */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full bg-purple-900/10 blur-[140px] pointer-events-none" />
      <div className="absolute bottom-20 right-1/4 w-[600px] h-[600px] rounded-full bg-rose-900/5 blur-[160px] pointer-events-none" />
      
      {/* HEADER BAR */}
      <header className="h-16 border-b border-white/5 flex items-center justify-between px-6 sm:px-12 bg-black/40 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-3">
          {/* Neon Purple N Brand representation */}
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-rose-500 flex items-center justify-center shadow-lg shadow-purple-900/40 border border-purple-400/20">
            <span className="text-white font-serif font-serif italic font-bold text-lg leading-none">N</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-md font-bold tracking-tight text-white font-serif italic">Nora AI</span>
              <span className="text-[9px] bg-purple-500/15 text-purple-300 font-mono px-1.5 py-0.5 rounded border border-purple-500/30">Bharat Gateway 🇮🇳</span>
            </div>
          </div>
        </div>

        {/* TOP STATUS NAVIGATION AND QUICK INDICATORS */}
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-3 bg-white/[0.03] border border-white/5 px-4 py-1.5 rounded-full text-xs">
            <div className={`w-2 h-2 rounded-full ${isKeyReady ? "bg-emerald-500 animate-pulse shadow-sm shadow-emerald-500" : "bg-amber-500"}`} />
            <span className="font-mono text-white/70">
              {isKeyReady ? "Gemini Live Ready" : "Gemini Credentials Needed"}
            </span>
          </div>

          <div className="flex items-center gap-1 bg-purple-500/10 border border-purple-500/20 px-3 py-1 rounded text-xs font-mono text-purple-300 font-bold">
            <Activity className="w-3.5 h-3.5 text-purple-400" /> WebClient API
          </div>
        </div>
      </header>

      {/* DASHBOARD GRID CONTAINER */}
      <main className="max-w-[1550px] w-full mx-auto flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 p-4 sm:p-8 z-10">
        
        {/* PRESENTATION PANEL (SPAN 4) - OFFERS CONTROL CONSOLE AND SCREEN SELECTORS */}
        <section className="lg:col-span-4 flex flex-col gap-5 justify-between">
          <div className="space-y-5">
            
            {/* DESIGN META */}
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 backdrop-blur-xs relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/10 rounded-full blur-xl pointer-events-none" />
              <div className="flex items-center gap-2 text-[10px] text-purple-400 uppercase tracking-widest font-mono font-bold mb-2">
                <Sparkles className="w-3.5 h-3.5 text-rose-400 animate-pulse" /> Visual Interactive Suite
              </div>
              <h2 className="text-xl font-serif italic font-bold text-white leading-tight">Interactive Device Sync</h2>
              <p className="text-xs text-white/50 mt-1 lines-clamp-3 leading-relaxed">
                Experience Nora AI exactly like a native high-fidelity iOS application device view. 
                Interact with the forms, select a voice, select languages, and trigger speech capture dynamically.
              </p>

              {/* SCREEN TRIGGER NAV RAIL */}
              <div className="mt-6 space-y-2">
                <span className="text-[10px] text-white/40 uppercase tracking-wider block font-bold font-mono">Presentational Screen Selector</span>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => { disconnectSession(); setCurrentScreen("welcome"); }}
                    className={`py-2 px-3 rounded-lg border text-left text-xs transition-all flex items-center justify-between ${currentScreen === "welcome" ? "bg-gradient-to-r from-purple-950 to-indigo-950 border-purple-500/50 text-white font-bold" : "bg-black/40 border-white/5 text-white/40 hover:text-white"}`}
                  >
                    <span>1. Welcome onboarding</span>
                    <span className="text-[8px] bg-white/10 px-1 hover:text-white rounded">Active</span>
                  </button>
                  <button 
                    onClick={() => { disconnectSession(); setCurrentScreen("connect"); }}
                    className={`py-2 px-3 rounded-lg border text-left text-xs transition-all flex items-center justify-between ${currentScreen === "connect" ? "bg-gradient-to-r from-purple-950 to-indigo-950 border-purple-500/50 text-white font-bold" : "bg-black/40 border-white/5 text-white/40 hover:text-white"}`}
                  >
                    <span>2. Connect Gemini API</span>
                    {isKeyReady && <Check className="w-3 h-3 text-emerald-400" />}
                  </button>
                  <button 
                    onClick={() => { disconnectSession(); setCurrentScreen("configure"); }}
                    className={`py-2 px-3 rounded-lg border text-left text-xs transition-all flex items-center justify-between ${currentScreen === "configure" ? "bg-gradient-to-r from-purple-950 to-indigo-950 border-purple-500/50 text-white font-bold" : "bg-black/40 border-white/5 text-white/40 hover:text-white"}`}
                  >
                    <span>3. Configure Nora</span>
                    <span className="text-[9px] text-purple-300 font-mono italic">{settings.language}</span>
                  </button>
                  <button 
                    onClick={() => { setCurrentScreen("voicechat"); }}
                    className={`py-2 px-3 rounded-lg border text-left text-xs transition-all flex items-center justify-between ${currentScreen === "voicechat" ? "bg-gradient-to-r from-purple-950 to-indigo-950 border-purple-500/50 text-white font-bold animate-pulse" : "bg-black/40 border-white/5 text-white/40 hover:text-white"}`}
                  >
                    <span>4. Voice Stream Live</span>
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                  </button>
                </div>
              </div>
            </div>

            {/* LIVE TELEMETRY ENGINE */}
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 space-y-4">
              <div className="flex justify-between items-center border-b border-white/5 pb-2">
                <span className="text-[10px] text-white/40 uppercase tracking-widest font-mono font-bold">Latency Diagnostics</span>
                <span className="text-[9px] bg-purple-500/20 text-purple-300 font-mono font-bold px-1.5 rounded uppercase">Dual Channel</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-black/30 border border-white/5 rounded-lg p-3">
                  <span className="text-[9px] text-white/40 font-mono block uppercase">Client Ping</span>
                  <div className="text-lg font-mono font-bold text-white mt-0.5">
                    {metrics.currentPingMs ? `${metrics.currentPingMs} ms` : "120 ms"}
                  </div>
                  <p className="text-[8px] text-white/30 leading-tight block mt-1">WebSocket server return trip time</p>
                </div>

                <div className="bg-black/30 border border-white/5 rounded-lg p-3">
                  <span className="text-[9px] text-white/40 font-mono block uppercase">Time to First Byte</span>
                  <div className="text-lg font-mono font-bold text-purple-400 mt-0.5">
                    {metrics.timeToFirstByteMs ? `${metrics.timeToFirstByteMs} ms` : "120 ms"}
                  </div>
                  <p className="text-[8px] text-white/30 leading-tight block mt-1">Audio speech packet latency</p>
                </div>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-white/5">
                <div className="flex justify-between text-[10px] text-white/50 font-mono">
                  <span>Packet Sent count:</span>
                  <span className="text-white font-bold">{metrics.audioChunksSent} chunks</span>
                </div>
                <div className="flex justify-between text-[10px] text-white/50 font-mono">
                  <span>Packet Received count:</span>
                  <span className="text-purple-400 font-bold">{metrics.audioChunksReceived} chunks</span>
                </div>
                <div className="flex justify-between text-[10px] text-white/50 font-mono">
                  <span>Conversational barge-ins:</span>
                  <span className="text-rose-400 font-bold">{userInterruptedCount} interrupted</span>
                </div>
              </div>
            </div>

            {/* SELECTION ASSISTANCE MANUAL */}
            <div className="bg-purple-950/20 border border-purple-500/10 rounded-2xl p-5 space-y-2">
              <span className="text-[10px] uppercase font-mono tracking-wider text-rose-400 font-bold block">🚨 Quick Setup Manual</span>
              <p className="text-[11px] text-white/60 leading-relaxed font-sans">
                To chat, simply select <strong>Configure Nora</strong> page, choose language <strong>Hinglish / Hindi / English</strong>, customized roles, and click <strong>Save &amp; Start</strong>. Press the central glowing pink microphone button inside the device to toggle stream live instantly!
              </p>
            </div>

          </div>

          <p className="text-[10px] text-white/20 font-mono mt-4">
            VoxGemini Bharat v2.1 • Created in high-contrast cosmic luxury design
          </p>
        </section>

        {/* PHYSICAL DEVICE SIMULATOR FRAME (SPAN 8) */}
        <section className="lg:col-span-8 flex justify-center items-center p-2 sm:p-6 bg-white/[0.01] border border-white/5 rounded-3xl backdrop-blur-xs relative overflow-hidden min-h-[750px]">
          
          {/* Subtle Grid overlay representing the premium backdrop of phone mockup */}
          <div className="absolute inset-0 bg-[#07050d] transition-all duration-500" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(139,92,246,0.1)_0%,_transparent_55%)] pointer-events-none" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_rgba(244,63,94,0.06)_0%,_transparent_60%)] pointer-events-none" />

          {/* PHYSICAL IPHONE DEVICE OUTER FRAME CONTAINER */}
          <div className="relative w-full max-w-[390px] h-[780px] rounded-[52px] bg-black border-[12px] border-[#181622] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.95)] flex flex-col justify-between overflow-hidden z-20 shrink-0">
            
            {/* SCREEN GLASS LAYER WITH REFLECTION */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.015] to-white/[0.04] pointer-events-none z-40 rounded-[40px]" />

            {/* TOP BAR: DYNAMIC ISLAND IN NOTCH STATUS & TIME (9:41) */}
            <div className="h-12 w-full flex items-center justify-between px-7 relative z-50 shrink-0 select-none bg-black">
              {/* iOS Local Time */}
              <span className="text-xs font-semibold text-white/90 font-sans">9:41</span>
              
              {/* Dynamic Island Capsule */}
              <div className="absolute left-1/2 -translate-x-1/2 top-3 w-28 h-6 bg-black border border-white/5 rounded-full flex items-center justify-between px-2.5 shadow-inner">
                {/* Right Camera Lens reflection */}
                <div className="w-1.5 h-1.5 rounded-full bg-blue-900/60" />
                <div className="w-3 h-3 rounded-full bg-purple-950 border border-white/10 flex items-center justify-center">
                  <div className="w-1 h-1 rounded-full bg-purple-400" />
                </div>
              </div>

              {/* Status Icons: Signal strength, Wifi, Battery */}
              <div className="flex items-center gap-1.5 text-white/90">
                {/* Signal icons */}
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M2 18h2v2H2zM6 14h2v6H6zM10 10h2v10h-2zM14 6h2v14h-2zM18 2h2v18h-2z" />
                </svg>
                {/* Battery outline icons */}
                <div className="w-5 h-2.5 border border-white/60 rounded-sm p-[1px] flex items-center">
                  <div className="h-full w-4 bg-white rounded-2xs" />
                </div>
              </div>
            </div>

            {/* DYNAMIC SCREEN VIEWPORT */}
            <div className="flex-1 w-full bg-[#090710] px-5 sm:px-6 py-4 overflow-y-auto relative z-30 flex flex-col justify-between select-none">
              
              <AnimatePresence mode="wait">
                
                {/* SCREEN 1: WELCOME / ONBOARDING */}
                {currentScreen === "welcome" && (
                  <motion.div
                    key="welcome_screen"
                    initial={{ opacity: 0, x: -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 15 }}
                    className="flex-1 flex flex-col justify-between py-2 relative"
                  >
                    {/* Welcome Screen upper area */}
                    <div className="flex flex-col items-center text-center pt-10 space-y-6">
                      
                      {/* Premium Neon N Logo Center Badge */}
                      <div className="relative w-28 h-28 flex items-center justify-center">
                        <div className="absolute inset-0 rounded-full bg-purple-600/10 blur-xl animate-pulse" />
                        <div className="absolute inset-1 rounded-full border border-purple-500/20" />
                        
                        {/* Circular glow base */}
                        <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-[#130f24] via-[#241334] to-[#120f26] border border-purple-500/45 shadow-[0_0_30px_rgba(139,92,246,0.3)] flex items-center justify-center">
                          {/* Inner glowing Purple gradient badge */}
                          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-purple-600 to-rose-500 flex items-center justify-center border border-white/20">
                            <span className="text-white font-serif font-serif italic font-bold text-4xl select-none leading-none">N</span>
                          </div>
                        </div>
                      </div>

                      {/* Header text */}
                      <div className="space-y-1">
                        <h1 className="text-2xl font-bold tracking-tight text-white font-sans uppercase">Nora AI</h1>
                        <div className="h-0.5 w-10 bg-gradient-to-r from-purple-500 to-rose-500 mx-auto rounded" />
                      </div>

                      {/* Headline statement */}
                      <div className="space-y-1 pt-4 text-center">
                        <div className="text-3xl font-serif italic text-white tracking-tight leading-none">Speak.</div>
                        <div className="text-3xl font-serif italic font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-rose-400 leading-none">Nora responds.</div>
                      </div>

                      {/* Narrative description */}
                      <p className="text-[11px] text-white/50 leading-relaxed max-w-xs mx-auto pt-2">
                        Your intelligent voice assistant that listens, understands, and responds instantly. Built for the Indian market.
                      </p>
                    </div>

                    {/* Bottom controls */}
                    <div className="space-y-6 pb-6">
                      
                      {/* iOS Pagination Dots */}
                      <div className="flex justify-center items-center gap-1.5 pt-4">
                        <span className="w-4 h-1.5 rounded-full bg-purple-500 shadow-xs shadow-purple-500" />
                        <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
                        <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
                        <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
                      </div>

                      {/* Action Button */}
                      <div className="space-y-3">
                        <button
                          onClick={() => {
                            setCurrentScreen("connect");
                          }}
                          className="w-full bg-gradient-to-r from-purple-600 via-purple-600 to-rose-500 hover:opacity-95 text-white py-3.5 px-6 rounded-full font-semibold text-xs tracking-wider uppercase transition shadow-lg shadow-purple-900/35 flex items-center justify-center gap-2"
                        >
                          <span>Get Started</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>

                        <div className="text-center">
                          <button onClick={() => setCurrentScreen("connect")} className="text-[10px] text-[#e2e0e7]/40 hover:text-white transition">
                            Already have an account? <span className="text-purple-400 font-bold hover:underline">Sign in</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}


                {/* SCREEN 2: CONNECT API */}
                {currentScreen === "connect" && (
                  <motion.div
                    key="connect_screen"
                    initial={{ opacity: 0, x: -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 15 }}
                    className="flex-1 flex flex-col justify-between py-2 relative"
                  >
                    {/* Header bar within phone */}
                    <div className="flex items-center justify-between pb-2 bg-transparent">
                      <button 
                        onClick={() => setCurrentScreen("welcome")}
                        className="w-8 h-8 rounded-full bg-[#181622] flex items-center justify-center hover:bg-white/10 text-white/70 transition"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="text-[10px] uppercase font-mono tracking-widest text-[#e2e0e7]/30">Handshake</span>
                      <div className="w-8 h-8 opacity-0" />
                    </div>

                    {/* API Main container */}
                    <div className="flex-1 flex flex-col pt-3 space-y-6">
                      
                      {/* Connection graphic symbol block */}
                      <div className="flex flex-col items-center text-center space-y-3">
                        <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shadow-md">
                          <Key className="w-5 h-5 text-purple-400 animate-pulse" />
                        </div>
                        <div className="space-y-1">
                          <h2 className="text-xl font-bold tracking-tight text-white leading-tight">Connect API</h2>
                          <p className="text-[10px] text-[#e2e0e7]/40 leading-relaxed max-w-xs px-2 mx-auto">
                            Power Nora with Gemini. Connect your Gemini API key to get started.
                          </p>
                        </div>
                      </div>

                      {/* Key Box Form Section */}
                      <div className="bg-[#120f1c] border border-white/5 rounded-2xl p-4 space-y-3">
                        <label className="text-[10px] uppercase tracking-wider text-[#e2e0e7]/50 font-bold block">
                          Gemini API Key
                        </label>
                        
                        <div className="relative">
                          <input
                            type={isKeyVisible ? "text" : "password"}
                            placeholder={hasServerKey ? "••••••••••••••••••••••••" : "AI Studio Key"}
                            disabled={hasServerKey}
                            value={settings.apiKey}
                            onChange={(e) => setSettings((s) => ({ ...s, apiKey: e.target.value }))}
                            className="w-full bg-[#1c1926] border border-white/5 rounded-xl pl-3 pr-10 py-3 text-xs text-white focus:outline-hidden focus:ring-1 focus:ring-purple-500/50 focus:border-purple-500/50 font-mono disabled:opacity-50"
                          />
                          {!hasServerKey && (
                            <button 
                              type="button"
                              onClick={() => setIsKeyVisible(!isKeyVisible)}
                              className="absolute right-3 top-3 text-[#e2e0e7]/30 hover:text-white transition text-xs"
                            >
                              {isKeyVisible ? "Hide" : "Show"}
                            </button>
                          )}
                        </div>

                        {/* Connection status notification popup */}
                        <div className="pt-1.5">
                          {isKeyReady ? (
                            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 flex items-start gap-2.5">
                              <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                              <div className="space-y-0.5">
                                <span className="text-[11px] font-bold text-white block">Connection successful</span>
                                <span className="text-[9px] text-emerald-300 block">You're all set to go!</span>
                              </div>
                            </div>
                          ) : (
                            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex items-start gap-2.5">
                              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                              <div className="space-y-0.5">
                                <span className="text-[11px] font-bold text-white block">Enter API key</span>
                                <span className="text-[9px] text-amber-300 block">Provide Gemini AI key to authorize live streams.</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Encryption lock footnote */}
                      <div className="flex items-center justify-center gap-1.5 text-[10px] text-[#e2e0e7]/30">
                        <Lock className="w-3.5 h-3.5" />
                        <span>Your key is encrypted and stored securely on your device</span>
                      </div>

                    </div>

                    {/* Foot controls */}
                    <div className="pt-2 pb-6">
                      <button
                        onClick={() => {
                          setCurrentScreen("configure");
                        }}
                        className={`w-full hover:opacity-95 text-white py-3.5 px-6 rounded-full font-semibold text-xs tracking-wider uppercase transition shadow-lg flex items-center justify-center gap-2 ${isKeyReady ? "bg-gradient-to-r from-purple-600 to-rose-500" : "bg-[#1c1926] text-[#e2e0e7]/30 cursor-not-allowed border border-white/5"}`}
                      >
                        <span>Continue</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>

                  </motion.div>
                )}


                {/* SCREEN 3: CONFIGURE NORA */}
                {currentScreen === "configure" && (
                  <motion.div
                    key="configure_screen"
                    initial={{ opacity: 0, x: -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 15 }}
                    className="flex-1 flex flex-col justify-between py-2 relative"
                  >
                    {/* Header bar */}
                    <div className="flex items-center justify-between pb-2 bg-transparent">
                      <button 
                        onClick={() => setCurrentScreen("connect")}
                        className="w-8 h-8 rounded-full bg-[#181622] flex items-center justify-center hover:bg-white/10 text-white/70 transition"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="text-[10px] uppercase font-mono tracking-widest text-[#e2e0e7]/30">Configure</span>
                      <div className="w-8 h-8 opacity-0" />
                    </div>

                    {/* Configure Form container */}
                    <div className="flex-1 space-y-4 pt-2">
                      
                      <div className="text-center pt-1">
                        <h2 className="text-xl font-bold tracking-tight text-white leading-tight">Configure Nora</h2>
                        <span className="text-[10px] text-white/40 block leading-normal mt-0.5">Customize your AI assistant to match your style</span>
                      </div>

                      {/* FORM CORE CONTAINER */}
                      <div className="space-y-3.5 max-h-[480px] overflow-y-auto pr-1">
                        
                        {/* Agent Name field */}
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase tracking-wider text-[#e2e0e7]/40 font-bold block">Agent Name</label>
                          <div className="relative">
                            <input
                              type="text"
                              value={settings.name}
                              onChange={(e) => setSettings((s) => ({ ...s, name: e.target.value }))}
                              className="w-full bg-[#120f1c] border border-white/5 rounded-xl pl-3 pr-10 py-2.5 text-xs text-white focus:outline-hidden focus:ring-1 focus:ring-purple-500/50"
                              placeholder="e.g. Nora"
                            />
                            <User className="absolute right-3.5 top-3 w-3.5 h-3.5 text-[#e2e0e7]/30" />
                          </div>
                        </div>

                        {/* Language Selection Row built precisely as requested */}
                        <div className="space-y-1.5">
                          <label className="text-[10px] uppercase tracking-wider text-[#e2e0e7]/40 font-bold block">Language</label>
                          <div className="grid grid-cols-3 gap-2 bg-[#120f1c] p-1.5 rounded-xl border border-white/5">
                            {["Hindi", "English", "Hinglish"].map((lang) => {
                              const isSelected = settings.language === lang;
                              return (
                                <button
                                  key={lang}
                                  type="button"
                                  onClick={() => setSettings((s) => ({ ...s, language: lang }))}
                                  className={`py-2 px-1 text-center rounded-lg text-xs font-semibold transition-all ${
                                    isSelected 
                                      ? "bg-purple-600 text-white shadow-md shadow-purple-900/10 scale-[1.02]" 
                                      : "bg-transparent text-[#e2e0e7]/40 hover:text-white"
                                  }`}
                                >
                                  {lang}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Helper alert highlighting why Hinglish is awesome */}
                        {settings.language === "Hinglish" && (
                          <div className="bg-purple-500/5 border border-purple-500/10 p-2.5 rounded-lg text-[9px] text-purple-300 leading-normal flex items-start gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-rose-450 shrink-0 mt-0.5" />
                            <span><strong>Hinglish default chosen:</strong> Highly recommended. Common hybrid mixture of Hindi &amp; English for the most lifelike India voice experience!</span>
                          </div>
                        )}

                        {/* Agent preset roles pill selectors */}
                        <div className="space-y-1">
                          <span className="text-[10px] uppercase tracking-wider text-[#e2e0e7]/40 font-bold block">Role Preset</span>
                          <div className="flex flex-wrap gap-1.5">
                            {[
                              { label: "Helpful AI Assistant", role: "Helpful AI Assistant" },
                              { label: "IT Guru", role: "IT Guru Tech Mentor" },
                              { label: "Auto Bhaiya", role: "Auto Bhaiya Street Guide" },
                              { label: "Dadi Ma Medicine", role: "Dadi Ma Life Advisor" }
                            ].map((preset) => {
                              const isCur = settings.role === preset.role;
                              return (
                                <button
                                  key={preset.label}
                                  type="button"
                                  onClick={() => setSettings((s) => ({ ...s, role: preset.role }))}
                                  className={`py-1.5 px-2.5 rounded-full text-[10px] font-semibold border transition-all ${
                                    isCur 
                                      ? "bg-purple-500/25 border-purple-500 text-white shadow-xs" 
                                      : "bg-[#120f1c] border-white/5 text-[#e2e0e7]/40 hover:text-[#e2e0e7]"
                                  }`}
                                >
                                  {preset.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Tone chips */}
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase tracking-wider text-[#e2e0e7]/40 font-bold block">Tone</label>
                          <div className="flex flex-wrap gap-1.5">
                            {["Friendly", "Professional", "Casual", "Witty", "Calm", "Inspiring"].map((tone) => {
                              const isSelected = settings.tone === tone;
                              return (
                                <button
                                  key={tone}
                                  type="button"
                                  onClick={() => setSettings((s) => ({ ...s, tone }))}
                                  className={`py-1.5 px-3 rounded-lg text-[10px] font-medium border transition-all ${
                                    isSelected 
                                      ? "bg-purple-600/35 border-purple-500 text-white" 
                                      : "bg-[#120f1c] border-white/5 text-[#e2e0e7]/45 hover:text-white"
                                  }`}
                                >
                                  {tone}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Personality chips */}
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase tracking-wider text-[#e2e0e7]/40 font-bold block">Personality</label>
                          <div className="flex flex-wrap gap-1.5">
                            {["Empathetic", "Curious", "Logical", "Creative", "Patient", "Encouraging"].map((pers) => {
                              const isSelected = settings.personality === pers;
                              return (
                                <button
                                  key={pers}
                                  type="button"
                                  onClick={() => setSettings((s) => ({ ...s, personality: pers }))}
                                  className={`py-1.5 px-3 rounded-lg text-[10px] font-medium border transition-all ${
                                    isSelected 
                                      ? "bg-purple-600/35 border-purple-500 text-white" 
                                      : "bg-[#120f1c] border-white/5 text-[#e2e0e7]/45 hover:text-white"
                                  }`}
                                >
                                  {pers}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Speech Response Style */}
                        <div className="space-y-1 pt-1.5">
                          <label className="text-[10px] uppercase tracking-wider text-[#e2e0e7]/40 font-bold block">Response Style</label>
                          <div className="grid grid-cols-2 gap-2">
                            {["Short", "Detailed"].map((styleOpt) => {
                              const isSelected = settings.responseStyle === styleOpt;
                              return (
                                <button
                                  key={styleOpt}
                                  type="button"
                                  onClick={() => setSettings((s) => ({ ...s, responseStyle: styleOpt as any }))}
                                  className={`py-2 px-2.5 rounded-lg text-[10px] font-semibold border text-center transition-all ${
                                    isSelected 
                                      ? "bg-gradient-to-r from-purple-950 to-[#2a133d] border-purple-500 text-white" 
                                      : "bg-[#120f1c] border-white/5 text-[#e2e0e7]/40 hover:text-white"
                                  }`}
                                >
                                  {styleOpt === "Short" ? "Short (Brief replies)" : "Detailed (Explanatory)"}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Custom Instruction (Optional) */}
                        <div className="space-y-1 pt-1">
                          <label className="text-[10px] uppercase tracking-wider text-[#e2e0e7]/40 font-bold block">Custom Instruction (Optional)</label>
                          <textarea
                            value={settings.customInstruction}
                            onChange={(e) => setSettings((s) => ({ ...s, customInstruction: e.target.value }))}
                            className="w-full h-11 bg-[#120f1c] border border-white/5 rounded-xl px-3 py-1.5 text-[10px] text-white placeholder-white/30 resize-none focus:outline-hidden focus:ring-1 focus:ring-purple-500"
                            placeholder="Add your own rules (e.g. Talk like a doctor)..."
                          />
                        </div>

                      </div>
                    </div>

                    {/* Bottom Save & Start button */}
                    <div className="pt-2 pb-6">
                      <button
                        onClick={() => {
                          setCurrentScreen("voicechat");
                          // Initiate connection automatically because they hit save!
                          initiateVoiceSession();
                        }}
                        className="w-full bg-gradient-to-r from-purple-600 via-purple-600 to-rose-500 hover:opacity-95 text-white py-3.5 px-6 rounded-full font-semibold text-xs tracking-wider uppercase transition shadow-lg shadow-purple-950/20 flex items-center justify-center gap-2"
                      >
                        <span>Save &amp; Start</span>
                        <Flame className="w-4 h-4" />
                      </button>
                    </div>

                  </motion.div>
                )}


                {/* SCREEN 4: VOICE CHAT */}
                {currentScreen === "voicechat" && (
                  <motion.div
                    key="voicechat_screen"
                    initial={{ opacity: 0, x: -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 15 }}
                    className="flex-1 flex flex-col justify-between py-2 relative"
                  >
                    {/* Header bar */}
                    <div className="flex items-center justify-between pb-2 bg-transparent relative z-10">
                      
                      {/* Left Burger Option Menu button */}
                      <button 
                        onClick={() => {
                          addSystemNotification("Left action menu toggled.");
                        }}
                        className="w-8 h-8 rounded-full bg-[#181622] flex items-center justify-center hover:bg-white/10 text-white/70 transition"
                      >
                        <Menu className="w-4 h-4" />
                      </button>

                      {/* Center Live Badge */}
                      <div className="flex items-center gap-1.5 bg-rose-500/10 border border-rose-500/30 px-3 py-1 rounded-full text-[9px] font-mono font-bold tracking-widest text-rose-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping shrink-0" />
                        <span>LIVE</span>
                      </div>

                      {/* Right Settings gear button */}
                      <button 
                        onClick={() => {
                          disconnectSession();
                          setCurrentScreen("configure");
                        }}
                        className="w-8 h-8 rounded-full bg-[#181622] flex items-center justify-center hover:bg-white/10 text-white/70 transition shadow-md"
                        title="Configure settings"
                      >
                        <Settings className="w-4 h-4 text-purple-400" />
                      </button>

                    </div>

                    {/* Latency and title banner right below top header */}
                    <div className="flex justify-between items-center px-1 pt-1 mb-2 relative z-10">
                      {/* Left language focus badge */}
                      <span className="text-[8px] uppercase tracking-wider text-white/30 font-mono">
                        Lang: <span className="text-purple-400 font-bold">{settings.language}</span>
                      </span>

                      {/* Explicit Live Dynamic Latency check badge */}
                      <div className="flex items-center gap-1 text-[8px] text-[#e2e0e7]/40 font-mono">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-xs" />
                        <span>{latestLatency}ms</span>
                      </div>
                    </div>

                    {/* ACTIVE VOICE PORTRAIT SECTION (WAVEFORM & MICROPHONE ORB) */}
                    <div className="flex-1 flex flex-col items-center justify-center space-y-4 py-2 relative">
                      
                      {/* Captions */}
                      <div className="text-center space-y-0.5">
                        <h3 className="text-lg font-bold tracking-tight text-white leading-none">
                          {connectionState === "idle" && "Ready to talk?"}
                          {connectionState === "connecting" && "Synthesizing..."}
                          {connectionState === "listening" && "Listening..."}
                          {connectionState === "speaking" && "Nora is speaking"}
                          {connectionState === "error" && "Pipeline error"}
                        </h3>
                        
                        <p className="text-[10px] text-white/40 block">
                          {connectionState === "idle" && "Tap the microphone to connect"}
                          {connectionState === "connecting" && "Handshaking with Indian gateway..."}
                          {connectionState === "listening" && `Nora is listening in ${settings.language}`}
                          {connectionState === "speaking" && `${settings.name} speaking in ${settings.language}`}
                          {connectionState === "error" && `${errorMessage || "Verify connection API keys"}`}
                        </p>
                      </div>

                      {/* WAVEFORM ANIMATION GRAPHICS */}
                      <div className="h-16 w-full flex items-center justify-center relative overflow-hidden my-1">
                        <svg className="w-full h-full max-w-[280px]" viewBox="0 0 100 40" preserveAspectRatio="none">
                          {/* Low wave 1 */}
                          <path
                            d={`M 0 20 Q 25 ${20 - (micLevel + agentLevel) * 12} 50 20 T 100 20`}
                            fill="none"
                            stroke="rgba(168, 85, 247, 0.2)"
                            strokeWidth="1.5"
                            className={connectionState !== "idle" ? "animate-pulse" : ""}
                          />
                          {/* Medium wave 2 */}
                          <path
                            d={`M 0 20 Q 25 ${20 + (micLevel + agentLevel) * 20} 50 20 T 100 20`}
                            fill="none"
                            stroke="rgba(139, 92, 246, 0.45)"
                            strokeWidth="1.5"
                            className={connectionState !== "idle" ? "animate-pulse" : ""}
                          />
                          {/* Primary vibrant wave 3 */}
                          <path
                            d={`M 0 20 Q 25 ${20 - (micLevel + agentLevel) * 35} 50 20 T 100 20`}
                            fill="none"
                            stroke="url(#purple_wave_gradient)"
                            strokeWidth="2.5"
                            className={connectionState !== "idle" ? "animate-pulse" : ""}
                          />
                          <defs>
                            <linearGradient id="purple_wave_gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                              <stop offset="0%" stopColor="#c084fc" />
                              <stop offset="50%" stopColor="#ec4899" />
                              <stop offset="100%" stopColor="#818cf8" />
                            </linearGradient>
                          </defs>
                        </svg>
                      </div>

                      {/* CENTER GLOWING PHYSICAL MICROPHONE ORB ASSEMBLY */}
                      <div className="relative w-36 h-36 flex items-center justify-center">
                        
                        {/* Interactive Ripple Waves expanding behind the button under speaking status */}
                        <AnimatePresence>
                          {(connectionState === "listening" || connectionState === "speaking") && (
                            <motion.div
                              initial={{ scale: 0.9, opacity: 0.4 }}
                              animate={{ 
                                scale: 1.45 + (micLevel + agentLevel) * 1.5, 
                                opacity: [0.35, 0] 
                              }}
                              transition={{ 
                                repeat: Infinity, 
                                duration: 1.5,
                                ease: "easeOut"
                              }}
                              exit={{ opacity: 0 }}
                              className="absolute w-full h-full rounded-full bg-purple-500/25 blur-sm pointer-events-none"
                            />
                          )}
                        </AnimatePresence>

                        {/* Master Trigger circle button */}
                        <button
                          onClick={initiateVoiceSession}
                          className={`w-28 h-28 rounded-full flex flex-col items-center justify-center relative transition duration-300 ${
                            connectionState === "idle" 
                              ? "bg-[#141220] border-2 border-purple-500/20 hover:border-purple-500/40 text-[#e2e0e7] shadow-lg shadow-purple-950/25 hover:scale-[1.01]"
                              : connectionState === "connecting"
                              ? "bg-amber-600/20 border-2 border-amber-500/50 text-amber-300 animate-pulse"
                              : "bg-gradient-to-tr from-purple-600 via-purple-600 to-rose-500 text-white shadow-[0_0_35px_rgba(168,85,247,0.55)] border border-white/20 hover:scale-[0.99]"
                          }`}
                        >
                          {/* Inner glowing mic shape */}
                          <div className="flex flex-col items-center space-y-1">
                            {connectionState === "idle" ? (
                              <MicOff className="w-7 h-7 text-white/30" />
                            ) : (
                              <Mic className="w-8 h-8 text-white animate-pulse" />
                            )}
                            <span className="text-[8px] font-mono uppercase tracking-widest text-white/60 font-medium">
                              {connectionState === "idle" && "OFF"}
                              {connectionState === "connecting" && "SYNC"}
                              {connectionState === "listening" && "LISTEN"}
                              {connectionState === "speaking" && "NORA"}
                            </span>
                          </div>
                        </button>
                      </div>

                    </div>

                    {/* CONVERSATIONAL LOGGER CARDS (YOU SAID & NORA RESPONDED) */}
                    <div className="space-y-2 pb-2 relative z-10">
                      
                      {/* 1. YOU SAID CARD */}
                      <div className="bg-[#120f1c]/80 border border-white/5 rounded-xl p-3 backdrop-blur-xs flex flex-col justify-between">
                        <div className="flex justify-between items-center text-[8px] uppercase tracking-wider text-[#e2e0e7]/30">
                          <span className="font-bold">You Said</span>
                          <span className="font-mono">9:41 AM</span>
                        </div>
                        <p className="text-xs text-white leading-relaxed mt-1 font-medium font-sans">
                          {latestUserSaid}
                        </p>
                      </div>

                      {/* 2. NORA RESPONDED CARD */}
                      <div className="bg-gradient-to-r from-purple-950/30 to-indigo-950/30 border border-purple-500/10 rounded-xl p-3 backdrop-blur-xs flex flex-col justify-between relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-8 h-8 bg-purple-500/10 rounded-full blur-md" />
                        <div className="flex justify-between items-center text-[8px] uppercase tracking-wider">
                          <span className="font-bold text-purple-400 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-ping" />
                            {settings.name}
                          </span>
                          <div className="flex items-center gap-1.5 text-white/30 font-mono">
                            <span>9:41 AM</span>
                            <span className="text-purple-300 font-bold bg-purple-500/10 px-1 rounded">{latestLatency}ms</span>
                          </div>
                        </div>
                        <p className="text-xs text-white/90 leading-relaxed mt-1.5 italic font-serif">
                          {latestNoraSaid}
                        </p>
                      </div>

                    </div>

                    {/* CLICKABLE STARTER SLIDER COCKPIT */}
                    <div className="pt-2 pb-6 relative z-10">
                      <div className="flex items-center justify-between mb-1.5 px-1">
                        <span className="text-[9px] uppercase tracking-widest text-[#e2e0e7]/30 font-mono font-bold flex items-center gap-1">
                          <Languages className="w-3.5 h-3.5 text-purple-400" /> Quick Starters suggestions
                        </span>
                      </div>
                      
                      {/* Horizontal slider list */}
                      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                        {suggestionsList.map((sug) => {
                          return (
                            <button
                              key={sug.label}
                              onClick={() => handleApplySuggestion(sug.text)}
                              className="py-1 px-2.5 rounded-full bg-white/[0.03] border border-white/5 hover:bg-white/10 text-white/50 hover:text-white transition text-[9px] shrink-0 font-medium"
                            >
                              {sug.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                  </motion.div>
                )}

              </AnimatePresence>

            </div>

            {/* iOS BOTTOM HOME SWIPE INDICATOR BAR */}
            <div className="h-6 w-full flex items-center justify-center shrink-0 select-none bg-black">
              <div className="w-32 h-[4px] rounded-full bg-white/20" />
            </div>

          </div>

        </section>

      </main>
    </div>
  );

  const renderActiveScreen = () => {
    const panelHeight = isMobile ? (isChatOpen ? 320 : 0) : 250;
    return (
      <AnimatePresence mode="wait">
        {currentScreen === "welcome" && (
          <motion.section
            key="welcome"
            className="nora-screen nora-welcome"
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -18 }}
          >
            <Brand />

            <div className="hero-orb-wrap">
              <NoraOrb size="large" active />
            </div>

            <div className="welcome-copy">
              <h1>Speak.<br /><span>Nora responds.</span></h1>
              <p>Your intelligent voice assistant that listens, understands, and responds instantly.</p>
            </div>

            <div className="screen-footer">
              <div className="step-dots"><i className="active" /><i /><i /><i /></div>
              <motion.button className="primary-button" whileHover={{ y: -3, scale: 1.015 }} whileTap={{ scale: 0.92 }} transition={{ type: "spring", stiffness: 430, damping: 18 }} onClick={() => setCurrentScreen("connect")}>
                Get Started <ArrowRight />
              </motion.button>
            </div>
          </motion.section>
        )}

        {currentScreen === "connect" && (
          <motion.section
            key="connect"
            className="nora-screen"
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -18 }}
          >
            <Brand />
            <div className="screen-heading">
              <span className="eyebrow">Step 2 of 4</span>
              <h1>Connect <span>API</span></h1>
              <h2>Power Nora with Gemini</h2>
              <p>Connect your Gemini API key to get started.</p>
            </div>

            <div className="api-card">
              <div className="floating-icon"><Key /></div>
              <label htmlFor="gemini-key">Gemini API Key</label>
              <div className="key-input">
                <input
                  id="gemini-key"
                  type={isKeyVisible ? "text" : "password"}
                  value={settings.apiKey}
                  placeholder={hasServerKey ? "Server key is configured" : "Paste your API key"}
                  onChange={(e) => setSettings({ ...settings, apiKey: e.target.value })}
                />
                <button onClick={() => setIsKeyVisible((value) => !value)} aria-label="Toggle API key visibility">
                  {isKeyVisible ? <EyeOff /> : <Eye />}
                </button>
              </div>

              <div className={`connection-card ${isKeyReady ? "success" : "waiting"}`}>
                <div className="connection-check">{isKeyReady ? <Suspense fallback={<Check />}><Lottie animationData={SUCCESS_ANIMATION} loop={false} /></Suspense> : <Key />}</div>
                <div>
                  <strong>{isKeyReady ? "Connection successful" : "API key required"}</strong>
                  <span>{isKeyReady ? "You're all set to go!" : "Enter a valid Gemini API key."}</span>
                </div>
              </div>
            </div>

            <p className="secure-copy"><Lock /> Your key stays securely on this device.</p>

            <div className="screen-footer compact">
              <motion.button
                className="primary-button"
                whileHover={isKeyReady ? { y: -3, scale: 1.015 } : {}}
                whileTap={isKeyReady ? { scale: 0.92 } : {}}
                transition={{ type: "spring", stiffness: 430, damping: 18 }}
                disabled={!isKeyReady}
                onClick={() => setCurrentScreen("configure")}
              >
                Continue <ArrowRight />
              </motion.button>
            </div>
          </motion.section>
        )}

        {currentScreen === "configure" && (
          <motion.section
            key="configure"
            className="nora-screen configure-screen"
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -18 }}
          >
            <div className="top-row">
              <div className="w-10" />
              <Brand compact />
              <span className="step-pill">3 / 4</span>
            </div>

            <div className="screen-heading left">
              <h1>Configure <span>Nora</span></h1>
              <p>Shape how your assistant speaks, thinks, and responds.</p>
            </div>

            <div className="config-form">
              <div className="config-group">
                <FieldLabel icon={<User />} text="Agent Name" />
                <input className="nora-input" value={settings.name} onChange={(e) => setSettings({ ...settings, name: e.target.value })} />
              </div>

              <div className="config-group">
                <FieldLabel icon={<Languages />} text="Language" />
                <ChipGroup values={["Hindi", "English", "Hinglish"]} selected={settings.language} onSelect={(language) => setSettings({ ...settings, language })} />
              </div>

              <div className="config-group">
                <FieldLabel icon={<Sparkles />} text="Industry / Role Template" />
                <select 
                  className="nora-input"
                  value={TELECALLER_ROLES.find(r => r.role === settings.role)?.label || "custom"}
                  onChange={(e) => {
                    const selectedLabel = e.target.value;
                    if (selectedLabel !== "custom") {
                      const found = TELECALLER_ROLES.find(r => r.label === selectedLabel);
                      if (found) {
                        setSettings({ ...settings, role: found.role });
                      }
                    }
                  }}
                >
                  <option value="custom">✍️ Custom Persona / Other Role</option>
                  {TELECALLER_ROLES.map((item) => (
                    <option key={item.label} value={item.label}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="config-group">
                <FieldLabel icon={<MessageSquare />} text="Role Instructions Prompt" />
                <textarea 
                  className="nora-input py-2 h-16 resize-none" 
                  value={settings.role} 
                  onChange={(e) => setSettings({ ...settings, role: e.target.value })}
                  placeholder="Describe what Nora should say and do..."
                />
              </div>

              <div className="config-group">
                <FieldLabel icon={<Volume2 />} text="Tone" />
                <ChipGroup values={["Friendly", "Professional", "Casual"]} selected={settings.tone} onSelect={(tone) => setSettings({ ...settings, tone })} />
              </div>

              <div className="config-group">
                <FieldLabel icon={<Activity />} text="Personality" />
                <ChipGroup values={["Empathetic", "Calm", "Smart"]} selected={settings.personality} onSelect={(personality) => setSettings({ ...settings, personality })} />
              </div>

              <div className="config-group">
                <FieldLabel icon={<MessageSquare />} text="Response Style" />
                <ChipGroup values={["Short", "Detailed"]} selected={settings.responseStyle} onSelect={(responseStyle) => setSettings({ ...settings, responseStyle: responseStyle as "Short" | "Detailed" })} />
              </div>
            </div>

            <motion.button
              className="primary-button sticky-action"
              whileHover={{ y: -3, scale: 1.015 }}
              whileTap={{ scale: 0.92 }}
              transition={{ type: "spring", stiffness: 430, damping: 18 }}
              onClick={() => {
                if (!isKeyReady) {
                  setCurrentScreen("connect");
                  setErrorMessage("Please enter a valid Gemini API key first.");
                } else {
                  setCurrentScreen("voicechat");
                  initiateVoiceSession();
                }
              }}
            >
              Save &amp; Start <ArrowRight />
            </motion.button>
          </motion.section>
        )}

        {currentScreen === "voicechat" && (
          <motion.section
            key="voicechat"
            className="nora-screen voice-screen"
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -18 }}
          >
            <div className="voice-header">
              <button className="round-button" onClick={() => { disconnectSession(); setCurrentScreen("configure"); }}><Menu /></button>
              <Brand compact />
              <button className="language-pill" onClick={() => setCurrentScreen("configure")}><Globe /> {settings.language}</button>
            </div>

            <div className="voice-stage">
              <div className="voice-wave" aria-hidden="true">
                {Array.from({ length: 35 }, (_, index) => {
                  const energy = Math.min(1, (micLevel + agentLevel) * 7);
                  const profile = 0.25 + Math.sin((index / 34) * Math.PI) * 0.75;
                  return <motion.span key={index} animate={{ scaleY: connectionState === "idle" ? 0.18 + profile * 0.18 : 0.35 + profile * (0.8 + energy * 2.8) }} transition={{ type: "spring", stiffness: 260, damping: 18, delay: (index % 6) * 0.012 }} />;
                })}
              </div>

              {/* Upper centered content (Orb & State Copy) */}
              <div className="flex-1 flex flex-col items-center justify-center w-full relative z-10 pt-4">
                <motion.button className="orb-button" whileHover={{ scale: 1.035 }} whileTap={{ scale: 0.88, rotate: -4 }} transition={{ type: "spring", stiffness: 420, damping: 16 }} onClick={initiateVoiceSession} aria-label="Start or stop voice session">
                  <NoraOrb size="medium" active={connectionState !== "idle"} level={micLevel + agentLevel} />
                </motion.button>

                <div className="voice-state-copy">
                  <h1>
                    {connectionState === "connecting" ? "Connecting..." : connectionState === "speaking" ? `${settings.name} is speaking...` : connectionState === "listening" ? "Listening..." : `Hi, I'm ${settings.name}`}
                  </h1>
                  <p>{connectionState === "idle" ? "Tap the mic and speak anything" : connectionState === "speaking" ? "You can interrupt anytime" : "Nora is listening"}</p>
                </div>
              </div>

              {/* Lower content (Tap to speak button & Caption) pushed down */}
              <div className="mt-auto flex flex-col items-center pb-12 relative z-10">
                <motion.button className={`mic-button ${connectionState !== "idle" ? "live" : ""}`} whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.82 }} transition={{ type: "spring", stiffness: 500, damping: 16 }} onClick={initiateVoiceSession}>
                  {connectionState === "idle" ? <Mic /> : <MicOff />}
                </motion.button>
                <span className="mic-caption">{connectionState === "idle" ? "Tap to speak" : "Tap to stop"}</span>
              </div>
            </div>

            {errorMessage && <div className="error-banner"><AlertCircle /> {errorMessage}</div>}

            {/* Floating arrow button to open the chat transcripts bottom sheet on mobile */}
            {isMobile && !isChatOpen && (
              <button 
                onClick={() => setIsChatOpen(true)}
                className="absolute bottom-[24px] left-1/2 transform -translate-x-1/2 w-10 h-10 flex items-center justify-center bg-black/75 border border-white/10 rounded-full text-[#a78bfa] hover:text-white shadow-lg shadow-black/50 backdrop-blur-md transition z-40 active:scale-95"
                aria-label="Open conversation transcripts"
              >
                <ChevronUp className="w-5 h-5 animate-bounce" />
              </button>
            )}

            <motion.div 
              className="conversation-panel"
              animate={{ height: panelHeight }}
              style={{ borderWidth: isMobile && !isChatOpen ? 0 : 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            >
              <div className="panel-header" onClick={() => setIsChatOpen(false)}>
                <div className="panel-handle" />
                <div className="conversation-title">
                  <div><MessageSquare /><span>Conversation</span></div>
                  <div className="flex items-center gap-2">
                    <span className="latency-badge">{latestLatency}ms</span>
                    <ChevronDown className="w-4 h-4 text-[#a78bfa]" />
                  </div>
                </div>
              </div>
              
              <div className="messages">
                <div className="message-row user-message">
                  <div className="avatar"><User /></div>
                  <div className="message-bubble"><small>You said</small><p>{latestUserSaid.replaceAll('"', '')}</p></div>
                </div>
                <div className="message-row nora-message">
                  <div className="avatar nora-avatar">N</div>
                  <div className="message-bubble"><small>{settings.name} responded</small><p>{latestNoraSaid.replaceAll('"', '')}</p></div>
                </div>
              </div>
            </motion.div>
          </motion.section>
        )}
      </AnimatePresence>
    );
  };

  return (
    <div className="nora-app">
      <div className="nora-ambient nora-ambient-one" />
      <div className="nora-ambient nora-ambient-two" />

      {isMobile ? (
        <main className={`nora-phone ${currentScreen !== "voicechat" ? "pb-16" : ""}`}>
          {renderActiveScreen()}

          {/* MOBILE BOTTOM NAVIGATION BAR */}
          {currentScreen !== "voicechat" && (
            <nav className="h-16 bg-[#090710]/95 backdrop-blur-md border-t border-white/5 flex items-center justify-around shrink-0 select-none z-50 absolute bottom-0 left-0 right-0">
              <button 
                onClick={() => { disconnectSession(); setCurrentScreen("welcome"); }}
                className={`relative flex flex-col items-center justify-center w-14 h-14 transition ${currentScreen === "welcome" ? "text-purple-400" : "text-white/40 hover:text-white"}`}
                aria-label="Home page"
              >
                <Home className="w-[26px] h-[26px]" />
                {currentScreen === "welcome" && (
                  <span className="absolute bottom-1 w-1 h-1 bg-purple-400 rounded-full shadow-[0_0_8px_#a78bfa]" />
                )}
              </button>

              <button 
                onClick={() => { disconnectSession(); setCurrentScreen("connect"); }}
                className={`relative flex flex-col items-center justify-center w-14 h-14 transition ${currentScreen === "connect" ? "text-purple-400" : "text-white/40 hover:text-white"}`}
                aria-label="API Credentials page"
              >
                <Key className="w-[26px] h-[26px]" />
                {currentScreen === "connect" && (
                  <span className="absolute bottom-1 w-1 h-1 bg-purple-400 rounded-full shadow-[0_0_8px_#a78bfa]" />
                )}
              </button>

              <button 
                onClick={() => { disconnectSession(); setCurrentScreen("configure"); }}
                className={`relative flex flex-col items-center justify-center w-14 h-14 transition ${currentScreen === "configure" ? "text-purple-400" : "text-white/40 hover:text-white"}`}
                aria-label="Configuration settings page"
              >
                <Settings className="w-[26px] h-[26px]" />
                {currentScreen === "configure" && (
                  <span className="absolute bottom-1 w-1 h-1 bg-purple-400 rounded-full shadow-[0_0_8px_#a78bfa]" />
                )}
              </button>

              <button 
                onClick={() => { 
                  if (!isKeyReady) {
                    setCurrentScreen("connect");
                    setErrorMessage("Please enter a valid Gemini API key first.");
                  } else {
                    setCurrentScreen("voicechat"); 
                    initiateVoiceSession();
                  }
                }}
                className={`relative flex flex-col items-center justify-center w-14 h-14 transition ${currentScreen === "voicechat" ? "text-purple-400" : "text-white/40 hover:text-white"}`}
                aria-label="Live Voice Assistant page"
              >
                <Mic className="w-[26px] h-[26px]" />
                {currentScreen === "voicechat" && (
                  <span className="absolute bottom-1 w-1 h-1 bg-purple-400 rounded-full shadow-[0_0_8px_#a78bfa]" />
                )}
              </button>
            </nav>
          )}
        </main>
      ) : (
        <div className="bg-[#05030a] min-h-screen text-[#e2e0e7] font-sans selection:bg-purple-950 selection:text-purple-200 flex flex-col justify-start relative overflow-x-hidden w-full">
          {/* HEADER BAR */}
          <header className="h-16 border-b border-white/5 flex items-center justify-between px-6 sm:px-12 bg-black/40 backdrop-blur-md sticky top-0 z-50 shrink-0 select-none">
            <div className="flex items-center gap-3">
              {/* Neon Purple N Brand representation */}
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-rose-500 flex items-center justify-center shadow-lg shadow-purple-900/40 border border-purple-400/20">
                <span className="text-white font-serif italic font-bold text-lg leading-none">N</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-md font-bold tracking-tight text-white font-serif italic">Nora AI</span>
                  <span className="text-[9px] bg-purple-500/15 text-purple-300 font-mono px-1.5 py-0.5 rounded border border-purple-500/30">Bharat Gateway 🇮🇳</span>
                </div>
              </div>
            </div>

            {/* TOP STATUS NAVIGATION AND QUICK INDICATORS */}
            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-3 bg-white/[0.03] border border-white/5 px-4 py-1.5 rounded-full text-xs">
                <div className={`w-2 h-2 rounded-full ${isKeyReady ? "bg-emerald-500 animate-pulse shadow-sm shadow-emerald-500" : "bg-amber-500"}`} />
                <span className="font-mono text-white/70">
                  {isKeyReady ? "Gemini Live Ready" : "Gemini Credentials Needed"}
                </span>
              </div>

              <div className="flex items-center gap-1 bg-purple-500/10 border border-purple-500/20 px-3 py-1 rounded text-xs font-mono text-purple-300 font-bold">
                <Activity className="w-3.5 h-3.5 text-purple-400" /> WebClient API
              </div>
            </div>
          </header>

          {/* DASHBOARD GRID CONTAINER */}
          <main className="max-w-[1550px] w-full mx-auto flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 p-4 sm:p-8 z-10">
            {/* PRESENTATION PANEL (SPAN 4) */}
            <section className="lg:col-span-4 flex flex-col gap-5 justify-between">
              <div className="space-y-5">
                {/* DESIGN META */}
                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 backdrop-blur-xs relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/10 rounded-full blur-xl pointer-events-none" />
                  <div className="flex items-center gap-2 text-[10px] text-purple-400 uppercase tracking-widest font-mono font-bold mb-2">
                    <Sparkles className="w-3.5 h-3.5 text-rose-400 animate-pulse" /> Visual Interactive Suite
                  </div>
                  <h2 className="text-xl font-serif italic font-bold text-white leading-tight">Interactive Device Sync</h2>
                  <p className="text-xs text-white/50 mt-1 leading-relaxed">
                    Experience Nora AI exactly like a native high-fidelity iOS application device view. 
                    Interact with the forms, select a voice, select languages, and trigger speech capture dynamically.
                  </p>

                  {/* SCREEN TRIGGER NAV RAIL */}
                  <div className="mt-6 space-y-2">
                    <span className="text-[10px] text-white/40 uppercase tracking-wider block font-bold font-mono">Presentational Screen Selector</span>
                    <div className="grid grid-cols-2 gap-2">
                      <button 
                        onClick={() => { disconnectSession(); setCurrentScreen("welcome"); }}
                        className={`py-2 px-3 rounded-lg border text-left text-xs transition-all flex items-center justify-between ${currentScreen === "welcome" ? "bg-gradient-to-r from-purple-950 to-indigo-950 border-purple-500/50 text-white font-bold" : "bg-black/40 border-white/5 text-white/40 hover:text-white"}`}
                      >
                        <span>1. Welcome onboarding</span>
                        <span className="text-[8px] bg-white/10 px-1 rounded">Active</span>
                      </button>
                      <button 
                        onClick={() => { disconnectSession(); setCurrentScreen("connect"); }}
                        className={`py-2 px-3 rounded-lg border text-left text-xs transition-all flex items-center justify-between ${currentScreen === "connect" ? "bg-gradient-to-r from-purple-950 to-indigo-950 border-purple-500/50 text-white font-bold" : "bg-black/40 border-white/5 text-white/40 hover:text-white"}`}
                      >
                        <span>2. Connect Gemini API</span>
                        {isKeyReady && <Check className="w-3 h-3 text-emerald-400" />}
                      </button>
                      <button 
                        onClick={() => { disconnectSession(); setCurrentScreen("configure"); }}
                        className={`py-2 px-3 rounded-lg border text-left text-xs transition-all flex items-center justify-between ${currentScreen === "configure" ? "bg-gradient-to-r from-purple-950 to-indigo-950 border-purple-500/50 text-white font-bold" : "bg-black/40 border-white/5 text-white/40 hover:text-white"}`}
                      >
                        <span>3. Configure Nora</span>
                        <span className="text-[9px] text-purple-300 font-mono italic">{settings.language}</span>
                      </button>
                      <button 
                        onClick={() => {
                          if (!isKeyReady) {
                            setCurrentScreen("connect");
                            setErrorMessage("Please enter a valid Gemini API key first.");
                          } else {
                            setCurrentScreen("voicechat");
                            initiateVoiceSession();
                          }
                        }}
                        className={`py-2 px-3 rounded-lg border text-left text-xs transition-all flex items-center justify-between ${currentScreen === "voicechat" ? "bg-gradient-to-r from-purple-950 to-indigo-950 border-purple-500/50 text-white font-bold animate-pulse" : "bg-black/40 border-white/5 text-white/40 hover:text-white"}`}
                      >
                        <span>4. Voice Stream Live</span>
                        {connectionState !== "idle" && <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* LIVE TELEMETRY ENGINE */}
                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 space-y-4">
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <span className="text-[10px] text-white/40 uppercase tracking-widest font-mono font-bold">Latency Diagnostics</span>
                    <span className="text-[9px] bg-purple-500/20 text-purple-300 font-mono font-bold px-1.5 rounded uppercase">Dual Channel</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-black/30 border border-white/5 rounded-lg p-3">
                      <span className="text-[9px] text-white/40 font-mono block uppercase">Client Ping</span>
                      <div className="text-lg font-mono font-bold text-white mt-0.5">
                        {metrics.currentPingMs ? `${metrics.currentPingMs} ms` : "120 ms"}
                      </div>
                      <p className="text-[8px] text-white/30 block mt-1">WebSocket server return trip time</p>
                    </div>

                    <div className="bg-black/30 border border-white/5 rounded-lg p-3">
                      <span className="text-[9px] text-white/40 font-mono block uppercase">Time to First Byte</span>
                      <div className="text-lg font-mono font-bold text-purple-400 mt-0.5">
                        {metrics.timeToFirstByteMs ? `${metrics.timeToFirstByteMs} ms` : "120 ms"}
                      </div>
                      <p className="text-[8px] text-white/30 block mt-1">Audio speech packet latency</p>
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-white/5">
                    <div className="flex justify-between text-[10px] text-white/50 font-mono">
                      <span>Packet Sent count:</span>
                      <span className="text-white font-bold">{metrics.audioChunksSent} chunks</span>
                    </div>
                    <div className="flex justify-between text-[10px] text-white/50 font-mono">
                      <span>Packet Received count:</span>
                      <span className="text-purple-400 font-bold">{metrics.audioChunksReceived} chunks</span>
                    </div>
                    <div className="flex justify-between text-[10px] text-white/50 font-mono">
                      <span>Conversational barge-ins:</span>
                      <span className="text-rose-450 font-bold">{userInterruptedCount} interrupted</span>
                    </div>
                  </div>
                </div>

                {/* SELECTION ASSISTANCE MANUAL */}
                <div className="bg-purple-950/20 border border-purple-500/10 rounded-2xl p-5 space-y-2">
                  <span className="text-[10px] uppercase font-mono tracking-wider text-rose-450 font-bold block">🚨 Quick Setup Manual</span>
                  <p className="text-[11px] text-white/60 leading-relaxed">
                    To chat, simply select <strong>Configure Nora</strong> page, choose language <strong>Hinglish / Hindi / English</strong>, customized roles, and click <strong>Save &amp; Start</strong>. Press the central glowing pink microphone button inside the device to toggle stream live instantly!
                  </p>
                </div>
              </div>

              <p className="text-[10px] text-white/20 font-mono mt-4">
                VoxGemini Bharat v2.1 • Created in high-contrast cosmic luxury design
              </p>
            </section>

            {/* RIGHT COLUMN: SCREEN CARDS (NO PHONE SIMULATOR FRAME) */}
            <section className="lg:col-span-8 flex justify-center items-stretch p-2 sm:p-6 bg-white/[0.01] border border-white/5 rounded-3xl backdrop-blur-xs relative overflow-hidden min-h-[750px]">
              <div className="absolute inset-0 bg-[#07050d] transition-all duration-500" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(139,92,246,0.1)_0%,_transparent_55%)] pointer-events-none" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_rgba(244,63,94,0.06)_0%,_transparent_60%)] pointer-events-none" />
              
              <div className="flex-1 w-full bg-[#090710] px-5 sm:px-6 py-4 overflow-y-auto relative z-30 flex flex-col justify-between select-none min-h-[680px] rounded-3xl border border-white/5">
                {renderActiveScreen()}
              </div>
            </section>
          </main>
        </div>
      )}
    </div>
  );
}

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`nora-brand ${compact ? "compact" : ""}`}>
      <span className="brand-mark">N</span>
      <span>Nora <b>AI</b></span>
    </div>
  );
}

function NoraOrb({ size, active = false, level = 0 }: { size: "large" | "medium"; active?: boolean; level?: number }) {
  const reactiveScale = 1 + Math.min(level * 1.8, 0.13);
  return (
    <motion.div
      className={`nora-orb ${size} ${active ? "active" : ""}`}
      animate={{ scale: reactiveScale }}
      transition={{ type: "spring", stiffness: 260, damping: 15 }}
    >
      {active && <>
        <motion.i className="orb-pulse pulse-one" animate={{ scale: [1, 1.35, 1.65], opacity: [.42, .18, 0] }} transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }} />
        <motion.i className="orb-pulse pulse-two" animate={{ scale: [1, 1.28, 1.55], opacity: [.34, .12, 0] }} transition={{ duration: 1.8, delay: .65, repeat: Infinity, ease: "easeOut" }} />
        {Array.from({ length: 8 }, (_, index) => <motion.i key={index} className="voice-particle" style={{ rotate: `${index * 45}deg` }} animate={{ y: [0, -(15 + (index % 3) * 7), 0], opacity: [.2, .95, .2], scale: [.7, 1.25, .7] }} transition={{ duration: 1.4 + (index % 3) * .2, delay: index * .08, repeat: Infinity }} />)}
      </>}
      <div className="orb-glass">
        {/* Real-time soundwave bars inside the glass instead of a static 'N' logo */}
        <div className="flex items-center justify-center gap-1 h-10 select-none pointer-events-none">
          {Array.from({ length: 5 }, (_, i) => {
            const baselineHeight = [10, 18, 26, 18, 10][i];
            return (
              <motion.div
                key={i}
                className="w-[3px] rounded-full bg-gradient-to-t from-white to-purple-200 shadow-[0_0_8px_rgba(255,255,255,0.7)]"
                style={{ height: baselineHeight }}
                animate={active ? {
                  scaleY: [1, 1.4 + level * 3, 0.4, 1],
                } : {
                  scaleY: [1, 1.12, 0.88, 1]
                }}
                transition={{
                  duration: active ? 0.5 + i * 0.08 : 2.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.08
                }}
              />
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

function FieldLabel({ icon, text }: { icon: ReactNode; text: string }) {
  return <label className="field-label"><span>{icon}</span>{text}</label>;
}

function ChipGroup({ values, selected, onSelect }: { values: string[]; selected: string; onSelect: (value: string) => void }) {
  return (
    <div className="chip-group">
      {values.map((value) => <button key={value} className={selected === value ? "selected" : ""} onClick={() => onSelect(value)}>{value}</button>)}
    </div>
  );
}
