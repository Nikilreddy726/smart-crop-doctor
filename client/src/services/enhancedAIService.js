// Enhanced AI scanning service with realistic processing simulation and database mapping
const PLANT_DISEASES = [
  {
    id: 'tomato-late-blight',
    name: 'Tomato Late Blight',
    scientificName: 'Phytophthora infestans',
    description: 'A devastating fungal disease that causes dark, water-soaked lesions on leaves, stems, and fruits. Can destroy entire crops within days under favorable conditions.',
    severity: 'Critical',
    affectedCrops: ['tomatoes', 'potatoes', 'peppers'],
    seasonalRisk: { spring: 0.3, summer: 0.7, fall: 0.9, winter: 0.1 },
    confidenceFactors: { imageQuality: 0.9, symptomClarity: 0.95, plantCondition: 0.8 }
  },
  {
    id: 'powdery-mildew',
    name: 'Powdery Mildew',
    scientificName: 'Erysiphe cichoracearum',
    description: 'A common fungal disease creating white, powdery patches on leaf surfaces. Thrives in warm, dry conditions with high humidity.',
    severity: 'Medium',
    affectedCrops: ['cucumbers', 'squash', 'melons', 'beans'],
    seasonalRisk: { spring: 0.4, summer: 0.8, fall: 0.6, winter: 0.2 },
    confidenceFactors: { imageQuality: 0.85, symptomClarity: 0.9, plantCondition: 0.75 }
  },
  {
    id: 'aphid-infestation',
    name: 'Aphid Infestation',
    scientificName: 'Aphididae family',
    description: 'Small, soft-bodied insects that feed on plant sap, causing stunted growth and transmitting viral diseases.',
    severity: 'Medium',
    affectedCrops: ['roses', 'vegetables', 'fruit trees'],
    seasonalRisk: { spring: 0.7, summer: 0.9, fall: 0.5, winter: 0.2 },
    confidenceFactors: { imageQuality: 0.8, symptomClarity: 0.95, plantCondition: 0.9 }
  },
  {
    id: 'bacterial-leaf-spot',
    name: 'Bacterial Leaf Spot',
    scientificName: 'Xanthomonas campestris',
    description: 'A bacterial infection causing water-soaked spots that turn brown with yellow halos. Spreads rapidly in warm, wet conditions.',
    severity: 'High',
    affectedCrops: ['tomatoes', 'peppers', 'beans'],
    seasonalRisk: { spring: 0.4, summer: 0.8, fall: 0.6, winter: 0.1 },
    confidenceFactors: { imageQuality: 0.75, symptomClarity: 0.8, plantCondition: 0.85 }
  },
  {
    id: 'nitrogen-deficiency',
    name: 'Nitrogen Deficiency',
    scientificName: 'Nutrient Deficiency',
    description: 'Nutrient deficiency causing yellowing of older leaves first, stunted growth, and reduced yield.',
    severity: 'Medium',
    affectedCrops: ['all vegetable crops', 'fruit trees'],
    seasonalRisk: { spring: 0.5, summer: 0.6, fall: 0.4, winter: 0.3 },
    confidenceFactors: { imageQuality: 0.7, symptomClarity: 0.75, plantCondition: 0.8 }
  },
  {
    id: 'spider-mites',
    name: 'Spider Mite Infestation',
    scientificName: 'Tetranychus urticae',
    description: 'Microscopic pests that create fine webbing and cause stippled, yellowing leaves. Thrive in hot, dry conditions.',
    severity: 'High',
    affectedCrops: ['indoor plants', 'vegetables', 'fruit trees'],
    seasonalRisk: { spring: 0.4, summer: 0.9, fall: 0.6, winter: 0.3 },
    confidenceFactors: { imageQuality: 0.6, symptomClarity: 0.7, plantCondition: 0.85 }
  },
  {
    id: 'healthy-plant',
    name: 'Healthy',
    scientificName: 'Solanum lycopersicum / Gossypium',
    description: 'The plant appears healthy with no visible signs of pathogen infection, pest infestation, or nutrient deficiency.',
    severity: 'None',
    affectedCrops: ['tomatoes', 'potatoes', 'peppers', 'cotton', 'beans'],
    seasonalRisk: { spring: 0.6, summer: 0.6, fall: 0.6, winter: 0.6 },
    confidenceFactors: { imageQuality: 0.9, symptomClarity: 0.9, plantCondition: 0.9 }
  }
];

