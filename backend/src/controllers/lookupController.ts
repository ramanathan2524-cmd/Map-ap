import { Request, Response, NextFunction } from "express";
import { LookupService } from "../services/lookupService";
import { sendSuccess } from "../utils/response";

const svc = new LookupService();

export class LookupController {
  getParties = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const year = parseInt(req.query.year as string) || 2024;
      sendSuccess(res, await svc.getParties(year));
    } catch (e) { next(e); }
  };

  getDistricts = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      sendSuccess(res, await svc.getDistricts());
    } catch (e) { next(e); }
  };

  getMPConstituencies = async (req: Request, res: Response, next: NextFunction) => {
    try {
      sendSuccess(res, await svc.getMPConstituencies(req.query.districtId as string));
    } catch (e) { next(e); }
  };

  getMLAConstituencies = async (req: Request, res: Response, next: NextFunction) => {
    try {
      sendSuccess(res, await svc.getMLAConstituencies(req.query.mpId as string));
    } catch (e) { next(e); }
  };

  getMandals = async (req: Request, res: Response, next: NextFunction) => {
    try {
      sendSuccess(res, await svc.getMandals(req.query.mlaId as string));
    } catch (e) { next(e); }
  };

  getVillages = async (req: Request, res: Response, next: NextFunction) => {
    try {
      sendSuccess(res, await svc.getVillages(req.query.mandalId as string));
    } catch (e) { next(e); }
  };

  search = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const q = (req.query.q as string) ?? "";
      if (q.length < 2) return sendSuccess(res, []);
      sendSuccess(res, await svc.search(q));
    } catch (e) { next(e); }
  };
}
