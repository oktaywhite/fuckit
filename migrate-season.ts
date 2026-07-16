import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Migrating existing matches to Season 1...');
  
  let season1 = await prisma.season.findFirst({
    where: { name: 'Sezon 1' }
  });

  if (!season1) {
    season1 = await prisma.season.create({
      data: {
        name: 'Sezon 1',
        isActive: true,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // +30 days default
      }
    });
    console.log('Created Sezon 1 with ID:', season1.id);
  } else {
    console.log('Sezon 1 already exists with ID:', season1.id);
  }

  const result = await prisma.match.updateMany({
    where: {
      seasonId: null
    },
    data: {
      seasonId: season1.id
    }
  });

  console.log(`Updated ${result.count} matches to belong to Sezon 1.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
