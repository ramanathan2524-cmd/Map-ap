import { Request, Response, NextFunction } from "express";
import { ResultsService } from "../services/resultsService";
import { sendSuccess } from "../utils/response";
import { AppError } from "../utils/errors";

const svc = new ResultsService();

const VALID_LEVELS = new Set([
  "state", "district", "mp_constituency",
  "mla_constituency", "mandal", "village",
]);

export class ResultsController {
  getRegionStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { level, id } = req.params;
      if (!VALID_LEVELS.has(level)) throw new AppError(`Invalid level: ${level}`, 400);

      const year = parseInt(req.query.year as string) || 2024;
      const data = await svc.getRegionStats(id, level as any, year);
      sendSuccess(res, data);
    } catch (e) { next(e); }
  };

  getBooths = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {
        north, south, east, west,
        districtId, mpConstituencyId, mlaConstituencyId,
        mandalId, villageId, partyId,
        page = "1", limit = "500", year,
      } = req.query as Record<string, string>;

      const params = {
        bbox: north ? { north: +north, south: +south, east: +east, west: +west } : undefined,
        districtId,
        mpConstituencyId,
        mlaConstituencyId,
        mandalId,
        villageId,
        partyId,
        page: Math.max(1, parseInt(page)),
        limit: Math.min(1000, parseInt(limit)),
        year: parseInt(year) || 2024,
      };

      const { data, total } = await svc.getBooths(params);
      sendSuccess(res, data, { total, page: params.page, limit: params.limit });
    } catch (e) { next(e); }
  };

  getBoothDetail = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const year = parseInt(req.query.year as string) || 2024;
      const data = await svc.getBoothDetail(req.params.id, year);
      sendSuccess(res, data);
    } catch (e) { next(e); }
  };

  getPartyPerformance = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const year = parseInt(req.query.year as string) || 2024;
      const data = await svc.getPartyPerformance(req.params.partyId, year);
      sendSuccess(res, data);
    } catch (e) { next(e); }
  };

  getStateSummary = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const year = parseInt(req.query.year as string) || 2024;
      const data = await svc.getStateSummary(year);
      sendSuccess(res, data);
    } catch (e) { next(e); }
  };
}
