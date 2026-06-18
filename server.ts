import express from "express";
import http from "http";
import { WebSocketServer, WebSocket } from "ws";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;
  const server = http.createServer(app);

  // Configure JSON parsing for HTTP endpoints
  app.use(express.json());

  // Health and verification routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  // Simple route to check if an API key is available
  app.get("/api/config", (req, res) => {
    res.json({
      hasEnvKey: !!process.env.GEMINI_API_KEY,
    });
  });

  // Create WebSocket server for real-time Voice agent session
  const wss = new WebSocketServer({ noServer: true });

  server.on("upgrade", (request, socket, head) => {
    const { pathname } = new URL(request.url || "", `http://${request.headers.host || "localhost"}`);
    if (pathname === "/api/live") {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit("connection", ws, request);
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
