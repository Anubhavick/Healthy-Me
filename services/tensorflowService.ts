import * as tf from '@tensorflow/tfjs';
import * as mobilenet from '@tensorflow-models/mobilenet';

export class TensorFlowService {
  private model: mobilenet.MobileNet | null = null;
  private isLoaded = false;

  async loadModel(): Promise<void> {
    if (this.isLoaded) return;

    try {
      console.log('Loading TensorFlow.js MobileNet model...');
      this.model = await mobilenet.load();
      this.isLoaded = true;
      console.log('TensorFlow.js model loaded successfully!');
    } catch (error) {
      console.error('Error loading TensorFlow.js model:', error);
      throw error;
    }
  }

  async classifyImage(imageElement: HTMLImageElement): Promise<{
    predictions: Array<{
      className: string;
      probability: number;
    }>;
    isFood: boolean;
    confidence: number;
  }> {
    if (!this.model) {
      throw new Error('Model not loaded. Call loadModel() first.');
    }

    try {
      const predictions = await this.model.classify(imageElement);
      
      // Food-related keywords for classification
      const foodKeywords = [
        'pizza', 'burger', 'sandwich', 'salad', 'soup', 'pasta', 'rice',
        'chicken', 'beef', 'fish', 'bread', 'cake', 'apple', 'banana',
        'orange', 'vegetable', 'fruit', 'meat', 'cheese', 'egg',
        'noodle', 'sushi', 'taco', 'hot_dog', 'french_fries', 'ice_cream',
        'chocolate', 'cookie', 'donut', 'bagel', 'muffin', 'waffle',
        'pancake', 'cereal', 'yogurt', 'smoothie', 'coffee', 'tea'
      ];

      // Check if any prediction is food-related
      const foodPredictions = predictions.filter(pred => 
        foodKeywords.some(keyword => 
          pred.className.toLowerCase().includes(keyword.toLowerCase())
        )
      );

      const isFood = foodPredictions.length > 0;
      const confidence = isFood ? foodPredictions[0].probability : 0;

      return {
        predictions: predictions.slice(0, 3), 
        isFood,
        confidence
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

  async enhancedFoodAnalysis(imageDataUrl: string): Promise<{
    tensorflowPredictions: any;
    estimatedCalories: number;
    nutritionalInsights: string[];
  }> {
    try {
      await this.loadModel();
      const imageElement = await this.preprocessImage(imageDataUrl);
      const tfResults = await this.classifyImage(imageElement);

      
      let estimatedCalories = 0;
      const nutritionalInsights: string[] = [];

      if (tfResults.isFood) {
        const topPrediction = tfResults.predictions[0];
        
        
        const calorieMap: { [key: string]: number } = {
          'pizza': 285,
          'burger': 540,
          'sandwich': 350,
          'salad': 150,
          'pasta': 220,
          'rice': 205,
          'apple': 52,
          'banana': 89,
          'bread': 265,
          'cake': 300,
          'french_fries': 365,
          'ice_cream': 207
        };

        
        for (const [food, calories] of Object.entries(calorieMap)) {
          if (topPrediction.className.toLowerCase().includes(food)) {
            estimatedCalories = calories;
            break;
          }
        }

        
        if (estimatedCalories > 400) {
          nutritionalInsights.push("High-calorie meal - consider portion control");
        }
        
        if (topPrediction.className.includes('fruit') || topPrediction.className.includes('vegetable')) {
          nutritionalInsights.push("Great choice! Rich in vitamins and fiber");
        }

        if (topPrediction.className.includes('fried') || topPrediction.className.includes('fries')) {
          nutritionalInsights.push("Contains fried foods - balance with vegetables");
        }
      }

      return {
        tensorflowPredictions: tfResults,
        estimatedCalories: estimatedCalories || 200, 
        nutritionalInsights
      };
    } catch (error) {
      console.error('Error in enhanced food analysis:', error);
      throw error;
    }
  }
}

export const tensorflowService = new TensorFlowService();
