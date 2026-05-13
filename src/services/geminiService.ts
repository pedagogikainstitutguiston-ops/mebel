import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function getChatResponse(message: string, history: { role: 'user' | 'model', parts: [{ text: string }] }[] = []) {
  try {
    const chat = ai.chats.create({
      model: "gemini-3-flash-preview",
      config: {
        systemInstruction: "Siz aqlli va yordamchi AI assistentsiz. O'zbek tilida gapirasiz. Foydalanuvchiga har qanday mavzuda yordam bera olasiz. Javoblaringiz qisqa va lo'nda bo'lishi kerak.",
      }
    });

    // Start with history if provided, otherwise it's a new chat
    // Actually, create takes initial history
    const response = await chat.sendMessage({ message });
    return response.text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
}

export async function* getChatResponseStream(message: string, history: any[] = []) {
  try {
    const chat = ai.chats.create({
      model: "gemini-3-flash-preview",
      config: {
        systemInstruction: "Siz aqlli va yordamchi AI assistentsiz. O'zbek tilida gapirasiz. Foydalanuvchiga har qanday mavzuda yordam bera olasiz. Javoblaringiz qisqa va lo'nda bo'lishi kerak.",
      },
      history: history
    });

    const result = await chat.sendMessageStream({ message });
    for await (const chunk of result) {
      yield chunk.text;
    }
  } catch (error) {
    console.error("Gemini API Streaming Error:", error);
    throw error;
  }
}
