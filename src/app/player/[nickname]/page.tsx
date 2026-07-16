import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { getRankFromMmr, getRankStyle, getNextRank, RANK_THRESHOLDS } from "@/lib/rank";
import { calculateBaseMmrChange, calculateFinalMmr } from "@/lib/mmr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Trophy, Swords, Medal, TrendingUp, ChevronRight, Info, Users } from "lucide-react";
import Link from "next/link";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function PlayerProfilePage(props: {
  params: Promise<{ nickname: string }>;
  searchParams: Promise<{ game?: string }>;
}) {
  const resolvedParams = await props.params;
  const searchParams = await Promise.resolve(props.searchParams);
  const gameParam = searchParams?.game || "LOL";
  const game = (gameParam === "ROCKET_LEAGUE" || gameParam === "VALORANT") ? gameParam : "LOL";
  const decodedNickname = decodeURIComponent(resolvedParams.nickname);

  const player = await prisma.player.findUnique({
    where: { nickname: decodedNickname },
    include: {
      gameStats: {
        where: { game: game as any }
      },
      seasonStats: {
        where: { season: { game: game as any } },
        include: { season: true },
        orderBy: { season: { endDate: "desc" } }
      },
      matchParticipants: {
        where: { match: { game: game as any } },
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

  const gameStat = player.gameStats[0] || { currentMmr: 1000, peakMmr: 1000, wins: 0, losses: 0 };
  const currentMmr = gameStat.currentMmr;
  const peakMmr = gameStat.peakMmr;
  const wins = gameStat.wins;
  const losses = gameStat.losses;

  const rank = getRankFromMmr(currentMmr, game as string);
  const totalMatches = wins + losses;
  const winRate = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0;

  // Active Leaderboard Rank
  const allGameStats = await prisma.playerGameStat.findMany({
    where: { game: game as any },
    orderBy: { currentMmr: 'desc' },
    select: { playerId: true }
  });
  const currentRankIndex = allGameStats.findIndex((p: any) => p.playerId === player.id);
  const currentLeaderboardRank = currentRankIndex !== -1 ? currentRankIndex + 1 : null;

  const rankProgression = getNextRank(currentMmr, game as string);

  // Past Season Champions
  const pastSeasons = await (prisma as any).season.findMany({
    where: { isActive: false, game: game as any },
    include: {
      stats: {
        orderBy: { finalMmr: 'desc' },
        take: 1
      }
    }
  });
  const championSeasons = pastSeasons.filter((s: any) => s.stats.length > 0 && s.stats[0].playerId === player.id);

  // --- Calculate per-match MMR changes by replaying the timeline ---
  const activeSeason = await (prisma as any).season.findFirst({
    where: { isActive: true, game: game as any },
    orderBy: { startDate: "desc" },
  });

  const allMatches = await prisma.match.findMany({
    where: activeSeason ? { seasonId: activeSeason.id, game: game as any } : { game: game as any },
    orderBy: { date: "asc" },
    include: { participants: true },
  });

  const allAdjustments = await (prisma as any).mmrAdjustment.findMany({
    where: { game: game as any },
    orderBy: { date: "asc" },
  });

  type TimelineEvent =
    | { type: "MATCH"; date: Date; data: any }
    | { type: "ADJUSTMENT"; date: Date; data: any };

  const timeline: TimelineEvent[] = [
    ...allMatches.map((m: any) => ({ type: "MATCH" as const, date: m.date, data: m })),
    ...allAdjustments.map((a: any) => ({ type: "ADJUSTMENT" as const, date: a.date, data: a })),
  ].sort((a, b) => a.date.getTime() - b.date.getTime());

  const pStates = new Map<string, { mmr: number; winStreak: number; lossStreak: number }>();
  const getPS = (id: string) => {
    if (!pStates.has(id)) pStates.set(id, { mmr: 1000, winStreak: 0, lossStreak: 0 });
    return pStates.get(id)!;
  };

  const mmrChangeMap = new Map<string, number>(); // matchId -> mmrChange for this player

  for (const event of timeline) {
    if (event.type === "ADJUSTMENT") {
      const adj = event.data;
      const st = getPS(adj.playerId);
      st.mmr += adj.amount;
      continue;
    }

    const match = event.data;
    const blueTeam = match.participants.filter((p: any) => p.team === "BLUE");
    const redTeam = match.participants.filter((p: any) => p.team === "RED");
    if (blueTeam.length === 0 || redTeam.length === 0) continue;

    const blueAvg = blueTeam.reduce((acc: number, p: any) => acc + getPS(p.playerId).mmr, 0) / blueTeam.length;
    const redAvg = redTeam.reduce((acc: number, p: any) => acc + getPS(p.playerId).mmr, 0) / redTeam.length;

    const { blueMmrChange, redMmrChange } = calculateBaseMmrChange(blueAvg, redAvg, match.winner as "BLUE" | "RED");

    for (const participant of match.participants) {
      const st = getPS(participant.playerId);
      const isWinner = participant.team === match.winner;
      const baseChange = participant.team === "BLUE" ? blueMmrChange : redMmrChange;
      const { finalMmr, change } = calculateFinalMmr(st.mmr, baseChange, st.winStreak, st.lossStreak);

      if (participant.playerId === player.id) {
        mmrChangeMap.set(match.id, change);
      }

      st.mmr = finalMmr;
      if (isWinner) {
        st.winStreak += 1;
        st.lossStreak = 0;
      } else {
        st.lossStreak += 1;
        st.winStreak = 0;
      }
    }
  }
  // --- End MMR change calculation ---

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

  // Find most played character for current game
  const championCounts: Record<string, number> = {};
  player.matchParticipants.forEach((mp: any) => {
    if (mp.match.game === game && mp.champion && mp.champion !== "Unknown") {
      championCounts[mp.champion] = (championCounts[mp.champion] || 0) + 1;
    }
  });

  let mostPlayedChampion = "";
  let maxCount = 0;
  Object.entries(championCounts).forEach(([champion, count]) => {
    if (count > maxCount) {
      mostPlayedChampion = champion;
      maxCount = count;
    }
  });

  let headerBgImage = "";
  if (mostPlayedChampion) {
    const filename = mostPlayedChampion.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (game === "LOL") headerBgImage = `/images/lol/${filename}-bg.png`;
    if (game === "VALORANT") headerBgImage = `/images/valorant/${filename}-bg.png`;
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Profile Header */}
      <div className="relative overflow-hidden flex flex-col md:flex-row items-center md:items-start gap-8 bg-card/50 p-8 rounded-xl border border-border/50 backdrop-blur">
        {headerBgImage && (
          <div
            className="absolute inset-0 z-0 opacity-40 pointer-events-none"
            style={game === "LOL" ? {
              backgroundImage: `url('${headerBgImage}')`,
              backgroundRepeat: 'no-repeat',
              backgroundSize: '40%',
              backgroundPosition: '60% 0%',
              transform: 'translateY(10px)',
            } : {
              backgroundImage: `url('${headerBgImage}')`,
              backgroundRepeat: 'no-repeat',
              backgroundSize: '40%',
              backgroundPosition: '60% 0%',
              transform: 'translateY(0px)',
            }}
          />
        )}
        <div className="absolute top-4 right-4 hidden sm:flex items-center gap-2 z-20">
          <Link href={`/player/${decodedNickname}?game=LOL`}>
            <Button variant={game === "LOL" ? "default" : "outline"} size="sm" className="rounded-full h-6 px-3 text-[10px] font-bold uppercase backdrop-blur">LoL</Button>
          </Link>
          <Link href={`/player/${decodedNickname}?game=VALORANT`}>
            <Button variant={game === "VALORANT" ? "default" : "outline"} size="sm" className="rounded-full h-6 px-3 text-[10px] font-bold uppercase backdrop-blur">Valorant</Button>
          </Link>
          <Link href={`/player/${decodedNickname}?game=ROCKET_LEAGUE`}>
            <Button variant={game === "ROCKET_LEAGUE" ? "default" : "outline"} size="sm" className="rounded-full h-6 px-3 text-[10px] font-bold uppercase backdrop-blur">Rocket League</Button>
          </Link>
        </div>
        <Avatar className="h-32 w-32 border-4 border-primary/20 relative z-10">
          <AvatarImage src={player.avatar || undefined} alt={player.nickname} />
          <AvatarFallback className="bg-primary/10 text-primary text-4xl font-bold">
            {player.nickname.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="flex flex-col items-center md:items-start space-y-4 flex-1 min-w-0 relative z-10">
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
                {currentMmr}
              </span>
            </div>
            <div className="flex flex-col items-center md:items-start bg-background/50 px-4 py-2 rounded-lg border border-border/50">
              <span className="text-xs text-muted-foreground uppercase font-semibold">Peak MMR</span>
              <span className="text-xl font-bold font-mono flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                {peakMmr}
              </span>
            </div>

            {bestDuo && (
              <div className="flex flex-col items-center md:items-start bg-background/50 px-4 py-2 rounded-lg border border-border/50">
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">En İyi İkili</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <Link href={`/player/${bestDuo.nickname}?game=${game}`} className="group/duo flex items-center gap-1.5">
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
                      {currentMmr} / {rankProgression.nextMin}
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
                  {RANK_THRESHOLDS.map((threshold, index) => {
                    const rankName = getRankFromMmr(threshold, game as string);
                    const isCurrent = rankName === rankProgression.current;
                    return (
                      <div key={index} className={cn("flex items-center justify-between p-2 rounded-lg border", isCurrent ? "bg-primary/10 border-primary/30" : "bg-card/30 border-border/50")}>
                        <div className="flex items-center gap-3">
                          <div className={cn("w-2 h-2 rounded-full", getRankStyle(rankName).match(/text-[a-z]+-?\d*/)?.[0]?.replace('text-', 'bg-') || "bg-primary")} />
                          <span className={cn("font-bold text-sm", isCurrent ? "text-primary" : "")}>{rankName}</span>
                          {isCurrent && <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded font-bold uppercase">Mevcut</span>}
                        </div>
                        <span className="font-mono font-bold text-sm text-muted-foreground">{threshold} MMR</span>
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
              {wins} Wins / {losses} Losses
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
                            <div className={cn("px-2 py-0.5 h-5 text-[10px] rounded-full font-bold border flex items-center justify-center uppercase w-fit", getRankStyle(getRankFromMmr(stat.finalMmr, stat.season.game)))}>{getRankFromMmr(stat.finalMmr, stat.season.game)}</div>
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
                  <div className={cn("px-1.5 py-0 h-4 text-[9px] rounded-full font-bold border flex items-center justify-center uppercase mt-1 w-fit", getRankStyle(getRankFromMmr(stat.finalMmr, stat.season.game)))}>{getRankFromMmr(stat.finalMmr, stat.season.game)}</div>
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
              const mmrChange = mmrChangeMap.get(match.id);

              let bgImage = "";
              if (mp.champion && mp.champion !== "Unknown") {
                const filename = mp.champion.toLowerCase().replace(/[^a-z0-9]/g, '');
                if (match.game === "LOL") bgImage = `/images/lol/${filename}.png`;
                if (match.game === "VALORANT") bgImage = `/images/valorant/${filename}.png`;
              }

              return (
                <div
                  key={match.id}
                  className={`relative overflow-hidden flex flex-col md:flex-row rounded-lg border transition-all ${isWin ? "bg-blue-500/5 border-blue-500/20" : "bg-red-500/5 border-red-500/20"
                    }`}
                >
                  {bgImage && (
                    <div
                      className="w-full md:w-36 h-24 md:h-auto shrink-0 bg-no-repeat bg-cover bg-center"
                      style={{
                        backgroundImage: `url('${bgImage}')`,
                        ...(match.game === "VALORANT" ? {
                          maskImage: 'linear-gradient(to left, black 70%, transparent 100%)',
                          WebkitMaskImage: 'linear-gradient(to left, black 70%, transparent 100%)'
                        } : {})
                      }}
                    />
                  )}
                  <div className="flex flex-col md:flex-row gap-4 p-4 flex-1">
                    {/* Result indicator */}
                    <div className="relative z-10 flex flex-row md:flex-col flex-wrap justify-between md:justify-center items-center md:w-28 shrink-0 gap-1">
                      <span className={`font-bold text-lg ${isWin ? "text-blue-400" : "text-red-400"}`}>
                        {isWin ? "VICTORY" : "DEFEAT"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {match.date.toLocaleDateString()}
                      </span>
                      {match.season && (
                        <Badge variant="secondary" className="mt-0.5 text-[10px] leading-tight px-1.5 py-0.5 h-auto min-h-0 bg-primary/10 text-primary hover:bg-primary/20 border-primary/20 max-w-full text-center whitespace-normal break-words">
                          {match.season.name}
                        </Badge>
                      )}
                    </div>

                    {/* Player Match Stats */}
                    <div className="relative z-10 flex items-center gap-4 flex-1">
                      <div className="flex flex-col">
                        <span className="font-semibold text-foreground">{mp.champion}</span>
                        <span className="text-sm font-mono text-muted-foreground" title={match.game === "ROCKET_LEAGUE" ? "Gol / Asist / Save / Puan" : "KDA"}>
                          {match.game === "ROCKET_LEAGUE" ? `${mp.kills} / ${mp.assists} / ${mp.deaths} / ${mp.points || 0}` : `${mp.kills} / ${mp.deaths} / ${mp.assists}`}
                        </span>
                      </div>
                    </div>

                    {/* MMR Change */}
                    {mmrChange !== undefined && (
                      <div className="relative z-10 flex items-center justify-center shrink-0">
                        <span className={cn(
                          "font-mono font-black text-base px-3 py-1.5 rounded-lg border",
                          mmrChange > 0
                            ? "text-emerald-500 bg-emerald-500/10 border-emerald-500/20"
                            : mmrChange < 0
                              ? "text-red-500 bg-red-500/10 border-red-500/20"
                              : "text-muted-foreground bg-muted/10 border-border/50"
                        )}>
                          {mmrChange > 0 ? `+${mmrChange}` : mmrChange}
                        </span>
                      </div>
                    )}

                    {/* Teams Overview */}
                    <div className="hidden md:flex flex-row gap-6 items-center text-xs w-72 shrink-0 bg-background/50 p-2 rounded-md border border-border/50">
                      {/* Blue Team */}
                      <div className="flex flex-col gap-1.5 w-full">
                        {match.participants.filter((p: any) => p.team === "BLUE").map((p: any) => (
                          <div key={p.id} className="flex items-center gap-2 group w-full">
                            <div className="w-5 h-5 rounded flex items-center justify-center text-[9px] font-black shrink-0 bg-blue-500/10 text-blue-500 border border-blue-500/20" title={p.champion}>
                              {p.champion.substring(0, 2).toUpperCase()}
                            </div>
                            <Link href={`/player/${p.player.nickname}?game=${game}`} className={`truncate flex-1 hover:underline ${p.player.nickname === decodedNickname ? "text-foreground font-bold" : "text-muted-foreground"}`}>
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
                            <Link href={`/player/${p.player.nickname}?game=${game}`} className={`truncate flex-1 hover:underline ${p.player.nickname === decodedNickname ? "text-foreground font-bold" : "text-muted-foreground"}`}>
                              {p.player.nickname}
                            </Link>
                          </div>
                        ))}
                      </div>
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
