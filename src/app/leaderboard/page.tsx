import { prisma } from "@/lib/prisma";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Trophy } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const allPlayers = await prisma.player.findMany({
    orderBy: { currentMmr: 'desc' },
    include: {
      matchParticipants: true
    }
  });

  const playersWithStats = allPlayers.map(player => {
    const totalMatches = player.wins + player.losses;
    const winRate = totalMatches > 0 ? Math.round((player.wins / totalMatches) * 100) : 0;

    const totalKills = player.matchParticipants.reduce((acc: number, mp: any) => acc + mp.kills, 0);
    const totalDeaths = player.matchParticipants.reduce((acc: number, mp: any) => acc + mp.deaths, 0) || 1;
    const totalAssists = player.matchParticipants.reduce((acc: number, mp: any) => acc + mp.assists, 0);
    const kda = Number(((totalKills + totalAssists) / totalDeaths).toFixed(2));

    return {
      ...player,
      totalMatches,
      winRate,
      kda
    };
  });

  playersWithStats.sort((a, b) => {
    if (b.currentMmr !== a.currentMmr) return b.currentMmr - a.currentMmr;
    if (b.winRate !== a.winRate) return b.winRate - a.winRate;
    if (b.totalMatches !== a.totalMatches) return b.totalMatches - a.totalMatches;
    return b.kda - a.kda;
  });

  const players = playersWithStats;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col space-y-2">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight flex items-center gap-4">
          <div className="bg-primary/10 p-3 rounded-2xl">
            <Trophy className="h-8 w-8 text-primary" />
          </div>
          Sıralama
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl">
          FUCKIT'in en iyileri. Gerçek MMR'a dayalı kesin sıralama tablosu.
        </p>
      </div>

      <div className="rounded-3xl border border-border/50 bg-background/40 backdrop-blur-md shadow-sm overflow-hidden p-2">
        <div className="rounded-2xl overflow-hidden border border-border/30">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="hover:bg-transparent border-b-border/30">
                <TableHead className="w-[100px] text-center font-bold">Rank</TableHead>
                <TableHead className="font-bold">Oyuncu</TableHead>
                <TableHead className="text-right font-bold">MMR</TableHead>
                <TableHead className="text-right font-bold">Kazanma %</TableHead>
                <TableHead className="text-right hidden md:table-cell font-bold">G - M</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {players.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                    Henüz hiç oyuncu yok.
                  </TableCell>
                </TableRow>
              ) : (
                players.map((player: any, index: number) => {
                  const totalMatches = player.wins + player.losses;
                  const winRate = totalMatches > 0 ? Math.round((player.wins / totalMatches) * 100) : 0;

                  return (
                    <TableRow key={player.id} className="group transition-colors hover:bg-muted/20 border-b-border/30">
                      <TableCell className="text-center font-mono font-bold text-lg text-muted-foreground group-hover:text-primary transition-colors">
                        #{index + 1}
                      </TableCell>
                      <TableCell>
                        <Link href={`/player/${player.nickname}`} className="flex items-center gap-3 w-fit group-hover:-translate-y-0.5 transition-transform">
                          <Avatar className="h-10 w-10 border border-primary/20 shadow-sm">
                            <AvatarImage src={player.avatar || undefined} alt={player.nickname} />
                            <AvatarFallback className="bg-primary/10 text-primary font-bold">
                              {player.nickname.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-semibold text-base group-hover:text-primary transition-colors">
                            {player.nickname}
                          </span>
                        </Link>
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold text-xl text-primary">
                        {player.currentMmr}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        <div className="flex justify-end items-center gap-2">
                          <span>{winRate}%</span>
                          <div className="w-12 h-2 bg-muted rounded-full overflow-hidden hidden sm:block">
                            <div className="h-full bg-primary" style={{ width: `${winRate}%` }} />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground hidden md:table-cell">
                        <span className="text-blue-500 font-bold">{player.wins}</span>
                        <span className="mx-2 opacity-50">-</span>
                        <span className="text-destructive font-bold">{player.losses}</span>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
