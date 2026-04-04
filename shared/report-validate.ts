/**
 * DETERMINISTIC VALIDATION FRAMEWORK
 * Validates computation results before PDF rendering
 * Catches errors like those found in Naumika's report:
 * - Activity multiplier mismatch (score 40 used 1.375 instead of 1.2)
 * - TDEE calculation errors
 * - Macro sum mismatches
 * - Condition contradictions
 */

import type { ComputationResult } from "./report-compute";
import type { QuizInput } from "./input-schema";
import { computeActivityMultiplier, computeBMR, computeTDEE } from "./report-compute";

export interface ValidationReport {
  isValid: boolean;
  criticalErrors: ValidationError[];
  warnings: ValidationWarning[];
  autoCorrections: string[];
  passedChecks: string[];
}

export interface ValidationError {
  code: string;
  severity: "critical" | "high" | "medium";
  message: string;
  affectedFields: string[];
}

export interface ValidationWarning {
  code: string;
  message: string;
  suggestion: string;
}

// ════════════════════════════════════════════════════════════════
// VALIDATOR 1: Activity Multiplier Match
// Ensures activity multiplier exactly matches the activity score
// ════════════════════════════════════════════════════════════════

function validateActivityMultiplier(
  input: QuizInput,
  result: ComputationResult
): { errors: ValidationError[]; warnings: ValidationWarning[] } {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  const expectedMultiplier = computeActivityMultiplier(input.activityScore);
  const actualMultiplier = result.metrics.activityMultiplier;

  if (Math.abs(actualMultiplier - expectedMultiplier) > 0.001) {
    errors.push({
      code: "ACTIVITY_MULTIPLIER_MISMATCH",
      severity: "critical",
      message: `Activity multiplier mismatch. Score ${input.activityScore} maps to multiplier ${expectedMultiplier}, but got ${actualMultiplier}`,
      affectedFields: ["activityScore", "activityMultiplier", "tdee"],
    });
  }

  return { errors, warnings };
}

// ════════════════════════════════════════════════════════════════
// VALIDATOR 2: BMR Calculation
// Validates BMR using Mifflin-St Jeor formula
// ════════════════════════════════════════════════════════════════

function validateBMR(
  input: QuizInput,
  result: ComputationResult
): { errors: ValidationError[]; warnings: ValidationWarning[] } {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  const expectedBMR = computeBMR(input.gender, input.weightKg, input.heightCm, input.age);
  const actualBMR = result.metrics.bmr;

  // Allow 2% tolerance due to rounding
  if (Math.abs(actualBMR - expectedBMR) > expectedBMR * 0.02) {
    errors.push({
      code: "BMR_CALCULATION_ERROR",
      severity: "critical",
      message: `BMR calculation error. Expected ${expectedBMR} kcal, got ${actualBMR} kcal`,
      affectedFields: ["bmr", "weightKg", "heightCm", "age", "gender"],
    });
  }

  return { errors, warnings };
}

// ════════════════════════════════════════════════════════════════
// VALIDATOR 3: TDEE Calculation
// TDEE = BMR × Activity Multiplier
// ════════════════════════════════════════════════════════════════

function validateTDEE(
  input: QuizInput,
  result: ComputationResult
): { errors: ValidationError[]; warnings: ValidationWarning[] } {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  const expectedTDEE = computeTDEE(result.metrics.bmr, result.metrics.activityMultiplier);
  const actualTDEE = result.metrics.tdee;

  if (Math.abs(actualTDEE - expectedTDEE) > 5) {
    errors.push({
      code: "TDEE_CALCULATION_ERROR",
      severity: "critical",
      message: `TDEE calculation error. Expected ${expectedTDEE} kcal (BMR ${result.metrics.bmr} × ${result.metrics.activityMultiplier}), got ${actualTDEE} kcal`,
      affectedFields: ["tdee", "bmr", "activityMultiplier"],
    });
  }

  return { errors, warnings };
}

// ════════════════════════════════════════════════════════════════
// VALIDATOR 4: Macro Calorie Sum
// Sum of (protein × 4) + (carbs × 4) + (fats × 9) must equal calorie target
// ════════════════════════════════════════════════════════════════

