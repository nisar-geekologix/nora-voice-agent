"use server";

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function getAgentConfig() {
  try {
    let agent = await prisma.agent.findFirst({
      include: {
        phoneNumbers: true
      }
    });
    
    // Seed default if empty
    if (!agent) {
      let user = await prisma.noraUser.findFirst();
      if (!user) {
        user = await prisma.noraUser.create({
          data: { orgName: "Default Organization" }
        });
      }
      
      agent = await prisma.agent.create({
        data: {
          userId: user.id,
          name: "Nora",
          systemInstruction: "You are a warm, helpful conversational AI voice assistant named Nora. Speak in friendly Hinglish.",
          voice: "Zephyr",
          model: "gemini-3.1-flash-live-preview",
          temperature: 0.7
        },
        include: {
          phoneNumbers: true
        }
      });
      
      const twilioNumber = process.env.TWILIO_NUMBER || "";
      if (twilioNumber) {
        await prisma.phoneNumber.create({
          data: {
            phoneNumber: twilioNumber,
            agentId: agent.id
          }
        });
      }
    }
    
    return { success: true, agent };
  } catch (err: any) {
    console.error("getAgentConfig error:", err);
    return { success: false, error: err.message || String(err) };
  }
}

export async function updateAgentConfig(agentId: string, data: {
  name: string;
  systemInstruction: string;
  voice: string;
  model: string;
  temperature?: number;
}) {
  try {
    const updatedAgent = await prisma.agent.update({
      where: { id: agentId },
      data: {
        name: data.name,
        systemInstruction: data.systemInstruction,
        voice: data.voice,
        model: data.model,
        temperature: data.temperature ?? 0.7
      }
    });
    return { success: true, agent: updatedAgent };
  } catch (err: any) {
    console.error("updateAgentConfig error:", err);
    return { success: false, error: err.message || String(err) };
  }
}

export async function getCallLogs() {
  try {
    const calls = await prisma.call.findMany({
      orderBy: { createdAt: "desc" },
      take: 20
    });
    return { success: true, calls };
  } catch (err: any) {
    console.error("getCallLogs error:", err);
    return { success: false, error: err.message || String(err) };
  }
}
