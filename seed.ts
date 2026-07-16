import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");
  await prisma.player.deleteMany({});
  await prisma.matchParticipant.deleteMany({});
  await prisma.match.deleteMany({});

  const players = await Promise.all([
    prisma.player.create({ data: { nickname: 'oktaywhite', currentMmr: 1500, peakMmr: 1550, wins: 20, losses: 10 } }),
    prisma.player.create({ data: { nickname: 'Faker', currentMmr: 2500, peakMmr: 2500, wins: 150, losses: 20 } }),
    prisma.player.create({ data: { nickname: 'Chovy', currentMmr: 2450, peakMmr: 2480, wins: 140, losses: 25 } }),
    prisma.player.create({ data: { nickname: 'ShowMaker', currentMmr: 2300, peakMmr: 2400, wins: 120, losses: 40 } }),
    prisma.player.create({ data: { nickname: 'Rookie', currentMmr: 2200, peakMmr: 2350, wins: 100, losses: 50 } }),
  ]);

  const match1 = await prisma.match.create({
    data: {
      winner: 'BLUE',
      participants: {
        create: [
          { playerId: players[0].id, team: 'BLUE', champion: 'Ahri', kills: 10, deaths: 2, assists: 5 },
          { playerId: players[1].id, team: 'RED', champion: 'Zed', kills: 8, deaths: 4, assists: 2 },
        ]
      }
    }
  });

  console.log("Seeding complete!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
