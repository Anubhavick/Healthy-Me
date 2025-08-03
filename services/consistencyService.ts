import { AnalysisResult } from '../types';

/**
 * Service to ensure consistent analysis results for the same products
 */
export class ConsistencyService {
  private static readonly CACHE_KEY = 'foodAnalysisCache';
  private static readonly MAX_CACHE_SIZE = 100;
  
  /**
   * Get cached analysis for a product if it exists
   */
  static getCachedAnalysis(productIdentifier: string): AnalysisResult | null {
    try {
      const cache = this.getCache();
      const cached = cache[productIdentifier];
      
      if (cached && this.isValidCacheEntry(cached)) {
        console.log('Using cached analysis for:', productIdentifier);
        return cached.analysis;
      }
    } catch (error) {
      console.warn('Error reading cache:', error);
    }
    
    return null;
  }
  
  /**
   * Cache an analysis result for future consistency
   */
  static cacheAnalysis(analysis: AnalysisResult): void {
    if (!analysis.productIdentifier) return;
    
    try {
      const cache = this.getCache();
      
      // Add new entry
      cache[analysis.productIdentifier] = {
        analysis,
        timestamp: Date.now(),
        dishName: analysis.dishName
      };
      
      // Cleanup old entries if cache is too large
      this.cleanupCache(cache);
      
      localStorage.setItem(this.CACHE_KEY, JSON.stringify(cache));
      console.log('Cached analysis for:', analysis.productIdentifier);
    } catch (error) {
      console.warn('Error caching analysis:', error);
    }
  }
  
  /**
   * Check if cached analysis might match current food (fallback for similar products)
   */
  static findSimilarCachedAnalysis(dishName: string, ingredients: string[]): AnalysisResult | null {
    try {
      const cache = this.getCache();
      
      for (const [identifier, entry] of Object.entries(cache)) {
        if (!this.isValidCacheEntry(entry)) continue;
        
        // Check for similar dish name
        const nameSimilarity = this.calculateNameSimilarity(dishName, entry.dishName);
        
        // Check for ingredient overlap
        const ingredientSimilarity = this.calculateIngredientSimilarity(
          ingredients, 
          entry.analysis.ingredients
        );
        
        // If high similarity, use cached result for consistency
        if (nameSimilarity > 0.8 && ingredientSimilarity > 0.7) {
          console.log('Using similar cached analysis:', identifier);
          
          // Return modified analysis with current dish name but same core data
          return {
            ...entry.analysis,
            dishName, // Use current name
            ingredients // Use current ingredients
          };
        }
      }
    } catch (error) {
      console.warn('Error finding similar cache:', error);
    }
    
    return null;
  }
  
  /**
   * Generate a product identifier for consistency
   */
  static generateProductIdentifier(dishName: string, ingredients: string[]): string {
    // Normalize and create identifier from key components
    const normalizedName = dishName.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '_');
    
    // Use key ingredients (first 3) for identifier
    const keyIngredients = ingredients
      .slice(0, 3)
      .map(ing => ing.toLowerCase().replace(/[^a-z0-9]/g, ''))
      .join('_');
    
    return `${normalizedName}_${keyIngredients}`.substring(0, 50);
  }
  
  /**
   * Clear analysis cache
   */
  static clearCache(): void {
    localStorage.removeItem(this.CACHE_KEY);
  }
  
  /**
   * Get analysis cache from localStorage
   */
  private static getCache(): Record<string, any> {
    try {
      const cacheData = localStorage.getItem(this.CACHE_KEY);
      return cacheData ? JSON.parse(cacheData) : {};
    } catch {
      return {};
    }
  }
  
  /**
   * Check if cache entry is still valid (not too old)
   */
  private static isValidCacheEntry(entry: any): boolean {
    const MAX_AGE = 30 * 24 * 60 * 60 * 1000; // 30 days
    return entry.timestamp && (Date.now() - entry.timestamp) < MAX_AGE;
  }
  
  /**
   * Calculate name similarity (simple string comparison)
   */
  private static calculateNameSimilarity(name1: string, name2: string): number {
    const n1 = name1.toLowerCase().replace(/[^a-z0-9]/g, '');
    const n2 = name2.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    if (n1 === n2) return 1.0;
    
    // Simple substring matching
    const longer = n1.length > n2.length ? n1 : n2;
    const shorter = n1.length > n2.length ? n2 : n1;
    
    if (longer.includes(shorter)) return 0.8;
    
    // Jaccard similarity on words
    const words1 = name1.toLowerCase().split(/\s+/);
    const words2 = name2.toLowerCase().split(/\s+/);
    const intersection = words1.filter(w => words2.includes(w)).length;
    const union = new Set([...words1, ...words2]).size;
    
    return intersection / union;
  }
  
  /**
   * Calculate ingredient similarity
   */
  private static calculateIngredientSimilarity(ingredients1: string[], ingredients2: string[]): number {
    const ing1 = new Set(ingredients1.map(i => i.toLowerCase().trim()));
    const ing2 = new Set(ingredients2.map(i => i.toLowerCase().trim()));
    
    const intersection = new Set([...ing1].filter(i => ing2.has(i)));
    const union = new Set([...ing1, ...ing2]);
    
    return intersection.size / union.size;
  }
  
  /**
   * Cleanup old cache entries
   */
  private static cleanupCache(cache: Record<string, any>): void {
    const entries = Object.entries(cache);
    
    if (entries.length <= this.MAX_CACHE_SIZE) return;
    
    // Sort by timestamp and keep only the most recent entries
    const sorted = entries.sort((a, b) => (b[1].timestamp || 0) - (a[1].timestamp || 0));
    const toKeep = sorted.slice(0, this.MAX_CACHE_SIZE);
    
    // Rebuild cache with only recent entries
    Object.keys(cache).forEach(key => delete cache[key]);
    toKeep.forEach(([key, value]) => cache[key] = value);
  }
}
