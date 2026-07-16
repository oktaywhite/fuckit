import { prisma } from "@/lib/prisma";
import { Users, Trophy } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function PlayersPage(props: { searchParams: Promise<{ game?: string }> }) {
  const params = await Promise.resolve(props.searchParams);
  const gameParam = params?.game || "LOL";
  const game = (gameParam === "ROCKET_LEAGUE" || gameParam === "VALORANT") ? gameParam : "LOL";

  const allGameStats = await prisma.playerGameStat.findMany({
    where: { game: game as any },
    orderBy: { currentMmr: 'desc' },
    include: {
      player: true
    }
  });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between space-y-4 md:space-y-0">
        <div className="flex flex-col space-y-2">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight flex items-center gap-4">
            <div className="bg-primary/10 p-3 rounded-2xl">
              <Users className="h-8 w-8 text-primary" />
            </div>
            Oyuncular
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl">
            FUCKIT'teki tüm oyuncuları keşfet, maç geçmişlerini incele.
          </p>
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

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {allGameStats.length === 0 ? (
          <div className="col-span-full text-muted-foreground text-center p-8 bg-background/40 backdrop-blur rounded-3xl border border-border/50">
            Henüz oyuncu bulunamadı.
          </div>
        ) : (
          allGameStats.map((stat: any) => {
            const player = stat.player;
            const totalMatches = stat.wins + stat.losses;
            const winRate = totalMatches > 0 ? Math.round((stat.wins / totalMatches) * 100) : 0;

            return (
              <Link key={player.id} href={`/player/${player.nickname}?game=${game}`}>
                <Card className="group border-border/50 bg-background/40 backdrop-blur-md shadow-sm hover:shadow-lg hover:-translate-y-1 hover:border-primary/50 transition-all rounded-[1.5rem] overflow-hidden">
                  <CardHeader className="flex flex-row items-center gap-4 pb-4 border-b border-border/30 bg-muted/20">
                    <Avatar className="h-14 w-14 border-2 border-background shadow-sm">
                      <AvatarImage src={player.avatar || undefined} alt={player.nickname} />
                      <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">
                        {player.nickname.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <h3 className="font-extrabold text-lg group-hover:text-primary transition-colors">
                        {player.nickname}
                      </h3>
                      <div className="text-sm text-primary font-bold font-mono flex items-center gap-1.5">
                        <Trophy className="h-4 w-4" />
                        {stat.currentMmr} MMR
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex gap-2 text-sm">
                        <Badge variant="secondary" className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 font-bold px-3">
                          {stat.wins} G
                        </Badge>
                        <Badge variant="secondary" className="bg-destructive/10 text-destructive hover:bg-destructive/20 font-bold px-3">
                          {stat.losses} M
                        </Badge>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-sm font-bold text-foreground">
                          %{winRate}
                        </span>
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                          Win Rate
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
