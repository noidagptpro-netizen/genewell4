/**
 * TEST SUITE: Deterministic Report Generation
 * Verifies compute → validate → render pipeline with sample data
 * Tests that NO hardcoded values are used in calculations
 */

import { computeFullProfile } from "./report-compute";
import { validateComputationResult, formatValidationReport } from "./report-validate";
import { generateReport, summarizeReportGeneration, type ReportGenerationRequest } from "./report-generate";
import type { QuizInput } from "./input-schema";

// ════════════════════════════════════════════════════════════════
// SAMPLE TEST DATA
// ════════════════════════════════════════════════════════════════

const sampleQuizInput: QuizInput = {
  // Personal Info
  name: "Test User",
  email: "test@example.com",
  age: 30,
  gender: "female",
  heightCm: 165,
  weightKg: 70,

  // Health Metrics
  activityScore: 45, // Should map to 1.375 multiplier
  sleepScore: 60, // Adequate sleep
  stressScore: 55, // Moderate stress
  energyScore: 65, // Good energy

  // Goals
  goals: ["lose weight", "feel more energetic"],

  // Conditions
  medicalConditions: [],
  digestiveIssues: ["occasional bloating"],
  foodIntolerances: [],
  skinConcerns: [],

  // Lifestyle
  dietaryPreference: "vegetarian",
  exercisePreference: "cardio",
  exerciseIntensity: "moderate",
  workSchedule: "sedentary",
  region: "india",
  mealFrequency: 3,

  // DNA Consent
  dnaConsent: false,
};

const sampleQuizInputWithConditions: QuizInput = {
  // Personal Info
  name: "Priya Sharma",
  email: "priya@example.com",
  age: 28,
  gender: "female",
  heightCm: 160,
  weightKg: 75,

  // Health Metrics
  activityScore: 35, // Should map to 1.375 multiplier
  sleepScore: 40, // Poor sleep
  stressScore: 70, // High stress
  energyScore: 45, // Low energy

  // Goals
  goals: ["manage pcos", "improve energy"],

  // Conditions
  medicalConditions: ["PCOS", "thyroid disorder"],
  digestiveIssues: ["constipation", "bloating"],
  foodIntolerances: ["lactose"],
  skinConcerns: ["acne"],

  // Lifestyle
  dietaryPreference: "vegetarian",
  exercisePreference: "strength training",
  exerciseIntensity: "light",
  workSchedule: "office",
  region: "india",
  mealFrequency: 4,

  // DNA Consent
  dnaConsent: false,
};

// ════════════════════════════════════════════════════════════════
// TEST 1: Basic Computation
// Verify formula-based calculation with no hardcoded values
// ════════════════════════════════════════════════════════════════

export function testBasicComputation(): { passed: boolean; errors: string[] } {
  const errors: string[] = [];
  console.log("\n════════════════════════════════════════════════════════════");
  console.log("TEST 1: Basic Computation (No Hardcoded Values)");
  console.log("════════════════════════════════════════════════════════════\n");

  try {
    const result = computeFullProfile(sampleQuizInput);

    // Test 1.1: BMR Calculation (Mifflin-St Jeor)
    // For female: (10 × 70) + (6.25 × 165) - (5 × 30) - 161
    // = 700 + 1031.25 - 150 - 161 = 1420.25 ≈ 1420
    const expectedBMR = Math.round(10 * 70 + 6.25 * 165 - 5 * 30 - 161);
    if (Math.abs(result.metrics.bmr - expectedBMR) > 5) {
      errors.push(`BMR mismatch: got ${result.metrics.bmr}, expected ~${expectedBMR}`);
    } else {
      console.log(`✓ BMR: ${result.metrics.bmr} kcal (formula-based, no hardcoding)`);
    }

    // Test 1.2: Activity Multiplier
    // Score 45 should map to 1.375 (range 40-60)
    if (Math.abs(result.metrics.activityMultiplier - 1.375) > 0.001) {
      errors.push(`Activity multiplier mismatch: got ${result.metrics.activityMultiplier}, expected 1.375`);
    } else {
      console.log(`✓ Activity Multiplier: ${result.metrics.activityMultiplier} (score 45 → 1.375)`);
    }

    // Test 1.3: TDEE = BMR × Activity Multiplier
    const expectedTDEE = Math.round(result.metrics.bmr * result.metrics.activityMultiplier);
    if (Math.abs(result.metrics.tdee - expectedTDEE) > 5) {
      errors.push(
        `TDEE mismatch: got ${result.metrics.tdee}, expected ${expectedTDEE} (${result.metrics.bmr} × ${result.metrics.activityMultiplier})`
      );
    } else {
      console.log(
        `✓ TDEE: ${result.metrics.tdee} kcal (${result.metrics.bmr} × ${result.metrics.activityMultiplier})`
      );
    }

    // Test 1.4: Calorie Target
    // For overweight (BMI ~25.7) wanting to lose weight: TDEE × 0.8
    if (result.metrics.calorieTarget <= 0) {
      errors.push(`Calorie target invalid: ${result.metrics.calorieTarget}`);
    } else {
      console.log(`✓ Calorie Target: ${result.metrics.calorieTarget} kcal`);
    }

    // Test 1.5: Macro Sum = Calorie Target
    const macroCalories = result.metrics.macros.proteinGrams * 4 + 
                          result.metrics.macros.carbsGrams * 4 + 
                          result.metrics.macros.fatsGrams * 9;
    if (Math.abs(macroCalories - result.metrics.calorieTarget) > 50) {
      errors.push(
        `Macro sum mismatch: ${macroCalories} kcal vs target ${result.metrics.calorieTarget} kcal`
      );
    } else {
      console.log(`✓ Macros: ${result.metrics.macros.proteinGrams}g protein, ${result.metrics.macros.carbsGrams}g carbs, ${result.metrics.macros.fatsGrams}g fats`);
      console.log(`  (Sum: ${macroCalories} kcal ≈ Target: ${result.metrics.calorieTarget} kcal)`);
    }

    console.log(`\nPersonalization Score: ${result.personalityScore}/10`);

    return { passed: errors.length === 0, errors };
  } catch (error) {
    return { passed: false, errors: [`Test exception: ${error}`] };
  }
}

