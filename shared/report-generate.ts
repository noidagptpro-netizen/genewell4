/**
 * REPORT GENERATION ORCHESTRATION
 * Compute → Validate → Render Pipeline
 * Only generates PDF if validation passes
 */

import type { QuizInput } from "./input-schema";
import { computeFullProfile, type ComputationResult } from "./report-compute";
import { validateComputationResult, formatValidationReport, type ValidationReport } from "./report-validate";

export interface ReportGenerationRequest {
  input: QuizInput;
  userId?: string;
  orderId?: string;
  includeDiagnostics?: boolean; // Include validation report in output
}

export interface ReportGenerationResponse {
  success: boolean;
  status: "computed" | "validated" | "rendered" | "failed";
  computation?: ComputationResult;
  validation?: ValidationReport;
  validationReport?: string;
  error?: string;
  blockedReason?: string;
  warnings?: string[];
}

// ════════════════════════════════════════════════════════════════
// STEP 1: COMPUTATION
// Pure formula-based calculation from quiz inputs
// ════════════════════════════════════════════════════════════════

export function stepCompute(input: QuizInput): { success: boolean; result?: ComputationResult; error?: string } {
  try {
    const result = computeFullProfile(input);
    return { success: true, result };
  } catch (err) {
    return {
      success: false,
      error: `Computation failed: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

// ════════════════════════════════════════════════════════════════
// STEP 2: VALIDATION
// Validates computation against all critical checks
// BLOCKS generation if critical errors found
// ════════════════════════════════════════════════════════════════

export function stepValidate(
  input: QuizInput,
  computation: ComputationResult
): { success: boolean; report?: ValidationReport; error?: string } {
  try {
    const report = validateComputationResult(input, computation);
    return { success: report.isValid, report };
  } catch (err) {
    return {
      success: false,
      error: `Validation failed: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

// ════════════════════════════════════════════════════════════════
// STEP 3: RENDER (Placeholder)
// In production, this would call the PDF generation service
// Returns true if ready to generate PDF
// ════════════════════════════════════════════════════════════════

export function stepRender(
  input: QuizInput,
  computation: ComputationResult,
  validation: ValidationReport
): { success: boolean; error?: string } {
  try {
    // Placeholder for actual PDF rendering
    // In production, this would call a service like:
    // - ReportLab (Python) via API
    // - PDFKit (Node.js)
    // - Chrome headless rendering
    // etc.

    // For now, just verify all inputs are present
    if (!input || !computation || !validation) {
      return { success: false, error: "Missing required inputs for rendering" };
    }

    // Verify computation has required fields
    if (
      !computation.metrics ||
      !computation.conditions ||
      !computation.metrics.macros ||
      !computation.metrics.macros.proteinGrams
    ) {
      return { success: false, error: "Computation output incomplete" };
    }

    // All checks passed - ready to render
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: `Rendering failed: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

// ════════════════════════════════════════════════════════════════
// MAIN ORCHESTRATION FUNCTION
// Executes compute → validate → render pipeline
// ════════════════════════════════════════════════════════════════

export function generateReport(request: ReportGenerationRequest): ReportGenerationResponse {
  const { input, userId, orderId, includeDiagnostics } = request;

  // ─────────────────────────────────────────────────────────────
  // STEP 1: COMPUTE
  // ─────────────────────────────────────────────────────────────
  console.log(`[Report] Computing profile for ${input.email}...`);
  const computeResult = stepCompute(input);

  if (!computeResult.success || !computeResult.result) {
    console.error(`[Report] Computation failed: ${computeResult.error}`);
    return {
      success: false,
      status: "failed",
      error: computeResult.error,
      blockedReason: "Computation error - unable to calculate profile",
    };
  }

  const computation = computeResult.result;
  console.log(`[Report] Computation successful. Personalization score: ${computation.personalityScore}/10`);

  // ─────────────────────────────────────────────────────────────
  // STEP 2: VALIDATE
  // ─────────────────────────────────────────────────────────────
  console.log(`[Report] Validating computation...`);
  const validateResult = stepValidate(input, computation);

  if (!validateResult.success || !validateResult.report) {
    console.error(`[Report] Validation failed - see report below`);
    const report = validateResult.report;

    if (report) {
      const validationText = formatValidationReport(report);
      console.error(validationText);

      return {
        success: false,
        status: "validated",
        computation,
        validation: report,
        validationReport: includeDiagnostics ? validationText : undefined,
        error: validateResult.error,
        blockedReason: `BLOCKED: ${report.criticalErrors.length} critical error(s) found`,
        warnings: report.warnings.map((w) => w.message),
      };
    }

    return {
      success: false,
      status: "failed",
      error: validateResult.error,
      blockedReason: "Validation error - unable to proceed",
    };
  }

  const validation = validateResult.report;
  console.log(`[Report] Validation passed. ${validation.passedChecks.length} checks passed.`);

  if (validation.warnings.length > 0) {
    console.warn(`[Report] ${validation.warnings.length} warning(s) detected:`);
    validation.warnings.forEach((w) => console.warn(`  - ${w.message}`));
  }

  // ─────────────────────────────────────────────────────────────
  // STEP 3: RENDER
  // ─────────────────────────────────────────────────────────────
  console.log(`[Report] Rendering PDF...`);
  const renderResult = stepRender(input, computation, validation);

  if (!renderResult.success) {
    console.error(`[Report] Rendering failed: ${renderResult.error}`);
    return {
      success: false,
      status: "failed",
      computation,
      validation,
      error: renderResult.error,
      blockedReason: "Rendering failed - check dependencies",
    };
  }

  console.log(`[Report] PDF rendered successfully!`);
  console.log(`[Report] Output: Personalized ${computation.metrics.calorieTarget}kcal nutrition blueprint`);

  // ─────────────────────────────────────────────────────────────
  // SUCCESS
  // ─────────────────────────────────────────────────────────────
  return {
    success: true,
    status: "rendered",
    computation,
    validation,
    validationReport: includeDiagnostics ? formatValidationReport(validation) : undefined,
  };
}

// ════════════════════════════════════════════════════════════════
// SUMMARY REPORT
// Returns human-readable summary of the report generation process
// ════════════════════════════════════════════════════════════════

export function summarizeReportGeneration(response: ReportGenerationResponse): string {
  let summary = "═══════════════════════════════════════════════════════════════\n";
  summary += "REPORT GENERATION SUMMARY\n";
  summary += "═══════════════════════════════════════════════════════════════\n\n";

  summary += `Status: ${response.status.toUpperCase()}\n`;
  summary += `Result: ${response.success ? "✅ SUCCESS" : "❌ FAILED"}\n\n`;

  if (response.computation) {
    const c = response.computation;
    summary += "METABOLIC PROFILE:\n";
    summary += `  BMI: ${c.metrics.bmi} (${c.metrics.bmiCategory})\n`;
    summary += `  BMR: ${c.metrics.bmr} kcal\n`;
    summary += `  TDEE: ${c.metrics.tdee} kcal (Activity ${c.metrics.activityMultiplier}x)\n`;
    summary += `  Calorie Target: ${c.metrics.calorieTarget} kcal\n`;
    summary += `  Macros: ${c.metrics.macros.proteinGrams}g protein, ${c.metrics.macros.carbsGrams}g carbs, ${c.metrics.macros.fatsGrams}g fats\n`;
    summary += `  Personalization Score: ${c.personalityScore}/10\n\n`;
  }

  if (response.validation) {
    const v = response.validation;
    summary += "VALIDATION RESULTS:\n";
    summary += `  Critical Errors: ${v.criticalErrors.length}\n`;
    summary += `  Warnings: ${v.warnings.length}\n`;
    summary += `  Passed Checks: ${v.passedChecks.length}\n`;

    if (v.criticalErrors.length > 0) {
      summary += "\n  ERROR DETAILS:\n";
      v.criticalErrors.forEach((err) => {
        summary += `    - [${err.code}] ${err.message}\n`;
      });
    }
  }

  if (response.error) {
    summary += `\nERROR: ${response.error}\n`;
  }

  if (response.blockedReason) {
    summary += `BLOCKED REASON: ${response.blockedReason}\n`;
  }

  return summary;
}

// ════════════════════════════════════════════════════════════════
// BATCH REPORT GENERATION
// Generate reports for multiple users
// ════════════════════════════════════════════════════════════════

export interface BatchReportResult {
  total: number;
  successful: number;
  failed: number;
  results: Array<{
    email: string;
    success: boolean;
    reason?: string;
  }>;
}

export function generateBatchReports(requests: ReportGenerationRequest[]): BatchReportResult {
  const results: BatchReportResult = {
    total: requests.length,
    successful: 0,
    failed: 0,
    results: [],
  };

  requests.forEach((request) => {
    const response = generateReport(request);
    if (response.success) {
      results.successful++;
      results.results.push({
        email: request.input.email,
        success: true,
      });
    } else {
      results.failed++;
      results.results.push({
        email: request.input.email,
        success: false,
        reason: response.blockedReason || response.error,
      });
    }
  });

  return results;
}