function validateMacroSum(
  input: QuizInput,
  result: ComputationResult
): { errors: ValidationError[]; warnings: ValidationWarning[] } {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  const { proteinGrams, carbsGrams, fatsGrams } = result.metrics.macros;
  const targetCals = result.metrics.calorieTarget;

  const macroCalories = proteinGrams * 4 + carbsGrams * 4 + fatsGrams * 9;
  const deviation = Math.abs(macroCalories - targetCals);

  // Allow 50 kcal tolerance for rounding
  if (deviation > 50) {
    errors.push({
      code: "MACRO_SUM_MISMATCH",
      severity: "high",
      message: `Macro calorie sum (${macroCalories}) does not match target (${targetCals}). Deviation: ${deviation} kcal`,
      affectedFields: ["proteinGrams", "carbsGrams", "fatsGrams", "calorieTarget"],
    });
  }

  // Warn if macros are unreasonable
  if (proteinGrams < 30) {
    warnings.push({
      code: "LOW_PROTEIN",
      message: `Protein intake (${proteinGrams}g) is below recommended minimum of 40-50g`,
      suggestion: "Increase protein to at least 40g daily for muscle preservation",
    });
  }

  return { errors, warnings };
}

// ════════════════════════════════════════════════════════════════
// VALIDATOR 5: Gender-Condition Compatibility
// PCOS cannot be in male profile
// Male-only conditions in female profiles should be flagged
// ════════════════════════════════════════════════════════════════

function validateGenderConditionCompatibility(
  input: QuizInput,
  result: ComputationResult
): { errors: ValidationError[]; warnings: ValidationWarning[] } {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  const gender = (input.gender || "").toLowerCase();
  const conditionsLower = input.medicalConditions.map((c) => c.toLowerCase());

  if (gender === "male" && conditionsLower.some((c) => c.includes("pcos"))) {
    errors.push({
      code: "GENDER_CONDITION_MISMATCH",
      severity: "critical",
      message: "PCOS cannot be present in male profile. This is a data entry error.",
      affectedFields: ["gender", "medicalConditions"],
    });
  }

  if (
    gender === "male" &&
    conditionsLower.some((c) => c.includes("menstrual") || c.includes("hormonal"))
  ) {
    errors.push({
      code: "GENDER_CONDITION_MISMATCH",
      severity: "high",
      message: "Female-specific condition found in male profile. Please review data entry.",
      affectedFields: ["gender", "medicalConditions"],
    });
  }

  return { errors, warnings };
}

// ════════════════════════════════════════════════════════════════
// VALIDATOR 6: Calorie-Goal Consistency
// Weight gain goal requires calories > TDEE
// Weight loss goal requires calories < TDEE
// ════════════════════════════════════════════════════════════════

function validateCalorieGoalConsistency(
  input: QuizInput,
  result: ComputationResult
): { errors: ValidationError[]; warnings: ValidationWarning[] } {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  const goalsLower = input.goals.map((g) => g.toLowerCase());
  const wantsGain = goalsLower.some((g) => g.includes("gain") || g.includes("muscle"));
  const wantsLoss = goalsLower.some((g) => g.includes("lose") || g.includes("fat"));
  const tdee = result.metrics.tdee;
  const target = result.metrics.calorieTarget;

  if (wantsGain && target <= tdee) {
    errors.push({
      code: "CALORIE_GOAL_CONTRADICTION",
      severity: "high",
      message: `Goal is WEIGHT GAIN but calorie target (${target}) is not in surplus (TDEE: ${tdee}). Should be ${tdee + 250}+`,
      affectedFields: ["goals", "calorieTarget"],
    });
  }

  if (wantsLoss && target >= tdee) {
    errors.push({
      code: "CALORIE_GOAL_CONTRADICTION",
      severity: "high",
      message: `Goal is FAT LOSS but calorie target (${target}) is not in deficit (TDEE: ${tdee}). Should be ${tdee - 300}`,
      affectedFields: ["goals", "calorieTarget"],
    });
  }

  return { errors, warnings };
}

// ════════════════════════════════════════════════════════════════
// VALIDATOR 7: Sleep-Thyroid-Supplement Consistency
// If sleep < 50 AND thyroid condition present, ashwagandha should NOT be recommended
// Sleep deprivation + ashwagandha can cause thyroid suppression
// ════════════════════════════════════════════════════════════════

function validateSleepThyroidSupplement(
  input: QuizInput,
  result: ComputationResult
): { errors: ValidationError[]; warnings: ValidationWarning[] } {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  const hasThyroid = input.medicalConditions.some((c) => c.toLowerCase().includes("thyroid"));
  const poorSleep = input.sleepScore < 50;
  const hasAshwagandha = result.conditions.supplementPriority.some((s) =>
    s.toLowerCase().includes("ashwagandha")
  );

  if (poorSleep && hasThyroid && hasAshwagandha) {
    errors.push({
      code: "SLEEP_THYROID_SUPPLEMENT_CONFLICT",
      severity: "high",
      message:
        "Critical conflict: Poor sleep (score " +
        input.sleepScore +
        ") + Thyroid condition + Ashwagandha. " +
        "Ashwagandha with sleep deprivation can suppress TSH. Sleep correction must be Priority #1.",
      affectedFields: ["sleepScore", "medicalConditions", "supplementPriority"],
    });
  }

  if (poorSleep && hasThyroid) {
    warnings.push({
      code: "SLEEP_THYROID_PRIORITY",
      message: `Sleep deprivation (score ${input.sleepScore}) directly affects thyroid function`,
      suggestion: "Sleep correction must be primary focus. Lab tests (TSH, Free T3/T4) required BEFORE any supplements.",
    });
  }

  return { errors, warnings };
}

