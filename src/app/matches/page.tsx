import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { MatchFilter } from "@/components/MatchFilter";
import { SearchX } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function MatchesPage({ searchParams }: { searchParams: Promise<{ player?: string, season?: string, date?: string }> }) {
  const resolvedParams = await searchParams;
  const { player, season, date } = resolvedParams;

  const seasons = await (prisma as any).season.findMany({ orderBy: { startDate: 'desc' } });

  const whereClause: any = {};
  if (season) whereClause.seasonId = season;
  if (player) {
    whereClause.participants = {
      some: {
        player: {
          nickname: {
            contains: player,
          }
        }
      }
    };
  }
  if (date) {
    // Filter by specific date (start of day to end of day)
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);
    whereClause.date = {
      gte: startDate,
      lte: endDate,
    };
  }

  const matches = await (prisma as any).match.findMany({
    where: whereClause,
    orderBy: { date: 'desc' },
    take: 50,
    include: {
      season: true,
      participants: {
        include: { player: true }
      }
    }
  });

  return (
    <div className="space-y-8 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-4xl mx-auto mt-8">
      <div className="space-y-2">
        <h1 className="text-4xl font-extrabold tracking-tight">Maç Arşivi</h1>
        <p className="text-muted-foreground text-lg">Tüm maç geçmişini detaylı olarak filtreleyin ve inceleyin.</p>
      </div>

      <MatchFilter seasons={seasons} />

      <div className="flex flex-col gap-4">
        {matches.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center bg-card/20 backdrop-blur border border-border/50 rounded-2xl">
            <SearchX className="w-12 h-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-xl font-bold">Sonuç Bulunamadı</h3>
            <p className="text-muted-foreground">Filtrelerinize uygun maç bulunamadı. Lütfen farklı kriterler deneyin.</p>
          </div>
        ) : (
          matches.map((match: any) => (
            <Card key={match.id} className="p-4 border-border/50 bg-card/40 backdrop-blur hover:bg-card/60 transition-all shadow-sm flex flex-col gap-4 group">
              <div className="flex justify-between items-center text-xs border-b border-border/50 pb-3">
                <div className="flex items-center gap-3">
                  <span className="text-muted-foreground font-medium bg-background/50 px-2 py-1 rounded-md border border-border/50">
                    {match.date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {match.season && (
                    <span className="text-[10px] font-black px-2 py-1 rounded-md bg-primary/10 text-primary border border-primary/20 shrink-0 shadow-sm uppercase tracking-wider">
                      {match.season.name}
                    </span>
                  )}
                </div>
                <span className={`font-black px-3 py-1 rounded-md text-[10px] uppercase tracking-wider shrink-0 shadow-sm ${match.winner === "BLUE" ? "bg-blue-500/10 text-blue-500 border border-blue-500/20" : "bg-red-500/10 text-red-500 border border-red-500/20"}`}>
                  {match.winner === "BLUE" ? "MAVİ TAKIM KAZANDI" : "KIRMIZI TAKIM KAZANDI"}
                </span>
              </div>

              <div className="flex flex-row justify-between items-center gap-4 px-2">
                {/* Blue Team */}
                <div className="flex flex-col gap-2 w-full max-w-[45%]">
                  {match.participants.filter((p: any) => p.team === "BLUE").map((p: any) => (
                    <div key={p.id} className="flex items-center gap-3 w-full group/player p-1 rounded-lg hover:bg-blue-500/5 transition-colors">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black shrink-0 bg-blue-500/10 text-blue-500 border border-blue-500/20 shadow-sm" title={p.champion}>
                        {p.champion.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="flex flex-col min-w-0 flex-1">
                        <Link href={`/player/${p.player.nickname}`} className="truncate text-sm font-semibold hover:underline text-foreground/80 group-hover/player:text-foreground transition-colors">
                          {p.player.nickname}
                        </Link>
                        <span className="text-[10px] font-mono font-medium text-muted-foreground mt-0.5">
                          {p.kills} / {p.deaths} / {p.assists}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col items-center justify-center gap-1">
                  <span className="text-xs font-black text-muted-foreground/30 px-3 py-1 bg-muted/20 rounded-full border border-border/50">VS</span>
                </div>

                {/* Red Team */}
                <div className="flex flex-col gap-2 w-full max-w-[45%]">
                  {match.participants.filter((p: any) => p.team === "RED").map((p: any) => (
                    <div key={p.id} className="flex items-center gap-3 w-full flex-row-reverse text-right group/player p-1 rounded-lg hover:bg-red-500/5 transition-colors">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black shrink-0 bg-red-500/10 text-red-500 border border-red-500/20 shadow-sm" title={p.champion}>
                        {p.champion.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="flex flex-col items-end min-w-0 flex-1">
                        <Link href={`/player/${p.player.nickname}`} className="truncate text-sm font-semibold hover:underline text-foreground/80 group-hover/player:text-foreground transition-colors">
                          {p.player.nickname}
                        </Link>
                        <span className="text-[10px] font-mono font-medium text-muted-foreground mt-0.5">
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
      </div>
    </div>
  );
}
