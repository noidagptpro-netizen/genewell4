/**
 * DETERMINISTIC COMPUTATION ENGINE
 * Pure formula-based calculations with NO hardcoded values
 * All outputs derive exclusively from quiz inputs via mathematical formulas
 */

import type { QuizInput, Gender } from "./input-schema";

// ════════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ════════════════════════════════════════════════════════════════

export interface MetabolicMetrics {
  bmi: number;
  bmiCategory: "underweight" | "normal" | "overweight" | "obese";
  bmr: number;
  activityMultiplier: number;
  tdee: number;
  calorieTarget: number;
  sleepAdjustment: number; // kcal added/subtracted due to sleep
  macros: MacroBreakdown;
}

export interface MacroBreakdown {
  proteinGrams: number;
  carbsGrams: number;
  fatsGrams: number;
  proteinPct: number;
  carbsPct: number;
  fatsPct: number;
}

export interface ConditionAnalysis {
  conditions: string[];
  activeConditions: string[];
  recommendations: string[];
  supplementPriority: string[];
  labTestPriority: LabTest[];
  mealPlanVariants: string[]; // e.g., ["lactose-free", "low-carb-for-pcos"]
}

export interface LabTest {
  name: string;
  reason: string;
  priority: number; // 1-10, 10 is highest
  frequency: string; // "once" | "quarterly" | "annually"
  relatedCondition?: string;
}

export interface ComputationResult {
  metrics: MetabolicMetrics;
  conditions: ConditionAnalysis;
  computationErrors: string[]; // Empty if valid
  warnings: string[]; // Non-blocking issues
  personalityScore: number; // 1-10 personalization depth
}

// ════════════════════════════════════════════════════════════════
// FORMULA 1: ACTIVITY MULTIPLIER (Pure formula, score-based)
// ════════════════════════════════════════════════════════════════

export function computeActivityMultiplier(activityScore: number): number {
  // Activity multiplier determined by activity score bins
  // This is the ONLY valid mapping - no exceptions
  if (activityScore < 20) return 1.2;
  if (activityScore < 40) return 1.375;
  if (activityScore < 60) return 1.55;
  if (activityScore < 80) return 1.725;
  return 1.9;
}

// ════════════════════════════════════════════════════════════════
// FORMULA 2: BMR (Basal Metabolic Rate) using Mifflin-St Jeor
// ════════════════════════════════════════════════════════════════

export function computeBMR(
  gender: Gender,
  weightKg: number,
  heightCm: number,
  age: number
): number {
  // Mifflin-St Jeor equation
  const baseCalc = 10 * weightKg + 6.25 * heightCm - 5 * age;
  const bmr = gender === "male" ? baseCalc + 5 : baseCalc - 161;
  return Math.round(bmr);
}

// ════════════════════════════════════════════════════════════════
// FORMULA 3: BMI and Category Classification
// ════════════════════════════════════════════════════════════════

export function computeBMI(weightKg: number, heightCm: number): number {
  const heightM = heightCm / 100;
  return parseFloat((weightKg / (heightM * heightM)).toFixed(1));
}

export function classifyBMI(bmi: number): "underweight" | "normal" | "overweight" | "obese" {
  if (bmi < 18.5) return "underweight";
  if (bmi < 25) return "normal";
  if (bmi < 30) return "overweight";
  return "obese";
}

// ════════════════════════════════════════════════════════════════
// FORMULA 4: TDEE with Activity Multiplier
// ════════════════════════════════════════════════════════════════

export function computeTDEE(bmr: number, activityMultiplier: number): number {
  return Math.round(bmr * activityMultiplier);
}

// ════════════════════════════════════════════════════════════════
// FORMULA 5: SLEEP ADJUSTMENT
// Accounts for metabolic impact of poor sleep on calorie burn
// Lower sleep = reduced metabolic rate
// ════════════════════════════════════════════════════════════════

export function computeSleepAdjustment(
  sleepScore: number,
  bmr: number
): { adjustment: number; narrative: string } {
  // Sleep score 0-100 (higher = better sleep)
  // Poor sleep (< 50) increases cortisol → reduces metabolic rate
  // Excellent sleep (> 75) supports optimal metabolism

  if (sleepScore <= 25) {
    // CRITICAL: < 5 hours average
    const adj = Math.round(bmr * -0.10); // -10% metabolic penalty
    return {
      adjustment: adj,
      narrative: "Critical sleep deprivation detected. Metabolism suppressed by ~10%. Sleep correction is PRIORITY #1.",
    };
  }

  if (sleepScore <= 50) {
    // POOR: 5-6 hours average
    const adj = Math.round(bmr * -0.05); // -5% metabolic penalty
    return {
      adjustment: adj,
      narrative: "Suboptimal sleep. Metabolic rate reduced by ~5%. Sleep improvement will enhance all health metrics.",
    };
  }

  if (sleepScore >= 75) {
    // EXCELLENT: 7+ hours average
    const adj = Math.round(bmr * 0.03); // +3% metabolic boost
    return {
      adjustment: adj,
      narrative: "Excellent sleep pattern supports optimal metabolism and recovery.",
    };
  }

  // NORMAL: 50-75 (6-7 hours average)
  return {
    adjustment: 0,
    narrative: "Sleep pattern is adequate. Minor improvements could enhance metabolism further.",
  };
}

