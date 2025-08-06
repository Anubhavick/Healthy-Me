
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { Diet, AnalysisResult, MedicalCondition, UserProfile } from '../types';
// import { tensorflowService, TensorFlowAnalysis } from './tensorflowService'; // BYPASSED for speed
import { ConsistencyService } from './consistencyService';

if (!import.meta.env.VITE_GEMINI_API_KEY) {
  throw new Error("VITE_GEMINI_API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

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
  userProfile: UserProfile
): Promise<AnalysisResult> {
  try {
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

    // BYPASS: Skip TensorFlow for faster processing
    // const [tensorflowResult, geminiResult] = await Promise.allSettled([
    //   runTensorFlowAnalysis(imageDataUrl),
    //   runGeminiAnalysis(imagePart, userProfile)
    // ]);

    // Run only Gemini AI for faster results
    let geminiAnalysis: AnalysisResult | null = null;
    try {
      geminiAnalysis = await runGeminiAnalysis(imagePart, userProfile);
    } catch (error) {
      console.error('Gemini analysis failed:', error);
    }

    // BYPASS: No TensorFlow analysis for speed
    const tensorflowAnalysis = undefined;

    // Simplified error handling (TensorFlow bypassed)
    if (!geminiAnalysis) {
      console.warn('Gemini AI analysis failed');
    }

    // Skip complex caching for speed - just return the analysis
    if (!geminiAnalysis) {
      throw new Error("Gemini AI analysis failed - please try again");
    }

    // Cache this analysis for future consistency (async, non-blocking)
    if (geminiAnalysis.productIdentifier) {
      setTimeout(() => ConsistencyService.cacheAnalysis(geminiAnalysis), 0);
    }

    // Return Gemini analysis directly for speed
    return geminiAnalysis;
  } catch (error) {
    console.error('Critical error in analyzeImage:', error);
    throw new Error(`Image analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Separate Gemini analysis function with consistency checking
async function runGeminiAnalysis(imagePart: any, userProfile: UserProfile): Promise<AnalysisResult> {
  const dietInstruction = userProfile.diet === Diet.None 
    ? "No specific diet." 
    : `User follows ${userProfile.diet} diet.`;

  const medicalConditions = userProfile.medicalConditions.filter(c => c !== MedicalCondition.None);
  const medicalInstruction = medicalConditions.length > 0 
    ? `Medical conditions: ${medicalConditions.join(', ')}${userProfile.customCondition ? `, ${userProfile.customCondition}` : ''}.`
    : "";

  // Optimized prompt for faster processing
  const prompt = `Analyze this food image quickly. ${dietInstruction} ${medicalInstruction}

Quick analysis requirements:
1. Identify food name
2. Estimate calories for visible portion
3. List main ingredients
4. Basic health score (1-10)
5. Diet compatibility check
6. Key health tips

Respond with precise JSON only - keep it concise for speed.`;

  // Simplified response schema for faster processing
  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      dishName: { type: Type.STRING },
      estimatedCalories: { type: Type.INTEGER },
      nutritionalBreakdown: {
        type: Type.OBJECT,
        properties: {
          carbs: { type: Type.NUMBER },
          protein: { type: Type.NUMBER },
          fat: { type: Type.NUMBER },
          fiber: { type: Type.NUMBER },
          sugar: { type: Type.NUMBER },
          sodium: { type: Type.NUMBER }
        },
        required: ["carbs", "protein", "fat", "fiber", "sugar", "sodium"]
      },
      healthScore: { type: Type.INTEGER },
      dietCompatibility: {
        type: Type.OBJECT,
        properties: {
          isCompatible: { type: Type.BOOLEAN },
          reason: { type: Type.STRING }
        },
        required: ["isCompatible", "reason"]
      },
      ingredients: {
        type: Type.ARRAY,
        items: { type: Type.STRING }
      },
      healthTips: {
        type: Type.ARRAY,
        items: { type: Type.STRING }
      }
    },
    required: ["dishName", "estimatedCalories", "nutritionalBreakdown", "healthScore", "dietCompatibility", "ingredients", "healthTips"]
  };

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: { parts: [imagePart, { text: prompt }] },
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema
      },
    });

    if (!response || !response.text) {
      throw new Error('No response received from Gemini API');
    }

    const result = JSON.parse(response.text) as AnalysisResult;
    
    // Basic validation only
    if (!result.dishName || !result.estimatedCalories) {
      throw new Error('Invalid response format from Gemini API');
    }
    
    return result;
  } catch (error) {
    console.error('Gemini API error:', error);
    throw new Error(`Gemini analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// BMI Calculator with AI-powered health advice
export async function calculateBMI(height: number, weight: number, medicalConditions: MedicalCondition[], customCondition?: string): Promise<{
  bmi: number;
  category: string;
  healthAdvice: string[];
  risks: string[];
  recommendations: string[];
}> {
  const bmi = Number((weight / ((height / 100) ** 2)).toFixed(1));
  
  let category = '';
  if (bmi < 18.5) category = 'Underweight';
  else if (bmi < 25) category = 'Normal weight';
  else if (bmi < 30) category = 'Overweight';
  else category = 'Obese';

  const medicalConditionsText = medicalConditions.filter(c => c !== MedicalCondition.None).join(', ');
  const conditionsInfo = medicalConditionsText + (customCondition ? `, ${customCondition}` : '');

  const prompt = `As a medical expert, provide personalized health advice for someone with:
- BMI: ${bmi} (${category})
- Height: ${height}cm, Weight: ${weight}kg
- Medical conditions: ${conditionsInfo || 'None reported'}

Provide specific, actionable advice focusing on their BMI category and medical conditions. Be professional and medically accurate.

Respond with a JSON object containing health advice, risk factors, and recommendations.`;

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      healthAdvice: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "General health advice based on BMI and conditions"
      },
      risks: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "Health risks associated with current BMI and conditions"
      },
      recommendations: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "Specific actionable recommendations"
      }
    },
    required: ["healthAdvice", "risks", "recommendations"]
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [{ text: prompt }] },
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema
      },
    });

    const result = JSON.parse(response.text);
    return {
      bmi,
      category,
      ...result
    };
  } catch (error) {
    return {
      bmi,
      category,
      healthAdvice: [`Your BMI is ${bmi}, which is classified as ${category}.`],
      risks: [],
      recommendations: ["Consult with a healthcare professional for personalized advice."]
    };
  }
}
