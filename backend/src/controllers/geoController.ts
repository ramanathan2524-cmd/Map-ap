import { Request, Response, NextFunction } from "express";
import { GeoService } from "../services/geoService";
import { sendSuccess } from "../utils/response";

const svc = new GeoService();

export class GeoController {
  getState = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await svc.getStateBoundary();
      sendSuccess(res, data);
    } catch (e) { next(e); }
  };

  getDistricts = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await svc.getDistricts(req.query as any);
      sendSuccess(res, data);
    } catch (e) { next(e); }
  };

  getMPConstituencies = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await svc.getMPConstituencies(req.query as any);
      sendSuccess(res, data);
    } catch (e) { next(e); }
  };

  getMLAConstituencies = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await svc.getMLAConstituencies(req.query as any);
      sendSuccess(res, data);
    } catch (e) { next(e); }
  };

  getMandals = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await svc.getMandals(req.query as any);
      sendSuccess(res, data);
    } catch (e) { next(e); }
  };

  getVillages = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await svc.getVillages(req.query as any);
      sendSuccess(res, data);
    } catch (e) { next(e); }
  };

  getDistrictById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await svc.getDistrictById(req.params.id);
      sendSuccess(res, data);
    } catch (e) { next(e); }
  };

  getMPById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await svc.getMPById(req.params.id);
      sendSuccess(res, data);
    } catch (e) { next(e); }
  };

  getMLAById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await svc.getMLAById(req.params.id);
      sendSuccess(res, data);
    } catch (e) { next(e); }
  };

  getMandalById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await svc.getMandalById(req.params.id);
      sendSuccess(res, data);
    } catch (e) { next(e); }
  };
}
