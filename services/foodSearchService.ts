// Food Search Service - Search OpenFoodFacts database by text
export interface FoodSearchResult {
  productName: string;
  brands?: string;
  imageUrl?: string;
  nutritionGrade?: string;
  categories?: string;
  ingredients?: string;
  barcode?: string;
  nutritionData?: {
    energy?: number;
    carbs?: number;
    protein?: number;
    fat?: number;
    fiber?: number;
    sugar?: number;
    sodium?: number;
  };
}

export const searchOpenFoodFacts = async (query: string): Promise<FoodSearchResult[]> => {
  try {
    const searchQuery = encodeURIComponent(query.toLowerCase().trim());
    const response = await fetch(
      `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${searchQuery}&search_simple=1&action=process&json=1&page_size=10`
    );
    
    if (!response.ok) {
      throw new Error('Failed to search OpenFoodFacts database');
    }
    
    const data = await response.json();
    
    if (!data.products || data.products.length === 0) {
      return [];
    }
    
    return data.products.map((product: any): FoodSearchResult => {
      // Convert kJ to kcal (divide by 4.184)
      const energyKj = product.nutriments?.['energy-kj_100g'];
      const energyKcal = product.nutriments?.['energy-kcal_100g'] || 
                        (energyKj ? Math.round(energyKj / 4.184) : undefined);
      
      return {
        productName: product.product_name || 'Unknown Product',
        brands: product.brands || undefined,
        imageUrl: product.image_url || product.image_front_url || undefined,
        nutritionGrade: product.nutrition_grades || undefined,
        categories: product.categories || undefined,
        ingredients: product.ingredients_text || undefined,
        barcode: product.code || undefined,
        nutritionData: {
          energy: energyKcal,
          carbs: product.nutriments?.carbohydrates_100g,
          protein: product.nutriments?.proteins_100g,
          fat: product.nutriments?.fat_100g,
          fiber: product.nutriments?.fiber_100g,
          sugar: product.nutriments?.sugars_100g,
          sodium: product.nutriments?.sodium_100g
        }
      };
    });
  } catch (error) {
    console.error('Error searching OpenFoodFacts:', error);
    return [];
  }
};

// Find best match for detected ingredients
export const findBestFoodMatch = async (dishName: string, ingredients: string[]): Promise<FoodSearchResult | null> => {
  try {
    // Try searching with dish name first
    let results = await searchOpenFoodFacts(dishName);
    
    if (results.length === 0 && ingredients.length > 0) {
      // Try searching with main ingredients
      const mainIngredients = ingredients.slice(0, 3).join(' ');
      results = await searchOpenFoodFacts(mainIngredients);
    }
    
    if (results.length === 0 && ingredients.length > 0) {
      // Try individual ingredients
      for (const ingredient of ingredients.slice(0, 2)) {
        results = await searchOpenFoodFacts(ingredient);
        if (results.length > 0) break;
      }
    }
    
    // Return the best match (first result with good data)
    const bestMatch = results.find(result => 
      result.nutritionData?.energy && 
      result.nutritionGrade && 
      result.nutritionGrade !== 'unknown'
    );
    
    return bestMatch || (results.length > 0 ? results[0] : null);
  } catch (error) {
    console.error('Error finding food match:', error);
    return null;
  }
};
