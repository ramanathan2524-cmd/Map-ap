#!/usr/bin/env ts-node
/**
 * Data Pipeline Script: Import GeoJSON boundary files into PostGIS
 *
 * Usage:
 *   npm run import-geo -- --level=district --file=./data/geojson/districts.geojson
 *   npm run import-geo -- --level=mp       --file=./data/geojson/mp_constituencies.geojson
 *   npm run import-geo -- --level=mla      --file=./data/geojson/mla_constituencies.geojson
 *   npm run import-geo -- --level=mandal   --file=./data/geojson/mandals.geojson
 *
 * The GeoJSON features must have these properties:
 *   - district:  { id?, name, code }
 *   - mp:        { id?, name, code, number, district_id }
 *   - mla:       { id?, name, code, number, mp_constituency_id, district_id }
 *   - mandal:    { id?, name, code, mla_constituency_id, district_id }
 *   - village:   { id?, name, code, mandal_id, district_id }
 */

import "dotenv/config";
import * as fs from "fs";
import * as path from "path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface GeoJSONFeature {
  type: "Feature";
  geometry: { type: string; coordinates: any };
  properties: Record<string, any>;
}

const args = process.argv.slice(2).reduce<Record<string, string>>((acc, arg) => {
  const [k, v] = arg.replace("--", "").split("=");
  acc[k] = v;
  return acc;
}, {});

const LEVEL = args.level ?? "district";
const FILE  = args.file  ?? `./data/geojson/${LEVEL}s.geojson`;

const TABLE_MAP: Record<string, string> = {
  district: "districts",
  mp:       "mp_constituencies",
  mla:      "mla_constituencies",
  mandal:   "mandals",
  village:  "villages",
};

async function importGeoJSON() {
  const table = TABLE_MAP[LEVEL];
  if (!table) {
    console.error(`Unknown level: ${LEVEL}. Use: district, mp, mla, mandal, village`);
    process.exit(1);
  }

  const filePath = path.resolve(FILE);
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
  }

  console.log(`\n📥 Importing ${LEVEL} boundaries from ${filePath}…`);
  const raw = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  const features: GeoJSONFeature[] = raw.features ?? [];

  console.log(`   Found ${features.length} features`);

  let imported = 0;
  let skipped  = 0;

  for (const feature of features) {
    const props = feature.properties;
    const geomWKT = `ST_GeomFromGeoJSON('${JSON.stringify(feature.geometry)}')`;

    try {
      if (LEVEL === "district") {
        await prisma.$executeRawUnsafe(`
          INSERT INTO districts (id, name, code, total_voters, geom)
          VALUES (
            COALESCE('${props.id}', gen_random_uuid()::text),
            '${props.name?.replace(/'/g, "''")}',
            '${props.code ?? props.name?.toUpperCase().replace(/\s+/g, "_").slice(0, 10)}',
            ${props.total_voters ?? 0},
            ST_Multi(ST_SetSRID(${geomWKT}, 4326))
          )
          ON CONFLICT (code) DO UPDATE
            SET geom = EXCLUDED.geom,
                name = EXCLUDED.name
        `);
      } else if (LEVEL === "mandal") {
        await prisma.$executeRawUnsafe(`
          INSERT INTO mandals (id, name, code, mla_constituency_id, district_id, total_voters, geom)
          VALUES (
            COALESCE('${props.id}', gen_random_uuid()::text),
            '${props.name?.replace(/'/g, "''")}',
            '${props.code}',
            '${props.mla_constituency_id}',
            '${props.district_id}',
            ${props.total_voters ?? 0},
            ST_Multi(ST_SetSRID(${geomWKT}, 4326))
          )
          ON CONFLICT (code) DO UPDATE SET geom = EXCLUDED.geom
        `);
      }
      // ... similar for mp, mla, village

      imported++;
    } catch (err: any) {
      console.warn(`   ⚠️  Skipped feature '${props.name}': ${err.message}`);
      skipped++;
    }
  }

  console.log(`\n✅ Done — imported: ${imported}, skipped: ${skipped}`);
  await prisma.$disconnect();
}

importGeoJSON().catch((e) => {
  console.error(e);
  process.exit(1);
});
