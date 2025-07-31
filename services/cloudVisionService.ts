// Cloud Vision API Service (for demonstration)
// Note: In production, this would run on your backend for security

export interface CloudVisionResult {
  labels: Array<{
    description: string;
    score: number;
  }>;
  textAnnotations: string[];
  objects: Array<{
    name: string;
    score: number;
  }>;
}

export class CloudVisionService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async analyzeImage(imageBase64: string): Promise<CloudVisionResult> {
    // Note: In a production app, this API call would be made from your backend
    // for security reasons. This is for demo purposes only.
    
    console.log('🔍 Cloud Vision analysis would run here...');
    
    // Mock response for demo (replace with actual API call in production)
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          labels: [
            { description: 'Food', score: 0.95 },
            { description: 'Dish', score: 0.87 },
            { description: 'Cuisine', score: 0.82 }
          ],
          textAnnotations: ['Menu item', 'Restaurant name'],
          objects: [
            { name: 'Food', score: 0.91 },
            { name: 'Plate', score: 0.76 }
          ]
        });
      }, 1000);
    });
  }

  // Enhanced food detection combining Cloud Vision + TensorFlow
  async enhancedFoodDetection(imageBase64: string): Promise<{
    isFood: boolean;
    confidence: number;
    categories: string[];
    insights: string[];
  }> {
    try {
      const visionResults = await this.analyzeImage(imageBase64);
      
      // Analyze Vision API results for food content
      const foodLabels = visionResults.labels.filter(label => 
        ['food', 'dish', 'meal', 'cuisine', 'restaurant'].some(keyword =>
          label.description.toLowerCase().includes(keyword)
        )
      );

      const isFood = foodLabels.length > 0 && foodLabels[0].score > 0.7;
      const confidence = isFood ? foodLabels[0].score : 0;
      
      const categories = visionResults.labels
        .slice(0, 5)
        .map(label => label.description);

      const insights = [
        `Cloud Vision detected ${visionResults.labels.length} labels`,
        `Food confidence: ${(confidence * 100).toFixed(1)}%`,
        visionResults.textAnnotations.length > 0 ? 'Text detected in image' : 'No text detected'
      ];

      return {
        isFood,
        confidence,
        categories,
        insights
      };
    } catch (error) {
      console.error('Cloud Vision API error:', error);
      throw error;
    }
  }
}

// Export a configured instance (using the same API key as Gemini for demo)
export const cloudVisionService = new CloudVisionService(
  process.env.API_KEY || 'demo-key'
);
