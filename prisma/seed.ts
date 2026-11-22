import { PrismaClient } from '@prisma/client';
import { STATIONS, LINES } from '@/lib/railway-data';

const prisma = new PrismaClient();

// Helper: import stations (shared reference data)
async function importStations() {
  console.log(`Importing ${STATIONS.length} stations...`);
  for (const st of STATIONS) {
    await prisma.railwayStation.upsert({
      where: { id: st.id },
      update: {
        name: st.name,
        region: st.region,
        interchange: st.interchange,
        lines: JSON.stringify(st.lines),
      },
      create: {
        id: st.id,
        name: st.name,
        coords: JSON.stringify(st.coords),
        region: st.region,
        interchange: st.interchange,
        lines: JSON.stringify(st.lines),
      },
    });
  }
  console.log(`Imported ${STATIONS.length} stations.`);
}

// Helper: import lines (shared reference data)
async function importLines() {
  console.log(`Importing ${LINES.length} lines...`);
  for (const line of LINES) {
    await prisma.railwayLine.upsert({
      where: { id: line.id },
      update: {
        name: line.name,
        shortName: line.shortName,
        category: line.category,
        color: line.color,
        region: line.region,
        operator: line.operator,
        headway: line.headway,
        sequences: JSON.stringify(line.sequences),
      },
      create: {
        id: line.id,
        name: line.name,
        shortName: line.shortName,
        category: line.category,
        color: line.color,
        region: line.region,
        operator: line.operator,
        headway: line.headway,
        sequences: JSON.stringify(line.sequences),
      },
    });
  }
  console.log(`Imported ${LINES.length} lines.`);
}

async function main() {
  await importStations();
  await importLines();
  console.log('Database seeding complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
