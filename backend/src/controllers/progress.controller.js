import { ProgressTracker } from "../models/ProgressTracker.model.js";
import { DietPlan } from "../models/dietplan.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";

/**
 * Get progress for a specific date (defaults to today)
 */
const getProgressByDate = asyncHandler(async (req, res) => {
    const { date } = req.query;
    const patientId = req.user._id;

    // Use provided date or today's date at 00:00:00
    const queryDate = date ? new Date(date) : new Date();
    queryDate.setHours(0, 0, 0, 0);

    let progress = await ProgressTracker.findOne({
        patient: patientId,
        date: queryDate
    });

    if (!progress) {
        // If no progress for today, we might want to initialize it if there's a diet plan
        const latestDietPlan = await DietPlan.findOne({ patient: patientId }).sort({ createdAt: -1 });

        if (latestDietPlan) {
            // Create a new tracker for today based on the latest diet plan
            progress = await ProgressTracker.create({
                patient: patientId,
                diet_plan: latestDietPlan._id,
                date: queryDate,
                water_intake_ml: 0,
                meal_log: [
                    { meal_type: "breakfast", status: "pending" },
                    { meal_type: "lunch", status: "pending" },
                    { meal_type: "dinner", status: "pending" }
                ]
            });
        } else {
            // No diet plan, just return empty data or 404
            return res.status(200).json(new ApiResponse(200, null, "No progress data available for this date."));
        }
    }

    return res.status(200).json(new ApiResponse(200, progress, "Progress fetched successfully."));
});

/**
 * Update water intake
 */
const updateWaterIntake = asyncHandler(async (req, res) => {
    const { amount, date } = req.body; // amount in ml
    const patientId = req.user._id;

    if (!amount) throw new ApiError(400, "Water amount is required");

    const queryDate = date ? new Date(date) : new Date();
    queryDate.setHours(0, 0, 0, 0);

    let progress = await ProgressTracker.findOne({
        patient: patientId,
        date: queryDate
    });

    if (!progress) {
        // Initialize if not exists
        const latestDietPlan = await DietPlan.findOne({ patient: patientId }).sort({ createdAt: -1 });
        if (!latestDietPlan) throw new ApiError(404, "No diet plan found to start tracking.");

        progress = await ProgressTracker.create({
            patient: patientId,
            diet_plan: latestDietPlan._id,
            date: queryDate,
            water_intake_ml: amount,
            meal_log: [
                { meal_type: "breakfast", status: "pending" },
                { meal_type: "lunch", status: "pending" },
                { meal_type: "dinner", status: "pending" }
            ]
        });
    } else {
        progress.water_intake_ml += amount;
        await progress.save();
    }

    return res.status(200).json(new ApiResponse(200, progress, "Water intake updated."));
});

/**
 * Mark meal as taken/completed
 */
const markMealTaken = asyncHandler(async (req, res) => {
    const { meal_type, date } = req.body;
    const patientId = req.user._id;

    if (!meal_type) throw new ApiError(400, "Meal type is required");

    const queryDate = date ? new Date(date) : new Date();
    queryDate.setHours(0, 0, 0, 0);

    let progress = await ProgressTracker.findOne({
        patient: patientId,
        date: queryDate
    });

    if (!progress) {
        // Initialize if not exists
        const latestDietPlan = await DietPlan.findOne({ patient: patientId }).sort({ createdAt: -1 });
        if (!latestDietPlan) throw new ApiError(404, "No diet plan found to start tracking.");

        progress = await ProgressTracker.create({
            patient: patientId,
            diet_plan: latestDietPlan._id,
            date: queryDate,
            meal_log: [
                { meal_type: "breakfast", status: meal_type === "breakfast" ? "completed" : "pending", acknowledged_at: meal_type === "breakfast" ? new Date() : null },
                { meal_type: "lunch", status: meal_type === "lunch" ? "completed" : "pending", acknowledged_at: meal_type === "lunch" ? new Date() : null },
                { meal_type: "dinner", status: meal_type === "dinner" ? "completed" : "pending", acknowledged_at: meal_type === "dinner" ? new Date() : null }
            ]
        });
    } else {
        const mealIndex = progress.meal_log.findIndex(m => m.meal_type === meal_type);
        if (mealIndex !== -1) {
            progress.meal_log[mealIndex].status = "completed";
            progress.meal_log[mealIndex].acknowledged_at = new Date();
        } else {
            progress.meal_log.push({
                meal_type,
                status: "completed",
                acknowledged_at: new Date()
            });
        }
        await progress.save();
    }

    return res.status(200).json(new ApiResponse(200, progress, `${meal_type} marked as taken.`));
});

/**
 * Get patient history (last 7 days by default)
 */
const getPatientHistory = asyncHandler(async (req, res) => {
    const patientId = req.user._id;
    const { limit = 7 } = req.query;

    const history = await ProgressTracker.find({
        patient: patientId
    })
        .sort({ date: -1 })
        .limit(parseInt(limit))
        .populate('diet_plan', 'suggestion');

    return res.status(200).json(new ApiResponse(200, history, "Patient history fetched successfully."));
});

export {
    getProgressByDate,
    updateWaterIntake,
    markMealTaken,
    getPatientHistory
};
