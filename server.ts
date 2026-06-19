import express from "express";
import http from "http";
import { WebSocketServer, WebSocket } from "ws";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import {
  base64ToUint8Array,
  mulawToPcm,
  resample8To16,
  base64ToInt16Array,
  resample24To8,
  pcmToMulaw,
  uint8ArrayToBase64,
  int16ArrayToBase64
} from "./src/audioUtils.ts";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  const server = http.createServer(app);

  // Configure JSON parsing for HTTP endpoints
  app.use(express.json());

  // Health and verification routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  // Dynamic TwiML response endpoint for Twilio calls
  app.all("/api/twilio-twiml", (req, res) => {
    const protocol = req.secure || req.headers["x-forwarded-proto"] === "https" ? "wss" : "ws";
    res.type("text/xml");
    res.send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="Polly.Aditi">Connecting you to Nora AI. Please wait...</Say>
    <Connect>
        <Stream url="${protocol}://${req.headers.host}/api/live-twilio" />
    </Connect>
</Response>`);
  });

  // Simple route to check if an API key is available
  app.get("/api/config", (req, res) => {
    res.json({
      hasEnvKey: !!process.env.GEMINI_API_KEY,
    });
  });

  // Create WebSocket server for real-time Voice agent session
  const wss = new WebSocketServer({ noServer: true });

  // Create WebSocket server for Twilio Media Stream session
  const wssTwilio = new WebSocketServer({ noServer: true });

  server.on("upgrade", (request, socket, head) => {
    const { pathname } = new URL(request.url || "", `http://${request.headers.host || "localhost"}`);
    if (pathname === "/api/live") {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit("connection", ws, request);
      });
    } else if (pathname === "/api/live-twilio") {
      wssTwilio.handleUpgrade(request, socket, head, (ws) => {
        wssTwilio.emit("connection", ws, request);
      });
    } else {
      socket.write("HTTP/1.1 404 Not Found\r\n\r\n");
      socket.destroy();
    }
  });

  wss.on("connection", async (clientWs: WebSocket, req: http.IncomingMessage) => {
    console.log("Client connected to Realtime voice pipeline.");

    // Parse URL parameters
    const requestUrl = new URL(req.url || "", `http://${req.headers.host || "localhost"}`);
    const clientProvidedKey = requestUrl.searchParams.get("apiKey") || "";
    const voice = requestUrl.searchParams.get("voice") || "Zephyr";
    const systemInstruction = requestUrl.searchParams.get("systemInstruction") || "You are a helpful voice assistant.";
    const model = requestUrl.searchParams.get("model") || "gemini-3.1-flash-live-preview";

    // Select the key to use: prioritizes client text field input, falls back to server env
    const apiKey = clientProvidedKey.trim() || process.env.GEMINI_API_KEY || "";

    if (!apiKey) {
      clientWs.send(
        JSON.stringify({
          type: "error",
          error: "No Gemini API Key found. Please configure it in Settings or set GEMINI_API_KEY in server env.",
        })
      );
      clientWs.close();
      return;
    }

    clientWs.send(JSON.stringify({ type: "status", text: "initializing", details: "Connecting to Gemini Live API..." }));

    try {
      // Lazy initialize the SDK client per-connection to support customized API keys cleanly
      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });

      console.log(`Connecting to live session with model ${model}, voice ${voice}`);

      // connect to Gemini Multimodal Live API using @google/genai SDK
      // Using type 'any' to cleanly adapt to the typing of live connect across SDK revisions safely
      const session = await (ai.live as any).connect({
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
          // Enable input & output transcripts so client can render real-time text history
          outputAudioTranscription: {},
          inputAudioTranscription: {},
        },
        callbacks: {
          onmessage: (message: any) => {
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
            console.log("Gemini Live session closed.");
            if (clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify({ type: "status", text: "disconnected", details: "Gemini server closed session." }));
              clientWs.close();
            }
          },
          onerror: (err: any) => {
            console.error("Gemini Live session suffered error:", err);
            if (clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(
                JSON.stringify({
                  type: "error",
                  error: err.message || "Gemini Live API communication error",
                })
              );
            }
          },
        },
      });

      clientWs.send(JSON.stringify({ type: "status", text: "connected", details: "Voice agent is ready! You can start speaking." }));

      // Monitor messages from client browser
      clientWs.on("message", (rawMessage) => {
        try {
          const parsed = JSON.parse(rawMessage.toString());

          if (parsed.type === "audio") {
            // Forward base64 PCM audio to Gemini Live session
            session.sendRealtimeInput({
              audio: {
                data: parsed.data,
                mimeType: "audio/pcm;rate=16000",
              },
            });
          } else if (parsed.type === "ping") {
            // Mirror ping back to client with latency calculations
            clientWs.send(
              JSON.stringify({
                type: "pong",
                pingId: parsed.pingId,
                serverTime: Date.now(),
              })
            );
          }
        } catch (err: any) {
          console.error("Error processing client socket message:", err);
        }
      });

      clientWs.on("close", () => {
        console.log("Client connection closed. Cleaning up Gemini Live session.");
        try {
          session.close();
        } catch (e) {
          // ignore double closes
        }
      });
    } catch (err: any) {
      console.error("Failed to establish Gemini Live connection:", err);
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(
          JSON.stringify({
            type: "error",
            error: `Failed to connect with Gemini: ${err.message || String(err)}`,
          })
        );
        clientWs.close();
      }
    }
  });

  // =========================================================================
  // TWILIO MEDIA STREAM WEBSOCKET CONNECTION
  // =========================================================================
  wssTwilio.on("connection", async (clientWs: WebSocket, req: http.IncomingMessage) => {
    console.log("Twilio Media Stream client connected.");

    const requestUrl = new URL(req.url || "", `http://${req.headers.host || "localhost"}`);
    const clientProvidedKey = requestUrl.searchParams.get("apiKey") || "";
    const voice = requestUrl.searchParams.get("voice") || "Zephyr";
    const systemInstruction = requestUrl.searchParams.get("systemInstruction") || "You are a helpful voice assistant.";
    const model = requestUrl.searchParams.get("model") || "gemini-3.1-flash-live-preview";

    const apiKey = clientProvidedKey.trim() || process.env.GEMINI_API_KEY || "";

    if (!apiKey) {
      console.error("Twilio connection rejected: Missing Gemini API Key.");
      clientWs.close();
      return;
    }

    let streamSid = "";
    let session: any = null;

    try {
      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });

      console.log(`Connecting Twilio to Gemini Live with model ${model}, voice ${voice}`);

      session = await (ai.live as any).connect({
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
        },
        callbacks: {
          onmessage: (message: any) => {
            try {
              if (message.serverContent?.interrupted) {
                console.log("User barge-in detected. Clearing Twilio buffer.");
                if (streamSid && clientWs.readyState === WebSocket.OPEN) {
                  clientWs.send(
                    JSON.stringify({
                      event: "clear",
                      streamSid: streamSid,
                    })
                  );
                }
              }

              const modelParts = message.serverContent?.modelTurn?.parts;
              if (modelParts) {
                for (const part of modelParts) {
                  if (part.inlineData?.data) {
                    // Transcode PCM 24kHz -> G.711 mu-law 8kHz
                    const pcm24 = base64ToInt16Array(part.inlineData.data);
                    const pcm8 = resample24To8(pcm24);
                    const mulaw = pcmToMulaw(pcm8);
                    const base64Mulaw = uint8ArrayToBase64(mulaw);

                    if (streamSid && clientWs.readyState === WebSocket.OPEN) {
                      clientWs.send(
                        JSON.stringify({
                          event: "media",
                          streamSid: streamSid,
                          media: {
                            payload: base64Mulaw,
                          },
                        })
                      );
                    }
                  }
                }
              }
            } catch (err) {
              console.error("Error processing Gemini response to Twilio:", err);
            }
          },
          onclose: () => {
            console.log("Gemini Live session closed for Twilio.");
            if (clientWs.readyState === WebSocket.OPEN) {
              clientWs.close();
            }
          },
          onerror: (err: any) => {
            console.error("Gemini Live session error for Twilio:", err);
          },
        },
      });

      // Listen to messages from Twilio
      clientWs.on("message", (rawMessage) => {
        try {
          const parsed = JSON.parse(rawMessage.toString());

          if (parsed.event === "start") {
            streamSid = parsed.start.streamSid;
            console.log(`Twilio stream started with streamSid: ${streamSid}`);
          } else if (parsed.event === "media") {
            if (!session) return;

            // Only process inbound (user) voice audio track
            if (parsed.media.track === "inbound") {
              const mulawBytes = base64ToUint8Array(parsed.media.payload);
              const pcm8 = mulawToPcm(mulawBytes);
              const pcm16 = resample8To16(pcm8);
              const base64Pcm16 = int16ArrayToBase64(pcm16);

              session.sendRealtimeInput({
                audio: {
                  data: base64Pcm16,
                  mimeType: "audio/pcm;rate=16000",
                },
              });
            }
          } else if (parsed.event === "stop") {
            console.log("Twilio stream stopped.");
            if (session) {
              session.close();
            }
          }
        } catch (err) {
          console.error("Error processing Twilio WebSocket message:", err);
        }
      });

      clientWs.on("close", () => {
        console.log("Twilio connection closed. Cleaning up Gemini session.");
        if (session) {
          try {
            session.close();
          } catch (e) {}
        }
      });

    } catch (err: any) {
      console.error("Failed to connect Gemini Live session for Twilio:", err);
      clientWs.close();
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite dev middleware attached.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Serving static production files from dist directory.");
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Application dev server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Fatal server start failure:", err);
});
