import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import { asyncHandler } from "../utils/asyncHandler";
import { getStats } from "../controllers/stats.controller";

export const statsRouter = Router();

statsRouter.use(requireAuth);
statsRouter.get("/", asyncHandler(getStats));
