import { prisma } from "@/lib/prisma";
import MatchForm from "@/app/admin/matches/new/match-form";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function NewMatchPage() {
  const activeSeasons = await prisma.season.findMany({
    where: { isActive: true },
    orderBy: { startDate: "desc" }
  });

  const players = await prisma.player.findMany({
    orderBy: { nickname: "asc" },
    include: { gameStats: true }
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <div className="flex items-center gap-4">
        <Link href="/admin/matches">
          <Button variant="outline" size="icon" className="shrink-0">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Yeni Maç Ekle</h1>
          <p className="text-muted-foreground text-sm">
            Mavi ve Kırmızı takımları oluşturun, istatistikleri girin ve maçı kaydedin.
          </p>
        </div>
      </div>

      <MatchForm players={players} activeSeasons={activeSeasons} />
    </div>
  );
}
