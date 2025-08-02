
import React from 'react';
import { AnalysisResult as AnalysisResultType } from '../types';
import { CheckCircleIcon, XCircleIcon, SparklesIcon } from './icons';

interface AnalysisResultProps {
  result: AnalysisResultType;
}

const StatCard: React.FC<{ title: string; value: string | number; children?: React.ReactNode }> = ({ title, value, children }) => (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        <p className="mt-1 text-3xl font-semibold text-gray-900">{value}</p>
        {children}
    </div>
);

const HealthScoreCard: React.FC<{ score: number }> = ({ score }) => {
  const getScoreColor = (score: number) => {
    if (score >= 16) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 12) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    if (score >= 8) return 'text-orange-600 bg-orange-50 border-orange-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 16) return 'Excellent';
    if (score >= 12) return 'Good';
    if (score >= 8) return 'Fair';
    return 'Poor';
  };

  return (
    <div className={`p-4 rounded-lg shadow-sm border ${getScoreColor(score)}`}>
      <h3 className="text-sm font-medium text-gray-500">Health Score</h3>
      <div className="flex items-center mt-1">
        <p className="text-3xl font-semibold">{score}</p>
        <span className="text-lg font-medium ml-2">/20</span>
      </div>
      <p className="text-sm font-medium mt-1">{getScoreLabel(score)}</p>
      
      {/* Score bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
        <div 
          className={`h-2 rounded-full transition-all duration-500 ${
            score >= 16 ? 'bg-green-600' : 
            score >= 12 ? 'bg-yellow-600' : 
            score >= 8 ? 'bg-orange-600' : 'bg-red-600'
          }`}
          style={{ width: `${(score / 20) * 100}%` }}
        ></div>
      </div>
    </div>
  );
};


const AnalysisResult: React.FC<AnalysisResultProps> = ({ result }) => {
  const { isCompatible, reason } = result.dietCompatibility;
  
  // Calculate health score based on calories, ingredients, diet compatibility, and chemical safety
  const calculateHealthScore = () => {
    let score = 10; // Base score
    
    // Calorie assessment (adjust based on reasonable ranges)
    const calories = result.estimatedCalories;
    if (calories <= 400) score += 3; // Light meal
    else if (calories <= 600) score += 4; // Moderate meal
    else if (calories <= 800) score += 2; // Heavy meal
    else score -= 2; // Very heavy meal
    
    // Ingredient quality (more ingredients often means more complex/nutritious)
    const ingredientCount = result.ingredients.length;
    if (ingredientCount >= 5) score += 3;
    else if (ingredientCount >= 3) score += 2;
    else score += 1;
    
    // Diet compatibility
    if (isCompatible) score += 3;
    else score -= 1;
    
    // Chemical safety analysis
    if (result.chemicalAnalysis) {
      // Safety score contribution (0-2 points)
      score += Math.floor(result.chemicalAnalysis.overallSafetyScore / 5);
      
      // Penalty for harmful chemicals
      if (result.chemicalAnalysis.harmfulChemicals.length > 0) {
        const severeChemicals = result.chemicalAnalysis.harmfulChemicals.filter(c => c.riskLevel === 'SEVERE');
        const highRiskChemicals = result.chemicalAnalysis.harmfulChemicals.filter(c => c.riskLevel === 'HIGH');
        score -= (severeChemicals.length * 3 + highRiskChemicals.length * 2);
      }
      
      // Bonus for organic certification
      if (result.chemicalAnalysis.isOrganicCertified) score += 2;
      
      // Penalty for artificial ingredients
      if (result.chemicalAnalysis.hasArtificialIngredients) score -= 1;
      
      // Penalty for harmful additives
      const harmfulAdditives = result.chemicalAnalysis.additives.filter(a => a.safetyRating === 'AVOID');
      score -= harmfulAdditives.length;
    }
    
    // TensorFlow analysis contribution
    if (result.tensorflowAnalysis) {
      // Quality bonus
      score += Math.floor(result.tensorflowAnalysis.qualityAssessment.overallQuality / 3);
      
      // Processing level penalty/bonus
      switch (result.tensorflowAnalysis.qualityAssessment.processingLevel) {
        case 'MINIMAL':
          score += 2;
          break;
        case 'MODERATE':
          // No change
          break;
        case 'HIGHLY_PROCESSED':
          score -= 2;
          break;
      }
      
      // Freshness bonus
      if (result.tensorflowAnalysis.visualAnalysis.freshnessScore >= 8) score += 1;
      else if (result.tensorflowAnalysis.visualAnalysis.freshnessScore <= 5) score -= 1;
      
      // Portion size consideration
      if (result.tensorflowAnalysis.visualAnalysis.portionSize === 'EXTRA_LARGE') score -= 1;
      else if (result.tensorflowAnalysis.visualAnalysis.portionSize === 'SMALL') score += 1;
      
      // Naturalness bonus
      if (result.tensorflowAnalysis.qualityAssessment.naturalness >= 8) score += 1;
      else if (result.tensorflowAnalysis.qualityAssessment.naturalness <= 4) score -= 2;
    }
    
    // Health tips bonus (more tips = more areas for improvement = lower base health)
    if (result.healthTips.length <= 2) score += 2;
    else if (result.healthTips.length <= 4) score += 1;
    
    return Math.max(1, Math.min(20, score)); // Ensure score is between 1-20
  };

  const healthScore = calculateHealthScore();
  
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-800">{result.dishName}</h2>
      </div>

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

      {/* Chemical Analysis Section */}
      {result.chemicalAnalysis && (
        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg text-gray-800 flex items-center">
              🧪 Chemical & Safety Analysis
            </h3>
            <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
              result.chemicalAnalysis.overallSafetyScore >= 8 ? 'bg-green-100 text-green-800' :
              result.chemicalAnalysis.overallSafetyScore >= 6 ? 'bg-yellow-100 text-yellow-800' :
              result.chemicalAnalysis.overallSafetyScore >= 4 ? 'bg-orange-100 text-orange-800' :
              'bg-red-100 text-red-800'
            }`}>
              Safety Score: {result.chemicalAnalysis.overallSafetyScore}/10
            </div>
          </div>

          {/* Safety Indicators */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className={`p-3 rounded-lg border ${
              result.chemicalAnalysis.isOrganicCertified ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
            }`}>
              <div className="flex items-center">
                <span className="text-xl mr-2">{result.chemicalAnalysis.isOrganicCertified ? '🌱' : '🏭'}</span>
                <span className={`font-medium ${result.chemicalAnalysis.isOrganicCertified ? 'text-green-800' : 'text-gray-600'}`}>
                  {result.chemicalAnalysis.isOrganicCertified ? 'Organic Certified' : 'Conventional'}
                </span>
              </div>
            </div>
            <div className={`p-3 rounded-lg border ${
              !result.chemicalAnalysis.hasArtificialIngredients ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'
            }`}>
              <div className="flex items-center">
                <span className="text-xl mr-2">{!result.chemicalAnalysis.hasArtificialIngredients ? '✅' : '⚠️'}</span>
                <span className={`font-medium ${!result.chemicalAnalysis.hasArtificialIngredients ? 'text-green-800' : 'text-orange-800'}`}>
                  {!result.chemicalAnalysis.hasArtificialIngredients ? 'No Artificial Ingredients' : 'Contains Artificial Ingredients'}
                </span>
              </div>
            </div>
          </div>

          {/* Harmful Chemicals */}
          {result.chemicalAnalysis.harmfulChemicals.length > 0 && (
            <div className="mb-4">
              <h4 className="font-semibold text-red-800 mb-2 flex items-center">
                ⚠️ Harmful Chemicals Detected
              </h4>
              <div className="space-y-2">
                {result.chemicalAnalysis.harmfulChemicals.map((chemical, index) => (
                  <div key={index} className={`p-3 rounded-lg border ${
                    chemical.riskLevel === 'SEVERE' ? 'bg-red-50 border-red-300' :
                    chemical.riskLevel === 'HIGH' ? 'bg-red-50 border-red-200' :
                    chemical.riskLevel === 'MEDIUM' ? 'bg-orange-50 border-orange-200' :
                    'bg-yellow-50 border-yellow-200'
                  }`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-1">
                          <span className="font-semibold text-gray-900">{chemical.name}</span>
                          <span className={`ml-2 px-2 py-1 text-xs font-bold rounded ${
                            chemical.riskLevel === 'SEVERE' ? 'bg-red-600 text-white' :
                            chemical.riskLevel === 'HIGH' ? 'bg-red-500 text-white' :
                            chemical.riskLevel === 'MEDIUM' ? 'bg-orange-500 text-white' :
                            'bg-yellow-500 text-white'
                          }`}>
                            {chemical.riskLevel}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{chemical.description}</p>
                        <div className="text-xs text-gray-500">
                          <strong>Health Effects:</strong> {chemical.healthEffects.join(', ')}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Additives */}
          {result.chemicalAnalysis.additives.length > 0 && (
            <div className="mb-4">
              <h4 className="font-semibold text-blue-800 mb-2 flex items-center">
                🧬 Food Additives
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {result.chemicalAnalysis.additives.map((additive, index) => (
                  <div key={index} className={`p-2 rounded border text-sm ${
                    additive.safetyRating === 'AVOID' ? 'bg-red-50 border-red-200' :
                    additive.safetyRating === 'CAUTION' ? 'bg-yellow-50 border-yellow-200' :
                    'bg-green-50 border-green-200'
                  }`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-medium">{additive.name}</span>
                        {additive.eNumber && <span className="text-gray-500 ml-1">({additive.eNumber})</span>}
                        <div className="text-xs text-gray-600">{additive.type.replace(/_/g, ' ')}</div>
                      </div>
                      <span className={`px-1 py-0.5 text-xs font-bold rounded ${
                        additive.safetyRating === 'AVOID' ? 'bg-red-600 text-white' :
                        additive.safetyRating === 'CAUTION' ? 'bg-yellow-600 text-white' :
                        'bg-green-600 text-white'
                      }`}>
                        {additive.safetyRating}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Allergens */}
          {result.chemicalAnalysis.allergens.length > 0 && (
            <div className="mb-4">
              <h4 className="font-semibold text-purple-800 mb-2 flex items-center">
                🚫 Allergen Warning
              </h4>
              <div className="space-y-2">
                {result.chemicalAnalysis.allergens.map((allergen, index) => (
                  <div key={index} className={`p-3 rounded-lg border ${
                    allergen.severity === 'SEVERE' ? 'bg-red-50 border-red-300' :
                    allergen.severity === 'MODERATE' ? 'bg-orange-50 border-orange-200' :
                    'bg-yellow-50 border-yellow-200'
                  }`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-gray-900">{allergen.name}</span>
                      <span className={`px-2 py-1 text-xs font-bold rounded ${
                        allergen.severity === 'SEVERE' ? 'bg-red-600 text-white' :
                        allergen.severity === 'MODERATE' ? 'bg-orange-600 text-white' :
                        'bg-yellow-600 text-white'
                      }`}>
                        {allergen.severity}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600">
                      <strong>Common Reactions:</strong> {allergen.commonReactions.join(', ')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No Issues Found */}
          {result.chemicalAnalysis.harmfulChemicals.length === 0 && 
           result.chemicalAnalysis.additives.filter(a => a.safetyRating !== 'SAFE').length === 0 && 
           result.chemicalAnalysis.allergens.length === 0 && (
            <div className="bg-green-50 border border-green-200 p-4 rounded-lg text-center">
              <span className="text-4xl mb-2 block">✅</span>
              <p className="font-semibold text-green-800">No harmful chemicals or major allergens detected!</p>
              <p className="text-sm text-green-600 mt-1">This product appears to be safe for consumption.</p>
            </div>
          )}
        </div>
      )}

      {/* TensorFlow Analysis Section */}
      {result.tensorflowAnalysis && (
        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg text-gray-800 flex items-center">
              🤖 AI Visual Analysis
            </h3>
            <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
              result.tensorflowAnalysis.qualityAssessment.overallQuality >= 8 ? 'bg-green-100 text-green-800' :
              result.tensorflowAnalysis.qualityAssessment.overallQuality >= 6 ? 'bg-yellow-100 text-yellow-800' :
              result.tensorflowAnalysis.qualityAssessment.overallQuality >= 4 ? 'bg-orange-100 text-orange-800' :
              'bg-red-100 text-red-800'
            }`}>
              Quality: {result.tensorflowAnalysis.qualityAssessment.overallQuality}/10
            </div>
          </div>

          {/* Food Identification */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-800 mb-2">🔍 Food Type Detected</h4>
              <div className="space-y-1">
                <div className="text-sm">
                  <span className="font-medium">Primary Type:</span> {result.tensorflowAnalysis.foodIdentification.primaryFoodType}
                </div>
                <div className="text-sm">
                  <span className="font-medium">Confidence:</span> {Math.round(result.tensorflowAnalysis.foodIdentification.confidence * 100)}%
                </div>
                <div className="text-xs text-blue-600 mt-2">
                  <strong>Top Predictions:</strong>
                  <ul className="mt-1">
                    {result.tensorflowAnalysis.foodIdentification.predictions.slice(0, 3).map((pred, i) => (
                      <li key={i}>• {pred.className} ({Math.round(pred.probability * 100)}%)</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
              <h4 className="font-semibold text-purple-800 mb-2">📊 Enhanced Nutrition</h4>
              <div className="space-y-1 text-sm">
                <div><span className="font-medium">Calories:</span> {result.tensorflowAnalysis.nutritionalEstimation.estimatedCalories} kcal</div>
                <div><span className="font-medium">Carbs:</span> {result.tensorflowAnalysis.nutritionalEstimation.macronutrients.carbs}g</div>
                <div><span className="font-medium">Protein:</span> {result.tensorflowAnalysis.nutritionalEstimation.macronutrients.protein}g</div>
                <div><span className="font-medium">Fat:</span> {result.tensorflowAnalysis.nutritionalEstimation.macronutrients.fat}g</div>
                <div><span className="font-medium">Fiber:</span> {result.tensorflowAnalysis.nutritionalEstimation.macronutrients.fiber}g</div>
                <div className="text-xs text-purple-600 mt-2">
                  Confidence: {Math.round(result.tensorflowAnalysis.nutritionalEstimation.confidenceLevel * 100)}%
                </div>
              </div>
            </div>
          </div>

          {/* Visual Characteristics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="p-3 bg-orange-50 rounded-lg border border-orange-200 text-center">
              <div className="text-2xl mb-1">🍽️</div>
              <div className="font-semibold text-orange-800">Portion Size</div>
              <div className="text-sm text-orange-700">{result.tensorflowAnalysis.visualAnalysis.portionSize}</div>
            </div>
            
            <div className="p-3 bg-green-50 rounded-lg border border-green-200 text-center">
              <div className="text-2xl mb-1">🌿</div>
              <div className="font-semibold text-green-800">Freshness</div>
              <div className="text-sm text-green-700">{result.tensorflowAnalysis.visualAnalysis.freshnessScore}/10</div>
            </div>
            
            <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-center">
              <div className="text-2xl mb-1">👨‍🍳</div>
              <div className="font-semibold text-amber-800">Cooking Method</div>
              <div className="text-sm text-amber-700 capitalize">{result.tensorflowAnalysis.visualAnalysis.cookingMethod}</div>
            </div>
          </div>

          {/* Quality Assessment */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
              <h4 className="font-semibold text-gray-800 mb-2">🔬 Processing Level</h4>
              <div className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                result.tensorflowAnalysis.qualityAssessment.processingLevel === 'MINIMAL' ? 'bg-green-100 text-green-800' :
                result.tensorflowAnalysis.qualityAssessment.processingLevel === 'MODERATE' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {result.tensorflowAnalysis.qualityAssessment.processingLevel}
              </div>
              <div className="text-sm text-gray-600 mt-2">
                Naturalness Score: {result.tensorflowAnalysis.qualityAssessment.naturalness}/10
              </div>
            </div>

            {result.tensorflowAnalysis.visualAnalysis.colorAnalysis.length > 0 && (
              <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                <h4 className="font-semibold text-indigo-800 mb-2">🎨 Color Analysis</h4>
                <div className="text-sm text-indigo-700">
                  {result.tensorflowAnalysis.visualAnalysis.colorAnalysis.map((analysis, i) => (
                    <div key={i}>• {analysis}</div>
                  ))}
                </div>
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
