import { AnalysisResult } from '../types';

/**
 * Centralized health score calculation service
 * Ensures consistent scoring across the application
 */
export class HealthScoreService {
  /**
   * Calculates a normalized health score from 1-20 based on AI analysis
   * @param analysis The analysis result from AI services
   * @returns Health score from 1-20
   */
  static calculateHealthScore(analysis: AnalysisResult): number {
    // Start with AI's health score (1-10) converted to 20-point scale
    let baseScore = analysis.healthScore ? analysis.healthScore * 2 : 12;
    
    // If no AI score, calculate from available data
    if (!analysis.healthScore) {
      baseScore = this.calculateFallbackScore(analysis);
    }
    
    // Apply additional factors
    baseScore += this.getCalorieAdjustment(analysis.estimatedCalories);
    baseScore += this.getDietCompatibilityAdjustment(analysis.dietCompatibility.isCompatible);
    baseScore += this.getProcessingLevelAdjustment(analysis.processingLevel);
    baseScore += this.getNutritionalDensityAdjustment(analysis.nutritionalDensity);
    baseScore += this.getChemicalSafetyAdjustment(analysis.chemicalAnalysis);
    
    // Ensure score stays within bounds
    return Math.max(1, Math.min(20, Math.round(baseScore)));
  }
  
  /**
   * Fallback score calculation when AI doesn't provide health score
   */
  private static calculateFallbackScore(analysis: AnalysisResult): number {
    let score = 12; // Start from middle
    
    // Base on chemical safety if available
    if (analysis.chemicalAnalysis?.overallSafetyScore) {
      score = (analysis.chemicalAnalysis.overallSafetyScore / 10) * 20;
    }
    
    return score;
  }
  
  /**
   * Calorie-based adjustment
   */
  private static getCalorieAdjustment(calories: number): number {
    if (calories <= 300) return 2;
    if (calories <= 500) return 1;
    if (calories > 800) return -1;
    if (calories > 1200) return -2;
    return 0;
  }
  
  /**
   * Diet compatibility adjustment
   */
  private static getDietCompatibilityAdjustment(isCompatible: boolean): number {
    return isCompatible ? 1 : -1;
  }
  
  /**
   * Processing level adjustment
   */
  private static getProcessingLevelAdjustment(processingLevel?: string): number {
    switch (processingLevel) {
      case 'MINIMAL': return 2;
      case 'MODERATE': return 0;
      case 'HIGHLY_PROCESSED': return -2;
      default: return 0;
    }
  }
  
  /**
   * Nutritional density adjustment
   */
  private static getNutritionalDensityAdjustment(nutritionalDensity?: string): number {
    switch (nutritionalDensity) {
      case 'HIGH': return 2;
      case 'MODERATE': return 0;
      case 'LOW': return -1;
      default: return 0;
    }
  }
  
  /**
   * Chemical safety adjustment
   */
  private static getChemicalSafetyAdjustment(chemicalAnalysis?: any): number {
    if (!chemicalAnalysis) return 0;
    
    let adjustment = 0;
    
    // Harmful chemicals penalty
    if (chemicalAnalysis.harmfulChemicals?.length > 0) {
      const severeCount = chemicalAnalysis.harmfulChemicals.filter((c: any) => c.riskLevel === 'SEVERE').length;
      const highCount = chemicalAnalysis.harmfulChemicals.filter((c: any) => c.riskLevel === 'HIGH').length;
      adjustment -= (severeCount * 3 + highCount * 2);
    }
    
    // Artificial ingredients penalty
    if (chemicalAnalysis.hasArtificialIngredients) {
      adjustment -= 1;
    }
    
    // Organic bonus
    if (chemicalAnalysis.isOrganicCertified) {
      adjustment += 1;
    }
    
    return adjustment;
  }
  
  /**
   * Get health score category label
   */
  static getHealthScoreLabel(score: number): string {
    if (score >= 18) return 'Excellent';
    if (score >= 15) return 'Very Good';
    if (score >= 12) return 'Good';
    if (score >= 9) return 'Fair';
    if (score >= 6) return 'Poor';
    return 'Very Poor';
  }
  
  /**
   * Get health score color class
   */
  static getHealthScoreColor(score: number): string {
    if (score >= 15) return 'text-green-600';
    if (score >= 12) return 'text-yellow-600';
    if (score >= 9) return 'text-orange-600';
    return 'text-red-600';
  }
  
  /**
   * Validate and normalize health score consistency
   * Used for meal history to ensure consistent scoring
   */
  static normalizeHistoricalScores(meals: any[]): any[] {
    return meals.map(meal => ({
      ...meal,
      healthScore: this.calculateHealthScore(meal.analysis)
    }));
  }
}