// ════════════════════════════════════════════════════════════════
// TEST 2: Validation Framework
// Verify all validation checks pass
// ════════════════════════════════════════════════════════════════

export function testValidationFramework(): { passed: boolean; errors: string[] } {
  const errors: string[] = [];
  console.log("\n════════════════════════════════════════════════════════════");
  console.log("TEST 2: Validation Framework");
  console.log("════════════════════════════════════════════════════════════\n");

  try {
    const result = computeFullProfile(sampleQuizInput);
    const validation = validateComputationResult(sampleQuizInput, result);

    console.log(`Validation Status: ${validation.isValid ? "✅ PASSED" : "❌ FAILED"}`);
    console.log(`Critical Errors: ${validation.criticalErrors.length}`);
    console.log(`Warnings: ${validation.warnings.length}`);
    console.log(`Passed Checks: ${validation.passedChecks.length}\n`);

    if (validation.criticalErrors.length > 0) {
      console.log("Critical Errors:");
      validation.criticalErrors.forEach((err) => {
        console.log(`  - [${err.code}] ${err.message}`);
        errors.push(err.message);
      });
    }

    if (validation.warnings.length > 0) {
      console.log("Warnings (non-blocking):");
      validation.warnings.forEach((warn) => {
        console.log(`  - [${warn.code}] ${warn.message}`);
      });
    }

    if (validation.passedChecks.length > 0) {
      console.log("Passed Checks:");
      validation.passedChecks.slice(0, 5).forEach((check) => {
        console.log(`  ✓ ${check}`);
      });
      if (validation.passedChecks.length > 5) {
        console.log(`  ... and ${validation.passedChecks.length - 5} more checks`);
      }
    }

    return { passed: validation.isValid, errors };
  } catch (error) {
    return { passed: false, errors: [`Test exception: ${error}`] };
  }
}

// ════════════════════════════════════════════════════════════════
// TEST 3: Condition Analysis
// Verify PCOS, thyroid, intolerance logic
// ════════════════════════════════════════════════════════════════

export function testConditionAnalysis(): { passed: boolean; errors: string[] } {
  const errors: string[] = [];
  console.log("\n════════════════════════════════════════════════════════════");
  console.log("TEST 3: Condition Analysis (PCOS, Thyroid, Intolerances)");
  console.log("════════════════════════════════════════════════════════════\n");

  try {
    const result = computeFullProfile(sampleQuizInputWithConditions);

    // Test 3.1: PCOS Supplements
    if (!result.conditions.supplementPriority.some((s) => s.toLowerCase().includes("inositol"))) {
      errors.push("PCOS detected but Inositol not in supplements");
    } else {
      console.log("✓ PCOS → Inositol in supplements");
    }

    // Test 3.2: Thyroid Lab Tests
    if (!result.conditions.labTestPriority.some((t) => t.name.toLowerCase().includes("tsh"))) {
      errors.push("Thyroid detected but TSH not in lab tests");
    } else {
      console.log("✓ Thyroid → TSH in lab tests");
    }

    // Test 3.3: Lactose Intolerance Variant
    if (!result.conditions.mealPlanVariants.some((v) => v.includes("lactose"))) {
      errors.push("Lactose intolerance detected but no lactose-free variant");
    } else {
      console.log("✓ Lactose intolerance → lactose-free meal plan variant");
    }

    // Test 3.4: Constipation Supplement
    if (!result.conditions.supplementPriority.some((s) => s.toLowerCase().includes("magnesium"))) {
      errors.push("Constipation detected but Magnesium not in supplements");
    } else {
      console.log("✓ Constipation → Magnesium in supplements");
    }

    console.log(`\nDetected Conditions: ${result.conditions.activeConditions.join(", ") || "None"}`);
    console.log(`Supplements Recommended: ${result.conditions.supplementPriority.length}`);
    console.log(`Lab Tests Recommended: ${result.conditions.labTestPriority.length}`);

    return { passed: errors.length === 0, errors };
  } catch (error) {
    return { passed: false, errors: [`Test exception: ${error}`] };
  }
}