function analyzeImageQuality() {
  const factors = [];
  const scores = [];

  const lighting = Math.random() * 0.4 + 0.6; // 0.6-1.0
  const focus = Math.random() * 0.3 + 0.7; // 0.7-1.0
  const resolution = Math.random() * 0.2 + 0.8; // 0.8-1.0
  const angle = Math.random() * 0.3 + 0.7; // 0.7-1.0

  scores.push(lighting, focus, resolution, angle);

  if (lighting < 0.7) factors.push('Lighting could be improved');
  if (focus < 0.8) factors.push('Image appears slightly blurred');
  if (resolution < 0.9) factors.push('Higher resolution would help analysis');
  if (angle < 0.8) factors.push('Try capturing from multiple angles');

  if (factors.length === 0) factors.push('Excellent image quality for analysis');

  return {
    score: scores.reduce((a, b) => a + b) / scores.length,
    factors
  };
}

const getPathogenType = (id) => {
  if (id === 'tomato-late-blight' || id === 'powdery-mildew') return 'Fungal';
  if (id === 'bacterial-leaf-spot') return 'Bacterial';
  if (id === 'aphid-infestation' || id === 'spider-mites') return 'Insect';
  if (id === 'nitrogen-deficiency') return 'Nutrient';
  return 'Biological';
};

const getCropName = (id) => {
  if (id === 'tomato-late-blight') return 'Tomato';
  if (id === 'powdery-mildew') return 'Cucurbits / Squash';
  if (id === 'bacterial-leaf-spot') return 'Tomato / Pepper';
  if (id === 'aphid-infestation') return 'General Crops';
  if (id === 'nitrogen-deficiency') return 'General Crops';
  if (id === 'spider-mites') return 'Ornamental / Vegetable';
  return 'General Plant';
};

const getOrganicSolutions = (id) => {
  if (id === 'tomato-late-blight') {
    return [
      "Remove and destroy all infected plant parts immediately.",
      "Water at soil level to keep foliage dry.",
      "Apply preventive neem oil sprays weekly.",
      "Ensure proper plant spacing for air circulation."
    ];
  }
  if (id === 'powdery-mildew') {
    return [
      "Apply baking soda solution (1 tsp baking soda + 1 tsp horticultural oil per quart water).",
      "Remove heavily infected leaves to reduce spore spread.",
      "Prune surrounding plants to increase sunlight exposure.",
      "Spray diluted milk solution (40% milk, 60% water) in bright sunlight."
    ];
  }
  if (id === 'aphid-infestation') {
    return [
      "Blast plants with a strong stream of water to dislodge insects.",
      "Spray with insecticidal soap or diluted neem oil.",
      "Introduce ladybugs or lacewings as natural predators.",
      "Plant companion marigolds to repel pests."
    ];
  }
  if (id === 'bacterial-leaf-spot') {
    return [
      "Remove and destroy infected plant parts immediately.",
      "Avoid working with wet plants to stop transmission.",
      "Water using drip irrigation to prevent splash dispersal.",
      "Sanitize garden tools with 70% alcohol between cuts."
    ];
  }
  if (id === 'nitrogen-deficiency') {
    return [
      "Add compost or well-rotted cow manure to the soil.",
      "Apply blood meal, fish emulsion, or alfalfa meal.",
      "Plant nitrogen-fixing cover crops like clover or beans.",
      "Apply mulch to retain organic matter and nutrients."
    ];
  }
  if (id === 'spider-mites') {
    return [
      "Spray plants with cold water, focusing on leaf undersides.",
      "Apply horticultural oil or neem oil to suffocate mites.",
      "Release predatory mites (Phytoseiulus persimilis).",
      "Increase ambient humidity (misting) to deter reproduction."
    ];
  }
  return [
    "Apply organic compost annually.",
    "Monitor plants daily for changes.",
    "Practice companion planting."
  ];
};

