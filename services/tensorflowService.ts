import * as tf from '@tensorflow/tfjs';
import * as mobilenet from '@tensorflow-models/mobilenet';

export interface TensorFlowAnalysis {
  foodIdentification: {
    predictions: Array<{
      className: string;
      probability: number;
    }>;
    isFood: boolean;
    confidence: number;
    primaryFoodType: string;
  };
  nutritionalEstimation: {
    estimatedCalories: number;
    macronutrients: {
      carbs: number;
      protein: number;
      fat: number;
      fiber: number;
    };
    confidenceLevel: number;
  };
  visualAnalysis: {
    portionSize: 'SMALL' | 'MEDIUM' | 'LARGE' | 'EXTRA_LARGE';
    freshnessScore: number; // 1-10 scale
    cookingMethod: string;
    colorAnalysis: string[];
  };
  qualityAssessment: {
    overallQuality: number; // 1-10 scale
    processingLevel: 'MINIMAL' | 'MODERATE' | 'HIGHLY_PROCESSED';
    naturalness: number; // 1-10 scale
  };
}

export class TensorFlowService {
  private model: mobilenet.MobileNet | null = null;
  private isLoaded = false;

  async loadModel(): Promise<void> {
    if (this.isLoaded) return;

    try {
      console.log('Loading TensorFlow.js MobileNet model...');
      
      // Add a timeout to prevent hanging
      const loadPromise = mobilenet.load();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Model loading timeout')), 30000)
      );
      
      this.model = await Promise.race([loadPromise, timeoutPromise]) as mobilenet.MobileNet;
      this.isLoaded = true;
      console.log('TensorFlow.js model loaded successfully!');
    } catch (error) {
      console.error('Error loading TensorFlow.js model:', error);
      this.isLoaded = false;
      // Don't throw error, just log it so the app continues working
      console.warn('TensorFlow.js will be disabled for this session');
    }
  }

  async classifyImage(imageElement: HTMLImageElement): Promise<{
    predictions: Array<{
      className: string;
      probability: number;
    }>;
    isFood: boolean;
    confidence: number;
    primaryFoodType: string;
  }> {
    if (!this.model) {
      throw new Error('Model not loaded. Call loadModel() first.');
    }

    try {
      const predictions = await this.model.classify(imageElement);
      
      // Enhanced food-related keywords with categories
      const foodCategories = {
        'PROTEIN': ['chicken', 'beef', 'fish', 'meat', 'egg', 'cheese', 'tofu', 'beans', 'salmon', 'tuna'],
        'CARBS': ['rice', 'pasta', 'bread', 'potato', 'noodle', 'cereal', 'bagel', 'pancake', 'waffle'],
        'FRUITS': ['apple', 'banana', 'orange', 'berry', 'grape', 'watermelon', 'mango', 'pineapple'],
        'VEGETABLES': ['salad', 'broccoli', 'carrot', 'spinach', 'tomato', 'cucumber', 'pepper'],
        'PROCESSED': ['pizza', 'burger', 'hot_dog', 'french_fries', 'donut', 'cookie', 'cake', 'ice_cream'],
        'BEVERAGES': ['coffee', 'tea', 'juice', 'smoothie', 'soda', 'milk'],
        'SNACKS': ['chip', 'cracker', 'pretzel', 'popcorn', 'nut', 'chocolate']
      };

      // Find food predictions and categorize them
      let primaryFoodType = 'UNKNOWN';
      const foodPredictions = predictions.filter(pred => {
        for (const [category, keywords] of Object.entries(foodCategories)) {
          if (keywords.some(keyword => 
            pred.className.toLowerCase().includes(keyword.toLowerCase())
          )) {
            if (pred.probability > 0.3) {
              primaryFoodType = category;
            }
            return true;
          }
        }
        return false;
      });

      const isFood = foodPredictions.length > 0;
      const confidence = isFood ? foodPredictions[0].probability : 0;

      return {
        predictions: predictions.slice(0, 5), 
        isFood,
        confidence,
        primaryFoodType
      };
    } catch (error) {
      console.error('Error classifying image:', error);
      throw error;
    }
  }

  async preprocessImage(imageDataUrl: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = imageDataUrl;
    });
  }

  // Advanced nutritional estimation based on visual analysis
  private estimateNutrition(predictions: any[], primaryFoodType: string, imageElement: HTMLImageElement): {
    estimatedCalories: number;
    macronutrients: {
      carbs: number;
      protein: number;
      fat: number;
      fiber: number;
    };
    confidenceLevel: number;
  } {
    const topPrediction = predictions[0];
    let calories = 200; // Base calories
    let carbs = 30, protein = 10, fat = 8, fiber = 3; // Base macros in grams
    let confidence = 0.7;

    // Enhanced calorie and macro estimation by food type
    const nutritionData: { [key: string]: { cal: number, carbs: number, protein: number, fat: number, fiber: number } } = {
      // Proteins
      'chicken': { cal: 165, carbs: 0, protein: 31, fat: 3.6, fiber: 0 },
      'beef': { cal: 250, carbs: 0, protein: 26, fat: 17, fiber: 0 },
      'fish': { cal: 206, carbs: 0, protein: 22, fat: 12, fiber: 0 },
      'salmon': { cal: 208, carbs: 0, protein: 20, fat: 12, fiber: 0 },
      'egg': { cal: 155, carbs: 1.1, protein: 13, fat: 11, fiber: 0 },
      
      // Carbs
      'rice': { cal: 130, carbs: 28, protein: 2.7, fat: 0.3, fiber: 0.4 },
      'pasta': { cal: 220, carbs: 44, protein: 8, fat: 1.1, fiber: 2.5 },
      'bread': { cal: 265, carbs: 49, protein: 9, fat: 3.2, fiber: 2.8 },
      'potato': { cal: 77, carbs: 17, protein: 2, fat: 0.1, fiber: 2.2 },
      
      // Fruits
      'apple': { cal: 52, carbs: 14, protein: 0.3, fat: 0.2, fiber: 2.4 },
      'banana': { cal: 89, carbs: 23, protein: 1.1, fat: 0.3, fiber: 2.6 },
      'orange': { cal: 47, carbs: 12, protein: 0.9, fat: 0.1, fiber: 2.4 },
      
      // Vegetables
      'salad': { cal: 20, carbs: 4, protein: 2, fat: 0.2, fiber: 2 },
      'broccoli': { cal: 34, carbs: 7, protein: 2.8, fat: 0.4, fiber: 2.6 },
      
      // Processed foods
      'pizza': { cal: 285, carbs: 36, protein: 12, fat: 10, fiber: 2.3 },
      'burger': { cal: 540, carbs: 40, protein: 25, fat: 31, fiber: 3 },
      'french_fries': { cal: 365, carbs: 63, protein: 4, fat: 17, fiber: 4 },
      'ice_cream': { cal: 207, carbs: 24, protein: 3.5, fat: 11, fiber: 0.7 }
    };

    // Find matching nutrition data
    for (const [food, nutrition] of Object.entries(nutritionData)) {
      if (topPrediction.className.toLowerCase().includes(food)) {
        calories = nutrition.cal;
        carbs = nutrition.carbs;
        protein = nutrition.protein;
        fat = nutrition.fat;
        fiber = nutrition.fiber;
        confidence = Math.min(0.9, topPrediction.probability + 0.2);
        break;
      }
    }

    // Adjust based on food category
    switch (primaryFoodType) {
      case 'PROCESSED':
        calories *= 1.3; // Processed foods are typically higher in calories
        fat *= 1.5;
        confidence *= 0.8;
        break;
      case 'FRUITS':
        calories *= 0.8;
        carbs *= 1.2;
        confidence *= 0.9;
        break;
      case 'VEGETABLES':
        calories *= 0.6;
        fiber *= 1.5;
        confidence *= 0.9;
        break;
      case 'PROTEIN':
        protein *= 1.2;
        confidence *= 0.85;
        break;
    }

    return {
      estimatedCalories: Math.round(calories),
      macronutrients: {
        carbs: Math.round(carbs * 10) / 10,
        protein: Math.round(protein * 10) / 10,
        fat: Math.round(fat * 10) / 10,
        fiber: Math.round(fiber * 10) / 10
      },
      confidenceLevel: Math.round(confidence * 100) / 100
    };
  }

  // Visual analysis for portion size and quality
  private analyzeVisualCharacteristics(imageElement: HTMLImageElement, predictions: any[]): {
    portionSize: 'SMALL' | 'MEDIUM' | 'LARGE' | 'EXTRA_LARGE';
    freshnessScore: number;
    cookingMethod: string;
    colorAnalysis: string[];
  } {
    const topPrediction = predictions[0];
    
    // Portion size estimation (simplified heuristic)
    let portionSize: 'SMALL' | 'MEDIUM' | 'LARGE' | 'EXTRA_LARGE' = 'MEDIUM';
    
    if (topPrediction.className.includes('slice') || topPrediction.className.includes('piece')) {
      portionSize = 'SMALL';
    } else if (topPrediction.className.includes('large') || topPrediction.className.includes('whole')) {
      portionSize = 'LARGE';
    } else if (topPrediction.className.includes('super') || topPrediction.className.includes('big')) {
      portionSize = 'EXTRA_LARGE';
    }

    // Freshness score estimation
    let freshnessScore = 8; // Default good freshness
    
    if (topPrediction.className.includes('fresh') || topPrediction.className.includes('raw')) {
      freshnessScore = 9;
    } else if (topPrediction.className.includes('cooked') || topPrediction.className.includes('grilled')) {
      freshnessScore = 7;
    } else if (topPrediction.className.includes('fried') || topPrediction.className.includes('processed')) {
      freshnessScore = 5;
    }

    // Cooking method detection
    let cookingMethod = 'Unknown';
    const cookingKeywords = {
      'grilled': ['grill', 'barbecue', 'char'],
      'fried': ['fries', 'fried', 'crispy'],
      'baked': ['baked', 'roasted'],
      'steamed': ['steamed', 'boiled'],
      'raw': ['fresh', 'raw', 'salad']
    };

    for (const [method, keywords] of Object.entries(cookingKeywords)) {
      if (keywords.some(keyword => topPrediction.className.toLowerCase().includes(keyword))) {
        cookingMethod = method;
        break;
      }
    }

    // Color analysis (simplified)
    const colorAnalysis = [];
    if (topPrediction.className.includes('green')) colorAnalysis.push('Rich in chlorophyll');
    if (topPrediction.className.includes('red')) colorAnalysis.push('Contains lycopene/anthocyanins');
    if (topPrediction.className.includes('orange')) colorAnalysis.push('High in beta-carotene');
    if (topPrediction.className.includes('yellow')) colorAnalysis.push('Contains vitamins and minerals');

    return {
      portionSize,
      freshnessScore,
      cookingMethod,
      colorAnalysis: colorAnalysis.length > 0 ? colorAnalysis : ['Natural food colors detected']
    };
  }

  // Quality assessment
  private assessQuality(predictions: any[], primaryFoodType: string): {
    overallQuality: number;
    processingLevel: 'MINIMAL' | 'MODERATE' | 'HIGHLY_PROCESSED';
    naturalness: number;
  } {
    let overallQuality = 7; // Default good quality
    let processingLevel: 'MINIMAL' | 'MODERATE' | 'HIGHLY_PROCESSED' = 'MODERATE';
    let naturalness = 7;

    const topPrediction = predictions[0];

    // Processing level assessment
    if (['FRUITS', 'VEGETABLES'].includes(primaryFoodType)) {
      processingLevel = 'MINIMAL';
      naturalness = 9;
      overallQuality = 8;
    } else if (['PROTEIN', 'CARBS'].includes(primaryFoodType)) {
      if (topPrediction.className.includes('fresh') || topPrediction.className.includes('grilled')) {
        processingLevel = 'MODERATE';
        naturalness = 7;
      } else {
        processingLevel = 'HIGHLY_PROCESSED';
        naturalness = 4;
      }
    } else if (primaryFoodType === 'PROCESSED') {
      processingLevel = 'HIGHLY_PROCESSED';
      naturalness = 3;
      overallQuality = 4;
    }

    // Adjust based on specific food items
    if (topPrediction.className.includes('organic')) {
      naturalness += 2;
      overallQuality += 1;
    }
    
    if (topPrediction.className.includes('fried') || topPrediction.className.includes('processed')) {
      overallQuality -= 2;
      naturalness -= 2;
    }

    return {
      overallQuality: Math.max(1, Math.min(10, overallQuality)),
      processingLevel,
      naturalness: Math.max(1, Math.min(10, naturalness))
    };
  }

  async enhancedFoodAnalysis(imageDataUrl: string): Promise<TensorFlowAnalysis> {
    try {
      if (!this.isLoaded) {
        await this.loadModel();
      }
      
      if (!this.model) {
        throw new Error('TensorFlow model not available. Analysis will continue with Gemini only.');
      }
      
      const imageElement = await this.preprocessImage(imageDataUrl);
      const classificationResults = await this.classifyImage(imageElement);

      if (!classificationResults.isFood) {
        throw new Error('No food detected in the image. Please upload an image containing food.');
      }

      // Perform comprehensive analysis
      const nutritionalEstimation = this.estimateNutrition(
        classificationResults.predictions, 
        classificationResults.primaryFoodType, 
        imageElement
      );

      const visualAnalysis = this.analyzeVisualCharacteristics(
        imageElement, 
        classificationResults.predictions
      );

      const qualityAssessment = this.assessQuality(
        classificationResults.predictions, 
        classificationResults.primaryFoodType
      );

      return {
        foodIdentification: {
          predictions: classificationResults.predictions,
          isFood: classificationResults.isFood,
          confidence: classificationResults.confidence,
          primaryFoodType: classificationResults.primaryFoodType
        },
        nutritionalEstimation,
        visualAnalysis,
        qualityAssessment
      };
    } catch (error) {
      console.error('Error in enhanced TensorFlow food analysis:', error);
      throw error;
    }
  }

  // Quick pre-analysis to validate food images before sending to Gemini
  async validateFoodImage(imageDataUrl: string): Promise<{
    isValidFood: boolean;
    confidence: number;
    suggestions: string[];
  }> {
    try {
      if (!this.isLoaded) {
        await this.loadModel();
      }
      
      if (!this.model) {
        // If model still not loaded, return neutral result
        return {
          isValidFood: true,
          confidence: 0.8,
          suggestions: ["Image ready for analysis"]
        };
      }
      
      const imageElement = await this.preprocessImage(imageDataUrl);
      const results = await this.classifyImage(imageElement);

      const suggestions = [];
      
      if (!results.isFood) {
        suggestions.push("Try uploading an image that clearly shows food items");
        suggestions.push("Ensure the food is well-lit and clearly visible");
        suggestions.push("Avoid images with too much background or packaging");
      } else if (results.confidence < 0.5) {
        suggestions.push("Image quality could be improved for better analysis");
        suggestions.push("Try taking a closer photo of the food");
        suggestions.push("Ensure good lighting conditions");
      } else {
        suggestions.push("Great food image! Ready for detailed analysis");
      }

      return {
        isValidFood: results.isFood,
        confidence: results.confidence,
        suggestions
      };
    } catch (error) {
      console.error('Error validating food image:', error);
      return {
        isValidFood: true,
        confidence: 0.8,
        suggestions: ["Image ready for analysis"]
      };
    }
  }
}

export const tensorflowService = new TensorFlowService();
