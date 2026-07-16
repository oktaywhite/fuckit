"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { recalculateAllPlayerStats } from "@/lib/stats";
import { Game } from "@prisma/client";

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
    if (!data.winner || !data.blueTeam || !data.redTeam || !data.seasonId) {
      return { error: "Eksik veri (Lütfen sezon seçin)" };
    }

    if (data.blueTeam.length === 0 || data.redTeam.length === 0) {
      return { error: "Takımlar boş olamaz" };
    }

    // Get selected season
    const selectedSeason = await prisma.season.findUnique({
      where: { id: data.seasonId }
    });

    if (!selectedSeason || !selectedSeason.isActive) {
      return { error: "Geçersiz veya kapalı sezon." };
    }

    // Create match
    const match = await prisma.match.create({
      data: {
        winner: data.winner,
        date: new Date(),
        seasonId: selectedSeason.id,
        game: selectedSeason.game,
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
        points: parseInt(p.points) || 0,
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
        points: parseInt(p.points) || 0,
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
