
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { Diet, AnalysisResult } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

function base64ToGenerativePart(base64: string, mimeType: string) {
  return {
    inlineData: {
      data: base64,
      mimeType,
    },
  };
}

export async function analyzeImage(
  imageDataUrl: string,
  diet: Diet
): Promise<AnalysisResult> {
  const [header, base64Data] = imageDataUrl.split(",");
  if (!header || !base64Data) {
    throw new Error("Invalid image data URL format");
  }

  const mimeTypeMatch = header.match(/data:(.*);base64/);
  if (!mimeTypeMatch || !mimeTypeMatch[1]) {
    throw new Error("Could not determine MIME type from image data URL");
  }
  const mimeType = mimeTypeMatch[1];
  
  const imagePart = base64ToGenerativePart(base64Data, mimeType);

  const dietInstruction = diet === Diet.None 
    ? "No specific diet is being followed." 
    : `The user is following a ${diet} diet. Assess if the meal is compatible.`;

  const prompt = `You are a nutrition expert. Analyze the food in this image. Based on the visual information, identify the dish, list its primary ingredients, estimate the total calorie count, provide 2-3 concise health tips, and determine its compatibility with the user's diet. ${dietInstruction} Respond ONLY with a JSON object that matches the provided schema. Be realistic with calorie estimations.`;
  
  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      dishName: {
        type: Type.STRING,
        description: "A concise name for the dish identified in the image.",
      },
      estimatedCalories: {
        type: Type.INTEGER,
        description: "The estimated total calorie count for the meal.",
      },
      dietCompatibility: {
        type: Type.OBJECT,
        properties: {
          isCompatible: {
            type: Type.BOOLEAN,
            description: "True if the meal is compatible with the specified diet, false otherwise.",
          },
          reason: {
            type: Type.STRING,
            description: "A brief explanation for the diet compatibility assessment.",
          },
        },
        required: ["isCompatible", "reason"],
      },
      ingredients: {
        type: Type.ARRAY,
        items: {
          type: Type.STRING,
          description: "An ingredient in the meal.",
        },
        description: "A list of the primary ingredients identified in the meal.",
      },
      healthTips: {
        type: Type.ARRAY,
        items: {
          type: Type.STRING,
          description: "A health tip related to the meal.",
        },
        description: "A list of 2-3 concise and actionable health tips related to the meal.",
      },
    },
    required: ["dishName", "estimatedCalories", "dietCompatibility", "ingredients", "healthTips"],
  };

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [imagePart, { text: prompt }] },
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema
      },
    });

    const jsonText = response.text;
    const result = JSON.parse(jsonText);
    return result as AnalysisResult;

  } catch (error) {
    console.error("Error analyzing image with Gemini:", error);
    if (error instanceof Error) {
        throw new Error(`Failed to analyze image: ${error.message}`);
    }
    throw new Error("An unknown error occurred during image analysis.");
  }
}
