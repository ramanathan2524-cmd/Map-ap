import { z } from "zod";

export const boothQuerySchema = z.object({
  north:              z.coerce.number().optional(),
  south:              z.coerce.number().optional(),
  east:               z.coerce.number().optional(),
  west:               z.coerce.number().optional(),
  districtId:         z.string().optional(),
  mpConstituencyId:   z.string().optional(),
  mlaConstituencyId:  z.string().optional(),
  mandalId:           z.string().optional(),
  villageId:          z.string().optional(),
  partyId:            z.string().optional(),
  page:               z.coerce.number().int().min(1).default(1),
  limit:              z.coerce.number().int().min(1).max(1000).default(500),
  year:               z.coerce.number().int().min(2000).max(2030).default(2024),
});

export const regionQuerySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2030).default(2024),
});

export const geoFilterSchema = z.object({
  districtId:         z.string().optional(),
  mpConstituencyId:   z.string().optional(),
  mlaConstituencyId:  z.string().optional(),
  mandalId:           z.string().optional(),
  year:               z.coerce.number().int().default(2024),
});
