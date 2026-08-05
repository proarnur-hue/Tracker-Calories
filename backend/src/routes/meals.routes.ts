import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import { analyzeRateLimiter } from "../middleware/rateLimit.middleware";
import { uploadPhoto } from "../middleware/upload.middleware";
import { asyncHandler } from "../utils/asyncHandler";
import {
  analyzeMeal,
  createMeal,
  deleteMeal,
  getMeal,
  listMeals,
  updateMeal,
} from "../controllers/meals.controller";

export const mealsRouter = Router();

mealsRouter.use(requireAuth);

mealsRouter.post("/analyze", analyzeRateLimiter, uploadPhoto, asyncHandler(analyzeMeal));
mealsRouter.post("/", asyncHandler(createMeal));
mealsRouter.get("/", asyncHandler(listMeals));
mealsRouter.get("/:id", asyncHandler(getMeal));
mealsRouter.patch("/:id", asyncHandler(updateMeal));
mealsRouter.delete("/:id", asyncHandler(deleteMeal));
