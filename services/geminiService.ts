import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

const getGeminiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY environment variable is missing.");
  }
  return new GoogleGenAI({ apiKey });
};

/**
 * Generates a creative title or caption for the GIF based on the first few frames.
 */
export const generateGifCaption = async (base64Images: string[]): Promise<string> => {
  try {
    const ai = getGeminiClient();

    // Use a subset of images (max 3) to save tokens and latency, 
    // enough to understand the context of the animation.
    const samples = base64Images.slice(0, 3).map((img) => {
      // Remove data:image/png;base64, prefix if present for the API call
      const cleanBase64 = img.split(',')[1] || img;
      return {
        inlineData: {
          mimeType: 'image/png', // Assuming PNG/JPEG, API is flexible
          data: cleanBase64,
        },
      };
    });

    const prompt = `
      これらの画像はGIFアニメーションのフレームです。
      このGIFアニメーションにふさわしい、面白くてキャッチーなタイトルを1つだけ提案してください。
      出力はタイトルのみにしてください（例：「踊る猫」「夕暮れのドライブ」）。
      余計な説明は不要です。
    `;

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [...samples, { text: prompt }],
      },
    });

    return response.text?.trim() || "無題のGIF";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "GIFアニメーション";
  }
};
