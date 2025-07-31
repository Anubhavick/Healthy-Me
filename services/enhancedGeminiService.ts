import { GoogleGenAI, Type } from "@google/genai";
import { tensorflowService } from './tensorflowService';
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

export async function enhancedAnalyzeImage(
  imageDataUrl: string,
  diet: Diet
): Promise<AnalysisResult & { 
  tensorflowData?: any;
  mlConfidence?: number;
  analysisMethod?: string;
}> {
  const [header, base64Data] = imageDataUrl.split(",");
  if (!header || !base64Data) {
    throw new Error("Invalid image data URL format");
  }

  const mimeTypeMatch = header.match(/data:(.*);base64/);
  if (!mimeTypeMatch || !mimeTypeMatch[1]) {
    throw new Error("Could not determine MIME type from image data URL");
  }
  const mimeType = mimeTypeMatch[1];

  try {
    // Step 1: TensorFlow.js Analysis (Fast, client-side)
    console.log("🧠 Starting TensorFlow.js analysis...");
    const tfAnalysis = await tensorflowService.enhancedFoodAnalysis(imageDataUrl);
    
    // Step 2: Gemini AI Analysis (Comprehensive, server-side)
    console.log("🤖 Starting Gemini AI analysis...");
    const imagePart = base64ToGenerativePart(base64Data, mimeType);

    const dietInstruction = diet === Diet.None 
      ? "No specific diet is being followed." 
      : `The user is following a ${diet} diet. Assess if the meal is compatible.`;

    // Enhanced prompt with TensorFlow insights
    const tfInsights = tfAnalysis.tensorflowPredictions.isFood 
      ? `TensorFlow detected: ${tfAnalysis.tensorflowPredictions.predictions[0].className} (${(tfAnalysis.tensorflowPredictions.confidence * 100).toFixed(1)}% confidence). `
      : "";

    const prompt = `You are a nutrition expert with access to machine learning analysis. ${tfInsights}Analyze the food in this image comprehensively. 

    Based on the visual information and ML insights, identify the dish, list its primary ingredients, estimate the total calorie count, provide 2-3 concise health tips, and determine its compatibility with the user's diet. ${dietInstruction} 

    If TensorFlow detected food with high confidence, incorporate those insights into your analysis. Be realistic with calorie estimations and consider portion sizes.
    
    Respond ONLY with a JSON object that matches the provided schema.`;
    
    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        dishName: {
          type: Type.STRING,
          description: "A concise name for the dish identified in the image.",
        },
        estimatedCalories: {
          type: Type.INTEGER,
          description: "Estimated total calories for the portion shown in the image.",
        },
        ingredients: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING,
          },
          description: "List of primary ingredients visible in the dish.",
        },
        healthTips: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING,
          },
          description: "2-3 concise health tips related to this meal.",
        },
        dietCompatibility: {
          type: Type.OBJECT,
          properties: {
            isCompatible: {
              type: Type.BOOLEAN,
              description: "Whether this meal is compatible with the user's specified diet.",
            },
            reason: {
              type: Type.STRING,
              description: "Brief explanation of diet compatibility assessment.",
            },
          },
          required: ["isCompatible", "reason"],
        },
      },
      required: ["dishName", "estimatedCalories", "ingredients", "healthTips", "dietCompatibility"],
    };

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [imagePart, { text: prompt }] },
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema
      },
    });

    const text = response.text;

    let analysisResult: AnalysisResult;
    try {
      analysisResult = JSON.parse(text);
    } catch (parseError) {
      console.error("Failed to parse Gemini response:", text);
      throw new Error("Invalid response format from AI service");
    }

    // Combine TensorFlow and Gemini insights
    const enhancedResult = {
      ...analysisResult,
      // Enhance calorie estimate with TensorFlow data
      estimatedCalories: tfAnalysis.tensorflowPredictions.isFood 
        ? Math.round((analysisResult.estimatedCalories + tfAnalysis.estimatedCalories) / 2)
        : analysisResult.estimatedCalories,
      // Add TensorFlow insights to health tips
      healthTips: [
        ...analysisResult.healthTips,
        ...tfAnalysis.nutritionalInsights
      ].slice(0, 4), // Limit to 4 tips
      // Add metadata for debugging
      tensorflowData: tfAnalysis.tensorflowPredictions,
      mlConfidence: tfAnalysis.tensorflowPredictions.confidence,
      analysisMethod: tfAnalysis.tensorflowPredictions.isFood ? "Gemini + TensorFlow.js" : "Gemini AI"
    };

    console.log("✅ Enhanced analysis complete!");
    return enhancedResult;

  } catch (error) {
    console.error("Error in enhanced analysis:", error);
    
    // Fallback to original Gemini-only analysis
    console.log("🔄 Falling back to Gemini-only analysis...");
    return await originalAnalyzeImage(imageDataUrl, diet);
  }
}

// Original analyze function as fallback
async function originalAnalyzeImage(
  imageDataUrl: string,
  diet: Diet
): Promise<AnalysisResult> {
  const [header, base64Data] = imageDataUrl.split(",");
  const mimeTypeMatch = header.match(/data:(.*);base64/);
  const mimeType = mimeTypeMatch![1];
  const imagePart = base64ToGenerativePart(base64Data, mimeType);

  const dietInstruction = diet === Diet.None 
    ? "No specific diet is being followed." 
    : `The user is following a ${diet} diet. Assess if the meal is compatible.`;

  const prompt = `You are a nutrition expert. Analyze the food in this image. Based on the visual information, identify the dish, list its primary ingredients, estimate the total calorie count, provide 2-3 concise health tips, and determine its compatibility with the user's diet. ${dietInstruction} Respond ONLY with a JSON object that matches the provided schema. Be realistic with calorie estimations.`;
  
  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      dishName: { type: Type.STRING },
      estimatedCalories: { type: Type.INTEGER },
      ingredients: { type: Type.ARRAY, items: { type: Type.STRING } },
      healthTips: { type: Type.ARRAY, items: { type: Type.STRING } },
      dietCompatibility: {
        type: Type.OBJECT,
        properties: {
          isCompatible: { type: Type.BOOLEAN },
          reason: { type: Type.STRING },
        },
        required: ["isCompatible", "reason"],
      },
    },
    required: ["dishName", "estimatedCalories", "ingredients", "healthTips", "dietCompatibility"],
  };

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: { parts: [imagePart, { text: prompt }] },
    config: {
      responseMimeType: "application/json",
      responseSchema: responseSchema
    },
  });

  const text = response.text;

  try {
    return JSON.parse(text);
  } catch (parseError) {
    console.error("Failed to parse Gemini response:", text);
    throw new Error("Invalid response format from AI service");
  }
}

// Export both functions
export { enhancedAnalyzeImage as analyzeImage, originalAnalyzeImage };
