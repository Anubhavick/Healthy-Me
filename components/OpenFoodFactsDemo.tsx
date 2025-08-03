import React, { useState } from 'react';
import { BarcodeService, ProductData } from '../services/barcodeService';

interface OpenFoodFactsDemoProps {
  isDarkMode?: boolean;
}

const OpenFoodFactsDemo: React.FC<OpenFoodFactsDemoProps> = ({ isDarkMode = false }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [barcode, setBarcode] = useState('');
  const [searchResults, setSearchResults] = useState<ProductData[]>([]);
  const [productResult, setProductResult] = useState<ProductData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const barcodeService = new BarcodeService();

  // Test some popular barcodes
  const testBarcodes = [
    { code: '3017620425400', name: 'Nutella (France)' },
    { code: '7622210233257', name: 'Oreo Original (Europe)' },
    { code: '8076809513394', name: 'Barilla Pasta' },
    { code: '0012000073496', name: 'Coca-Cola' },
    { code: '4013549369309', name: 'Ferrero Rocher' }
  ];

  const handleBarcodeSearch = async (testBarcode?: string) => {
    const searchBarcode = testBarcode || barcode;
    if (!searchBarcode) return;

    setLoading(true);
    setError(null);
    setProductResult(null);

    try {
      const result = await barcodeService.fetchProductData(searchBarcode);
      if (result) {
        setProductResult(result);
      } else {
        setError('Product not found in OpenFoodFacts database');
      }
    } catch (err) {
      setError('Error fetching product data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery) return;

    setLoading(true);
    setError(null);
    setSearchResults([]);

    try {
      const results = await barcodeService.searchProducts(searchQuery);
      setSearchResults(results.slice(0, 5)); // Show first 5 results
    } catch (err) {
      setError('Error searching products');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatNutrition = (nutriments: any) => {
    if (!nutriments) return 'No nutrition data';
    
    return (
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>Energy: {Math.round(nutriments.energy_100g || 0)} kJ</div>
        <div>Calories: {Math.round((nutriments.energy_100g || 0) / 4.184)} kcal</div>
        <div>Protein: {(nutriments.proteins_100g || 0).toFixed(1)}g</div>
        <div>Carbs: {(nutriments.carbohydrates_100g || 0).toFixed(1)}g</div>
        <div>Fat: {(nutriments.fat_100g || 0).toFixed(1)}g</div>
        <div>Sugar: {(nutriments.sugars_100g || 0).toFixed(1)}g</div>
        <div>Fiber: {(nutriments.fiber_100g || 0).toFixed(1)}g</div>
        <div>Sodium: {((nutriments.sodium_100g || 0) * 1000).toFixed(0)}mg</div>
      </div>
    );
  };

  return (
    <div className={`p-6 rounded-xl border ${
      isDarkMode 
        ? 'bg-gray-800 border-gray-600 text-white' 
        : 'bg-white border-gray-200 text-gray-800'
    }`}>
      <h2 className="text-2xl font-bold mb-6">OpenFoodFacts API Demo</h2>
      
      {/* Test Barcodes Section */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4">Test with Sample Barcodes</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {testBarcodes.map((item) => (
            <button
              key={item.code}
              onClick={() => handleBarcodeSearch(item.code)}
              className={`p-3 rounded-lg border text-left transition-colors ${
                isDarkMode
                  ? 'bg-gray-700 border-gray-600 hover:bg-gray-600'
                  : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
              }`}
            >
              <div className="font-mono text-sm">{item.code}</div>
              <div className="text-xs opacity-75">{item.name}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Manual Barcode Input */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-4">Search by Barcode</h3>
        <div className="flex gap-3">
          <input
            type="text"
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            placeholder="Enter barcode (e.g., 3017620425400)"
            className={`flex-1 p-3 rounded-lg border ${
              isDarkMode
                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                : 'bg-white border-gray-300 text-gray-800 placeholder-gray-500'
            }`}
          />
          <button
            onClick={() => handleBarcodeSearch()}
            disabled={!barcode || loading}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              isDarkMode
                ? 'bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600'
                : 'bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300'
            } text-white disabled:cursor-not-allowed`}
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </div>

      {/* Product Name Search */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-4">Search by Product Name</h3>
        <div className="flex gap-3">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Enter product name (e.g., nutella, coca cola)"
            className={`flex-1 p-3 rounded-lg border ${
              isDarkMode
                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                : 'bg-white border-gray-300 text-gray-800 placeholder-gray-500'
            }`}
          />
          <button
            onClick={handleSearch}
            disabled={!searchQuery || loading}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              isDarkMode
                ? 'bg-green-600 hover:bg-green-700 disabled:bg-gray-600'
                : 'bg-green-500 hover:bg-green-600 disabled:bg-gray-300'
            } text-white disabled:cursor-not-allowed`}
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-500/20 border border-red-500/50 text-red-200">
          {error}
        </div>
      )}

      {/* Product Result */}
      {productResult && (
        <div className={`mb-6 p-6 rounded-xl border ${
          isDarkMode 
            ? 'bg-gray-700 border-gray-600' 
            : 'bg-gray-50 border-gray-200'
        }`}>
          <h3 className="text-xl font-bold mb-4">Product Details</h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <div className="mb-4">
                <strong>Name:</strong> {productResult.product_name || productResult.product_name_en || 'Unknown'}
              </div>
              <div className="mb-4">
                <strong>Brand:</strong> {productResult.brands || 'Unknown'}
              </div>
              <div className="mb-4">
                <strong>Categories:</strong> {productResult.categories || 'Unknown'}
              </div>
              <div className="mb-4">
                <strong>Nutrition Grade:</strong> 
                <span className={`ml-2 px-2 py-1 rounded text-xs font-bold ${
                  productResult.nutriscore_grade === 'a' ? 'bg-green-500 text-white' :
                  productResult.nutriscore_grade === 'b' ? 'bg-lime-500 text-white' :
                  productResult.nutriscore_grade === 'c' ? 'bg-yellow-500 text-black' :
                  productResult.nutriscore_grade === 'd' ? 'bg-orange-500 text-white' :
                  productResult.nutriscore_grade === 'e' ? 'bg-red-500 text-white' :
                  'bg-gray-500 text-white'
                }`}>
                  {productResult.nutriscore_grade?.toUpperCase() || 'N/A'}
                </span>
              </div>
              <div className="mb-4">
                <strong>NOVA Group:</strong> {productResult.nova_group || 'Unknown'} 
                <span className="text-sm opacity-75 ml-2">
                  (Processing level: {
                    productResult.nova_group === 1 ? 'Unprocessed' :
                    productResult.nova_group === 2 ? 'Processed culinary ingredients' :
                    productResult.nova_group === 3 ? 'Processed foods' :
                    productResult.nova_group === 4 ? 'Ultra-processed foods' : 'Unknown'
                  })
                </span>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-3">Nutrition (per 100g)</h4>
              {formatNutrition(productResult.nutriments)}
            </div>
          </div>

          {productResult.ingredients_text && (
            <div className="mt-4">
              <strong>Ingredients:</strong>
              <p className="mt-2 text-sm opacity-90">{productResult.ingredients_text}</p>
            </div>
          )}

          {productResult.image_front_url && (
            <div className="mt-4">
              <strong>Product Image:</strong>
              <img 
                src={productResult.image_front_url} 
                alt="Product" 
                className="mt-2 max-w-48 rounded-lg border"
              />
            </div>
          )}
        </div>
      )}

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className={`p-6 rounded-xl border ${
          isDarkMode 
            ? 'bg-gray-700 border-gray-600' 
            : 'bg-gray-50 border-gray-200'
        }`}>
          <h3 className="text-xl font-bold mb-4">Search Results</h3>
          <div className="space-y-4">
            {searchResults.map((product, index) => (
              <div 
                key={product.code || index}
                className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                  isDarkMode
                    ? 'bg-gray-600 border-gray-500 hover:bg-gray-500'
                    : 'bg-white border-gray-200 hover:bg-gray-50'
                }`}
                onClick={() => setProductResult(product)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-semibold">{product.product_name || product.product_name_en}</div>
                    <div className="text-sm opacity-75">{product.brands}</div>
                    <div className="text-xs opacity-60 font-mono">{product.code}</div>
                  </div>
                  {product.nutriscore_grade && (
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      product.nutriscore_grade === 'a' ? 'bg-green-500 text-white' :
                      product.nutriscore_grade === 'b' ? 'bg-lime-500 text-white' :
                      product.nutriscore_grade === 'c' ? 'bg-yellow-500 text-black' :
                      product.nutriscore_grade === 'd' ? 'bg-orange-500 text-white' :
                      product.nutriscore_grade === 'e' ? 'bg-red-500 text-white' :
                      'bg-gray-500 text-white'
                    }`}>
                      {product.nutriscore_grade.toUpperCase()}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* API Information */}
      <div className={`mt-8 p-4 rounded-lg border ${
        isDarkMode 
          ? 'bg-blue-900/30 border-blue-700' 
          : 'bg-blue-50 border-blue-200'
      }`}>
        <h4 className="font-semibold mb-2">OpenFoodFacts API Info</h4>
        <ul className="text-sm space-y-1">
          <li>• <strong>Free API:</strong> No registration or API key required</li>
          <li>• <strong>Global Database:</strong> 2.8M+ products worldwide</li>
          <li>• <strong>Open Source:</strong> Community-driven and transparent</li>
          <li>• <strong>Real-time Data:</strong> Updated continuously by users</li>
          <li>• <strong>Rich Data:</strong> Nutrition, ingredients, allergens, labels</li>
        </ul>
      </div>
    </div>
  );
};

export default OpenFoodFactsDemo;
