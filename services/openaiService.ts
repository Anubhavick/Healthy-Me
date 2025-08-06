import OpenAI from 'openai';
import { Diet, AnalysisResult, MedicalCondition, UserProfile } from '../types';

if (!import.meta.env.VITE_OPENAI_API_KEY) {
  throw new Error("VITE_OPENAI_API_KEY environment variable is not set.");
}

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Enable browser usage
});

export async function analyzeImage(
  imageDataUrl: string,
  userProfile: UserProfile
): Promise<AnalysisResult> {
  try {
    const dietInstruction = userProfile.diet === Diet.None 
      ? "No specific diet." 
      : `User follows ${userProfile.diet} diet.`;

    const medicalConditions = userProfile.medicalConditions.filter(c => c !== MedicalCondition.None);
    const medicalInstruction = medicalConditions.length > 0 
      ? `Medical conditions: ${medicalConditions.join(', ')}${userProfile.customCondition ? `, ${userProfile.customCondition}` : ''}.`
      : "";

    // Enhanced prompt for better food analysis with OpenAI
    const prompt = `Analyze this food image with high accuracy. ${dietInstruction} ${medicalInstruction}

Provide detailed nutrition analysis in JSON format:
1. dishName: Specific food name with portion description
2. estimatedCalories: Accurate calorie estimate for visible portion
3. nutritionalBreakdown: 
   - carbs: grams of carbohydrates
   - protein: grams of protein  
   - fat: grams of fat
   - fiber: grams of dietary fiber
   - sugar: grams of sugar
   - sodium: milligrams of sodium
4. healthScore: Rate 1-10 (nutrition quality, processing level, health impact)
5. dietCompatibility:
   - isCompatible: true/false for user's diet
   - reason: Clear explanation why compatible/incompatible
6. ingredients: List of all visible/identifiable ingredients
7. healthTips: 3-4 practical health tips specific to this food

Focus on accuracy and be specific about nutritional values. Consider food preparation method and portion size visible in image.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // Best model for vision tasks - fastest and most accurate
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "image_url",
              image_url: {
                url: imageDataUrl,
                detail: "high" // High detail for better food recognition
              }
            }
          ]
        }
      ],
      max_tokens: 1500, // Increased for better analysis
      temperature: 0.1, // Low temperature for consistency
      response_format: { type: "json_object" }
    });

    if (!response.choices[0]?.message?.content) {
      throw new Error('No response received from OpenAI API');
    }

    const result = JSON.parse(response.choices[0].message.content) as AnalysisResult;
    
    // Basic validation
    if (!result.dishName || !result.estimatedCalories) {
      throw new Error('Invalid response format from OpenAI API');
    }
    
    return result;
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw new Error(`OpenAI analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// BMI Calculator with OpenAI-powered health advice
export async function calculateBMI(
  height: number, 
  weight: number, 
  medicalConditions: MedicalCondition[], 
  customCondition?: string
): Promise<{
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

  const prompt = `BMI: ${bmi} (${category}), Height: ${height}cm, Weight: ${weight}kg, Conditions: ${conditionsInfo || 'None'}

Return JSON with healthAdvice, risks, and recommendations arrays. Be brief and medical.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // Best model for medical advice
      messages: [{ role: "user", content: prompt }],
      max_tokens: 800,
      temperature: 0.1,
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0]?.message?.content || '{}');
    return {
      bmi,
      category,
      healthAdvice: result.healthAdvice || [`Your BMI is ${bmi}, which is classified as ${category}.`],
      risks: result.risks || [],
      recommendations: result.recommendations || ["Consult with a healthcare professional for personalized advice."]
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
