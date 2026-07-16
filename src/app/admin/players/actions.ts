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

  if (!playerId || !newMmrStr) return { error: "Eksik bilgi." };

  const newMmr = parseInt(newMmrStr);
  if (isNaN(newMmr)) return { error: "Geçersiz MMR." };

  const player = await prisma.player.findUnique({
    where: { id: playerId }
  });

  if (!player) return { error: "Oyuncu bulunamadı." };

  // Hesaplanacak miktar: Yeni hedeflenen MMR - Şu anki MMR
  const amount = newMmr - player.currentMmr;

  if (amount === 0) return { error: "MMR değeri zaten aynı." };

  // Müdahale kaydı ekle
  await (prisma as any).mmrAdjustment.create({
    data: {
      playerId,
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
}
