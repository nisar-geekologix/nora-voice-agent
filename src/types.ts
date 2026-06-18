export type AgentState = "idle" | "connecting" | "listening" | "speaking" | "error";

export interface AudioVoice {
  id: string;
  name: string;
  description: string;
  gender: "Male" | "Female" | "Neutral";
}

export interface TranscriptItem {
  id: string;
  sender: "user" | "agent" | "system";
  text: string;
  timestamp: number;
  audioDurationSec?: number;
}

export interface LatencyMetrics {
  wsPingMs: number[];
  currentPingMs: number | null;
  timeToFirstByteMs: number | null;
  userTurnStart: number | null;
  serverTurnStart: number | null;
  audioChunksSent: number;
  audioChunksReceived: number;
}

export interface AgentSettings {
  apiKey: string;
  voice: string;
  model: string;
  role: string;
  personality: string;
  tone: string;
  language: string;
}
