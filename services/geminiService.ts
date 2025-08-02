
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { Diet, AnalysisResult, MedicalCondition, UserProfile } from '../types';

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

  const dietInstruction = userProfile.diet === Diet.None 
    ? "No specific diet is being followed." 
    : `The user is following a ${userProfile.diet} diet. Assess if the meal is compatible.`;

  const medicalConditions = userProfile.medicalConditions.filter(c => c !== MedicalCondition.None);
  const medicalInstruction = medicalConditions.length > 0 
    ? `IMPORTANT: The user has the following medical conditions: ${medicalConditions.join(', ')}${userProfile.customCondition ? `, ${userProfile.customCondition}` : ''}. Provide specific medical advice, warnings, and recommendations for these conditions.`
    : "No specific medical conditions reported.";

  const bmiInstruction = userProfile.bmi 
    ? `The user's BMI is ${userProfile.bmi.value} (${userProfile.bmi.category}). Consider this in your nutritional advice.`
    : "";

  const prompt = `You are a nutrition expert, food scientist, and medical advisor. Analyze the food or food product packaging in this image comprehensively. 

IMPORTANT: If this is a packaged food product with ingredient labels, focus heavily on chemical analysis including harmful additives, preservatives, artificial chemicals, allergens, and E-numbers.

${dietInstruction}
${medicalInstruction}
${bmiInstruction}

For packaged foods, perform detailed ingredient label analysis:
1. Identify all chemicals, additives, preservatives, and artificial ingredients
2. Assess their safety levels and potential health impacts
3. Check for harmful substances like trans fats, high fructose corn syrup, artificial colors, MSG, etc.
4. Evaluate E-numbers and their safety ratings
5. Identify allergens and their severity levels
6. Determine if the product is organic or contains artificial ingredients

For prepared meals, provide general nutrition analysis but also flag any visible processed ingredients that might contain harmful chemicals.

Be realistic with estimations and provide actionable, medically-informed advice. Respond ONLY with a JSON object that matches the schema.`;

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
      nutritionalBreakdown: {
        type: Type.OBJECT,
        properties: {
          carbs: { type: Type.NUMBER, description: "Carbohydrates in grams" },
          protein: { type: Type.NUMBER, description: "Protein in grams" },
          fat: { type: Type.NUMBER, description: "Fat in grams" },
          fiber: { type: Type.NUMBER, description: "Fiber in grams" },
          sugar: { type: Type.NUMBER, description: "Sugar in grams" },
          sodium: { type: Type.NUMBER, description: "Sodium in milligrams" }
        },
        required: ["carbs", "protein", "fat", "fiber", "sugar", "sodium"]
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
      medicalAdvice: {
        type: Type.OBJECT,
        properties: {
          isSafeForConditions: {
            type: Type.BOOLEAN,
            description: "Whether this meal is safe for the user's medical conditions"
          },
          warnings: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Specific warnings related to the user's medical conditions"
          },
          recommendations: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Medical recommendations for the user's conditions"
          }
        },
        required: ["isSafeForConditions", "warnings", "recommendations"]
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
      chemicalAnalysis: {
        type: Type.OBJECT,
        properties: {
          harmfulChemicals: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING, description: "Name of the harmful chemical" },
                riskLevel: { type: Type.STRING, description: "Risk level: LOW, MEDIUM, HIGH, or SEVERE" },
                description: { type: Type.STRING, description: "Description of the chemical" },
                healthEffects: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "List of potential health effects"
                }
              },
              required: ["name", "riskLevel", "description", "healthEffects"]
            },
            description: "List of harmful chemicals found in the product"
          },
          additives: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING, description: "Name of the additive" },
                eNumber: { type: Type.STRING, description: "E-number if applicable" },
                type: { type: Type.STRING, description: "Type: PRESERVATIVE, COLORANT, FLAVOR_ENHANCER, EMULSIFIER, SWEETENER, or OTHER" },
                safetyRating: { type: Type.STRING, description: "Safety rating: SAFE, CAUTION, or AVOID" },
                description: { type: Type.STRING, description: "Description of the additive" }
              },
              required: ["name", "type", "safetyRating", "description"]
            },
            description: "List of additives found in the product"
          },
          allergens: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING, description: "Name of the allergen" },
                severity: { type: Type.STRING, description: "Severity: MILD, MODERATE, or SEVERE" },
                commonReactions: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "Common allergic reactions"
                }
              },
              required: ["name", "severity", "commonReactions"]
            },
            description: "List of allergens found in the product"
          },
          overallSafetyScore: {
            type: Type.INTEGER,
            description: "Overall safety score from 1-10 (10 being safest)"
          },
          isOrganicCertified: {
            type: Type.BOOLEAN,
            description: "Whether the product has organic certification"
          },
          hasArtificialIngredients: {
            type: Type.BOOLEAN,
            description: "Whether the product contains artificial ingredients"
          }
        },
        required: ["harmfulChemicals", "additives", "allergens", "overallSafetyScore", "isOrganicCertified", "hasArtificialIngredients"],
        description: "Chemical analysis of the food product"
      },
    },
    required: ["dishName", "estimatedCalories", "nutritionalBreakdown", "dietCompatibility", "medicalAdvice", "ingredients", "healthTips", "chemicalAnalysis"],
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
    console.error("Error getting BMI advice:", error);
    return {
      bmi,
      category,
      healthAdvice: [`Your BMI is ${bmi}, which is classified as ${category}.`],
      risks: [],
      recommendations: ["Consult with a healthcare professional for personalized advice."]
    };
  }
}
