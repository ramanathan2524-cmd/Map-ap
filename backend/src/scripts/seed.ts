/**
 * Seed script — populates parties, districts, constituencies, mandals,
 * villages, booths, and election results with realistic AP sample data.
 *
 * Run: npm run seed
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const PARTIES = [
  { name: "YSR Congress Party",          abbreviation: "YSRCP", color: "#1565C0" },
  { name: "Telugu Desam Party",          abbreviation: "TDP",   color: "#FFD600" },
  { name: "Jana Sena Party",             abbreviation: "JSP",   color: "#E53935" },
  { name: "Indian National Congress",    abbreviation: "INC",   color: "#00897B" },
  { name: "Bharatiya Janata Party",      abbreviation: "BJP",   color: "#FF6D00" },
  { name: "Communist Party of India",    abbreviation: "CPI",   color: "#B71C1C" },
  { name: "Independent",                 abbreviation: "IND",   color: "#9E9E9E" },
];

const DISTRICTS = [
  "Visakhapatnam", "Srikakulam", "Vizianagaram", "East Godavari",
  "West Godavari", "Krishna", "Guntur", "Prakasam",
  "Sri Potti Sriramulu Nellore", "Kurnool", "Anantapur", "Chittoor",
  "YSR Kadapa", "Tirupati",
];

async function seed() {
  console.log("🌱 Starting seed…");

  // ── Parties ──────────────────────────────────────────────────────────────
  console.log("  → Seeding parties…");
  const parties: Record<string, any> = {};
  for (const p of PARTIES) {
    const party = await prisma.party.upsert({
      where: { abbreviation: p.abbreviation },
      update: { color: p.color },
      create: p,
    });
    parties[p.abbreviation] = party;
  }

  // ── Districts ─────────────────────────────────────────────────────────────
  console.log("  → Seeding districts…");
  const districtRecords: Record<string, any> = {};
  for (const dName of DISTRICTS) {
    const code = dName.toUpperCase().replace(/\s+/g, "_").slice(0, 10);
    const district = await prisma.district.upsert({
      where: { code },
      update: {},
      create: {
        name: dName,
        code,
        totalVoters: Math.floor(Math.random() * 500_000) + 800_000,
      },
    });
    districtRecords[dName] = district;
  }

  // ── MP + MLA Constituencies, Mandals, Villages, Booths ───────────────────
  console.log("  → Seeding constituencies, mandals, villages, booths…");

  let mpCounter  = 1;
  let mlaCounter = 1;

  for (const district of Object.values(districtRecords)) {
    // 2 MP constituencies per district (simplified)
    for (let mp = 0; mp < 2; mp++) {
      const mpCode = `MP_${district.code}_${mp + 1}`;
      const mpConst = await prisma.mPConstituency.upsert({
        where: { code: mpCode },
        update: {},
        create: {
          name: `${district.name} MP ${mp + 1}`,
          code: mpCode,
          number: mpCounter++,
          districtId: district.id,
          totalVoters: Math.floor(district.totalVoters / 2),
        },
      });

      // 6 MLA constituencies per MP (simplified — actual ratio varies)
      for (let mla = 0; mla < 6; mla++) {
        const mlaCode = `MLA_${mpCode}_${mla + 1}`;
        const mlaConst = await prisma.mLAConstituency.upsert({
          where: { code: mlaCode },
          update: {},
          create: {
            name: `${district.name} Segment ${mlaCounter}`,
            code: mlaCode,
            number: mlaCounter++,
            mpConstituencyId: mpConst.id,
            districtId: district.id,
            totalVoters: Math.floor(district.totalVoters / 12),
          },
        });

        // 3 mandals per MLA
        for (let man = 0; man < 3; man++) {
          const manCode = `MAN_${mlaCode}_${man + 1}`;
          const mandal = await prisma.mandal.upsert({
            where: { code: manCode },
            update: {},
            create: {
              name: `Mandal ${manCode}`,
              code: manCode,
              mlaConstituencyId: mlaConst.id,
              districtId: district.id,
              totalVoters: Math.floor(mlaConst.totalVoters / 3),
            },
          });

          // 4 villages per mandal
          for (let vil = 0; vil < 4; vil++) {
            const vilCode = `VIL_${manCode}_${vil + 1}`;
            const village = await prisma.village.upsert({
              where: { code: vilCode },
              update: {},
              create: {
                name: `Village ${vilCode}`,
                code: vilCode,
                mandalId: mandal.id,
                districtId: district.id,
                totalVoters: Math.floor(mandal.totalVoters / 4),
              },
            });

            // 3 booths per village
            // NOTE: location (PostGIS) inserted via raw SQL below
            for (let b = 0; b < 3; b++) {
              const boothNum = `${mlaConst.number}-${man + 1}${vil + 1}${b + 1}`;
              await prisma.$executeRawUnsafe(`
                INSERT INTO booths (
                  id, booth_number, village_id, village_name,
                  mandal_id, mandal_name,
                  mla_constituency_id, mla_constituency_name,
                  mp_constituency_id, district_id,
                  total_voters, location
                ) VALUES (
                  gen_random_uuid(), '${boothNum}',
                  '${village.id}', '${village.name}',
                  '${mandal.id}', '${mandal.name}',
                  '${mlaConst.id}', '${mlaConst.name}',
                  '${mpConst.id}', '${district.id}',
                  ${Math.floor(village.totalVoters / 3)},
                  ST_SetSRID(ST_MakePoint(
                    ${79.5 + Math.random() * 4.8},
                    ${13.0 + Math.random() * 6.5}
                  ), 4326)
                )
                ON CONFLICT (booth_number, mla_constituency_id) DO NOTHING
              `);
            }
          }
        }

        // Seed MLA election result
        const winningPartyAbbr = randomParty();
        await seedElectionResult({
          regionId: mlaConst.id,
          level: "mla_constituency",
          totalVoters: mlaConst.totalVoters,
          winningPartyAbbr,
          parties,
        });
      }

      // Seed MP election result
      const winningPartyAbbr = randomParty();
      await seedElectionResult({
        regionId: mpConst.id,
        level: "mp_constituency",
        totalVoters: mpConst.totalVoters,
        winningPartyAbbr,
        parties,
        mpConstituencyId: mpConst.id,
      });
    }

    // Seed District election result
    const winningPartyAbbr = randomParty();
    await seedElectionResult({
      regionId: district.id,
      level: "district",
      totalVoters: district.totalVoters,
      winningPartyAbbr,
      parties,
      districtId: district.id,
    });
  }

  console.log("✅ Seed complete");
  await prisma.$disconnect();
}

function randomParty(): string {
  const weighted = ["YSRCP", "YSRCP", "TDP", "TDP", "JSP", "INC", "BJP"];
  return weighted[Math.floor(Math.random() * weighted.length)];
}

async function seedElectionResult({
  regionId, level, totalVoters, winningPartyAbbr, parties,
  districtId, mpConstituencyId, mlaConstituencyId, mandalId,
}: any) {
  const totalVotes = Math.floor(totalVoters * (0.65 + Math.random() * 0.25));
  const winnerVotes = Math.floor(totalVotes * (0.35 + Math.random() * 0.25));

  const mainParties = ["YSRCP", "TDP", "JSP", "INC", "BJP"];
  let remaining = totalVotes - winnerVotes;
  const partyResults = mainParties.map((abbr, i) => {
    if (abbr === winningPartyAbbr) {
      return { partyId: parties[abbr]?.id, partyCode: abbr, votes: winnerVotes, voteSharePercent: (winnerVotes / totalVotes) * 100 };
    }
    const v = i === mainParties.length - 1 ? remaining : Math.floor(remaining * Math.random() * 0.5);
    remaining -= v;
    return { partyId: parties[abbr]?.id, partyCode: abbr, votes: Math.max(0, v), voteSharePercent: (Math.max(0, v) / totalVotes) * 100 };
  });

  const second = [...partyResults].sort((a, b) => b.votes - a.votes)[1];
  const margin = winnerVotes - (second?.votes ?? 0);

  await prisma.electionResult.upsert({
    where: { regionId_regionLevel_electionYear_electionType: { regionId, regionLevel: level, electionYear: 2024, electionType: "assembly" } },
    update: {},
    create: {
      regionId, regionLevel: level,
      electionYear: 2024, electionType: "assembly",
      winningParty: winningPartyAbbr,
      winningPartyId: parties[winningPartyAbbr]?.id,
      totalVotesCast: totalVotes,
      totalVoters,
      voterTurnoutPercent: (totalVotes / totalVoters) * 100,
      marginOfVictory: Math.max(0, margin),
      partyResults,
      districtId, mpConstituencyId, mlaConstituencyId, mandalId,
    },
  });
}

seed().catch((e) => { console.error(e); process.exit(1); });
