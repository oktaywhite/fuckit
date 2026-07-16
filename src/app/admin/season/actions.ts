"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function endSeasonAction(formData: FormData) {
  const seasonId = formData.get("seasonId") as string;
  if (!seasonId) return;

  // 1. Fetch all current players
  const players = await prisma.player.findMany();

  // 2. Create PlayerSeasonStat for each player
  const seasonStats = players.map((p: any) => ({
    playerId: p.id,
    seasonId: seasonId,
    finalMmr: p.currentMmr,
    peakMmr: p.peakMmr,
    wins: p.wins,
    losses: p.losses,
  }));

  if (seasonStats.length > 0) {
    await (prisma as any).playerSeasonStat.createMany({
      data: seasonStats
    });
  }

  // 3. Reset all players
  await prisma.player.updateMany({
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
  revalidatePath("/admin/season");
  revalidatePath("/players");
  revalidatePath("/leaderboard");
}

export async function startSeasonAction(formData: FormData) {
  const name = formData.get("name") as string;
  const daysStr = formData.get("days") as string;
  
  if (!name || !daysStr) return;
  
  const days = parseInt(daysStr);
  if (isNaN(days) || days <= 0) return;

  const endDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

  await (prisma as any).season.create({
    data: {
      name,
      isActive: true,
      startDate: new Date(),
      endDate
    }
  });

  revalidatePath("/");
  revalidatePath("/admin/season");
}

export async function deletePastSeasonsAction() {
  await (prisma as any).season.deleteMany({
    where: { isActive: false }
  });

  revalidatePath("/admin/season");
  revalidatePath("/seasons");
}
