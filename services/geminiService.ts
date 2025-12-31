
import { GoogleGenAI, GenerateContentResponse, Modality } from "@google/genai";
import { SYSTEM_INSTRUCTION, APA_TOOLS } from "../constants";

// Strictly using process.env.API_KEY as per coding guidelines
const API_KEY = process.env.API_KEY;

export class APAEngine {
  public ai: GoogleGenAI;

  constructor() {
    if (!API_KEY) {
      console.error("CRITICAL: API_KEY is missing from environment. Ensure .env has API_KEY=...");
      throw new Error("API Key not found.");
    }
    this.ai = new GoogleGenAI({ apiKey: API_KEY });
  }

  // Live API Connection for Real-time Voice (Gemini 2.5 Flash Native Audio)
  connectLive(config: any) {
    return this.ai.live.connect({
      model: 'gemini-2.5-flash-native-audio-preview-09-2025',
      ...config
    });
  }

  // Thinking Mode with gemini-3-pro-preview
  async processCommand(command: string, history: any[] = []) {
    try {
      const validHistory = history
        .filter(h => h.parts && h.parts.length > 0 && h.parts[0].text)
        .map(h => ({
          role: h.role === 'assistant' ? 'model' : 'user',
          parts: h.parts
        }));

      const response: GenerateContentResponse = await this.ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: [
          ...validHistory,
          { role: 'user', parts: [{ text: command }] }
        ],
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          tools: [{ functionDeclarations: APA_TOOLS }],
          temperature: 0.7,
          thinkingConfig: { thinkingBudget: 32768 }
        },
      });

      return response;
    } catch (error) {
      console.error("APA Engine Error:", error);
      throw error;
    }
  }

  async transcribeAudio(base64Audio: string): Promise<string> {
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
          parts: [
            { inlineData: { mimeType: 'audio/webm', data: base64Audio } },
            { text: "Transcribe accurately. Return only text." }
          ]
        }
      });
      return response.text || "";
    } catch (error) {
      console.error("Transcription Error:", error);
      return "";
    }
  }

  async generateSpeech(text: string): Promise<string | undefined> {
    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `Say clearly: ${text}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
          },
        },
      });
      return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    } catch (error) {
      console.error("TTS Error:", error);
      return undefined;
    }
  }
}
