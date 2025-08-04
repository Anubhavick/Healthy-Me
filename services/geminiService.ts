
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { Diet, AnalysisResult, MedicalCondition, UserProfile } from '../types';
import { tensorflowService, TensorFlowAnalysis } from './tensorflowService';
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

    // Run TensorFlow and Gemini in parallel for faster processing
    const [tensorflowResult, geminiResult] = await Promise.allSettled([
      runTensorFlowAnalysis(imageDataUrl),
      runGeminiAnalysis(imagePart, userProfile)
    ]);

    // Extract results from Promise.allSettled
    const tensorflowAnalysis = tensorflowResult.status === 'fulfilled' ? tensorflowResult.value : undefined;
    let geminiAnalysis = geminiResult.status === 'fulfilled' ? geminiResult.value : null;

    // Log any errors for debugging
    if (tensorflowResult.status === 'rejected') {
      console.warn('TensorFlow analysis failed:', tensorflowResult.reason);
    }
    if (geminiResult.status === 'rejected') {
      console.warn('Gemini analysis failed:', geminiResult.reason);
    }

    // Check for cached analysis for consistency if Gemini analysis exists
    if (geminiAnalysis?.productIdentifier) {
      const cachedAnalysis = ConsistencyService.getCachedAnalysis(geminiAnalysis.productIdentifier);
      if (cachedAnalysis) {
        // Use cached analysis but update with current TensorFlow data
        geminiAnalysis = {
          ...cachedAnalysis,
          tensorflowAnalysis: tensorflowAnalysis
        };
      }
    } else if (geminiAnalysis) {
      // Try to find similar cached analysis as fallback
      const similarAnalysis = ConsistencyService.findSimilarCachedAnalysis(
        geminiAnalysis.dishName, 
        geminiAnalysis.ingredients
      );
      if (similarAnalysis) {
        geminiAnalysis = {
          ...similarAnalysis,
          dishName: geminiAnalysis.dishName,
          ingredients: geminiAnalysis.ingredients,
          tensorflowAnalysis: tensorflowAnalysis
        };
      }
    }

    if (!geminiAnalysis) {
      // Fallback: if Gemini fails but TensorFlow succeeded, provide basic analysis
      if (tensorflowAnalysis) {
        return {
          dishName: tensorflowAnalysis.foodIdentification.predictions[0]?.className || 'Unknown Food',
          estimatedCalories: tensorflowAnalysis.nutritionalEstimation.estimatedCalories,
          dietCompatibility: {
            isCompatible: true,
            reason: 'Basic compatibility assessment based on food type'
          },
          ingredients: ['Analysis based on visual identification'],
          healthTips: [
            `This appears to be ${tensorflowAnalysis.foodIdentification.primaryFoodType.toLowerCase()} food`,
            `Processing level: ${tensorflowAnalysis.qualityAssessment.processingLevel.toLowerCase()}`
          ],
          nutritionalBreakdown: {
            carbs: tensorflowAnalysis.nutritionalEstimation.macronutrients.carbs,
            protein: tensorflowAnalysis.nutritionalEstimation.macronutrients.protein,
            fat: tensorflowAnalysis.nutritionalEstimation.macronutrients.fat,
            fiber: tensorflowAnalysis.nutritionalEstimation.macronutrients.fiber,
            sugar: 5,
            sodium: 300
          },
          tensorflowAnalysis
        };
      }
      throw new Error("Both AI services failed to analyze the image");
    }

    // Merge TensorFlow analysis with Gemini results
    if (tensorflowAnalysis) {
      geminiAnalysis.tensorflowAnalysis = tensorflowAnalysis;
      
      // Cross-validate calorie estimates
      const geminiCalories = geminiAnalysis.estimatedCalories;
      const tfCalories = tensorflowAnalysis.nutritionalEstimation.estimatedCalories;
      
      // Use average if both estimates are reasonable
      if (Math.abs(geminiCalories - tfCalories) < 200) {
        geminiAnalysis.estimatedCalories = Math.round((geminiCalories + tfCalories) / 2);
      }
    }
    
    return geminiAnalysis;
  } catch (error) {
    console.error('Critical error in analyzeImage:', error);
    throw new Error(`Image analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Separate TensorFlow analysis function
async function runTensorFlowAnalysis(imageDataUrl: string): Promise<TensorFlowAnalysis | undefined> {
  try {
    const validation = await tensorflowService.validateFoodImage(imageDataUrl);
    if (validation.isValidFood) {
      return await tensorflowService.enhancedFoodAnalysis(imageDataUrl);
    }
  } catch (error) {
    console.warn('TensorFlow analysis failed:', error);
  }
  return undefined;
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

  // Enhanced prompt with specific health score calculation instructions
  const prompt = `Analyze this food image comprehensively. ${dietInstruction} ${medicalInstruction}

CRITICAL: Be consistent - same product must get same analysis every time.

Analysis requirements:
1. Identify food name precisely
2. Estimate calories based on visible portion size
3. List ALL visible ingredients from packaging (if packaged food)
4. MANDATORY CHEMICAL ANALYSIS: Scan for ALL chemicals, preservatives, additives, artificial ingredients
5. Calculate health score (1-10) based on:
   - Nutritional density: protein, fiber, vitamins (high=better)
   - Processing level: minimal=10, moderate=6-7, highly processed=1-4
   - Chemical safety: preservatives, artificial additives, harmful compounds (CRITICAL FACTOR)
   - Medical compatibility with user's conditions

For packaged foods - CRITICAL CHEMICAL SCANNING:
- Read ALL ingredient labels word-by-word
- Identify ALL preservatives (E200-E400 series): BHA, BHT, sodium benzoate, potassium sorbate
- Find ALL artificial colors (E100-E199): Red 40, Yellow 6, Blue 1, tartrazine
- Detect ALL flavor enhancers: MSG, disodium inosinate, disodium guanylate
- Spot ALL emulsifiers and stabilizers: lecithin, carrageenan, xanthan gum
- Find ALL artificial sweeteners: aspartame, sucralose, acesulfame K
- Check for harmful chemicals: trans fats, high fructose corn syrup, nitrates/nitrites
- Assess EVERY E-number and chemical compound for safety
- Note any cancer-linked, hormone-disrupting, or toxic substances

Chemical Analysis Requirements:
- Rate EVERY chemical found (SAFE/CAUTION/AVOID)
- List health effects for harmful chemicals
- Calculate chemical safety score (1-10) - heavily weight this in final health score
- If multiple harmful chemicals present, significantly lower health score (max 4/10)
- Natural, organic foods with no additives = higher scores

Health Score Guidelines (Chemical-Weighted):
- 9-10: Whole foods, no harmful chemicals, minimal processing, high nutrients
- 7-8: Good nutrition, minor safe additives only
- 5-6: Moderate nutrition, some concerning chemicals
- 3-4: Poor nutrition, multiple harmful chemicals (MSG, artificial colors, preservatives)
- 1-2: Very harmful ingredients, toxic chemicals, cancer-linked substances

Respond with precise JSON only.`;

  // Simplified response schema for faster processing
  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      dishName: { type: Type.STRING },
      productIdentifier: { 
        type: Type.STRING,
        description: "Unique product identifier based on brand+name+key ingredients for consistency"
      },
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
      healthScore: {
        type: Type.INTEGER,
        description: "Health score from 1-10 based on nutritional value, processing level, and safety"
      },
      processingLevel: {
        type: Type.STRING,
        enum: ["MINIMAL", "MODERATE", "HIGHLY_PROCESSED"],
        description: "Level of food processing"
      },
      nutritionalDensity: {
        type: Type.STRING,
        enum: ["LOW", "MODERATE", "HIGH"],
        description: "Overall nutritional density and quality"
      },
      dietCompatibility: {
        type: Type.OBJECT,
        properties: {
          isCompatible: { type: Type.BOOLEAN },
          reason: { type: Type.STRING }
        },
        required: ["isCompatible", "reason"]
      },
      medicalAdvice: {
        type: Type.OBJECT,
        properties: {
          isSafeForConditions: { type: Type.BOOLEAN },
          warnings: { type: Type.ARRAY, items: { type: Type.STRING } },
          recommendations: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["isSafeForConditions", "warnings", "recommendations"]
      },
      ingredients: {
        type: Type.ARRAY,
        items: { type: Type.STRING }
      },
      healthTips: {
        type: Type.ARRAY,
        items: { type: Type.STRING }
      },
      chemicalAnalysis: {
        type: Type.OBJECT,
        properties: {
          harmfulChemicals: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                riskLevel: { type: Type.STRING },
                description: { type: Type.STRING },
                healthEffects: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ["name", "riskLevel", "description", "healthEffects"]
            }
          },
          additives: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                eNumber: { type: Type.STRING },
                type: { type: Type.STRING },
                safetyRating: { type: Type.STRING },
                description: { type: Type.STRING }
              },
              required: ["name", "type", "safetyRating", "description"]
            }
          },
          allergens: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                severity: { type: Type.STRING },
                commonReactions: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ["name", "severity", "commonReactions"]
            }
          },
          overallSafetyScore: { type: Type.INTEGER },
          isOrganicCertified: { type: Type.BOOLEAN },
          hasArtificialIngredients: { type: Type.BOOLEAN }
        },
        required: ["overallSafetyScore", "isOrganicCertified", "hasArtificialIngredients"]
      }
    },
    required: ["dishName", "productIdentifier", "estimatedCalories", "nutritionalBreakdown", "healthScore", "processingLevel", "nutritionalDensity", "dietCompatibility", "medicalAdvice", "ingredients", "healthTips", "chemicalAnalysis"]
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
    
    // Validate essential fields
    if (!result.dishName || !result.estimatedCalories) {
      throw new Error('Invalid response format from Gemini API');
    }
    
    // Generate identifier if not provided
    if (!result.productIdentifier) {
      result.productIdentifier = ConsistencyService.generateProductIdentifier(
        result.dishName, 
        result.ingredients
      );
    }
    
    // Cache this analysis for future consistency
    ConsistencyService.cacheAnalysis(result);
    
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
