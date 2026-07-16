import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Calendar, ChevronRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SeasonsPage() {
  const seasons = await (prisma as any).season.findMany({
    where: { isActive: false },
    orderBy: { endDate: 'desc' },
    include: {
      _count: {
        select: { matches: true, stats: true }
      }
    }
  });

  return (
    <div className="space-y-8 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-4xl mx-auto mt-8">
      <div className="space-y-2">
        <h1 className="text-4xl font-extrabold tracking-tight">Geçmiş Sezonlar</h1>
        <p className="text-muted-foreground text-lg">Eski sezonların sıralamalarını ve maç arşivlerini inceleyin.</p>
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
