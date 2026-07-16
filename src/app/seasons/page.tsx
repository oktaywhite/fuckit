import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Calendar, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function SeasonsPage({ searchParams }: { searchParams: Promise<{ game?: string }> }) {
  const resolvedParams = await searchParams;
  const gameParam = resolvedParams?.game || "LOL";
  const game = (gameParam === "ROCKET_LEAGUE" || gameParam === "VALORANT") ? gameParam : "LOL";

  const seasons = await (prisma as any).season.findMany({
    where: { isActive: false, game: game as any },
    orderBy: { endDate: 'desc' },
    include: {
      _count: {
        select: { matches: true, stats: true }
      }
    }
  });

  return (
    <div className="space-y-8 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-4xl mx-auto mt-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between space-y-4 md:space-y-0">
        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight">Geçmiş Sezonlar</h1>
          <p className="text-muted-foreground text-lg">Eski sezonların sıralamalarını ve maç arşivlerini inceleyin.</p>
        </div>
        <div className="flex gap-2 bg-muted/30 p-1.5 rounded-xl border border-border/50">
          <Link href="?game=LOL">
            <Button variant={game === "LOL" ? "default" : "ghost"} size="sm" className="rounded-lg">LoL</Button>
          </Link>
          <Link href="?game=ROCKET_LEAGUE">
            <Button variant={game === "ROCKET_LEAGUE" ? "default" : "ghost"} size="sm" className="rounded-lg">Rocket League</Button>
          </Link>
          <Link href="?game=VALORANT">
            <Button variant={game === "VALORANT" ? "default" : "ghost"} size="sm" className="rounded-lg">Valorant</Button>
          </Link>
        </div>
      </div>

      {seasons.length === 0 ? (
        <Card className="bg-background/40 backdrop-blur-md border-border/50 text-center py-12">
          <p className="text-muted-foreground">Henüz tamamlanmış bir sezon bulunmuyor.</p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {seasons.map((season: any) => (
            <Link key={season.id} href={`/seasons/${season.id}`}>
              <Card className="bg-background/40 backdrop-blur-md border-border/50 shadow-sm hover:shadow-md transition-all hover:-translate-y-1 hover:border-primary/50 group">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div className="space-y-1">
                    <CardTitle className="text-xl flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-primary" />
                      {season.name}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {season.startDate.toLocaleDateString('tr-TR')} - {season.endDate?.toLocaleDateString('tr-TR')}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </CardHeader>
                <CardContent className="pt-4 flex gap-6 text-sm text-muted-foreground">
                  <div>
                    <span className="font-bold text-foreground">{season._count.stats}</span> Oyuncu
                  </div>
                  <div>
                    <span className="font-bold text-foreground">{season._count.matches}</span> Maç
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