// ════════════════════════════════════════════════════════════════
// VALIDATOR 8: Meal Plan Intolerance Consistency
// If lactose-intolerant, meal plan should NOT include dairy
// If gluten-intolerant, meal plan should NOT include wheat products
// ════════════════════════════════════════════════════════════════

function validateMealPlanIntolerances(
  input: QuizInput,
  result: ComputationResult
): { errors: ValidationError[]; warnings: ValidationWarning[] } {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  const intolerancesLower = input.foodIntolerances.map((i) => i.toLowerCase());
  const hasLactose = intolerancesLower.some((i) => i.includes("lactose") || i.includes("dairy"));
  const hasGluten = intolerancesLower.some((i) => i.includes("gluten"));

  // Check meal plan variants
  const variants = result.conditions.mealPlanVariants.map((v) => v.toLowerCase());

  if (hasLactose && !variants.some((v) => v.includes("lactose"))) {
    warnings.push({
      code: "MISSING_LACTOSE_VARIANT",
      message: "Lactose intolerance detected but no lactose-free meal plan variant created",
      suggestion: "Meal plan generator should apply lactose-free variant globally",
    });
  }

  if (hasGluten && !variants.some((v) => v.includes("gluten"))) {
    warnings.push({
      code: "MISSING_GLUTEN_VARIANT",
      message: "Gluten intolerance detected but no gluten-free meal plan variant created",
      suggestion: "Meal plan generator should apply gluten-free variant globally",
    });
  }

  return { errors, warnings };
}

// ════════════════════════════════════════════════════════════════
// VALIDATOR 9: Lab Test Completeness
// If condition detected, relevant lab test should be in priority list
// ════════════════════════════════════════════════════════════════

function validateLabTestCompleteness(
  input: QuizInput,
  result: ComputationResult
): { errors: ValidationError[]; warnings: ValidationWarning[] } {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  const conditionsLower = input.medicalConditions.map((c) => c.toLowerCase());
  const testNames = result.conditions.labTestPriority.map((t) => t.name.toLowerCase());

  if (
    conditionsLower.some((c) => c.includes("thyroid")) &&
    !testNames.some((t) => t.includes("tsh") || t.includes("t3") || t.includes("t4"))
  ) {
    errors.push({
      code: "MISSING_THYROID_TESTS",
      severity: "high",
      message: "Thyroid condition detected but TSH/Free T3/T4 tests not in priority list",
      affectedFields: ["medicalConditions", "labTestPriority"],
    });
  }

  if (
    conditionsLower.some((c) => c.includes("pcos")) &&
    !testNames.some((t) => t.includes("insulin"))
  ) {
    errors.push({
      code: "MISSING_PCOS_TESTS",
      severity: "high",
      message: "PCOS condition detected but Fasting Insulin test not in priority list",
      affectedFields: ["medicalConditions", "labTestPriority"],
    });
  }

  if (
    conditionsLower.some((c) => c.includes("diabetes")) &&
    !testNames.some((t) => t.includes("glucose") || t.includes("hba1c"))
  ) {
    errors.push({
      code: "MISSING_DIABETES_TESTS",
      severity: "high",
      message: "Diabetes condition detected but Glucose/HbA1c tests not in priority list",
      affectedFields: ["medicalConditions", "labTestPriority"],
    });
  }

  return { errors, warnings };
}

// ════════════════════════════════════════════════════════════════
// VALIDATOR 10: Age-Based Safety Constraints
// Age >= 60 should have calorie floor of 85% TDEE
// Age < 10 or > 120 is invalid
// ════════════════════════════════════════════════════════════════

