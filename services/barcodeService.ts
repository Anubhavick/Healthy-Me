// Dynamic import for Quagga to avoid ES module issues
import jsQR from 'jsqr';

export interface BarcodeResult {
  code: string;
  format: string;
  confidence?: number;
}

export interface ProductData {
  code: string;
  product_name: string;
  product_name_en?: string;
  brands?: string;
  categories?: string;
  ingredients_text?: string;
  nutrition_grades?: string;
  nutriments?: {
    energy_100g?: number;
    fat_100g?: number;
    'saturated-fat_100g'?: number;
    carbohydrates_100g?: number;
    sugars_100g?: number;
    fiber_100g?: number;
    proteins_100g?: number;
    salt_100g?: number;
    sodium_100g?: number;
  };
  additives_tags?: string[];
  allergens?: string;
  image_url?: string;
  image_front_url?: string;
  nova_group?: number;
  nutriscore_score?: number;
  nutriscore_grade?: string;
}

export interface OpenFoodFactsResponse {
  code: string;
  product?: ProductData;
  status: number;
  status_verbose: string;
}

export class BarcodeService {
  private isInitialized = false;

    // Initialize Quagga for 1D barcode scanning
  async initializeQuagga(videoElement: HTMLVideoElement): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        if (this.isInitialized) {
          resolve();
          return;
        }

        // Dynamic import for Quagga
        const Quagga = (await import('quagga')).default;

        Quagga.init({
          inputStream: {
            name: 'Live',
            type: 'LiveStream',
            target: videoElement,
            constraints: {
              width: { ideal: 1280 },
              height: { ideal: 720 },
              facingMode: 'environment'
            }
          },
          locator: {
            patchSize: 'medium',
            halfSample: true
          },
          numOfWorkers: 2,
          decoder: {
            readers: [
              'code_128_reader',
              'ean_reader',
              'ean_8_reader',
              'code_39_reader',
              'code_39_vin_reader',
              'codabar_reader',
              'upc_reader',
              'upc_e_reader',
              'i2of5_reader'
            ]
          },
          locate: true
        }, (err: any) => {
          if (err) {
            console.error('Quagga initialization failed:', err);
            reject(err);
            return;
          }
          
          this.isInitialized = true;
          Quagga.start();
          resolve();
        });
      } catch (error) {
        console.error('Failed to load Quagga:', error);
        reject(error);
      }
    });
  }

  // Scan QR codes from image data
  scanQRCode(imageData: ImageData): BarcodeResult | null {
    try {
      const qrResult = jsQR(imageData.data, imageData.width, imageData.height);
      
      if (qrResult) {
        return {
          code: qrResult.data,
          format: 'QR_CODE'
        };
      }
      
      return null;
    } catch (error) {
      console.error('QR scanning error:', error);
      return null;
    }
  }

  // Get image data from canvas for QR scanning
  getImageDataFromCanvas(canvas: HTMLCanvasElement): ImageData | null {
    try {
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      
      return ctx.getImageData(0, 0, canvas.width, canvas.height);
    } catch (error) {
      console.error('Error getting image data:', error);
      return null;
    }
  }

    // Stop Quagga scanning
  async stopQuagga(): Promise<void> {
    try {
      if (this.isInitialized) {
        const Quagga = (await import('quagga')).default;
        Quagga.stop();
        this.isInitialized = false;
      }
    } catch (error) {
      console.error('Error stopping Quagga:', error);
    }
  }

  // Fetch product data from OpenFoodFacts API
  async fetchProductData(barcode: string): Promise<ProductData | null> {
    try {
      const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: OpenFoodFactsResponse = await response.json();
      
      if (data.status === 1 && data.product) {
        return data.product;
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching product data:', error);
      return null;
    }
  }

  // Search products by name (fallback if barcode not found)
  async searchProducts(query: string, page: number = 1): Promise<ProductData[]> {
    try {
      const response = await fetch(
        `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&page=${page}&page_size=20&json=1`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      return data.products || [];
    } catch (error) {
      console.error('Error searching products:', error);
      return [];
    }
  }

  // Convert OpenFoodFacts nutrition data to our format
  convertToNutritionAnalysis(product: ProductData): {
    estimatedCalories: number;
    macronutrients: {
      carbs: number;
      protein: number;
      fat: number;
      fiber: number;
      sugar: number;
      saturatedFat: number;
      sodium: number;
    };
    servingSize: string;
    nutritionGrade: string;
  } {
    const nutriments = product.nutriments || {};
    
    return {
      estimatedCalories: Math.round(nutriments.energy_100g || 0),
      macronutrients: {
        carbs: Math.round((nutriments.carbohydrates_100g || 0) * 10) / 10,
        protein: Math.round((nutriments.proteins_100g || 0) * 10) / 10,
        fat: Math.round((nutriments.fat_100g || 0) * 10) / 10,
        fiber: Math.round((nutriments.fiber_100g || 0) * 10) / 10,
        sugar: Math.round((nutriments.sugars_100g || 0) * 10) / 10,
        saturatedFat: Math.round((nutriments['saturated-fat_100g'] || 0) * 10) / 10,
        sodium: Math.round((nutriments.sodium_100g || 0) * 1000) / 1000 // Convert to mg
      },
      servingSize: "per 100g",
      nutritionGrade: product.nutriscore_grade || 'unknown'
    };
  }

  // Analyze additives and processing level
  analyzeAdditives(product: ProductData): {
    additiveCount: number;
    harmfulAdditives: string[];
    processingLevel: 'MINIMAL' | 'MODERATE' | 'HIGHLY_PROCESSED';
    novaGroup: number;
  } {
    const additives = product.additives_tags || [];
    const novaGroup = product.nova_group || 1;
    
    // Common harmful additives to watch for
    const harmfulAdditivesList = [
      'E102', 'E104', 'E110', 'E122', 'E124', 'E129', // Artificial colors
      'E210', 'E211', 'E212', 'E213', // Preservatives
      'E621', 'E627', 'E631', // Flavor enhancers (MSG family)
      'E951', 'E952', 'E954', 'E955' // Artificial sweeteners
    ];
    
    const harmfulAdditives = additives.filter(additive => 
      harmfulAdditivesList.some(harmful => additive.includes(harmful))
    );

    let processingLevel: 'MINIMAL' | 'MODERATE' | 'HIGHLY_PROCESSED' = 'MINIMAL';
    
    if (novaGroup >= 4) {
      processingLevel = 'HIGHLY_PROCESSED';
    } else if (novaGroup === 3) {
      processingLevel = 'MODERATE';
    } else if (novaGroup <= 2) {
      processingLevel = 'MINIMAL';
    }

    return {
      additiveCount: additives.length,
      harmfulAdditives,
      processingLevel,
      novaGroup
    };
  }

  // Validate barcode format
  isValidBarcode(code: string): boolean {
    // Common barcode formats
    const barcodeRegex = /^(\d{8}|\d{12}|\d{13}|\d{14})$/;
    return barcodeRegex.test(code);
  }

  // Get barcode type from format
  getBarcodeType(format: string): string {
    const types: { [key: string]: string } = {
      'code_128': 'Code 128',
      'ean_reader': 'EAN-13',
      'ean_8_reader': 'EAN-8',
      'upc_reader': 'UPC-A',
      'upc_e_reader': 'UPC-E',
      'QR_CODE': 'QR Code'
    };
    
    return types[format] || format;
  }
}

export const barcodeService = new BarcodeService();
