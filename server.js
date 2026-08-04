import express from "express";
import http from "http";
import next from "next";
import { WebSocketServer, WebSocket } from "ws";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const port = parseInt(process.env.PORT || "3008", 10);
const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = express();
  const httpServer = http.createServer(server);

  server.use(express.json());

  // Health and verification API endpoints
  server.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      name: "HeyIra. AI Agent Platform",
      time: new Date().toISOString(),
    });
  });

  server.get("/api/config", (req, res) => {
    res.json({
      hasEnvKey: !!process.env.GEMINI_API_KEY,
      appName: "HeyIra.",
    });
  });

  // Create WebSocket server for real-time Voice agent session
  const wss = new WebSocketServer({ noServer: true });

  const nextUpgradeHandler = typeof app.getUpgradeHandler === "function" ? app.getUpgradeHandler() : null;

  httpServer.on("upgrade", (request, socket, head) => {
    const { pathname } = new URL(
      request.url || "",
      `http://${request.headers.host || "localhost"}`
    );

    if (pathname === "/api/live") {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit("connection", ws, request);
      });
    } else if (nextUpgradeHandler) {
      nextUpgradeHandler(request, socket, head);
    }
  });

  wss.on("connection", async (clientWs, req) => {
    console.log("[HeyIra] Client connected to real-time voice pipeline.");

    const requestUrl = new URL(
      req.url || "",
      `http://${req.headers.host || "localhost"}`
    );
    const clientProvidedKey = requestUrl.searchParams.get("apiKey") || "";
    const voice = requestUrl.searchParams.get("voice") || "Zephyr";
    const systemInstruction =
      requestUrl.searchParams.get("systemInstruction") ||
      "You are HeyIra, a friendly, human-like AI voice employee for businesses.";
    const model =
      requestUrl.searchParams.get("model") || "gemini-3.1-flash-live-preview";

    const apiKey = clientProvidedKey.trim() || process.env.GEMINI_API_KEY || "";

    if (!apiKey) {
      clientWs.send(
        JSON.stringify({
          type: "error",
          error:
            "No Gemini API Key configured. Please set GEMINI_API_KEY in .env or settings.",
        })
      );
      clientWs.close();
      return;
    }

    clientWs.send(
      JSON.stringify({
        type: "status",
        text: "initializing",
        details: "Connecting to HeyIra Voice Engine...",
      })
    );

    try {
      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "heyira-voice-agent",
          },
        },
      });

      console.log(`[HeyIra] Starting Live session - Model: ${model}, Voice: ${voice}`);

      const session = await ai.live.connect({
        model: model,
        config: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voice },
            },
          },
          systemInstruction: {
            parts: [{ text: systemInstruction }],
          },
          outputAudioTranscription: {},
          inputAudioTranscription: {},
        },
        callbacks: {
          onmessage: (message) => {
            if (clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(
                JSON.stringify({
                  type: "gemini",
                  payload: message,
                })
              );
            }
          },
          onclose: () => {
            console.log("[HeyIra] Live session closed.");
            if (clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(
                JSON.stringify({
                  type: "status",
                  text: "disconnected",
                  details: "HeyIra session ended.",
                })
              );
              clientWs.close();
            }
          },
          onerror: (err) => {
            console.error("[HeyIra] Session error:", err);
            if (clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(
                JSON.stringify({
                  type: "error",
                  error: err.message || "HeyIra Live communication error",
                })
              );
            }
          },
        },
      });

      clientWs.send(
        JSON.stringify({
          type: "status",
          text: "connected",
          details: "HeyIra is ready! You can start speaking.",
        })
      );

      clientWs.on("message", (rawMessage) => {
        try {
          const parsed = JSON.parse(rawMessage.toString());

          if (parsed.type === "audio") {
            session.sendRealtimeInput({
              audio: {
                data: parsed.data,
                mimeType: "audio/pcm;rate=16000",
              },
            });
          } else if (parsed.type === "ping") {
            clientWs.send(
              JSON.stringify({
                type: "pong",
                pingId: parsed.pingId,
                serverTime: Date.now(),
              })
            );
          }
        } catch (err) {
          console.error("[HeyIra] Socket parse error:", err);
        }
      });

      clientWs.on("close", () => {
        console.log("[HeyIra] Client disconnected. Cleaning up session.");
        try {
          session.close();
        } catch (e) {
          // ignore
        }
      });
    } catch (err) {
      console.error("[HeyIra] Failed to establish Live connection:", err);
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(
          JSON.stringify({
            type: "error",
            error: `Connection error: ${err.message || String(err)}`,
          })
        );
        clientWs.close();
      }
    }
  });

  // Next.js request routing
  server.all("*", (req, res) => {
    return handle(req, res);
  });

  httpServer.listen(port, (err) => {
    if (err) throw err;
    console.log(`\n==================================================`);
    console.log(`  🚀 HeyIra. AI Agent Platform Server Running`);
    console.log(`  🌐 URL: http://localhost:${port}`);
    console.log(`  ⚡ Environment: ${dev ? "Development" : "Production"}`);
    console.log(`==================================================\n`);
  });
});
