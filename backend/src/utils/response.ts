import { Response } from "express";

export const sendSuccess = (
  res: Response,
  data: unknown,
  meta?: Record<string, unknown>
) => {
  res.json({ success: true, data, ...(meta ? { meta } : {}) });
};

export const sendError = (res: Response, message: string, statusCode = 400) => {
  res.status(statusCode).json({ success: false, error: message });
};
