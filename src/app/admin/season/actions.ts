"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { Game } from "@prisma/client";

export async function endSeasonAction(formData: FormData) {
  const seasonId = formData.get("seasonId") as string;
  if (!seasonId) return;

  const season = await (prisma as any).season.findUnique({ where: { id: seasonId } });
  if (!season) return;

  // 1. Fetch all current players' game stats for this season's game
  const gameStats = await prisma.playerGameStat.findMany({
    where: { game: season.game as Game }
  });

  // 2. Create PlayerSeasonStat for each player
  const seasonStats = gameStats.map((stat) => ({
    playerId: stat.playerId,
    seasonId: seasonId,
    finalMmr: stat.currentMmr,
    peakMmr: stat.peakMmr,
    wins: stat.wins,
    losses: stat.losses,
  }));

  if (seasonStats.length > 0) {
    await (prisma as any).playerSeasonStat.createMany({
      data: seasonStats
    });
  }

  // 3. Reset all players' stats for this game
  await prisma.playerGameStat.updateMany({
    where: { game: season.game as Game },
    data: {
      currentMmr: 1000,
      peakMmr: 1000,
      wins: 0,
      losses: 0,
    }
  });

  // 4. Mark season as inactive
  await (prisma as any).season.update({
    where: { id: seasonId },
    data: {
      isActive: false,
      endDate: new Date(), // End it right now
    }
  });

  revalidatePath("/");
  revalidatePath("/rocket-league");
  revalidatePath("/valorant");
  revalidatePath("/admin/season");
  revalidatePath("/players");
  revalidatePath("/leaderboard");
}

export async function startSeasonAction(formData: FormData) {
  const name = formData.get("name") as string;
  const daysStr = formData.get("days") as string;
  const game = formData.get("game") as string || "LOL";
  
  if (!name || !daysStr) return;
  
  const days = parseInt(daysStr);
  if (isNaN(days) || days <= 0) return;

  const endDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

  await (prisma as any).season.create({
    data: {
      name,
      game: game as Game,
      isActive: true,
      startDate: new Date(),
      endDate
    }
  });

  revalidatePath("/");
  revalidatePath("/rocket-league");
  revalidatePath("/valorant");
  revalidatePath("/admin/season");
}

export async function deletePastSeasonsAction() {
  await (prisma as any).season.deleteMany({
    where: { isActive: false }
  });

  revalidatePath("/admin/season");
  revalidatePath("/seasons");
}
