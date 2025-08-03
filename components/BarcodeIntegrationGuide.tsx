import React, { useState } from 'react';
import { BarcodeService, ProductData } from '../services/barcodeService';

interface BarcodeIntegrationGuideProps {
  isDarkMode?: boolean;
}

const BarcodeIntegrationGuide: React.FC<BarcodeIntegrationGuideProps> = ({ isDarkMode = false }) => {
  const [testResult, setTestResult] = useState<ProductData | null>(null);
  const [loading, setLoading] = useState(false);

  const barcodeService = new BarcodeService();

  // Popular test barcodes with real products
  const testBarcodes = [
    { 
      code: '3017620425400', 
      name: 'Nutella', 
      description: 'Hazelnut spread with cocoa',
      country: 'France'
    },
    { 
      code: '7622210233257', 
      name: 'Oreo Original', 
      description: 'Chocolate sandwich cookies',
      country: 'Europe'
    },
    { 
      code: '8076809513394', 
      name: 'Barilla Spaghetti', 
      description: 'Italian pasta',
      country: 'Italy'
    },
    { 
      code: '0012000073496', 
      name: 'Coca-Cola', 
      description: 'Carbonated soft drink',
      country: 'USA'
    },
    { 
      code: '4002359003004', 
      name: 'Kinder Bueno', 
      description: 'Milk chocolate bar',
      country: 'Germany'
    },
    { 
      code: '3088350002019', 
      name: 'President Camembert', 
      description: 'French cheese',
      country: 'France'
    }
  ];

  const testBarcode = async (barcode: string) => {
    setLoading(true);
    try {
      const result = await barcodeService.fetchProductData(barcode);
      setTestResult(result);
    } catch (error) {
      console.error('Test failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatNutritionData = (nutriments: any) => {
    if (!nutriments) return null;

    return {
      energy: Math.round((nutriments.energy_100g || 0) / 4.184), // Convert kJ to kcal
      protein: (nutriments.proteins_100g || 0).toFixed(1),
      carbs: (nutriments.carbohydrates_100g || 0).toFixed(1),
      sugar: (nutriments.sugars_100g || 0).toFixed(1),
      fat: (nutriments.fat_100g || 0).toFixed(1),
      saturatedFat: (nutriments['saturated-fat_100g'] || 0).toFixed(1),
      fiber: (nutriments.fiber_100g || 0).toFixed(1),
      sodium: ((nutriments.sodium_100g || 0) * 1000).toFixed(0), // Convert to mg
      salt: (nutriments.salt_100g || 0).toFixed(1)
    };
  };

  const getNutritionGradeColor = (grade: string) => {
    switch (grade?.toLowerCase()) {
      case 'a': return 'bg-green-500 text-white';
      case 'b': return 'bg-lime-500 text-white';
      case 'c': return 'bg-yellow-500 text-black';
      case 'd': return 'bg-orange-500 text-white';
      case 'e': return 'bg-red-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getNovaGroupInfo = (novaGroup: number) => {
    switch (novaGroup) {
      case 1: return { label: 'Unprocessed/Minimally processed', color: 'text-green-600', bg: 'bg-green-100' };
      case 2: return { label: 'Processed culinary ingredients', color: 'text-yellow-600', bg: 'bg-yellow-100' };
      case 3: return { label: 'Processed foods', color: 'text-orange-600', bg: 'bg-orange-100' };
      case 4: return { label: 'Ultra-processed foods', color: 'text-red-600', bg: 'bg-red-100' };
      default: return { label: 'Unknown processing level', color: 'text-gray-600', bg: 'bg-gray-100' };
    }
  };

  return (
    <div className={`max-w-6xl mx-auto p-6 rounded-xl ${
      isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'
    }`}>
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-4">🔍 OpenFoodFacts Barcode Integration</h1>
        <p className="text-lg opacity-80">
          Scan any barcode to get detailed product information, nutrition data, and health insights
        </p>
      </div>

      {/* Integration Overview */}
      <div className={`mb-8 p-6 rounded-lg border ${
        isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-blue-50 border-blue-200'
      }`}>
        <h2 className="text-xl font-bold mb-4">🚀 How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className={`w-16 h-16 mx-auto mb-3 rounded-full flex items-center justify-center ${
              isDarkMode ? 'bg-blue-600' : 'bg-blue-500'
            } text-white`}>
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 5v4h4V5H3zm0 6v4h4v-4H3zm6-6v4h4V5H9zm6 0v4h4V5h-4zm-6 6v4h4v-4H9zm6 0v4h4v-4h-4z"/>
              </svg>
            </div>
            <h3 className="font-semibold mb-2">1. Scan Barcode</h3>
            <p className="text-sm opacity-75">User scans product barcode with camera</p>
          </div>
          <div className="text-center">
            <div className={`w-16 h-16 mx-auto mb-3 rounded-full flex items-center justify-center ${
              isDarkMode ? 'bg-green-600' : 'bg-green-500'
            } text-white`}>
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </div>
            <h3 className="font-semibold mb-2">2. API Call</h3>
            <p className="text-sm opacity-75">Fetch data from OpenFoodFacts database</p>
          </div>
          <div className="text-center">
            <div className={`w-16 h-16 mx-auto mb-3 rounded-full flex items-center justify-center ${
              isDarkMode ? 'bg-purple-600' : 'bg-purple-500'
            } text-white`}>
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 11H7v6h2v-6zm4 0h-2v6h2v-6zm4 0h-2v6h2v-6zm2.5-5L12 2 4.5 6v2h15V6z"/>
              </svg>
            </div>
            <h3 className="font-semibold mb-2">3. Process Data</h3>
            <p className="text-sm opacity-75">Convert to app format & analyze</p>
          </div>
          <div className="text-center">
            <div className={`w-16 h-16 mx-auto mb-3 rounded-full flex items-center justify-center ${
              isDarkMode ? 'bg-orange-600' : 'bg-orange-500'
            } text-white`}>
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
              </svg>
            </div>
            <h3 className="font-semibold mb-2">4. Show Results</h3>
            <p className="text-sm opacity-75">Display nutrition & health insights</p>
          </div>
        </div>
      </div>

      {/* Test Section */}
      <div className={`mb-8 p-6 rounded-lg border ${
        isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
      }`}>
        <h2 className="text-xl font-bold mb-4">🧪 Test Real Barcodes</h2>
        <p className="mb-4 opacity-80">Click any product below to test the OpenFoodFacts API integration:</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {testBarcodes.map((product) => (
            <button
              key={product.code}
              onClick={() => testBarcode(product.code)}
              disabled={loading}
              className={`p-4 rounded-lg border text-left transition-all transform hover:scale-105 active:scale-95 ${
                isDarkMode
                  ? 'bg-gray-600 border-gray-500 hover:bg-gray-500'
                  : 'bg-white border-gray-300 hover:bg-gray-50'
              } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="flex items-start space-x-3">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-white text-xs font-bold ${
                  ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500'][Math.floor(Math.random() * 6)]
                }`}>
                  {product.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">{product.name}</h3>
                  <p className="text-sm opacity-75 mb-1">{product.description}</p>
                  <div className="text-xs font-mono opacity-60">{product.code}</div>
                  <div className="text-xs opacity-50">{product.country}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Results Display */}
      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Fetching product data from OpenFoodFacts...</p>
        </div>
      )}

      {testResult && (
        <div className={`p-6 rounded-lg border ${
          isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'
        }`}>
          <h2 className="text-xl font-bold mb-4">📊 Product Details</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Basic Info */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Basic Information</h3>
              <div className="space-y-2">
                <div>
                  <strong>Product Name:</strong> {testResult.product_name || testResult.product_name_en || 'Unknown'}
                </div>
                <div>
                  <strong>Brand:</strong> {testResult.brands || 'Unknown'}
                </div>
                <div>
                  <strong>Categories:</strong> {testResult.categories || 'Unknown'}
                </div>
                <div>
                  <strong>Barcode:</strong> <code className="bg-gray-200 dark:bg-gray-800 px-2 py-1 rounded">{testResult.code}</code>
                </div>
                
                {/* Nutrition Grade */}
                <div className="flex items-center space-x-2">
                  <strong>Nutrition Grade:</strong>
                  <span className={`px-3 py-1 rounded font-bold text-sm ${getNutritionGradeColor(testResult.nutriscore_grade || '')}`}>
                    {testResult.nutriscore_grade?.toUpperCase() || 'N/A'}
                  </span>
                </div>
                
                {/* NOVA Group */}
                {testResult.nova_group && (
                  <div className="flex items-center space-x-2">
                    <strong>Processing Level:</strong>
                    <span className={`px-3 py-1 rounded text-sm font-medium ${getNovaGroupInfo(testResult.nova_group).bg} ${getNovaGroupInfo(testResult.nova_group).color}`}>
                      NOVA {testResult.nova_group} - {getNovaGroupInfo(testResult.nova_group).label}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Nutrition Facts */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Nutrition Facts (per 100g)</h3>
              {(() => {
                const nutrition = formatNutritionData(testResult.nutriments);
                return nutrition ? (
                  <div className={`grid grid-cols-2 gap-3 p-4 rounded-lg ${
                    isDarkMode ? 'bg-gray-800' : 'bg-gray-50'
                  }`}>
                    <div><strong>Energy:</strong> {nutrition.energy} kcal</div>
                    <div><strong>Protein:</strong> {nutrition.protein}g</div>
                    <div><strong>Carbohydrates:</strong> {nutrition.carbs}g</div>
                    <div><strong>- of which sugars:</strong> {nutrition.sugar}g</div>
                    <div><strong>Fat:</strong> {nutrition.fat}g</div>
                    <div><strong>- saturated:</strong> {nutrition.saturatedFat}g</div>
                    <div><strong>Fiber:</strong> {nutrition.fiber}g</div>
                    <div><strong>Sodium:</strong> {nutrition.sodium}mg</div>
                  </div>
                ) : (
                  <p className="text-gray-500">No nutrition data available</p>
                );
              })()}
            </div>
          </div>

          {/* Ingredients */}
          {testResult.ingredients_text && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-3">Ingredients</h3>
              <p className={`p-4 rounded-lg text-sm leading-relaxed ${
                isDarkMode ? 'bg-gray-800' : 'bg-gray-50'
              }`}>
                {testResult.ingredients_text}
              </p>
            </div>
          )}

          {/* Product Image */}
          {testResult.image_front_url && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-3">Product Image</h3>
              <img 
                src={testResult.image_front_url} 
                alt="Product" 
                className="max-w-64 rounded-lg border"
              />
            </div>
          )}

          {/* Additional Info */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            {testResult.allergens && (
              <div>
                <h4 className="font-semibold mb-2">Allergens</h4>
                <p className="text-sm">{testResult.allergens}</p>
              </div>
            )}
            
            {testResult.additives_tags && testResult.additives_tags.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Additives ({testResult.additives_tags.length})</h4>
                <div className="text-xs space-y-1">
                  {testResult.additives_tags.slice(0, 5).map((additive, index) => (
                    <div key={index} className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
                      {additive.replace('en:', '')}
                    </div>
                  ))}
                  {testResult.additives_tags.length > 5 && (
                    <div className="text-xs opacity-60">
                      +{testResult.additives_tags.length - 5} more additives
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* API Documentation */}
      <div className={`mt-8 p-6 rounded-lg border ${
        isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-blue-50 border-blue-200'
      }`}>
        <h2 className="text-xl font-bold mb-4">📚 API Documentation</h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Endpoint</h3>
            <code className={`block p-3 rounded text-sm ${
              isDarkMode ? 'bg-gray-800' : 'bg-white'
            }`}>
              GET https://world.openfoodfacts.org/api/v0/product/{'{barcode}'}.json
            </code>
          </div>
          
          <div>
            <h3 className="font-semibold mb-2">Key Features</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li><strong>No API Key Required:</strong> Completely free and open</li>
              <li><strong>Global Database:</strong> 2.8M+ products worldwide</li>
              <li><strong>Rich Data:</strong> Nutrition, ingredients, allergens, labels</li>
              <li><strong>Real-time Updates:</strong> Community-driven content</li>
              <li><strong>Multiple Languages:</strong> Product names in various languages</li>
              <li><strong>Image Support:</strong> Product photos and packaging</li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mb-2">Data Available</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
              <div>• Product name</div>
              <div>• Brand information</div>
              <div>• Nutrition facts</div>
              <div>• Ingredients list</div>
              <div>• Allergen info</div>
              <div>• Nutri-Score grade</div>
              <div>• NOVA processing level</div>
              <div>• Categories & labels</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BarcodeIntegrationGuide;
