import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import { asyncHandler } from "../utils/asyncHandler";
import { getProfile, updateProfile } from "../controllers/profile.controller";

export const profileRouter = Router();

profileRouter.use(requireAuth);
profileRouter.get("/", asyncHandler(getProfile));
profileRouter.put("/", asyncHandler(updateProfile));
