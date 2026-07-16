"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { recalculateAllPlayerStats } from "@/lib/stats";

export async function addPlayerAction(state: any, formData: FormData) {
  const nickname = formData.get("nickname") as string;
  const avatar = formData.get("avatar") as string;

  if (!nickname || nickname.trim() === "") {
    return { error: "Nickname zorunludur." };
  }

  const existing = await prisma.player.findUnique({
    where: { nickname: nickname.trim() },
  });

  if (existing) {
    return { error: "Bu nickname zaten kullanılıyor." };
  }

  await prisma.player.create({
    data: {
      nickname: nickname.trim(),
      avatar: avatar.trim() || null,
    },
  });

  // Yeni oyuncunun varsayılan 1000 MMR statlarının oluşması için tetikliyoruz
  await recalculateAllPlayerStats();

  revalidatePath("/admin/players");
  revalidatePath("/players");
  revalidatePath("/leaderboard");
  revalidatePath("/");
  redirect("/admin/players");
}

export async function deletePlayerAction(formData: FormData) {
  const id = formData.get("id") as string;

  if (!id) return;

  await prisma.player.delete({
    where: { id },
  });

  // Bir oyuncu silindiğinde onun bulunduğu maçlar da silinir (Cascade on MatchParticipant)
  // Fakat o maçlardaki eksik kişi sorun yaratır, bu yüzden istatistikleri baştan hesaplamak en doğrusu:
  await recalculateAllPlayerStats();

  revalidatePath("/leaderboard");
  revalidatePath("/");
}

export async function adjustPlayerMmrAction(formData: FormData) {
  const playerId = formData.get("playerId") as string;
  const newMmrStr = formData.get("newMmr") as string;
  const game = (formData.get("game") as string) || "LOL";

  if (!playerId || !newMmrStr) return { error: "Eksik bilgi." };

  const newMmr = parseInt(newMmrStr);
  if (isNaN(newMmr)) return { error: "Geçersiz MMR." };

  const player = await prisma.player.findUnique({
    where: { id: playerId }
  });

  if (!player) return { error: "Oyuncu bulunamadı." };

  // Get the game-specific stat, or assume 1000 if none exists
  const gameStat = await prisma.playerGameStat.findUnique({
    where: { playerId_game: { playerId, game: game as any } }
  });

  const currentMmr = gameStat?.currentMmr ?? 1000;
  const amount = newMmr - currentMmr;

  if (amount === 0) {
    if (gameStat) {
      return { error: "MMR değeri zaten aynı." };
    } else {
      // Sadece kayıt oluşturmak için amount 0 olsa bile (örn: 1000) müdahale geçmişi oluşturur
    }
  }

  // Müdahale kaydı ekle (game-scoped)
  await (prisma as any).mmrAdjustment.create({
    data: {
      playerId,
      game: game as any,
      amount,
      date: new Date(),
    }
  });

  // Sistemi baştan hesapla ki bu müdahale zaman çizelgesinde yerini alsın
  await recalculateAllPlayerStats();

  revalidatePath("/admin/players");
  revalidatePath("/players");
  revalidatePath("/leaderboard");
  revalidatePath("/");
  revalidatePath("/rocket-league");
  revalidatePath("/valorant");
}
