
export enum Diet {
  None = 'None',
  Keto = 'Keto',
  Vegan = 'Vegan',
  Diabetic = 'Low-Glycemic (Diabetic-Friendly)',
  GlutenFree = 'Gluten-Free',
}

export interface AnalysisResult {
  estimatedCalories: number;
  dietCompatibility: {
    isCompatible: boolean;
    reason: string;
  };
  ingredients: string[];
  healthTips: string[];
  dishName: string;
}

export interface Meal {
  id: string;
  imageDataUrl: string;
  analysis: AnalysisResult;
  timestamp: string;
}
