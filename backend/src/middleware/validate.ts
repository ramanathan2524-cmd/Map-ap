import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";

export const validateQuery =
  (schema: ZodSchema) =>
  (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: "Invalid query parameters",
        details: result.error.flatten().fieldErrors,
      });
    }
    req.query = result.data as any;
    next();
  };

export const validateBody =
  (schema: ZodSchema) =>
  (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: "Invalid request body",
        details: result.error.flatten().fieldErrors,
      });
    }
    req.body = result.data;
    next();
  };
