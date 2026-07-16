import { prisma } from "@/lib/prisma";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Trash2, UserPlus } from "lucide-react";
import { deletePlayerAction } from "@/app/admin/players/actions";
import EditMmrDialog from "./edit-mmr-dialog";

export const dynamic = "force-dynamic";

export default async function AdminPlayersPage() {
  const players = await prisma.player.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Oyuncular</h1>
          <p className="text-muted-foreground text-sm">
            Sistemdeki tüm oyuncuları yönetin.
          </p>
        </div>
        <Link href="/admin/players/new">
          <Button className="flex items-center gap-2">
            <UserPlus className="w-4 h-4" />
            Yeni Ekle
          </Button>
        </Link>
      </div>

      <div className="rounded-md border bg-card/50">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nickname</TableHead>
              <TableHead>MMR</TableHead>
              <TableHead>K/D</TableHead>
              <TableHead className="text-right">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {players.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center h-24">
                  Henüz oyuncu eklenmemiş.
                </TableCell>
              </TableRow>
            ) : (
              players.map((player: any) => (
                <TableRow key={player.id}>
                  <TableCell className="font-semibold">{player.nickname}</TableCell>
                  <TableCell className="font-mono text-primary">{player.currentMmr}</TableCell>
                  <TableCell>
                    <span className="text-blue-400">{player.wins}</span> -{" "}
                    <span className="text-red-400">{player.losses}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end items-center gap-1">
                      <EditMmrDialog 
                        playerId={player.id} 
                        currentMmr={player.currentMmr} 
                        nickname={player.nickname} 
                      />
                      <form action={deletePlayerAction}>
                        <input type="hidden" name="id" value={player.id} />
                        <Button type="submit" variant="ghost" size="icon" className="text-red-400 hover:text-red-500 hover:bg-red-500/10">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </form>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
