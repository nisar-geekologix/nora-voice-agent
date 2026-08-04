"use client";

import { useState, useEffect, useRef } from "react";
import { Mic, MicOff, Volume2, Sparkles, AlertCircle, RefreshCw, Radio, Terminal, Settings, Zap } from "lucide-react";

export default function LiveVoiceAgent({ settings, onOpenSettings }) {
  const [connectionState, setConnectionState] = useState("idle"); // idle | connecting | connected | error
  const [errorMessage, setErrorMessage] = useState(null);
  const [transcripts, setTranscripts] = useState([]);
  const [micActive, setMicActive] = useState(false);
  const [pingMs, setPingMs] = useState(null);

  const wsRef = useRef(null);
  const pingIntervalRef = useRef(null);
  const audioContextRef = useRef(null);
  const scriptProcessorRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const outputAudioCtxRef = useRef(null);
  const nextStartTimeRef = useRef(0);

  // Initialize playback audio context
  const getOutputAudioContext = () => {
    if (!outputAudioCtxRef.current) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      outputAudioCtxRef.current = new AudioCtx({ sampleRate: 24000 });
    }
    if (outputAudioCtxRef.current.state === "suspended") {
      outputAudioCtxRef.current.resume();
    }
    return outputAudioCtxRef.current;
  };

  // Play incoming PCM base64 audio chunks from HeyIra
  const playPcmAudioChunk = (base64Data) => {
    try {
      const ctx = getOutputAudioContext();
      const binaryStr = atob(base64Data);
      const len = binaryStr.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }

      const pcm16 = new Int16Array(bytes.buffer);
      const float32 = new Float32Array(pcm16.length);
      for (let i = 0; i < pcm16.length; i++) {
        float32[i] = pcm16[i] / 32768.0;
      }

      const audioBuffer = ctx.createBuffer(1, float32.length, 24000);
      audioBuffer.getChannelData(0).set(float32);

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);

      const currentTime = ctx.currentTime;
      const startTime = Math.max(currentTime, nextStartTimeRef.current);
      source.start(startTime);
      nextStartTimeRef.current = startTime + audioBuffer.duration;
    } catch (err) {
      console.error("Audio playback error:", err);
    }
  };

  // Start Mic capture
  const startMicCapture = async (ws) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const inputCtx = new AudioCtx({ sampleRate: 16000 });
      audioContextRef.current = inputCtx;

      const source = inputCtx.createMediaStreamSource(stream);
      const processor = inputCtx.createScriptProcessor(4096, 1, 1);
      scriptProcessorRef.current = processor;

      processor.onaudioprocess = (e) => {
        if (ws.readyState !== WebSocket.OPEN) return;
        const inputData = e.inputBuffer.getChannelData(0);
        const pcm16 = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          const s = Math.max(-1, Math.min(1, inputData[i]));
          pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
        }

        let binary = "";
        const bytes = new Uint8Array(pcm16.buffer);
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        const base64 = btoa(binary);

        ws.send(JSON.stringify({ type: "audio", data: base64 }));
      };

      source.connect(processor);
      processor.connect(inputCtx.destination);
      setMicActive(true);
    } catch (err) {
      console.error("Microphone access error:", err);
      setErrorMessage("Microphone access denied or unverified.");
    }
  };

  // Connect to HeyIra WebSocket
  const startVoiceSession = () => {
    if (connectionState === "connected" || connectionState === "connecting") {
      disconnectSession();
      return;
    }

    setConnectionState("connecting");
    setErrorMessage(null);

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.host;

    let customInstruction = `
      You are ${settings.name || "HeyIra"}, a friendly, human-like AI voice assistant for businesses built by HeyIra.
      Role: ${settings.role || "Sales & Support Executive"}.
      Language mode: ${settings.language || "Hinglish"}.
      Tone: ${settings.tone || "Friendly"}.
      Keep responses brief, spoken naturally, under 2-3 sentences.
    `.trim();

    const queryParams = new URLSearchParams({
      apiKey: settings.apiKey || "",
      voice: settings.voice || "Zephyr",
      model: settings.model || "gemini-3.1-flash-live-preview",
      systemInstruction: customInstruction,
    });

    const routeUrl = `${protocol}//${host}/api/live?${queryParams.toString()}`;

    try {
      const ws = new WebSocket(routeUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnectionState("connected");
        startMicCapture(ws);

        // Ping tracker
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            const sendTime = Date.now();
            ws.send(JSON.stringify({ type: "ping", pingId: sendTime }));
          }
        }, 3000);
      };

      ws.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);

          if (parsed.type === "gemini") {
            const parts = parsed.payload?.serverContent?.modelTurn?.parts || [];
            for (const part of parts) {
              if (part.inlineData?.data) {
                playPcmAudioChunk(part.inlineData.data);
              }
              if (part.text) {
                setTranscripts((prev) => [
                  ...prev.slice(-15),
                  { sender: "HeyIra", text: part.text, time: new Date().toLocaleTimeString() },
                ]);
              }
            }

            const inputTranscript = parsed.payload?.serverContent?.turnComplete;
            // Check transcript annotations if available
          } else if (parsed.type === "pong") {
            setPingMs(Date.now() - parsed.pingId);
          } else if (parsed.type === "error") {
            setErrorMessage(parsed.error);
            setConnectionState("error");
          }
        } catch (e) {
          console.error("Socket message error:", e);
        }
      };

      ws.onclose = () => {
        setConnectionState("idle");
        stopMicCapture();
      };

      ws.onerror = (err) => {
        setErrorMessage("WebSocket connection failed.");
        setConnectionState("error");
      };
    } catch (err) {
      setErrorMessage(err.message);
      setConnectionState("error");
    }
  };

  const stopMicCapture = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.disconnect();
      scriptProcessorRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setMicActive(false);
  };

  const disconnectSession = () => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    stopMicCapture();
    setConnectionState("idle");
  };

  useEffect(() => {
    return () => {
      disconnectSession();
    };
  }, []);

  return (
    <section className="py-12 bg-[#0D0D0F]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Playground Container Card */}
        <div className="glass-panel-glow rounded-3xl p-6 sm:p-10 border border-[#7B5CFF]/30 space-y-8 relative overflow-hidden">
          
          {/* Top Title Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#7B5CFF] flex items-center justify-center text-white font-bold shadow-lg shadow-[#7B5CFF]/30">
                <Radio className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  HeyIra Live Voice Assistant
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-medium">
                    {connectionState === "connected" ? "Connected Live" : connectionState === "connecting" ? "Connecting..." : "Ready"}
                  </span>
                </h3>
                <p className="text-xs text-[#A1A1AA]">
                  Model: {settings.model || "gemini-3.1-flash-live-preview"} | Voice: {settings.voice || "Zephyr"} | Language: {settings.language || "Hinglish"}
                </p>
              </div>
            </div>

            <button
              onClick={onOpenSettings}
              className="btn-secondary px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2"
            >
              <Settings className="w-4 h-4 text-[#7B5CFF]" />
              Agent Settings
            </button>
          </div>

          {/* Center Visualizer & Mic Button */}
          <div className="flex flex-col items-center justify-center py-8 space-y-6 text-center">
            
            {/* Waveform Visualizer Orb */}
            <div className="relative flex items-center justify-center">
              {/* Outer pulsing ring when active */}
              {connectionState === "connected" && (
                <div className="absolute w-44 h-44 rounded-full bg-[#7B5CFF]/20 animate-ping pointer-events-none" />
              )}

              {/* Center Mic Button */}
              <button
                onClick={startVoiceSession}
                className={`w-32 h-32 rounded-full flex flex-col items-center justify-center transition-all duration-300 shadow-2xl relative z-10 ${
                  connectionState === "connected"
                    ? "bg-gradient-to-br from-[#7B5CFF] to-[#6340FF] shadow-[#7B5CFF]/60 scale-105"
                    : connectionState === "connecting"
                    ? "bg-amber-500/80 animate-pulse shadow-amber-500/30"
                    : "bg-[#14131A] border-2 border-[#7B5CFF] hover:bg-[#7B5CFF]/20 hover:scale-105 shadow-[#7B5CFF]/30"
                }`}
              >
                {connectionState === "connected" ? (
                  <>
                    <Mic className="w-10 h-10 text-white animate-bounce" />
                    <span className="text-[11px] font-bold text-white mt-1 uppercase">Listening</span>
                  </>
                ) : connectionState === "connecting" ? (
                  <>
                    <RefreshCw className="w-10 h-10 text-white animate-spin" />
                    <span className="text-[11px] font-bold text-white mt-1 uppercase">Connecting</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-10 h-10 text-[#7B5CFF]" />
                    <span className="text-[11px] font-bold text-white mt-1 uppercase">Tap to Speak</span>
                  </>
                )}
              </button>
            </div>

            {/* Instruction helper text */}
            <p className="text-sm text-[#A1A1AA]">
              {connectionState === "connected"
                ? "Speak into your microphone in Hinglish, Hindi, or English. HeyIra will reply naturally."
                : "Click the orb to start live voice interaction with HeyIra."}
            </p>

            {/* Latency metric badge */}
            {pingMs !== null && (
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-[#A78BFA]">
                <Zap className="w-3.5 h-3.5 text-[#7B5CFF]" />
                <span>Server RTT Latency: <strong>{pingMs} ms</strong></span>
              </div>
            )}

            {/* Error banner */}
            {errorMessage && (
              <div className="w-full max-w-md p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-3">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}
          </div>

          {/* Transcripts History Feed */}
          <div className="bg-[#0D0D0F]/90 rounded-2xl p-5 border border-white/5 space-y-4">
            <div className="flex items-center justify-between text-xs font-semibold text-[#A1A1AA]">
              <span className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-[#7B5CFF]" /> Real-time Speech Log
              </span>
              <span>{transcripts.length} exchanges</span>
            </div>

            <div className="space-y-3 max-h-56 overflow-y-auto pr-2">
              {transcripts.length === 0 ? (
                <p className="text-xs text-white/30 italic text-center py-4">
                  No speech transcripts yet. Start session & talk to see live transcripts.
                </p>
              ) : (
                transcripts.map((item, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl text-xs space-y-1 ${
                      item.sender === "HeyIra"
                        ? "bg-[#7B5CFF]/15 border border-[#7B5CFF]/30 text-white"
                        : "bg-white/5 text-white/90"
                    }`}
                  >
                    <div className="flex items-center justify-between font-semibold text-[11px] text-[#A78BFA]">
                      <span>{item.sender}</span>
                      <span className="text-white/40">{item.time}</span>
                    </div>
                    <p className="leading-relaxed">{item.text}</p>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