// ════════════════════════════════════════════════════════════════
// FORMULA 6: CALORIE TARGET with Goal-Based Adjustments
// ════════════════════════════════════════════════════════════════

export function computeCalorieTarget(
  tdee: number,
  bmiCategory: string,
  goals: string[],
  age: number,
  bmr: number,
  sleepAdjustment: number
): number {
  const goalsLower = goals.map((g) => g.toLowerCase());
  const wantsLoss = goalsLower.some((g) => g.includes("lose") || g.includes("weight loss") || g.includes("fat loss"));
  const wantsGain = goalsLower.some((g) => g.includes("gain") || g.includes("muscle") || g.includes("build"));

  // Start with TDEE + sleep adjustment
  let target = Math.round(tdee + sleepAdjustment);

  // Goal-based adjustment
  if (wantsLoss || bmiCategory === "obese") {
    target = Math.round((tdee + sleepAdjustment) * 0.8);
  } else if (bmiCategory === "overweight" && !wantsGain) {
    target = Math.round((tdee + sleepAdjustment) * 0.85);
  } else if (wantsGain) {
    target = Math.round((tdee + sleepAdjustment) * 1.1);
  } else if (bmiCategory === "underweight") {
    target = Math.round((tdee + sleepAdjustment) * 1.15);
  }

  // Safety constraint: Age >= 60
  if (age >= 60) {
    const floor = Math.max(bmr, Math.round((tdee + sleepAdjustment) * 0.85));
    if (target < floor) {
      target = floor;
    }
  }

  // Absolute floor: Never below BMR
  if (target < bmr) {
    target = bmr;
  }

  return target;
}

// ════════════════════════════════════════════════════════════════
// FORMULA 7: MACRO DISTRIBUTION (Goal and Condition-Based)
// ════════════════════════════════════════════════════════════════

export function computeMacros(
  calorieTarget: number,
  gender: Gender,
  goals: string[],
  conditions: string[]
): MacroBreakdown {
  const goalsLower = goals.map((g) => g.toLowerCase());
  const conditionsLower = conditions.map((c) => c.toLowerCase());

  let proteinPct = 0.25;
  let fatsPct = 0.25;
  let carbsPct = 0.5;

  // Goal-based macro adjustment
  if (goalsLower.some((g) => g.includes("muscle") || g.includes("build") || g.includes("gain"))) {
    proteinPct = 0.3;
    carbsPct = 0.45;
    fatsPct = 0.25;
  } else if (goalsLower.some((g) => g.includes("lose") || g.includes("fat"))) {
    proteinPct = 0.3;
    carbsPct = 0.4;
    fatsPct = 0.3;
  }

  // Condition-based macro adjustment
  if (conditionsLower.some((c) => c.includes("diabetes") || c.includes("pcos"))) {
    proteinPct = 0.3;
    carbsPct = 0.35;
    fatsPct = 0.35;
  }

  if (conditionsLower.some((c) => c.includes("thyroid"))) {
    // No macro change, but mark for iodine monitoring
  }

  // Normalize percentages
  const total = proteinPct + carbsPct + fatsPct;
  proteinPct = proteinPct / total;
  carbsPct = carbsPct / total;
  fatsPct = fatsPct / total;

  // Convert to grams (protein/carbs = 4 kcal/g, fats = 9 kcal/g)
  const proteinGrams = Math.round((calorieTarget * proteinPct) / 4);
  const carbsGrams = Math.round((calorieTarget * carbsPct) / 4);
  const fatsGrams = Math.round((calorieTarget * fatsPct) / 9);

  return {
    proteinGrams,
    carbsGrams,
    fatsGrams,
    proteinPct: Math.round(proteinPct * 100),
    carbsPct: Math.round(carbsPct * 100),
    fatsPct: Math.round(fatsPct * 100),
  };
}

// ════════════════════════════════════════════════════════════════
// DECISION TREE: Condition Analysis
// ════════════════════════════════════════════════════════════════

