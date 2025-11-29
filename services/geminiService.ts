import { GoogleGenAI } from "@google/genai";

// Initialize the client.
// NOTE: We assume process.env.API_KEY is available as per instructions.
// In a real production app, you would proxy this through a backend to hide the key.
const getClient = () => {
    const key = process.env.API_KEY;
    if (!key) {
        console.warn("Gemini API Key missing. AI features will mock responses.");
        return null;
    }
    return new GoogleGenAI({ apiKey: key });
};

export const summarizeText = async (text: string): Promise<string> => {
    const ai = getClient();
    if (!ai) return "AI API Key not configured. (Mock) This document is about...";

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Summarize the following text in a concise, professional manner:\n\n${text.substring(0, 30000)}`, // Truncate to avoid massive payloads if necessary
            config: {
                temperature: 0.3,
            }
        });
        return response.text || "Could not generate summary.";
    } catch (error) {
        console.error("Gemini API Error:", error);
        throw new Error("Failed to summarize text using Gemini AI.");
    }
};

export const analyzeImage = async (file: File, prompt: string = "Describe this image in detail."): Promise<string> => {
    const ai = getClient();
    if (!ai) return "AI API Key not configured. (Mock) This image shows...";

    try {
        // Convert file to Base64
        const base64Data = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                // Remove the data URL prefix (e.g., "data:image/png;base64,")
                const base64 = result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    {
                        inlineData: {
                            mimeType: file.type,
                            data: base64Data
                        }
                    },
                    { text: prompt }
                ]
            }
        });

        return response.text || "Could not analyze image.";
    } catch (error) {
        console.error("Gemini API Error:", error);
        throw new Error("Failed to analyze image using Gemini AI.");
    }
};
