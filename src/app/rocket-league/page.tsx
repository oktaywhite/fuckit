import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Activity, Users } from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { getRankFromMmr, getRankStyle } from "@/lib/rank";
import { cn } from "@/lib/utils";
import { Game } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function RocketLeagueHome() {
  const playersCount = await prisma.playerGameStat.count({
    where: { game: Game.ROCKET_LEAGUE }
  });
  
  const matchesCount = await prisma.match.count({
    where: { game: Game.ROCKET_LEAGUE }
  });

  const activeSeason = await (prisma as any).season.findFirst({
    where: { isActive: true, game: Game.ROCKET_LEAGUE }
  });

  let remainingDays = null;
  if (activeSeason && activeSeason.endDate) {
    const diffTime = activeSeason.endDate.getTime() - Date.now();
    remainingDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  const allGameStats = await prisma.playerGameStat.findMany({
    where: { game: Game.ROCKET_LEAGUE },
    orderBy: { currentMmr: 'desc' },
    take: 50,
    include: {
      player: {
        include: {
          matchParticipants: {
            where: { match: { game: Game.ROCKET_LEAGUE } }
          }
        }
      }
    }
  });

  const playersWithStats = allGameStats.map(stat => {
    const player = stat.player;
    const totalMatches = stat.wins + stat.losses;
    const winRate = totalMatches > 0 ? Math.round((stat.wins / totalMatches) * 100) : 0;

    const totalKills = player.matchParticipants.reduce((acc: number, mp: any) => acc + mp.kills, 0);
    const totalDeaths = player.matchParticipants.reduce((acc: number, mp: any) => acc + mp.deaths, 0) || 1;
    const totalAssists = player.matchParticipants.reduce((acc: number, mp: any) => acc + mp.assists, 0);
    const kda = Number(((totalKills + totalAssists) / totalDeaths).toFixed(2));

    const avgGoals = totalMatches > 0 ? (totalKills / totalMatches).toFixed(1) : "0.0";
    const avgAssists = totalMatches > 0 ? (totalAssists / totalMatches).toFixed(1) : "0.0";
    const avgSaves = totalMatches > 0 ? (totalDeaths / totalMatches).toFixed(1) : "0.0";

    return {
      id: player.id,
      nickname: player.nickname,
      currentMmr: stat.currentMmr,
      totalMatches,
      winRate,
      kda,
      avgGoals,
      avgAssists,
      avgSaves
    };
  });

  playersWithStats.sort((a, b) => {
    if (b.currentMmr !== a.currentMmr) return b.currentMmr - a.currentMmr;
    if (b.winRate !== a.winRate) return b.winRate - a.winRate;
    if (b.totalMatches !== a.totalMatches) return b.totalMatches - a.totalMatches;
    return b.kda - a.kda;
  });

  const topPlayers = playersWithStats.slice(0, 4);

  const recentMatches = await prisma.match.findMany({
    where: { game: Game.ROCKET_LEAGUE },
    orderBy: { date: 'desc' },
    take: 50,
    include: {
      participants: {
        include: { player: true },
      },
      // @ts-ignore
      season: true,
    },
  });

  return (
    <div className="space-y-12 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">

      {/* HERO SECTION */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600/10 via-background to-blue-400/5 p-6 md:py-8 md:px-12 border border-blue-500/20 shadow-sm mt-4">
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
        <div className="relative z-10 w-full flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-4">
            <div className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] uppercase font-black tracking-wider shadow-sm w-fit ${activeSeason ? "border-blue-500/20 bg-blue-500/10 text-blue-500" : "border-destructive/20 bg-destructive/10 text-destructive"}`}>
              <span className={`flex h-1.5 w-1.5 rounded-full mr-2 animate-pulse ${activeSeason ? "bg-blue-500" : "bg-destructive"}`}></span>
              {activeSeason ? activeSeason.name : "Sezon Kapalı"}
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground leading-[1.1]">
              Rocket League <span className="text-blue-500 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-blue-400/60">Arena</span>
            </h1>
            <p className="text-base md:text-lg text-muted-foreground max-w-xl leading-relaxed">
              Havada uç, gol at ve takımını zafere taşı!
            </p>
          </div>
          <div className="pt-2 flex flex-wrap gap-4">
            <Link href="/leaderboard">
              <Button size="lg" className="rounded-full font-bold px-8 shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5 bg-blue-600 hover:bg-blue-700 text-white">
                Sıralamayı Gör
              </Button>
            </Link>
            <Link href="/players">
              <Button variant="outline" size="lg" className="rounded-full font-bold px-8 bg-background/50 backdrop-blur hover:bg-background/80 transition-all border-blue-500/30">
                Tüm Oyuncular
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* QUICK STATS */}
      <div className="grid gap-6 md:grid-cols-3">
        {activeSeason ? (
          <Card className="bg-background/40 backdrop-blur-md border-border/50 shadow-sm hover:shadow-md transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Kalan Gün</CardTitle>
              <div className="bg-blue-500/10 p-2 rounded-full">
                <Trophy className="h-4 w-4 text-blue-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black">
                {remainingDays !== null ? (remainingDays > 0 ? remainingDays : "Son Gün") : "Belirsiz"}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-background/40 backdrop-blur-md border-border/50 shadow-sm hover:shadow-md transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Sezon Durumu</CardTitle>
              <div className="bg-destructive/10 p-2 rounded-full">
                <Activity className="h-4 w-4 text-destructive" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-black text-destructive">Kapalı</div>
            </CardContent>
          </Card>
        )}
        <Card className="bg-background/40 backdrop-blur-md border-border/50 shadow-sm hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Toplam Oyuncu</CardTitle>
            <div className="bg-blue-500/10 p-2 rounded-full">
              <Users className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black">{playersCount}</div>
          </CardContent>
        </Card>
        <Card className="bg-background/40 backdrop-blur-md border-border/50 shadow-sm hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Oynanan Maç</CardTitle>
            <div className="bg-blue-500/10 p-2 rounded-full">
              <Activity className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black">{matchesCount}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">Top Players</h2>
          <div className="flex flex-col gap-2">
            {topPlayers.length === 0 ? (
              <div className="text-muted-foreground">No players found.</div>
            ) : (
              topPlayers.map((player: any, index: number) => {
                const rank = getRankFromMmr(player.currentMmr, "ROCKET_LEAGUE");

                return (
                  <Link key={player.id} href={`/player/${player.nickname}?game=ROCKET_LEAGUE`}>
                    <Card className="bg-card hover:bg-muted/50 transition-colors border-border/50 shadow-sm group">
                      <div className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-4 min-w-[180px] w-full sm:w-auto">
                          <div className="flex h-10 w-10 text-lg items-center justify-center rounded-full bg-blue-500/10 text-blue-500 font-bold shrink-0">
                            {index + 1}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-xl leading-tight">{player.nickname}</span>
                            <div className={cn("px-2.5 py-0.5 mt-1 rounded-full font-bold border flex items-center justify-center uppercase text-[10px] w-fit", getRankStyle(rank))}>
                              {rank}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-center w-full sm:w-auto bg-muted/20 px-4 py-1.5 rounded-xl border border-border/30 shrink-0">
                          <div className="flex flex-col text-center min-w-[60px]">
                            <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider mb-0.5">Win Rate</span>
                            <span className={cn("font-bold text-sm", player.winRate >= 50 ? "text-emerald-500" : "text-red-500")}>{player.winRate}%</span>
                          </div>
                          <div className="h-8 w-px bg-border/50 mx-3"></div>
                          <div className="flex flex-col text-center min-w-[40px]">
                            <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider mb-0.5">Maç</span>
                            <span className="font-bold text-sm">{player.totalMatches}</span>
                          </div>
                          <div className="h-8 w-px bg-border/50 mx-3"></div>
                          <div className="flex flex-col text-center min-w-[70px]">
                            <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider mb-0.5">G/A/S</span>
                            <span className="font-mono font-bold text-xs">{player.avgGoals}/{player.avgAssists}/{player.avgSaves}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 bg-background/50 px-3 py-1.5 rounded-lg border border-border/50 shrink-0 w-full sm:w-auto justify-center sm:justify-start">
                          <Trophy className="h-4 w-4 text-blue-500" />
                          <span className="font-mono font-bold text-lg">{player.currentMmr}</span>
                        </div>
                      </div>
                    </Card>
                  </Link>
                );
              })
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold tracking-tight">Son Oynanan Maçlar</h2>
          </div>
          <div className="flex flex-col gap-3">
            {recentMatches.length === 0 ? (
              <div className="text-muted-foreground bg-muted/20 p-6 rounded-xl text-center border border-border/50">Henüz hiç maç oynanmadı.</div>
            ) : (
              recentMatches.slice(0, 5).map((match: any) => (
                <Card key={match.id} className="p-3 border-border/50 bg-card/40 backdrop-blur hover:bg-card/60 transition-all shadow-sm flex flex-col gap-3">
                  <div className="flex justify-between items-center text-xs border-b border-border/50 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground font-medium">{match.date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                      {match.season && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-blue-500/10 text-blue-500 border border-blue-500/20 shrink-0">{match.season.name}</span>
                      )}
                    </div>
                    <span className={`font-black px-2 py-0.5 rounded text-[10px] shrink-0 ${match.winner === "BLUE" ? "bg-blue-500/10 text-blue-500 border border-blue-500/20" : "bg-red-500/10 text-red-500 border border-red-500/20"}`}>
                      {match.winner === "BLUE" ? "MAVİ TAKIM KAZANDI" : "KIRMIZI TAKIM KAZANDI"}
                    </span>
                  </div>

                  <div className="flex flex-row justify-between items-center gap-2 px-1">
                    {/* Blue Team */}
                    <div className="flex flex-col gap-1.5 w-full max-w-[45%]">
                      {match.participants.filter((p: any) => p.team === "BLUE").map((p: any) => (
                        <div key={p.id} className="flex items-center gap-2 w-full group">
                          <div className="w-5 h-5 rounded flex items-center justify-center text-[9px] font-black shrink-0 bg-blue-500/10 text-blue-500 border border-blue-500/20 shadow-sm" title={p.champion}>
                            {p.champion.substring(0, 2).toUpperCase()}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <Link href={`/player/${p.player.nickname}?game=ROCKET_LEAGUE`} className="truncate text-xs font-medium hover:underline text-muted-foreground group-hover:text-foreground transition-colors">
                              {p.player.nickname}
                            </Link>
                            <span className="text-[9px] font-mono text-muted-foreground/60 leading-none mt-0.5" title="Gol / Asist / Save / Puan">
                              {p.kills} / {p.assists} / {p.deaths} / {p.points || 0}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <span className="text-[10px] font-black text-muted-foreground/30 shrink-0">VS</span>

                    {/* Red Team */}
                    <div className="flex flex-col gap-1.5 w-full max-w-[45%]">
                      {match.participants.filter((p: any) => p.team === "RED").map((p: any) => (
                        <div key={p.id} className="flex items-center gap-2 w-full flex-row-reverse text-right group">
                          <div className="w-5 h-5 rounded flex items-center justify-center text-[9px] font-black shrink-0 bg-red-500/10 text-red-500 border border-red-500/20 shadow-sm" title={p.champion}>
                            {p.champion.substring(0, 2).toUpperCase()}
                          </div>
                          <div className="flex flex-col items-end min-w-0">
                            <Link href={`/player/${p.player.nickname}?game=ROCKET_LEAGUE`} className="truncate text-xs font-medium hover:underline text-muted-foreground group-hover:text-foreground transition-colors">
                              {p.player.nickname}
                            </Link>
                            <span className="text-[9px] font-mono text-muted-foreground/60 leading-none mt-0.5" title="Gol / Asist / Save / Puan">
                              {p.kills} / {p.assists} / {p.deaths} / {p.points || 0}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              ))
            )}
            {recentMatches.length > 5 && (
              <Dialog>
                <DialogTrigger className="w-full py-3 text-xs font-bold tracking-wider text-blue-500 bg-card/40 backdrop-blur hover:bg-card/60 transition-all shadow-sm border border-border/50 rounded-xl flex items-center justify-center gap-2 uppercase">
                  Tüm Maçları Gör ({recentMatches.length} Maç)
                </DialogTrigger>
                <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto bg-background/60 backdrop-blur-2xl border-blue-500/20 shadow-2xl shadow-blue-500/10 custom-scrollbar">
                  <DialogHeader className="pb-4 border-b border-border/50">
                    <DialogTitle className="text-2xl font-extrabold flex items-center gap-2">
                      <Activity className="w-6 h-6 text-blue-500" />
                      Son Oynanan Maçlar Arşivi
                    </DialogTitle>
                  </DialogHeader>
                  <div className="flex flex-col gap-3 mt-4 p-1">
                    {recentMatches.map((match: any) => (
                      <Card key={match.id} className="p-3 border-border/50 bg-card/40 backdrop-blur hover:bg-card/60 transition-all shadow-sm flex flex-col gap-3">
                        <div className="flex justify-between items-center text-xs border-b border-border/50 pb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground font-medium">{match.date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                            {match.season && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-blue-500/10 text-blue-500 border border-blue-500/20 shrink-0">{match.season.name}</span>
                            )}
                          </div>
                          <span className={`font-black px-2 py-0.5 rounded text-[10px] shrink-0 ${match.winner === "BLUE" ? "bg-blue-500/10 text-blue-500 border border-blue-500/20" : "bg-red-500/10 text-red-500 border border-red-500/20"}`}>
                            {match.winner === "BLUE" ? "MAVİ TAKIM KAZANDI" : "KIRMIZI TAKIM KAZANDI"}
                          </span>
                        </div>

                        <div className="flex flex-row justify-between items-center gap-2 px-1">
                          {/* Blue Team */}
                          <div className="flex flex-col gap-1.5 w-full max-w-[45%]">
                            {match.participants.filter((p: any) => p.team === "BLUE").map((p: any) => (
                              <div key={p.id} className="flex items-center gap-2 w-full group">
                                <div className="w-5 h-5 rounded flex items-center justify-center text-[9px] font-black shrink-0 bg-blue-500/10 text-blue-500 border border-blue-500/20 shadow-sm" title={p.champion}>
                                  {p.champion.substring(0, 2).toUpperCase()}
                                </div>
                                <div className="flex flex-col min-w-0">
                                  <Link href={`/player/${p.player.nickname}?game=ROCKET_LEAGUE`} className="truncate text-xs font-medium hover:underline text-muted-foreground group-hover:text-foreground transition-colors">
                                    {p.player.nickname}
                                  </Link>
                                  <span className="text-[9px] font-mono text-muted-foreground/60 leading-none mt-0.5" title="Gol / Asist / Save / Puan">
                                    {p.kills} / {p.assists} / {p.deaths} / {p.points || 0}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>

                          <span className="text-[10px] font-black text-muted-foreground/30 shrink-0">VS</span>

                          {/* Red Team */}
                          <div className="flex flex-col gap-1.5 w-full max-w-[45%]">
                            {match.participants.filter((p: any) => p.team === "RED").map((p: any) => (
                              <div key={p.id} className="flex items-center gap-2 w-full flex-row-reverse text-right group">
                                <div className="w-5 h-5 rounded flex items-center justify-center text-[9px] font-black shrink-0 bg-red-500/10 text-red-500 border border-red-500/20 shadow-sm" title={p.champion}>
                                  {p.champion.substring(0, 2).toUpperCase()}
                                </div>
                                <div className="flex flex-col items-end min-w-0">
                                  <Link href={`/player/${p.player.nickname}?game=ROCKET_LEAGUE`} className="truncate text-xs font-medium hover:underline text-muted-foreground group-hover:text-foreground transition-colors">
                                    {p.player.nickname}
                                  </Link>
                                  <span className="text-[9px] font-mono text-muted-foreground/60 leading-none mt-0.5" title="Gol / Asist / Save / Puan">
                                    {p.kills} / {p.assists} / {p.deaths} / {p.points || 0}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
