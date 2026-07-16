import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { getRankFromMmr, getRankStyle, getNextRank, RANK_THRESHOLDS } from "@/lib/rank";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Trophy, Swords, Medal, TrendingUp, ChevronRight, Info, Users } from "lucide-react";
import Link from "next/link";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function PlayerProfilePage({
  params,
}: {
  params: Promise<{ nickname: string }>;
}) {
  const resolvedParams = await params;
  const decodedNickname = decodeURIComponent(resolvedParams.nickname);

  const player = await prisma.player.findUnique({
    where: { nickname: decodedNickname },
    include: {
      seasonStats: {
        include: { season: true },
        orderBy: { season: { endDate: "desc" } }
      },
      matchParticipants: {
        include: {
          match: {
            include: {
              // @ts-ignore
              season: true,
              participants: {
                include: { player: true },
              },
            },
          },
        },
        orderBy: {
          match: { date: "desc" },
        },
      },
    },
  });

  if (!player) {
    notFound();
  }

  const rank = getRankFromMmr(player.currentMmr);
  const totalMatches = player.wins + player.losses;
  const winRate = totalMatches > 0 ? Math.round((player.wins / totalMatches) * 100) : 0;

  // Active Leaderboard Rank
  const allPlayers = await prisma.player.findMany({
    orderBy: { currentMmr: 'desc' },
    select: { id: true }
  });
  const currentRankIndex = allPlayers.findIndex((p: any) => p.id === player.id);
  const currentLeaderboardRank = currentRankIndex !== -1 ? currentRankIndex + 1 : null;

  const rankProgression = getNextRank(player.currentMmr);

  // Past Season Champions
  const pastSeasons = await (prisma as any).season.findMany({
    where: { isActive: false },
    include: {
      stats: {
        orderBy: { finalMmr: 'desc' },
        take: 1
      }
    }
  });
  const championSeasons = pastSeasons.filter((s: any) => s.stats.length > 0 && s.stats[0].playerId === player.id);

  const teammateStats: Record<string, { nickname: string; matches: number; wins: number; id: string }> = {};

  player.matchParticipants.forEach((mp: any) => {
    const isWin = mp.match.winner === mp.team;
    const teammates = mp.match.participants.filter((p: any) => p.team === mp.team && p.playerId !== player.id);

    teammates.forEach((t: any) => {
      if (!teammateStats[t.playerId]) {
        teammateStats[t.playerId] = { nickname: t.player.nickname, matches: 0, wins: 0, id: t.playerId };
      }
      teammateStats[t.playerId].matches += 1;
      if (isWin) {
        teammateStats[t.playerId].wins += 1;
      }
    });
  });

  const allTeammates = Object.values(teammateStats).map(t => ({
    ...t,
    winRate: Math.round((t.wins / t.matches) * 100)
  }));

  allTeammates.sort((a, b) => {
    const scoreA = a.wins * (a.wins / a.matches);
    const scoreB = b.wins * (b.wins / b.matches);
    if (scoreB !== scoreA) return scoreB - scoreA;
    return b.matches - a.matches;
  });

  const bestDuo = allTeammates.length > 0 && allTeammates[0].matches > 0 ? allTeammates[0] : null;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Profile Header */}
      <div className="flex flex-col md:flex-row items-center md:items-start gap-8 bg-card/50 p-8 rounded-xl border border-border/50 backdrop-blur">
        <Avatar className="h-32 w-32 border-4 border-primary/20">
          <AvatarImage src={player.avatar || undefined} alt={player.nickname} />
          <AvatarFallback className="bg-primary/10 text-primary text-4xl font-bold">
            {player.nickname.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="flex flex-col items-center md:items-start space-y-4 flex-1 min-w-0">
          <div className="w-full">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-4xl font-extrabold tracking-tight truncate mr-2">{player.nickname}</h1>
              {currentLeaderboardRank === 1 && <span title="Mevcut Sezon 1." className="text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded text-xs font-bold border border-yellow-500/20 shrink-0">👑 #1</span>}
              {currentLeaderboardRank === 2 && <span title="Mevcut Sezon 2." className="text-slate-400 bg-slate-400/10 px-2 py-0.5 rounded text-xs font-bold border border-slate-400/20 shrink-0">🥈 #2</span>}
              {currentLeaderboardRank === 3 && <span title="Mevcut Sezon 3." className="text-amber-700 dark:text-amber-600 bg-amber-600/10 px-2 py-0.5 rounded text-xs font-bold border border-amber-600/20 shrink-0">🥉 #3</span>}

              {championSeasons.slice(0, 2).map((s: any) => (
                <span key={s.id} title={`${s.name} Şampiyonu`} className="text-primary bg-primary/10 px-2 py-0.5 rounded text-xs font-bold border border-primary/20 shrink-0">
                  🏆 {s.name} Şampiyonu
                </span>
              ))}
              {championSeasons.length > 2 && (
                <Dialog>
                  <DialogTrigger className="text-muted-foreground bg-muted/30 hover:bg-muted/50 transition-colors px-2 py-0.5 rounded text-xs font-bold border border-border/50 shrink-0">
                    +{championSeasons.length - 2} Şampiyonluk
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md bg-background/60 backdrop-blur-2xl border-primary/20 shadow-2xl shadow-primary/10">
                    <DialogHeader>
                      <DialogTitle className="text-xl font-extrabold flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-primary" />
                        Tüm Şampiyonluklar
                      </DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-wrap gap-2 py-4">
                      {championSeasons.map((s: any) => (
                        <span key={s.id} title={`${s.name} Şampiyonu`} className="text-primary bg-primary/10 px-3 py-1.5 rounded text-sm font-bold border border-primary/20">
                          🏆 {s.name} Şampiyonu
                        </span>
                      ))}
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <div className={cn("px-3 py-1 rounded-full font-bold border uppercase text-xs flex items-center justify-center", getRankStyle(rank))}>
                {rank}
              </div>
              <span className="text-muted-foreground text-sm flex items-center">
                Joined {player.createdAt.toLocaleDateString()}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 mt-4 justify-center md:justify-start">
            <div className="flex flex-col items-center md:items-start bg-background/50 px-4 py-2 rounded-lg border border-border/50">
              <span className="text-xs text-muted-foreground uppercase font-semibold">Current MMR</span>
              <span className="text-xl font-bold font-mono text-primary flex items-center gap-2">
                <Trophy className="w-4 h-4" />
                {player.currentMmr}
              </span>
            </div>
            <div className="flex flex-col items-center md:items-start bg-background/50 px-4 py-2 rounded-lg border border-border/50">
              <span className="text-xs text-muted-foreground uppercase font-semibold">Peak MMR</span>
              <span className="text-xl font-bold font-mono flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                {player.peakMmr}
              </span>
            </div>

            {bestDuo && (
              <div className="flex flex-col items-center md:items-start bg-background/50 px-4 py-2 rounded-lg border border-border/50">
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">En İyi İkili</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <Link href={`/player/${bestDuo.nickname}`} className="group/duo flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-primary" />
                    <span className="text-sm font-bold group-hover/duo:underline transition-all">{bestDuo.nickname}</span>
                  </Link>
                  <span className={cn("text-[10px] font-black px-1.5 py-0.5 rounded shrink-0", bestDuo.winRate >= 50 ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" : "bg-red-500/10 text-red-500 border border-red-500/20")} title={`${bestDuo.matches} Maçta ${bestDuo.wins} Galibiyet`}>
                    %{bestDuo.winRate} WR
                  </span>
                </div>
              </div>
            )}

            <Dialog>
              <DialogTrigger className="flex flex-col items-start bg-background/50 px-4 py-2 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors w-full md:w-auto text-left group">
                <div className="flex w-full items-center justify-between gap-4 mb-1">
                  <span className="text-xs text-muted-foreground uppercase font-semibold flex items-center gap-1">
                    Sonraki Aşama <Info className="w-3 h-3 text-muted-foreground group-hover:text-primary transition-colors" />
                  </span>
                  {rankProgression.next && (
                    <span className="text-xs font-bold text-muted-foreground">
                      {player.currentMmr} / {rankProgression.nextMin}
                    </span>
                  )}
                </div>
                {rankProgression.next ? (
                  <div className="w-full flex items-center gap-2">
                    <div className="flex-1 min-w-[120px] h-2 bg-muted/50 rounded-full overflow-hidden border border-border/50">
                      <div className="h-full bg-primary transition-all" style={{ width: `${rankProgression.progress}%` }} />
                    </div>
                    <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase", getRankStyle(rankProgression.next))}>
                      {rankProgression.next}
                    </span>
                  </div>
                ) : (
                  <div className="text-sm font-bold text-primary uppercase">Maksimum Seviye</div>
                )}
              </DialogTrigger>
              <DialogContent className="sm:max-w-md bg-background/80 backdrop-blur-2xl border-primary/20 shadow-2xl">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-primary" />
                    Rütbe MMR Gereksinimleri
                  </DialogTitle>
                </DialogHeader>
                <div className="py-4 flex flex-col gap-2">
                  {(Object.keys(RANK_THRESHOLDS) as import("@/lib/rank").RankTier[]).map((r) => {
                    const isCurrent = r === rankProgression.current;
                    return (
                      <div key={r} className={cn("flex items-center justify-between p-2 rounded-lg border", isCurrent ? "bg-primary/10 border-primary/30" : "bg-card/30 border-border/50")}>
                        <div className="flex items-center gap-3">
                          <div className={cn("w-2 h-2 rounded-full", getRankStyle(r).match(/text-[a-z]+-?\d*/)?.[0]?.replace('text-', 'bg-') || "bg-primary")} />
                          <span className={cn("font-bold text-sm", isCurrent ? "text-primary" : "")}>{r}</span>
                          {isCurrent && <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded font-bold uppercase">Mevcut</span>}
                        </div>
                        <span className="font-mono font-bold text-sm text-muted-foreground">{RANK_THRESHOLDS[r]} MMR</span>
                      </div>
                    );
                  })}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-card/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Win Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{winRate}%</div>
            <div className="text-sm text-muted-foreground mt-1">
              {player.wins} Wins / {player.losses} Losses
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Matches</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalMatches}</div>
          </CardContent>
        </Card>
        <Card className="bg-card/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">KDA (Overall)</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Simple KDA calculation placeholder. 
                In a real scenario, you aggregate from all MatchParticipants. */}
            {(() => {
              const totalKills = player.matchParticipants.reduce((acc: number, mp: any) => acc + mp.kills, 0);
              const totalDeaths = player.matchParticipants.reduce((acc: number, mp: any) => acc + mp.deaths, 0) || 1; // avoid division by zero
              const totalAssists = player.matchParticipants.reduce((acc: number, mp: any) => acc + mp.assists, 0);
              const kda = ((totalKills + totalAssists) / totalDeaths).toFixed(2);
              return <div className="text-3xl font-bold font-mono">{kda}</div>;
            })()}
          </CardContent>
        </Card>
      </div>

      {/* Past Seasons Stats */}
      {player.seasonStats.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold tracking-tight flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary" />
              Geçmiş Sezonlar
            </h2>
            {player.seasonStats.length > 4 && (
              <Dialog>
                <DialogTrigger className="text-xs text-primary hover:underline font-medium">
                  Tüm Sezonları Gör
                </DialogTrigger>
                <DialogContent className="sm:max-w-4xl max-h-[85vh] overflow-y-auto bg-background/60 backdrop-blur-2xl border-primary/20 shadow-2xl shadow-primary/10 custom-scrollbar">
                  <DialogHeader className="pb-4 border-b border-border/50">
                    <DialogTitle className="text-2xl font-extrabold flex items-center gap-2">
                      <Trophy className="w-6 h-6 text-primary" />
                      Tüm Geçmiş Sezonlar Arşivi
                    </DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mt-4 p-1">
                    {player.seasonStats.map((stat: any) => (
                      <Card key={stat.id} className="bg-card/40 border-primary/10 shadow-sm hover:shadow-primary/20 hover:border-primary/30 transition-all duration-300">
                        <CardHeader className="p-4 pb-2 flex flex-row justify-between items-center space-y-0">
                          <CardTitle className="text-base font-bold text-foreground">{stat.season.name}</CardTitle>
                          <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">{stat.season.startDate.toLocaleDateString('tr-TR', { year: 'numeric', month: 'short' })}</span>
                        </CardHeader>
                        <CardContent className="p-4 pt-3 space-y-3">
                          <div className="flex justify-between items-center text-sm border-b border-border/50 pb-2">
                            <span className="text-muted-foreground font-medium">Bitiş MMR</span>
                            <span className="font-bold font-mono text-primary flex items-center gap-1.5"><Trophy className="w-3.5 h-3.5" /> {stat.finalMmr}</span>
                          </div>
                          <div className="flex justify-between items-center text-sm border-b border-border/50 pb-2">
                            <span className="text-muted-foreground font-medium">Ulaşılan Seviye</span>
                            <div className={cn("px-2 py-0.5 h-5 text-[10px] rounded-full font-bold border flex items-center justify-center uppercase", getRankStyle(getRankFromMmr(stat.finalMmr)))}>{getRankFromMmr(stat.finalMmr)}</div>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground font-medium">Toplam Skor</span>
                            <span className="font-bold text-xs bg-background/50 px-2 py-1 rounded border border-border/50">
                              <span className="text-blue-500">{stat.wins}G</span> <span className="text-muted-foreground mx-1">|</span> <span className="text-red-500">{stat.losses}M</span>
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
          <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {player.seasonStats.slice(0, 4).map((stat: any) => (
              <Card key={stat.id} className="bg-card/30 border-border/50 shadow-sm hover:shadow-md transition-all">
                <CardHeader className="p-3 pb-1 flex flex-row justify-between items-center space-y-0">
                  <CardTitle className="text-sm font-bold">{stat.season.name}</CardTitle>
                  <span className="text-[10px] text-muted-foreground">{stat.season.startDate.toLocaleDateString('tr-TR', { year: 'numeric', month: 'short' })}</span>
                </CardHeader>
                <CardContent className="p-3 pt-2 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground font-medium">MMR</span>
                    <span className="font-bold font-mono text-primary flex items-center gap-1"><Trophy className="w-3 h-3" /> {stat.finalMmr}</span>
                  </div>
                  <div className={cn("px-1.5 py-0 h-4 text-[9px] rounded-full font-bold border flex items-center justify-center uppercase mt-1", getRankStyle(getRankFromMmr(stat.finalMmr)))}>{getRankFromMmr(stat.finalMmr)}</div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground font-medium">Skor</span>
                    <span className="font-bold text-[10px]">
                      <span className="text-blue-500">{stat.wins}W</span> - <span className="text-red-500">{stat.losses}L</span>
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Match History */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <Swords className="w-6 h-6 text-primary" />
          Match History
        </h2>

        <div className="flex flex-col gap-3">
          {player.matchParticipants.length === 0 ? (
            <div className="text-center p-8 border rounded-lg bg-card/20 text-muted-foreground">
              No matches played yet.
            </div>
          ) : (
            player.matchParticipants.map((mp: any) => {
              const match = mp.match;
              const isWin = mp.team === match.winner;

              return (
                <div
                  key={match.id}
                  className={`flex flex-col md:flex-row gap-4 p-4 rounded-lg border transition-all ${isWin ? "bg-blue-500/5 border-blue-500/20" : "bg-red-500/5 border-red-500/20"
                    }`}
                >
                  {/* Result indicator */}
                  <div className="flex flex-row md:flex-col justify-between md:justify-center items-center md:w-24 shrink-0">
                    <span className={`font-bold text-lg ${isWin ? "text-blue-400" : "text-red-400"}`}>
                      {isWin ? "VICTORY" : "DEFEAT"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {match.date.toLocaleDateString()}
                    </span>
                    {match.season && (
                      <Badge variant="secondary" className="mt-1 text-[10px] leading-tight px-1.5 py-0 h-4 min-h-0 bg-primary/10 text-primary hover:bg-primary/20 border-primary/20">
                        {match.season.name}
                      </Badge>
                    )}
                  </div>

                  {/* Player Match Stats */}
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex flex-col">
                      <span className="font-semibold text-foreground">{mp.champion}</span>
                      <span className="text-sm font-mono text-muted-foreground">
                        {mp.kills} / {mp.deaths} / {mp.assists}
                      </span>
                    </div>
                  </div>

                  {/* Teams Overview */}
                  <div className="hidden md:flex flex-row gap-6 items-center text-xs w-72 shrink-0 bg-background/50 p-2 rounded-md border border-border/50">
                    {/* Blue Team */}
                    <div className="flex flex-col gap-1.5 w-full">
                      {match.participants.filter((p: any) => p.team === "BLUE").map((p: any) => (
                        <div key={p.id} className="flex items-center gap-2 group w-full">
                          <div className="w-5 h-5 rounded flex items-center justify-center text-[9px] font-black shrink-0 bg-blue-500/10 text-blue-500 border border-blue-500/20" title={p.champion}>
                            {p.champion.substring(0, 2).toUpperCase()}
                          </div>
                          <Link href={`/player/${p.player.nickname}`} className={`truncate flex-1 hover:underline ${p.player.nickname === decodedNickname ? "text-foreground font-bold" : "text-muted-foreground"}`}>
                            {p.player.nickname}
                          </Link>
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-col items-center justify-center">
                      <span className="text-[10px] font-black text-muted-foreground/30">VS</span>
                    </div>

                    {/* Red Team */}
                    <div className="flex flex-col gap-1.5 w-full">
                      {match.participants.filter((p: any) => p.team === "RED").map((p: any) => (
                        <div key={p.id} className="flex items-center gap-2 group w-full flex-row-reverse text-right">
                          <div className="w-5 h-5 rounded flex items-center justify-center text-[9px] font-black shrink-0 bg-red-500/10 text-red-500 border border-red-500/20" title={p.champion}>
                            {p.champion.substring(0, 2).toUpperCase()}
                          </div>
                          <Link href={`/player/${p.player.nickname}`} className={`truncate flex-1 hover:underline ${p.player.nickname === decodedNickname ? "text-foreground font-bold" : "text-muted-foreground"}`}>
                            {p.player.nickname}
                          </Link>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