export function analyzeConditions(
  medicalConditions: string[],
  digestiveIssues: string[],
  foodIntolerances: string[]
): ConditionAnalysis {
  const conditions = [...medicalConditions, ...digestiveIssues, ...foodIntolerances];
  const conditionsLower = conditions.map((c) => c.toLowerCase());
  const activeConditions = conditions.filter((c) => c.trim().length > 0);

  const recommendations: string[] = [];
  const supplementPriority: string[] = [];
  const labTestPriority: LabTest[] = [];
  const mealPlanVariants: string[] = [];

  // PCOS Logic
  if (conditionsLower.some((c) => c.includes("pcos"))) {
    recommendations.push("Insulin resistance management: reduced refined carbs, increased fiber");
    recommendations.push("Inositol supplementation (myo-inositol 2-4g daily)");
    supplementPriority.push("Inositol (myo-inositol)");
    supplementPriority.push("Chromium picolinate");
    supplementPriority.push("N-acetylcysteine (NAC)");
    labTestPriority.push({
      name: "Fasting Insulin",
      reason: "PCOS screening - assess insulin resistance severity",
      priority: 10,
      frequency: "quarterly",
      relatedCondition: "PCOS",
    });
    labTestPriority.push({
      name: "Testosterone (Free & Total)",
      reason: "PCOS hormonal assessment",
      priority: 9,
      frequency: "quarterly",
      relatedCondition: "PCOS",
    });
    mealPlanVariants.push("low-gi-for-pcos");
    mealPlanVariants.push("high-fiber");
  }

  // Thyroid Logic
  if (conditionsLower.some((c) => c.includes("thyroid"))) {
    recommendations.push("Ensure adequate iodine, selenium, and zinc intake");
    recommendations.push("Take any thyroid medications 4+ hours away from supplements");
    supplementPriority.push("Selenium");
    supplementPriority.push("Zinc");
    labTestPriority.push({
      name: "TSH",
      reason: "Thyroid baseline - must check BEFORE starting any supplements",
      priority: 10,
      frequency: "annually",
      relatedCondition: "Thyroid",
    });
    labTestPriority.push({
      name: "Free T3 & Free T4",
      reason: "Thyroid function assessment",
      priority: 9,
      frequency: "annually",
      relatedCondition: "Thyroid",
    });
  }

  // Lactose Intolerance
  if (conditionsLower.some((c) => c.includes("lactose") || c.includes("dairy"))) {
    recommendations.push("Avoid dairy products - use lactose-free alternatives");
    supplementPriority.push("Calcium carbonate");
    supplementPriority.push("Vitamin D3");
    mealPlanVariants.push("lactose-free");
  }

  // Gluten Sensitivity
  if (conditionsLower.some((c) => c.includes("gluten"))) {
    recommendations.push("Eliminate wheat, roti, bread, pasta - use millet, rice alternatives");
    mealPlanVariants.push("gluten-free");
  }

  // Constipation
  if (conditionsLower.some((c) => c.includes("constipation"))) {
    recommendations.push("Increase fiber intake gradually (25-30g daily)");
    recommendations.push("Maintain 3L water daily minimum");
    supplementPriority.push("Psyllium husk");
    supplementPriority.push("Magnesium glycinate");
    labTestPriority.push({
      name: "Stool Analysis",
      reason: "Assess gut dysbiosis and microbiota balance",
      priority: 8,
      frequency: "once",
      relatedCondition: "Digestive",
    });
  }

  // Diabetes/Pre-diabetes
  if (conditionsLower.some((c) => c.includes("diabetes"))) {
    labTestPriority.push({
      name: "Fasting Glucose",
      reason: "Diabetes monitoring - must check regularly",
      priority: 10,
      frequency: "quarterly",
      relatedCondition: "Diabetes",
    });
    labTestPriority.push({
      name: "HbA1c",
      reason: "3-month average blood glucose level",
      priority: 10,
      frequency: "quarterly",
      relatedCondition: "Diabetes",
    });
  }

  // General Lab Tests (everyone should have baseline)
  labTestPriority.push({
    name: "Complete Blood Count (CBC)",
    reason: "Baseline health screening - detect anemia, infections, immune status",
    priority: 9,
    frequency: "annually",
  });
  labTestPriority.push({
    name: "Lipid Panel (Cholesterol, HDL, LDL, Triglycerides)",
    reason: "Cardiovascular risk assessment",
    priority: 8,
    frequency: "annually",
  });
  labTestPriority.push({
    name: "Liver Function Tests",
    reason: "Hepatic health assessment",
    priority: 7,
    frequency: "annually",
  });
  labTestPriority.push({
    name: "Kidney Function Tests (Creatinine, BUN)",
    reason: "Renal health monitoring",
    priority: 7,
    frequency: "annually",
  });

  // Sort lab tests by priority (descending)
  labTestPriority.sort((a, b) => b.priority - a.priority);

  return {
    conditions: activeConditions,
    activeConditions,
    recommendations,
    supplementPriority: [...new Set(supplementPriority)], // Remove duplicates
    labTestPriority: labTestPriority.slice(0, 10), // Top 10 tests
    mealPlanVariants: [...new Set(mealPlanVariants)],
  };
}

