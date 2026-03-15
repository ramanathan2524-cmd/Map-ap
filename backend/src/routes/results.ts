import { Router } from "express";
import { ResultsController } from "../controllers/resultsController";
import { cacheMiddleware } from "../middleware/cache";
import { validateQuery } from "../middleware/validate";
import { boothQuerySchema, regionQuerySchema } from "../models/schemas";

const router = Router();
const results = new ResultsController();

const CACHE_5M  = cacheMiddleware(5 * 60);
const CACHE_15M = cacheMiddleware(15 * 60);

// Region stats
router.get("/:level/:id", CACHE_15M, validateQuery(regionQuerySchema), results.getRegionStats);

// Booths (bbox-aware, paginated)
router.get("/booths", CACHE_5M, validateQuery(boothQuerySchema), results.getBooths);

// Single booth
router.get("/booths/:id", CACHE_15M, results.getBoothDetail);

// Party performance across all regions
router.get("/party/:partyId", CACHE_15M, results.getPartyPerformance);

// Summary stats for the whole state
router.get("/summary/state", CACHE_15M, results.getStateSummary);

export default router;
