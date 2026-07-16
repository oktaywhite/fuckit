import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Card, CardHeader } from "@/components/ui/card";
import { Trophy, ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MatchFilter } from "@/components/MatchFilter";

export const dynamic = "force-dynamic";

export default async function SeasonDetailPage({ params, searchParams }: { params: Promise<{ id: string }>, searchParams: Promise<{ player?: string, date?: string, sort?: string, page?: string }> }) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const { player, date, sort, page } = resolvedSearchParams;

  const season = await (prisma as any).season.findUnique({
    where: { id: resolvedParams.id },
    include: {
      stats: {
        include: { player: true },
        orderBy: { finalMmr: 'desc' }
      }
    }
  });

  if (!season) {
    notFound();
  }

  // Pagination logic
  const currentPage = parseInt(page || "1") || 1;
  const take = 10;
  const skip = (currentPage - 1) * take;

  // Filter logic
  const whereClause: any = { seasonId: resolvedParams.id };
  if (player) {
    whereClause.participants = {
      some: {
        player: {
          nickname: { contains: player }
        }
      }
    };
  }
  if (date) {
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);
    whereClause.date = { gte: startDate, lte: endDate };
  }

  const [matches, totalMatches] = await Promise.all([
    (prisma as any).match.findMany({
      where: whereClause,
      orderBy: { date: sort === 'asc' ? 'asc' : 'desc' },
      take,
      skip,
      include: {
        participants: {
          include: { player: true }
        }
      }
    }),
    (prisma as any).match.count({ where: whereClause })
  ]);

  const totalPages = Math.ceil(totalMatches / take);

  // Helper to generate pagination URLs
  const createPageUrl = (pageNumber: number) => {
    const params = new URLSearchParams();
    if (player) params.set("player", player);
    if (date) params.set("date", date);
    if (sort) params.set("sort", sort);
    params.set("page", pageNumber.toString());
    return `/seasons/${resolvedParams.id}?${params.toString()}`;
  };

  return (
    <div className="space-y-8 pb-12 max-w-5xl mx-auto mt-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center gap-4">
        <Link href="/seasons">
          <Button variant="outline" size="icon" className="rounded-full">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">{season.name}</h1>
          <p className="text-muted-foreground">
            {season.startDate.toLocaleDateString('tr-TR')} - {season.endDate?.toLocaleDateString('tr-TR')}
          </p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        {/* Sol Kolon: Sıralama */}
        <div className="space-y-4 lg:col-span-4">
          <h2 className="text-xl font-bold tracking-tight">Sezon Sıralaması</h2>
          <div className="flex flex-col gap-3">
            {season.stats.length === 0 ? (
              <div className="text-muted-foreground p-4 bg-background/40 rounded-xl border border-border/50 text-sm">Veri yok.</div>
            ) : (
              season.stats.map((stat: any, index: number) => (
                <Link key={stat.id} href={`/player/${stat.player.nickname}`}>
                  <Card className="transition-all hover:bg-muted/30 hover:border-primary/50 hover:shadow-md border-border/50 bg-background/40 backdrop-blur-md">
                    <CardHeader className="p-3 flex flex-row items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary font-black text-sm shadow-sm border border-primary/20">
                          #{index + 1}
                        </div>
                        <div className="space-y-0.5">
                          <span className="font-bold text-sm leading-none">{stat.player.nickname}</span>
                          <p className="text-[10px] text-muted-foreground leading-none">{stat.wins}G {stat.losses}M</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-primary bg-primary/5 px-2 py-1 rounded-full border border-primary/10">
                        <Trophy className="h-3 w-3" />
                        <span className="font-mono font-bold text-xs">{stat.finalMmr}</span>
                      </div>
                    </CardHeader>
                  </Card>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Sağ Kolon: Maçlar */}
        <div className="space-y-4 lg:col-span-8">
          <h2 className="text-xl font-bold tracking-tight">Maç Geçmişi</h2>

          <MatchFilter basePath={`/seasons/${season.id}`} hideSeason={true} />

          <div className="flex flex-col gap-3">
            {matches.length === 0 ? (
              <div className="text-muted-foreground p-8 text-center bg-background/40 rounded-xl border border-border/50 text-sm">
                Filtrelere uygun maç bulunamadı.
              </div>
            ) : (
              matches.map((match: any) => (
                <Card key={match.id} className="p-3 border-border/50 bg-card/40 backdrop-blur hover:bg-card/60 transition-all shadow-sm flex flex-col gap-3">
                  <div className="flex justify-between items-center text-xs border-b border-border/50 pb-2">
                    <span className="text-muted-foreground font-medium">{match.date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
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
                            <Link href={`/player/${p.player.nickname}`} className="truncate text-xs font-medium hover:underline text-muted-foreground group-hover:text-foreground transition-colors">
                              {p.player.nickname}
                            </Link>
                            <span className="text-[9px] font-mono text-muted-foreground/60 leading-none mt-0.5">
                              {p.kills} / {p.deaths} / {p.assists}
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
                            <Link href={`/player/${p.player.nickname}`} className="truncate text-xs font-medium hover:underline text-muted-foreground group-hover:text-foreground transition-colors">
                              {p.player.nickname}
                            </Link>
                            <span className="text-[9px] font-mono text-muted-foreground/60 leading-none mt-0.5">
                              {p.kills} / {p.deaths} / {p.assists}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              ))
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <Link href={createPageUrl(Math.max(1, currentPage - 1))}>
                  <Button variant="outline" size="sm" disabled={currentPage === 1} className="gap-2 rounded-xl">
                    <ChevronLeft className="w-4 h-4" />
                    Önceki
                  </Button>
                </Link>
                <span className="text-sm font-medium text-muted-foreground">
                  Sayfa {currentPage} / {totalPages}
                </span>
                <Link href={createPageUrl(Math.min(totalPages, currentPage + 1))}>
                  <Button variant="outline" size="sm" disabled={currentPage === totalPages} className="gap-2 rounded-xl">
                    Sonraki
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