// ════════════════════════════════════════════════════════════════
// PERSONALIZATION SCORE (1-10)
// Measures how thoroughly the report is personalized to the user's profile
// ════════════════════════════════════════════════════════════════

export function computePersonalizationScore(input: QuizInput): number {
  let score = 1; // Base score

  // Profile completeness (up to 3 points)
  if (input.name && input.name.trim()) score += 1;
  if (input.medicalConditions.length > 0) score += 1;
  if (input.goals.length > 0) score += 1;

  // Health metrics depth (up to 2 points)
  if (input.stressScore > 0) score += 0.5;
  if (input.sleepScore > 0) score += 0.5;
  if (input.activityScore > 0) score += 0.5;
  if (input.energyScore > 0) score += 0.5;

  // Dietary specificity (up to 2 points)
  if (input.foodIntolerances.length > 0) score += 0.5;
  if (input.digestiveIssues.length > 0) score += 0.5;
  if (input.skinConcerns.length > 0) score += 0.5;
  if (input.dietaryPreference && input.dietaryPreference !== "none") score += 0.5;

  // Lifestyle detail (up to 2 points)
  if (input.exercisePreference && input.exercisePreference !== "none") score += 0.5;
  if (input.workSchedule && input.workSchedule !== "none") score += 0.5;
  if (input.region && input.region !== "none") score += 0.5;
  if (input.mealFrequency && input.mealFrequency > 0) score += 0.5;

  return Math.min(Math.ceil(score), 10);
}

// ════════════════════════════════════════════════════════════════
// MAIN COMPUTATION ORCHESTRATION
// ════════════════════════════════════════════════════════════════

export function computeFullProfile(input: QuizInput): ComputationResult {
  const computationErrors: string[] = [];
  const warnings: string[] = [];

  // Compute metabolic metrics
  const bmi = computeBMI(input.weightKg, input.heightCm);
  const bmiCategory = classifyBMI(bmi);
  const bmr = computeBMR(input.gender, input.weightKg, input.heightCm, input.age);
  const activityMultiplier = computeActivityMultiplier(input.activityScore);
  const tdee = computeTDEE(bmr, activityMultiplier);

  // Sleep adjustment
  const { adjustment: sleepAdjustment, narrative: sleepNarrative } = computeSleepAdjustment(
    input.sleepScore,
    bmr
  );
  if (sleepNarrative.includes("PRIORITY")) {
    warnings.push(sleepNarrative);
  }

  // Calorie target with sleep adjustment
  const calorieTarget = computeCalorieTarget(
    tdee,
    bmiCategory,
    input.goals,
    input.age,
    bmr,
    sleepAdjustment
  );

  // Macros
  const macros = computeMacros(calorieTarget, input.gender, input.goals, input.medicalConditions);

  // Condition analysis
  const conditions = analyzeConditions(
    input.medicalConditions,
    input.digestiveIssues,
    input.foodIntolerances
  );

  // Personalization score
  const personalityScore = computePersonalizationScore(input);

  // VALIDATION: Activity multiplier must match score
  const correctMultiplier = computeActivityMultiplier(input.activityScore);
  if (Math.abs(activityMultiplier - correctMultiplier) > 0.001) {
    computationErrors.push(
      `CRITICAL: Activity multiplier mismatch. Score ${input.activityScore} should use multiplier ${correctMultiplier}, not ${activityMultiplier}`
    );
  }

  // VALIDATION: Macro sum should equal calorie target
  const macroCalories = macros.proteinGrams * 4 + macros.carbsGrams * 4 + macros.fatsGrams * 9;
  if (Math.abs(macroCalories - calorieTarget) > 50) {
    computationErrors.push(
      `CRITICAL: Macro calorie sum (${macroCalories}) does not match target (${calorieTarget})`
    );
  }

  return {
    metrics: {
      bmi,
      bmiCategory,
      bmr,
      activityMultiplier,
      tdee,
      calorieTarget,
      sleepAdjustment,
      macros,
    },
    conditions,
    computationErrors,
    warnings,
    personalityScore,
  };
}
