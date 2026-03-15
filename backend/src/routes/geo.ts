import { Router } from "express";
import { GeoController } from "../controllers/geoController";
import { cacheMiddleware } from "../middleware/cache";

const router = Router();
const geo = new GeoController();

// 30-minute cache for boundary data (rarely changes)
const CACHE_30M = cacheMiddleware(30 * 60);

/**
 * @swagger
 * /geo/state:
 *   get:
 *     summary: Get Andhra Pradesh state boundary GeoJSON
 *     tags: [Geo]
 *     responses:
 *       200:
 *         description: State boundary GeoJSON
 */
router.get("/state",              CACHE_30M, geo.getState);

/**
 * @swagger
 * /geo/districts:
 *   get:
 *     summary: Get all district boundaries
 *     tags: [Geo]
 */
router.get("/districts",          CACHE_30M, geo.getDistricts);

router.get("/mp-constituencies",  CACHE_30M, geo.getMPConstituencies);
router.get("/mla-constituencies", CACHE_30M, geo.getMLAConstituencies);
router.get("/mandals",            CACHE_30M, geo.getMandals);
router.get("/villages",           CACHE_30M, geo.getVillages);

// Single region boundary
router.get("/district/:id",          CACHE_30M, geo.getDistrictById);
router.get("/mp-constituency/:id",   CACHE_30M, geo.getMPById);
router.get("/mla-constituency/:id",  CACHE_30M, geo.getMLAById);
router.get("/mandal/:id",            CACHE_30M, geo.getMandalById);

export default router;
