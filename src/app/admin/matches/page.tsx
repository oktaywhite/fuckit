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
import { Trash2, Plus } from "lucide-react";
import { deleteMatchAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminMatchesPage() {
  const matches = await prisma.match.findMany({
    orderBy: { date: "desc" },
    include: {
      participants: {
        include: { player: true }
      }
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Maçlar</h1>
          <p className="text-muted-foreground text-sm">
            Sistemdeki tüm maçları yönetin. Bir maçı silmek MMR'ları otomatik olarak geri alır.
          </p>
        </div>
        <Link href="/admin/matches/new">
          <Button className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Yeni Ekle
          </Button>
        </Link>
      </div>

      <div className="rounded-md border bg-card/50">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tarih</TableHead>
              <TableHead>Mavi Takım</TableHead>
              <TableHead>Kırmızı Takım</TableHead>
              <TableHead>Kazanan</TableHead>
              <TableHead className="text-right">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {matches.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center h-24">
                  Henüz maç eklenmemiş.
                </TableCell>
              </TableRow>
            ) : (
              matches.map((match: any) => {
                const blueTeam = match.participants.filter((p: any) => p.team === "BLUE");
                const redTeam = match.participants.filter((p: any) => p.team === "RED");

                return (
                  <TableRow key={match.id}>
                    <TableCell className="font-mono text-sm">
                      {match.date.toLocaleString("tr-TR")}
                    </TableCell>
                    <TableCell>
                      {blueTeam.map((p: any) => p.player.nickname).join(", ")}
                    </TableCell>
                    <TableCell>
                      {redTeam.map((p: any) => p.player.nickname).join(", ")}
                    </TableCell>
                    <TableCell>
                      <span className={match.winner === "BLUE" ? "text-blue-500 font-bold" : "text-red-500 font-bold"}>
                        {match.winner}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <form action={deleteMatchAction}>
                        <input type="hidden" name="id" value={match.id} />
                        <Button type="submit" variant="ghost" size="icon" className="text-red-400 hover:text-red-500 hover:bg-red-500/10" title="Maçı Sil">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </form>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