function validateAgeSafetyConstraints(
  input: QuizInput,
  result: ComputationResult
): { errors: ValidationError[]; warnings: ValidationWarning[] } {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  if (input.age < 10 || input.age > 120) {
    errors.push({
      code: "INVALID_AGE",
      severity: "critical",
      message: `Age ${input.age} is outside valid range (10-120)`,
      affectedFields: ["age"],
    });
  }

  if (input.age >= 60) {
    const calorieFloor = Math.max(result.metrics.bmr, Math.round(result.metrics.tdee * 0.85));
    if (result.metrics.calorieTarget < calorieFloor) {
      warnings.push({
        code: "SENIOR_CALORIE_FLOOR",
        message: `Age ${input.age} requires minimum calories (${calorieFloor}) but target is ${result.metrics.calorieTarget}`,
        suggestion: "Apply age-based safety floor to ensure adequate nutrition",
      });
    }
  }

  return { errors, warnings };
}

// ════════════════════════════════════════════════════════════════
// MAIN VALIDATION ORCHESTRATOR
// ════════════════════════════════════════════════════════════════

export function validateComputationResult(
  input: QuizInput,
  result: ComputationResult
): ValidationReport {
  const allErrors: ValidationError[] = [];
  const allWarnings: ValidationWarning[] = [];
  const autoCorrections: string[] = [];
  const passedChecks: string[] = [];

  // Run all validators
  const validators = [
    { name: "Activity Multiplier Match", fn: validateActivityMultiplier },
    { name: "BMR Calculation", fn: validateBMR },
    { name: "TDEE Calculation", fn: validateTDEE },
    { name: "Macro Calorie Sum", fn: validateMacroSum },
    { name: "Gender-Condition Compatibility", fn: validateGenderConditionCompatibility },
    { name: "Calorie-Goal Consistency", fn: validateCalorieGoalConsistency },
    { name: "Sleep-Thyroid-Supplement Consistency", fn: validateSleepThyroidSupplement },
    { name: "Meal Plan Intolerance Consistency", fn: validateMealPlanIntolerances },
    { name: "Lab Test Completeness", fn: validateLabTestCompleteness },
    { name: "Age-Based Safety Constraints", fn: validateAgeSafetyConstraints },
  ];

  validators.forEach(({ name, fn }) => {
    const { errors, warnings } = fn(input, result);
    if (errors.length === 0) {
      passedChecks.push(name);
    }
    allErrors.push(...errors);
    allWarnings.push(...warnings);
  });

  // Add computation-time errors from result
  if (result.computationErrors.length > 0) {
    result.computationErrors.forEach((msg) => {
      allErrors.push({
        code: "COMPUTATION_ERROR",
        severity: "critical",
        message: msg,
        affectedFields: ["unknown"],
      });
    });
  }

  // Add computation-time warnings from result
  if (result.warnings.length > 0) {
    result.warnings.forEach((msg) => {
      allWarnings.push({
        code: "COMPUTATION_WARNING",
        message: msg,
        suggestion: "Review this area in the report and add emphasis if needed",
      });
    });
  }

  return {
    isValid: allErrors.length === 0,
    criticalErrors: allErrors,
    warnings: allWarnings,
    autoCorrections,
    passedChecks,
  };
}

// ════════════════════════════════════════════════════════════════
// VALIDATION REPORT FORMATTER
// ════════════════════════════════════════════════════════════════

export function formatValidationReport(report: ValidationReport): string {
  let output = "═══════════════════════════════════════════════════════════════\n";
  output += "COMPUTATION VALIDATION REPORT\n";
  output += "═══════════════════════════════════════════════════════════════\n\n";

  if (report.isValid) {
    output += "✅ VALIDATION PASSED - Report is safe to generate\n\n";
  } else {
    output += "❌ VALIDATION FAILED - Report generation blocked\n\n";
    output += `Critical Errors: ${report.criticalErrors.length}\n`;
    output += `Warnings: ${report.warnings.length}\n\n`;
  }

  if (report.criticalErrors.length > 0) {
    output += "CRITICAL ERRORS:\n";
    output += "───────────────────────────────────────────────────────────────\n";
    report.criticalErrors.forEach((err, i) => {
      output += `${i + 1}. [${err.code}] ${err.message}\n`;
      output += `   Fields: ${err.affectedFields.join(", ")}\n`;
    });
    output += "\n";
  }

  if (report.warnings.length > 0) {
    output += "WARNINGS:\n";
    output += "───────────────────────────────────────────────────────────────\n";
    report.warnings.forEach((warn, i) => {
      output += `${i + 1}. [${warn.code}] ${warn.message}\n`;
      output += `   → ${warn.suggestion}\n`;
    });
    output += "\n";
  }

  if (report.passedChecks.length > 0) {
    output += "PASSED CHECKS:\n";
    output += "───────────────────────────────────────────────────────────────\n";
    report.passedChecks.forEach((check) => {
      output += `✓ ${check}\n`;
    });
  }

  return output;
}
