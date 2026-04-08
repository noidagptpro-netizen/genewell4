/**
 * REPORT GENERATION API ROUTES
 * Deterministic compute → validate → render pipeline
 * Only generates PDF if validation passes
 */

import { RequestHandler } from "express";
import { generateReport, summarizeReportGeneration, type ReportGenerationRequest } from "../shared/report-generate";
import type { QuizInput } from "../shared/input-schema";

// ════════════════════════════════════════════════════════════════
// POST /api/report/generate
// Generate personalized wellness report from quiz input
// Returns: { success, status, computation, validation, error }
// ════════════════════════════════════════════════════════════════

export const handleGenerateWellnessReport: RequestHandler = async (req, res) => {
  try {
    const { input, userId, orderId, includeDiagnostics } = req.body;

    // Validate input
    if (!input) {
      return res.status(400).json({
        success: false,
        error: "Missing 'input' (QuizInput object) in request body",
      });
    }

    // Ensure required fields exist
    if (!input.email || !input.age || !input.weightKg || !input.heightCm) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: email, age, weightKg, heightCm",
      });
    }

    console.log(`[API] Report generation request for ${input.email}`);

    // Generate report using deterministic pipeline
    const request: ReportGenerationRequest = {
      input,
      userId,
      orderId,
      includeDiagnostics: includeDiagnostics === true,
    };

    const response = generateReport(request);

    // Return response based on success
    if (response.success) {
      console.log(`[API] Report generated successfully for ${input.email}`);
      return res.status(200).json({
        success: true,
        status: response.status,
        computation: response.computation,
        validation: response.validation,
        validationReport: response.validationReport,
      });
    } else {
      // Report generation blocked by validation
      console.warn(`[API] Report generation blocked for ${input.email}: ${response.blockedReason}`);
      return res.status(400).json({
        success: false,
        status: response.status,
        blockedReason: response.blockedReason,
        computation: response.computation,
        validation: response.validation,
        validationReport: response.validationReport,
        warnings: response.warnings,
        error: response.error,
      });
    }
  } catch (error) {
    console.error("[API] Report generation error:", error);
    return res.status(500).json({
      success: false,
      error: `Server error: ${error instanceof Error ? error.message : String(error)}`,
    });
  }
};

// ════════════════════════════════════════════════════════════════
// GET /api/report/validate/:email
// Pre-check if a user's data can generate a valid report
// Returns: { canGenerate, criticalErrors, warnings }
// ════════════════════════════════════════════════════════════════

export const handleValidateReportInput: RequestHandler = async (req, res) => {
  try {
    const { email } = req.params;
    const { input } = req.body;

    if (!input || !email) {
      return res.status(400).json({
        success: false,
        error: "Missing email parameter and/or input object in body",
      });
    }

    console.log(`[API] Validating report input for ${email}`);

    const request: ReportGenerationRequest = { input };
    const response = generateReport(request);

    return res.status(200).json({
      success: true,
      email,
      canGenerate: response.success,
      blockedReason: response.blockedReason,
      computation: {
        personalityScore: response.computation?.personalityScore,
        metrics: response.computation?.metrics
          ? {
              bmi: response.computation.metrics.bmi,
              bmr: response.computation.metrics.bmr,
              tdee: response.computation.metrics.tdee,
              calorieTarget: response.computation.metrics.calorieTarget,
            }
          : undefined,
      },
      validation: response.validation
        ? {
            isValid: response.validation.isValid,
            criticalErrors: response.validation.criticalErrors.length,
            warnings: response.validation.warnings.length,
            errors: response.validation.criticalErrors.map((e) => ({
              code: e.code,
              message: e.message,
            })),
          }
        : undefined,
    });
  } catch (error) {
    console.error("[API] Validation error:", error);
    return res.status(500).json({
      success: false,
      error: `Server error: ${error instanceof Error ? error.message : String(error)}`,
    });
  }
};

// ════════════════════════════════════════════════════════════════
// POST /api/report/diagnose
// Run full diagnostic on computation and validation
// Returns: { computation, validation, formattedReport }
// ════════════════════════════════════════════════════════════════

export const handleReportDiagnostics: RequestHandler = async (req, res) => {
  try {
    const { input } = req.body;

    if (!input) {
      return res.status(400).json({
        success: false,
        error: "Missing 'input' in request body",
      });
    }

    console.log(`[API] Running diagnostics for ${input.email}`);

    const request: ReportGenerationRequest = {
      input,
      includeDiagnostics: true,
    };

    const response = generateReport(request);
    const summary = summarizeReportGeneration(response);

    return res.status(200).json({
      success: response.success,
      status: response.status,
      blockedReason: response.blockedReason,
      computation: response.computation,
      validation: response.validation,
      diagnosticReport: summary,
    });
  } catch (error) {
    console.error("[API] Diagnostic error:", error);
    return res.status(500).json({
      success: false,
      error: `Server error: ${error instanceof Error ? error.message : String(error)}`,
    });
  }
};

// ════════════════════════════════════════════════════════════════
// POST /api/report/batch
// Generate reports for multiple users
// Returns: { total, successful, failed, results }
// ════════════════════════════════════════════════════════════════

export const handleBatchReportGeneration: RequestHandler = async (req, res) => {
  try {
    const { inputs } = req.body;

    if (!Array.isArray(inputs) || inputs.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Missing 'inputs' array in request body",
      });
    }

    console.log(`[API] Batch report generation for ${inputs.length} users`);

    const requests: ReportGenerationRequest[] = inputs.map((input) => ({ input }));
    const results = { total: 0, successful: 0, failed: 0, details: [] as any[] };

    inputs.forEach((input, index) => {
      const response = generateReport({ input });
      results.total++;
      if (response.success) {
        results.successful++;
        results.details.push({
          email: input.email,
          success: true,
          personalityScore: response.computation?.personalityScore,
        });
      } else {
        results.failed++;
        results.details.push({
          email: input.email,
          success: false,
          blockedReason: response.blockedReason,
        });
      }
    });

    return res.status(200).json({
      success: true,
      ...results,
    });
  } catch (error) {
    console.error("[API] Batch generation error:", error);
    return res.status(500).json({
      success: false,
      error: `Server error: ${error instanceof Error ? error.message : String(error)}`,
    });
  }
};

// ════════════════════════════════════════════════════════════════
// Export handlers
// ════════════════════════════════════════════════════════════════

export default {
  handleGenerateWellnessReport,
  handleValidateReportInput,
  handleReportDiagnostics,
  handleBatchReportGeneration,
};