const getChemicalPesticides = (id) => {
  if (id === 'tomato-late-blight') return ["Copper-based fungicide", "Chlorothalonil", "Mancozeb"];
  if (id === 'powdery-mildew') return ["Sulfur dust / spray", "Myclobutanil", "Triadimefon"];
  if (id === 'aphid-infestation') return ["Acetamiprid", "Imidacloprid", "Pyrethrin-based spray"];
  if (id === 'bacterial-leaf-spot') return ["Copper-based bactericides", "Streptomycin sulfate sprays"];
  if (id === 'nitrogen-deficiency') return ["Urea (46% Nitrogen)", "Calcium Ammonium Nitrate", "NPK 20-20-20 soluble spray"];
  if (id === 'spider-mites') return ["Abamectin", "Spiromesifen", "Bifenthrin spray"];
  return ["No chemical treatment required"];
};

export class EnhancedAIService {
  static async analyzeImage(imageData, onProgress) {
    const startTime = Date.now();

    // Stage 1: Image preprocessing
    if (onProgress) onProgress(1, 'Preprocessing image and checking quality...');
    await new Promise(resolve => setTimeout(resolve, 600));

    const imageQuality = analyzeImageQuality();

    // Stage 2: Feature extraction
    if (onProgress) onProgress(2, 'Extracting visual features using CNN model...');
    await new Promise(resolve => setTimeout(resolve, 800));

    // Stage 3: Disease pattern matching
    if (onProgress) onProgress(3, 'Analyzing disease patterns and symptoms...');
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Stage 4: Confidence calculation
    if (onProgress) onProgress(4, 'Calculating confidence scores and alternatives...');
    await new Promise(resolve => setTimeout(resolve, 600));

    // Stage 5: Generating recommendations
    if (onProgress) onProgress(5, 'Generating treatment recommendations...');
    await new Promise(resolve => setTimeout(resolve, 500));

    const processingTime = Date.now() - startTime;

    // Select disease based on weighted probability
    const currentSeason = this.getCurrentSeason();
    const weightedDiseases = PLANT_DISEASES.map(disease => ({
      disease,
      weight: disease.seasonalRisk[currentSeason] * Math.random()
    }));

    weightedDiseases.sort((a, b) => b.weight - a.weight);
    const primaryDisease = weightedDiseases[0].disease;

    // Calculate confidence
    const baseConfidence = primaryDisease.confidenceFactors.imageQuality * imageQuality.score;
    const randomVariation = (Math.random() - 0.5) * 0.2; // ±10% variation
    const finalConfidence = Math.max(0.65, Math.min(0.99, baseConfidence + randomVariation));

    const confidenceValue = Math.round(finalConfidence * 100) / 100;

    // Map response format to match local DB models
    return {
      id: 'local-' + Date.now(),
      disease: primaryDisease.name,
      scientific_name: primaryDisease.scientificName || "",
      pathogen: getPathogenType(primaryDisease.id),
      crop: getCropName(primaryDisease.id),
      severity: primaryDisease.severity,
      confidence: confidenceValue,
      recommendations: {
        organic_solutions: getOrganicSolutions(primaryDisease.id),
        pesticides: getChemicalPesticides(primaryDisease.id)
      },
      imageUrl: imageData,
      analysis: {
        health_index: Math.round(imageQuality.score * 100),
        chlorosis_index: Math.round((1 - finalConfidence) * 100 * 0.4),
        necrosis_index: Math.round((1 - finalConfidence) * 100 * 0.6)
      }
    };
  }

  static getCurrentSeason() {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'fall';
    return 'winter';
  }
}
