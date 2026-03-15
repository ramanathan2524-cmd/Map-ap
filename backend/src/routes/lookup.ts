import { Router } from "express";
import { LookupController } from "../controllers/lookupController";
import { cacheMiddleware } from "../middleware/cache";

const router = Router();
const lookup = new LookupController();
const CACHE_1H = cacheMiddleware(60 * 60);

router.get("/parties",           CACHE_1H, lookup.getParties);
router.get("/districts",         CACHE_1H, lookup.getDistricts);
router.get("/mp-constituencies", CACHE_1H, lookup.getMPConstituencies);
router.get("/mla-constituencies",CACHE_1H, lookup.getMLAConstituencies);
router.get("/mandals",           CACHE_1H, lookup.getMandals);
router.get("/villages",          CACHE_1H, lookup.getVillages);
router.get("/search",            lookup.search);

export default router;
