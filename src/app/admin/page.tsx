import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { Users, Swords, Trophy } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const playersCount = await prisma.player.count();
  const matchesCount = await prisma.match.count();
  const highestMmrPlayer = await prisma.player.findFirst({
    orderBy: { currentMmr: 'desc' }
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Sisteme genel bakış ve hızlı işlemler.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-card/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Toplam Oyuncu</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{playersCount}</div>
          </CardContent>
        </Card>

        <Card className="bg-card/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Toplam Maç</CardTitle>
            <Swords className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{matchesCount}</div>
          </CardContent>
        </Card>

        <Card className="bg-card/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">En Yüksek MMR</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {highestMmrPlayer ? highestMmrPlayer.currentMmr : 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {highestMmrPlayer ? highestMmrPlayer.nickname : "-"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-4">
        <Link href="/admin/players/new">
          <Button variant="default">Oyuncu Ekle</Button>
        </Link>
        <Link href="/admin/matches/new">
          <Button variant="secondary">Maç Ekle</Button>
        </Link>
      </div>
    </div>
  );
}