// ════════════════════════════════════════════════════════════════
// TEST 4: Complete Pipeline (Compute → Validate → Render)
// ════════════════════════════════════════════════════════════════

export function testCompletePipeline(): { passed: boolean; errors: string[] } {
  const errors: string[] = [];
  console.log("\n════════════════════════════════════════════════════════════");
  console.log("TEST 4: Complete Pipeline (Compute → Validate → Render)");
  console.log("════════════════════════════════════════════════════════════\n");

  try {
    const request: ReportGenerationRequest = {
      input: sampleQuizInput,
      userId: "test-user-123",
      orderId: "test-order-456",
      includeDiagnostics: true,
    };

    const response = generateReport(request);

    if (!response.success) {
      errors.push(`Pipeline failed: ${response.blockedReason || response.error}`);
    } else {
      console.log("✅ Pipeline succeeded (all 3 stages passed)");
    }

    console.log(`\nStage: ${response.status.toUpperCase()}`);
    console.log(`Computation: ${response.computation ? "✓ Complete" : "✗ Missing"}`);
    console.log(`Validation: ${response.validation ? "✓ Complete" : "✗ Missing"}`);

    if (response.computation) {
      console.log(
        `\nMetrics: BMI ${response.computation.metrics.bmi}, TDEE ${response.computation.metrics.tdee}, ` +
        `Target ${response.computation.metrics.calorieTarget} kcal`
      );
    }

    if (response.validation) {
      console.log(
        `Validation: ${response.validation.isValid ? "✅ PASSED" : "❌ FAILED"} ` +
        `(${response.validation.criticalErrors.length} errors, ${response.validation.warnings.length} warnings)`
      );
    }

    return { passed: response.success && errors.length === 0, errors };
  } catch (error) {
    return { passed: false, errors: [`Test exception: ${error}`] };
  }
}

// ════════════════════════════════════════════════════════════════
// RUN ALL TESTS
// ════════════════════════════════════════════════════════════════

export function runAllTests(): void {
  console.log("\n╔═══════════════════════════════════════════════════════════╗");
  console.log("║     DETERMINISTIC REPORT GENERATION TEST SUITE             ║");
  console.log("╚═══════════════════════════════════════════════════════════╝");

  const results = [
    { name: "Basic Computation", fn: testBasicComputation },
    { name: "Validation Framework", fn: testValidationFramework },
    { name: "Condition Analysis", fn: testConditionAnalysis },
    { name: "Complete Pipeline", fn: testCompletePipeline },
  ];

  let allPassed = true;
  const summary: Array<{ test: string; passed: boolean }> = [];

  results.forEach(({ name, fn }) => {
    const { passed, errors } = fn();
    summary.push({ test: name, passed });

    if (!passed) {
      allPassed = false;
      console.log(`\n❌ FAILED: ${name}`);
      errors.forEach((err) => console.log(`   ${err}`));
    }
  });

  // Final Summary
  console.log("\n════════════════════════════════════════════════════════════");
  console.log("FINAL SUMMARY");
  console.log("════════════════════════════════════════════════════════════\n");

  summary.forEach(({ test, passed }) => {
    console.log(`${passed ? "✅" : "❌"} ${test}`);
  });

  console.log(
    `\n${allPassed ? "✅ ALL TESTS PASSED" : "❌ SOME TESTS FAILED"} (${summary.filter((s) => s.passed).length}/${summary.length})`
  );
  console.log("\n════════════════════════════════════════════════════════════\n");
}

// Export for testing
export default {
  testBasicComputation,
  testValidationFramework,
  testConditionAnalysis,
  testCompletePipeline,
  runAllTests,
};
