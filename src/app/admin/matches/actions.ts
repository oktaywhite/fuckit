"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { recalculateAllPlayerStats } from "@/lib/stats";

export async function deleteMatchAction(formData: FormData) {
  const id = formData.get("id") as string;

  if (!id) return;

  await prisma.match.delete({
    where: { id },
  });

  // Re-calculate all MMR and stats from scratch to ensure consistency
  await recalculateAllPlayerStats();

  revalidatePath("/", "layout");
}

export async function createMatchAction(formData: FormData) {
  const payloadStr = formData.get("payload") as string;
  if (!payloadStr) return { error: "Payload missing" };

  try {
    const data = JSON.parse(payloadStr);
    
    // Data validation
    if (!data.winner || !data.blueTeam || !data.redTeam) {
      return { error: "Eksik veri" };
    }

    if (data.blueTeam.length === 0 || data.redTeam.length === 0) {
      return { error: "Takımlar boş olamaz" };
    }

    // Get active season
    const activeSeason = await prisma.season.findFirst({
      where: { isActive: true },
      orderBy: { startDate: "desc" }
    });

    if (!activeSeason) {
      return { error: "Şu an aktif bir sezon yok. Lütfen önce admin panelinden bir sezon başlatın." };
    }

    // Create match
    const match = await prisma.match.create({
      data: {
        winner: data.winner,
        date: new Date(),
        seasonId: activeSeason.id,
      },
    });

    const participants = [];

    for (const p of data.blueTeam) {
      participants.push({
        matchId: match.id,
        playerId: p.playerId,
        team: "BLUE",
        champion: p.champion || "Unknown",
        kills: parseInt(p.kills) || 0,
        deaths: parseInt(p.deaths) || 0,
        assists: parseInt(p.assists) || 0,
      });
    }

    for (const p of data.redTeam) {
      participants.push({
        matchId: match.id,
        playerId: p.playerId,
        team: "RED",
        champion: p.champion || "Unknown",
        kills: parseInt(p.kills) || 0,
        deaths: parseInt(p.deaths) || 0,
        assists: parseInt(p.assists) || 0,
      });
    }

    await prisma.matchParticipant.createMany({
      data: participants,
    });

    // Re-calculate all MMR
    await recalculateAllPlayerStats();

  } catch (error: any) {
    console.error(error);
    return { error: error.message || "Bir hata oluştu" };
  }

  revalidatePath("/", "layout");
  redirect("/admin/matches");
}
