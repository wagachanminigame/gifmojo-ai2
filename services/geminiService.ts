import { GoogleGenerativeAI } from "@google/generative-ai";

const getGeminiClient = () => {
  const apiKey = localStorage.getItem('gifmojo-api-key');
  if (!apiKey) {
    throw new Error("API Key not found");
  }
  return new GoogleGenerativeAI(apiKey);
};

export const generateGifCaption = async (images: string[]) => {
  try {
    const client = getGeminiClient();
    const model = client.getGenerativeModel({ model: "gemini-2.0-flash" });

    // Limit to first 5 frames to save tokens, usually enough for context
    const framesToAnalyze = images.slice(0, 5);
    
    const imageParts = framesToAnalyze.map(base64 => ({
      inlineData: {
        data: base64.split(',')[1],
        mimeType: "image/png"
      }
    }));

    const prompt = "Generate a short, funny, and catchy title for this GIF animation. Just the title, nothing else. Maximum 10 words.";

    const result = await model.generateContent([
      prompt,
      ...imageParts
    ]);

    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error generating caption:", error);
    return "Funny GIF";
  }
};

export const detectGridWithAi = async (imageSrc: string): Promise<{ rows: number; cols: number }> => {
  try {
    const client = getGeminiClient();
    const model = client.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    const cleanBase64 = imageSrc.split(',')[1];

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: 'image/png',
          data: cleanBase64,
        },
      },
      {
        text: `Analyze this image which contains a grid of animation frames.
      1. Detect the grid layout (rows and columns).
      2. Count the total number of frames.
      
      Return the result in this specific JSON format:
      {
        "rows": number,
        "cols": number,
        "count": number
      }
      
      Example response:
      {
        "rows": 4,
        "cols": 5,
        "count": 20
      }
      
      Only return the JSON object, no other text.`
      }
    ]);

    const response = await result.response;
    const text = response.text();

    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsedResult = JSON.parse(jsonMatch[0]);
        console.log('AI Grid Detection:', parsedResult);
        return {
          rows: parsedResult.rows || 2,
          cols: parsedResult.cols || 3,
        };
      }
      throw new Error("Invalid JSON format");
    } catch (e) {
      console.error("Failed to parse Gemini response:", text);
      return { rows: 1, cols: 1 };
    }
  } catch (error) {
    console.error("Grid detection error:", error);
    return { rows: 2, cols: 3 };
  }
};

export async function reorderFramesWithAi(images: string[]): Promise<number[]> {
  const client = getGeminiClient();
  const model = client.getGenerativeModel({ model: "gemini-2.0-flash" });

  // Limit to first 16 images to avoid token limits
  const framesToAnalyze = images.slice(0, 16);

  const imageParts = framesToAnalyze.map(base64 => ({
    inlineData: {
      data: base64.split(',')[1],
      mimeType: "image/png"
    }
  }));

  const prompt = `
    I have a set of ${framesToAnalyze.length} images that form an animation, but they are in random order.
    The images are provided in the order of index 0 to ${framesToAnalyze.length - 1}.
    
    Analyze the visual content and motion flow of each image to determine the correct chronological order to create a smooth animation loop.
    Look for progressive changes in position, pose, or shape.
    
    Return ONLY a JSON array of indices representing the correct order.
    Example format: [2, 0, 3, 1]
    Do not include any markdown formatting or explanation. Just the raw JSON array.
  `;

  const result = await model.generateContent([
    prompt,
    ...imageParts
  ]);

  const response = await result.response;
  const text = response.text();
  
  try {
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const indices = JSON.parse(jsonMatch[0]);
      if (Array.isArray(indices)) {
        return indices;
      }
    }
    throw new Error("Invalid response format");
  } catch (e) {
    console.error("Failed to parse Gemini reorder response:", text);
    throw e;
  }
}
