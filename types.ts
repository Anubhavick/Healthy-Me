
export enum Diet {
  None = 'None',
  Keto = 'Keto',
  Vegan = 'Vegan',
  Diabetic = 'Low-Glycemic (Diabetic-Friendly)',
  GlutenFree = 'Gluten-Free',
}

export enum MedicalCondition {
  None = 'None',
  Diabetes = 'Diabetes',
  Hypertension = 'High Blood Pressure',
  Cholesterol = 'High Cholesterol',
  HeartDisease = 'Heart Disease',
  Obesity = 'Obesity',
  PCOS = 'PCOS',
  ThyroidIssues = 'Thyroid Issues',
  KidneyDisease = 'Kidney Disease',
  LiverDisease = 'Liver Disease',
  Other = 'Other (Custom)'
}

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  diet: Diet;
  medicalConditions: MedicalCondition[];
  customCondition?: string;
  bmi?: {
    height: number; // cm
    weight: number; // kg
    value: number;
    category: string;
    lastUpdated: string;
  };
  goals: {
    dailyCalories?: number;
    targetHealthScore?: number;
    targetWeight?: number;
  };
  streak: {
    current: number;
    best: number;
    lastMealDate?: string;
  };
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
  medicalAdvice?: {
    isSafeForConditions: boolean;
    warnings: string[];
    recommendations: string[];
  };
  nutritionalBreakdown?: {
    carbs: number;
    protein: number;
    fat: number;
    fiber: number;
    sugar: number;
    sodium: number;
  };
}

export interface Meal {
  id: string;
  imageDataUrl: string;
  analysis: AnalysisResult;
  timestamp: string;
  healthScore: number;
}

export interface ExportData {
  user: UserProfile;
  meals: Meal[];
  analytics: {
    totalMeals: number;
    avgCalories: number;
    avgHealthScore: number;
    streak: number;
    goalProgress: number;
  };
  exportDate: string;
}
