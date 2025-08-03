
import React from 'react';
import { AnalysisResult as AnalysisResultType } from '../types';
import { CheckCircleIcon, XCircleIcon, SparklesIcon } from './icons';

interface ProductDisplay {
  productName?: string;
  brands?: string;
  imageUrl?: string;
  nutritionGrade?: string;
  categories?: string;
  isBarcode?: boolean;
  barcodeData?: any; // OpenFoodFacts product data
}

interface AnalysisResultProps {
  result: AnalysisResultType;
  onShare?: () => void;
  productDisplay?: ProductDisplay;
}

const StatCard: React.FC<{ title: string; value: string | number; children?: React.ReactNode }> = ({ title, value, children }) => (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        <p className="mt-1 text-3xl font-semibold text-gray-900">{value}</p>
        {children}
    </div>
);

const NutritionCard: React.FC<{ 
  title: string; 
  value: number; 
  unit: string; 
  color?: string;
  isDarkMode?: boolean;
}> = ({ title, value, unit, color = 'blue', isDarkMode = false }) => (
  <div className={`p-4 rounded-lg shadow-sm border ${
    isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
  }`}>
    <h3 className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>{title}</h3>
    <div className="flex items-baseline mt-1">
      <p className={`text-2xl font-bold ${
        color === 'green' ? 'text-green-600' :
        color === 'blue' ? 'text-blue-600' :
        color === 'orange' ? 'text-orange-600' :
        color === 'red' ? 'text-red-600' :
        isDarkMode ? 'text-white' : 'text-gray-900'
      }`}>
        {Math.round(value * 10) / 10}
      </p>
      <span className={`ml-1 text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
        {unit}
      </span>
    </div>
  </div>
);

const HealthScoreCard: React.FC<{ score: number }> = ({ score }) => {
  const getScoreColor = (score: number) => {
    if (score >= 16) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 13) return 'text-lime-600 bg-lime-50 border-lime-200';
    if (score >= 10) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    if (score >= 7) return 'text-orange-600 bg-orange-50 border-orange-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 16) return 'Excellent';
    if (score >= 13) return 'Good';
    if (score >= 10) return 'Fair';
    if (score >= 7) return 'Poor';
    return 'Very Poor';
  };

  return (
    <div className={`p-4 rounded-lg shadow-sm border ${getScoreColor(score)}`}>
      <h3 className="text-sm font-medium text-gray-500">Health Score</h3>
      <div className="flex items-center mt-1">
        <p className="text-3xl font-semibold">{score}</p>
        <span className="text-lg font-medium ml-2">/20</span>
      </div>
      <p className="text-sm font-medium mt-1">{getScoreLabel(score)}</p>
      
      <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
        <div 
          className={`h-2 rounded-full transition-all duration-500 ${
            score >= 16 ? 'bg-green-600' : 
            score >= 13 ? 'bg-lime-600' : 
            score >= 10 ? 'bg-yellow-600' : 
            score >= 7 ? 'bg-orange-600' : 'bg-red-600'
          }`}
          style={{ width: `${(score / 20) * 100}%` }}
        ></div>
      </div>
      {score <= 10 && (
        <p className="text-xs text-gray-500 mt-2">
          ⚠️ Consider healthier alternatives
        </p>
      )}
    </div>
  );
};


const AnalysisResult: React.FC<AnalysisResultProps> = ({ result, onShare, productDisplay }) => {
  const { isCompatible, reason } = result.dietCompatibility;
  
  const calculateHealthScore = () => {
    // Start with the chemical safety score as the foundation (converted to 20-point scale)
    let score = result.chemicalAnalysis ? 
      Math.round((result.chemicalAnalysis.overallSafetyScore / 10) * 20) : 12;
    
    // If no chemical analysis, start from middle
    if (!result.chemicalAnalysis) {
      score = 12;
    }
    
    // Calorie adjustment (max ±3 points)
    const calories = result.estimatedCalories;
    if (calories <= 300) score += 2;
    else if (calories <= 500) score += 1;
    else if (calories > 800) score -= 2;
    else if (calories > 1200) score -= 3;
    
    // Diet compatibility (max ±2 points)
    if (isCompatible) score += 1;
    else score -= 2;
    
    // Chemical safety penalties (this is crucial for health)
    if (result.chemicalAnalysis) {
      const harmfulChemicals = result.chemicalAnalysis.harmfulChemicals;
      if (harmfulChemicals.length > 0) {
        // Heavy penalty for harmful chemicals
        const severeCount = harmfulChemicals.filter(c => c.riskLevel === 'SEVERE').length;
        const highCount = harmfulChemicals.filter(c => c.riskLevel === 'HIGH').length;
        const mediumCount = harmfulChemicals.filter(c => c.riskLevel === 'MEDIUM').length;
        
        score -= (severeCount * 4 + highCount * 3 + mediumCount * 1);
      }
      
      // Artificial ingredients penalty
      if (result.chemicalAnalysis.hasArtificialIngredients) score -= 2;
      
      // Organic bonus
      if (result.chemicalAnalysis.isOrganicCertified) score += 2;
      
      // Allergen penalties
      if (result.chemicalAnalysis.allergens.length > 0) {
        score -= result.chemicalAnalysis.allergens.length;
      }
    }
    
    // Processing level from TensorFlow (max ±2 points)
    if (result.tensorflowAnalysis) {
      switch (result.tensorflowAnalysis.qualityAssessment.processingLevel) {
        case 'MINIMAL':
          score += 2;
          break;
        case 'MODERATE':
          // No change
          break;
        case 'HIGHLY_PROCESSED':
          score -= 3;
          break;
      }
      
      // Quality bonus
      const quality = result.tensorflowAnalysis.qualityAssessment.overallQuality;
      if (quality >= 8) score += 1;
      else if (quality <= 4) score -= 1;
    }
    
    // Ensure score stays within bounds and reflects chemical safety
    const finalScore = Math.max(1, Math.min(20, Math.round(score)));
    
    // Additional check: if chemical safety is very low, cap the max score
    if (result.chemicalAnalysis && result.chemicalAnalysis.overallSafetyScore <= 5) {
      return Math.min(finalScore, 10); // Cap at 10 if safety is very poor
    }
    
    if (result.chemicalAnalysis && result.chemicalAnalysis.overallSafetyScore <= 7) {
      return Math.min(finalScore, 14); // Cap at 14 if safety is poor
    }
    
    return finalScore;
  };

  const healthScore = calculateHealthScore();
  
  // Check if this is a barcode product
  const isProduct = productDisplay?.isBarcode || false;
  
  return (
    <div className="space-y-6">
      {/* Enhanced Product Header for Barcode Items */}
      {isProduct && productDisplay ? (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl shadow-sm border border-blue-200">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Product Image */}
            <div className="flex-shrink-0">
              {productDisplay.imageUrl ? (
                <div className="relative">
                  <img 
                    src={productDisplay.imageUrl} 
                    alt={productDisplay.productName || 'Product'} 
                    className="w-32 h-32 md:w-40 md:h-40 object-cover rounded-lg shadow-md border border-gray-200"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                  <div className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                    📷 Product
                  </div>
                </div>
              ) : (
                <div className="w-32 h-32 md:w-40 md:h-40 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center border border-gray-300">
                  <div className="text-center text-gray-500">
                    <span className="text-3xl block mb-1">📦</span>
                    <span className="text-xs">No Image</span>
                  </div>
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-1 line-clamp-2">
                    {productDisplay.productName || result.dishName}
                  </h2>
                  {productDisplay.brands && (
                    <p className="text-lg text-blue-600 font-medium mb-2">
                      by {productDisplay.brands}
                    </p>
                  )}
                  {productDisplay.categories && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {productDisplay.categories.split(',').slice(0, 3).map((category, index) => (
                        <span key={index} className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">
                          {category.trim()}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2 ml-4">
                  {/* Nutrition Grade */}
                  {productDisplay.nutritionGrade && productDisplay.nutritionGrade !== 'unknown' && (
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg ${
                      productDisplay.nutritionGrade === 'a' ? 'bg-green-500' :
                      productDisplay.nutritionGrade === 'b' ? 'bg-lime-500' :
                      productDisplay.nutritionGrade === 'c' ? 'bg-yellow-500' :
                      productDisplay.nutritionGrade === 'd' ? 'bg-orange-500' :
                      productDisplay.nutritionGrade === 'e' ? 'bg-red-500' :
                      'bg-gray-400'
                    }`}>
                      {productDisplay.nutritionGrade.toUpperCase()}
                    </div>
                  )}
                  {onShare && (
                    <button
                      onClick={onShare}
                      className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold py-2 px-4 rounded-full hover:from-blue-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg shadow-blue-200/50 text-sm"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                      </svg>
                      Share
                    </button>
                  )}
                </div>
              </div>
              
              {/* Barcode Badge */}
              <div className="flex items-center gap-2 text-sm text-blue-600">
                <span className="bg-blue-100 px-2 py-1 rounded-full text-xs font-medium">
                  🏷️ Scanned Product
                </span>
                <span className="text-gray-400">•</span>
                <span>OpenFoodFacts Database</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Original Header for Photo Analysis */
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-800">{result.dishName}</h2>
          {onShare && (
            <button
              onClick={onShare}
              className="mt-4 inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold py-2 px-6 rounded-full hover:from-blue-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg shadow-blue-200/50"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
              </svg>
              Share Your Success
            </button>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Estimated Calories" value={result.estimatedCalories}>
            <p className="text-xs text-gray-500 mt-1">kcal</p>
        </StatCard>
        
        <HealthScoreCard score={healthScore} />
        
        <div className={`p-4 rounded-lg shadow-sm border flex items-center ${isCompatible ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            {isCompatible ? <CheckCircleIcon className="w-10 h-10 text-green-500 mr-4 flex-shrink-0"/> : <XCircleIcon className="w-10 h-10 text-red-500 mr-4 flex-shrink-0"/>}
            <div>
                <h3 className={`text-lg font-semibold ${isCompatible ? 'text-green-800' : 'text-red-800'}`}>
                    {isCompatible ? 'Diet Compatible' : 'Not Compatible'}
                </h3>
                <p className={`text-sm ${isCompatible ? 'text-green-700' : 'text-red-700'}`}>{reason}</p>
            </div>
        </div>
      </div>
      
      {/* Enhanced Nutrition Breakdown for Barcode Products */}
      {isProduct && result.nutritionalBreakdown && (
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-xl shadow-sm border border-indigo-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-xl text-indigo-800 flex items-center">
              📊 Detailed Nutrition (per 100g)
            </h3>
            {productDisplay?.nutritionGrade && productDisplay.nutritionGrade !== 'unknown' && (
              <div className="text-sm text-indigo-600">
                Nutri-Score: <span className={`font-bold px-2 py-1 rounded-full text-white ${
                  productDisplay.nutritionGrade === 'a' ? 'bg-green-500' :
                  productDisplay.nutritionGrade === 'b' ? 'bg-lime-500' :
                  productDisplay.nutritionGrade === 'c' ? 'bg-yellow-500' :
                  productDisplay.nutritionGrade === 'd' ? 'bg-orange-500' :
                  productDisplay.nutritionGrade === 'e' ? 'bg-red-500' :
                  'bg-gray-400'
                }`}>{productDisplay.nutritionGrade.toUpperCase()}</span>
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <NutritionCard 
              title="Carbohydrates" 
              value={result.nutritionalBreakdown.carbs} 
              unit="g" 
              color="blue"
            />
            <NutritionCard 
              title="Protein" 
              value={result.nutritionalBreakdown.protein} 
              unit="g" 
              color="green"
            />
            <NutritionCard 
              title="Fat" 
              value={result.nutritionalBreakdown.fat} 
              unit="g" 
              color="orange"
            />
            <NutritionCard 
              title="Fiber" 
              value={result.nutritionalBreakdown.fiber} 
              unit="g" 
              color="green"
            />
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <NutritionCard 
              title="Sugar" 
              value={result.nutritionalBreakdown.sugar} 
              unit="g" 
              color="red"
            />
            <NutritionCard 
              title="Sodium" 
              value={result.nutritionalBreakdown.sodium * 1000} 
              unit="mg" 
              color="red"
            />
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <h4 className="text-sm font-medium text-gray-500">Energy</h4>
              <div className="flex items-baseline mt-1">
                <p className="text-2xl font-bold text-purple-600">
                  {result.estimatedCalories}
                </p>
                <span className="ml-1 text-sm font-medium text-gray-500">kcal</span>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
        <h3 className="font-semibold text-lg text-gray-800 mb-3">Identified Ingredients</h3>
        <ul className="flex flex-wrap gap-2">
          {result.ingredients.map((ingredient, index) => (
            <li key={index} className="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-1 rounded-full">
              {ingredient}
            </li>
          ))}
        </ul>
      </div>

      {result.chemicalAnalysis && (
        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg text-gray-800 flex items-center">
              🧪 Safety Analysis
            </h3>
            <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
              result.chemicalAnalysis.overallSafetyScore >= 8 ? 'bg-green-100 text-green-800' :
              result.chemicalAnalysis.overallSafetyScore >= 6 ? 'bg-yellow-100 text-yellow-800' :
              result.chemicalAnalysis.overallSafetyScore >= 4 ? 'bg-orange-100 text-orange-800' :
              'bg-red-100 text-red-800'
            }`}>
              {result.chemicalAnalysis.overallSafetyScore}/10
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            <div className={`p-3 rounded-lg text-center ${
              result.chemicalAnalysis.isOrganicCertified ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'
            }`}>
              <div className="text-lg mb-1">{result.chemicalAnalysis.isOrganicCertified ? '🌱' : '🏭'}</div>
              <div className="text-sm font-medium">
                {result.chemicalAnalysis.isOrganicCertified ? 'Organic' : 'Conventional'}
              </div>
            </div>
            
            <div className={`p-3 rounded-lg text-center ${
              !result.chemicalAnalysis.hasArtificialIngredients ? 'bg-green-50 border border-green-200' : 'bg-orange-50 border border-orange-200'
            }`}>
              <div className="text-lg mb-1">{!result.chemicalAnalysis.hasArtificialIngredients ? '✅' : '⚠️'}</div>
              <div className="text-sm font-medium">
                {!result.chemicalAnalysis.hasArtificialIngredients ? 'Natural' : 'Artificial'}
              </div>
            </div>

            <div className={`p-3 rounded-lg text-center ${
              result.chemicalAnalysis.harmfulChemicals.length === 0 ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
            }`}>
              <div className="text-lg mb-1">{result.chemicalAnalysis.harmfulChemicals.length === 0 ? '🛡️' : '⚠️'}</div>
              <div className="text-sm font-medium">
                {result.chemicalAnalysis.harmfulChemicals.length === 0 ? 'Safe' : `${result.chemicalAnalysis.harmfulChemicals.length} Concerns`}
              </div>
            </div>
          </div>

          {result.chemicalAnalysis.harmfulChemicals.length > 0 && (
            <div className="space-y-2 mb-4">
              <h4 className="font-medium text-red-800 text-sm">⚠️ Safety Concerns:</h4>
              {result.chemicalAnalysis.harmfulChemicals.slice(0, 3).map((chemical, index) => (
                <div key={index} className="bg-red-50 border border-red-200 p-2 rounded text-sm">
                  <div className="flex justify-between items-start">
                    <span className="font-medium">{chemical.name}</span>
                    <span className={`px-2 py-0.5 text-xs font-bold rounded ${
                      chemical.riskLevel === 'HIGH' || chemical.riskLevel === 'SEVERE' ? 'bg-red-600 text-white' : 'bg-orange-600 text-white'
                    }`}>
                      {chemical.riskLevel}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">{chemical.description}</p>
                </div>
              ))}
              {result.chemicalAnalysis.harmfulChemicals.length > 3 && (
                <p className="text-xs text-gray-500">+ {result.chemicalAnalysis.harmfulChemicals.length - 3} more concerns</p>
              )}
            </div>
          )}

          {result.chemicalAnalysis.allergens.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
              <h4 className="font-medium text-yellow-800 text-sm mb-2">🚫 Allergen Warning</h4>
              <div className="flex flex-wrap gap-1">
                {result.chemicalAnalysis.allergens.map((allergen, index) => (
                  <span key={index} className="bg-yellow-200 text-yellow-800 text-xs px-2 py-1 rounded">
                    {allergen.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {result.tensorflowAnalysis && (
        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg text-gray-800 flex items-center">
              🤖 Visual Analysis
            </h3>
            <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
              result.tensorflowAnalysis.qualityAssessment.overallQuality >= 8 ? 'bg-green-100 text-green-800' :
              result.tensorflowAnalysis.qualityAssessment.overallQuality >= 6 ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {result.tensorflowAnalysis.qualityAssessment.overallQuality}/10
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 text-center">
              <div className="text-lg mb-1">🍽️</div>
              <div className="text-xs font-medium text-blue-800">Portion</div>
              <div className="text-xs text-blue-700">{result.tensorflowAnalysis.visualAnalysis.portionSize}</div>
            </div>
            
            <div className="p-3 bg-green-50 rounded-lg border border-green-200 text-center">
              <div className="text-lg mb-1">�</div>
              <div className="text-xs font-medium text-green-800">Freshness</div>
              <div className="text-xs text-green-700">{result.tensorflowAnalysis.visualAnalysis.freshnessScore}/10</div>
            </div>
            
            <div className="p-3 bg-purple-50 rounded-lg border border-purple-200 text-center">
              <div className="text-lg mb-1">🔬</div>
              <div className="text-xs font-medium text-purple-800">Processing</div>
              <div className="text-xs text-purple-700">{result.tensorflowAnalysis.qualityAssessment.processingLevel}</div>
            </div>

            <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-center">
              <div className="text-lg mb-1">�</div>
              <div className="text-xs font-medium text-amber-800">Confidence</div>
              <div className="text-xs text-amber-700">{Math.round(result.tensorflowAnalysis.foodIdentification.confidence * 100)}%</div>
            </div>
          </div>

          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-sm">
              <span className="font-medium text-gray-700">Detected as:</span> {result.tensorflowAnalysis.foodIdentification.primaryFoodType}
            </div>
            {result.tensorflowAnalysis.foodIdentification.predictions.length > 1 && (
              <div className="text-xs text-gray-500 mt-1">
                Also matches: {result.tensorflowAnalysis.foodIdentification.predictions.slice(1, 3).map(p => p.className).join(', ')}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
        <h3 className="font-semibold text-lg text-gray-800 mb-3 flex items-center">
          <SparklesIcon className="w-5 h-5 mr-2 text-yellow-500" />
          Health Tips
        </h3>
        <ul className="space-y-2">
          {result.healthTips.map((tip, index) => (
            <li key={index} className="flex items-start">
              <span className="text-green-500 mr-2 mt-1">&#10003;</span>
              <p className="text-gray-600">{tip}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default AnalysisResult;
