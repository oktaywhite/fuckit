import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
// @ts-ignore
import { startSeasonAction, endSeasonAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function SeasonAdminPage() {
  const activeSeasons = await (prisma as any).season.findMany({
    where: { isActive: true },
  });

  const pastSeasons = await (prisma as any).season.findMany({
    where: { isActive: false },
    orderBy: { endDate: 'desc' }
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Sezon Yönetimi</h1>
        <p className="text-muted-foreground">Aktif sezonu kontrol edin ve yeni sezonlar başlatın.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-primary/20 shadow-sm bg-background/50 backdrop-blur-md">
          <CardHeader>
            <CardTitle>Mevcut Sezon</CardTitle>
            <CardDescription>Şu anki aktif sezonun detayları.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {activeSeasons.length > 0 ? (
              <div className="space-y-4">
                {activeSeasons.map((activeSeason: any) => (
                  <div key={activeSeason.id} className="p-4 bg-primary/10 border border-primary/20 rounded-xl mb-4">
                    <h3 className="font-bold text-lg text-primary mb-1">{activeSeason.name} ({activeSeason.game})</h3>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>Başlangıç: {activeSeason.startDate.toLocaleDateString('tr-TR')}</p>
                      {activeSeason.endDate && (
                        <p>Bitiş Hedefi: {activeSeason.endDate.toLocaleDateString('tr-TR')}</p>
                      )}
                    </div>
                    
                    <form action={endSeasonAction} className="mt-4">
                      <input type="hidden" name="seasonId" value={activeSeason.id} />
                      <Button type="submit" variant="destructive" className="w-full font-bold">
                        Sezonu Bitir
                      </Button>
                      <p className="text-xs text-muted-foreground mt-2 text-center">
                        Sezon bittiğinde tüm oyuncuların {activeSeason.game} MMR ve maç istatistikleri sıfırlanır, geçmiş sezon arşivine kaydedilir.
                      </p>
                    </form>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 bg-muted/50 border border-border/50 rounded-xl text-center">
                <p className="text-muted-foreground font-medium mb-4">Şu an aktif bir sezon yok.</p>
              </div>
            )}

            <div className="pt-6 border-t border-border/50">
              <h3 className="font-bold text-lg mb-4">Yeni Sezon Başlat</h3>
              <form action={startSeasonAction} className="space-y-4 text-left bg-muted/30 p-4 rounded-xl border border-border/50">
                <div className="space-y-2">
                  <Label>Oyun</Label>
                  <select name="game" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background" required>
                    <option value="LOL">League of Legends</option>
                    <option value="ROCKET_LEAGUE">Rocket League</option>
                    <option value="VALORANT">Valorant</option>
                  </select>
                </div>
                <div className="space-y-2">
                    <Label>Sezon Adı</Label>
                    <Input name="name" placeholder="Örn: Sezon 2" required />
                  </div>
                  <div className="space-y-2">
                    <Label>Kaç Gün Sürecek?</Label>
                    <Input name="days" type="number" min="1" placeholder="Örn: 30" required />
                  </div>
                <Button type="submit" className="w-full">Yeni Sezon Başlat</Button>
              </form>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm bg-background/50 backdrop-blur-md">
          <CardHeader>
            <CardTitle>Geçmiş Sezonlar</CardTitle>
            <CardDescription>Tamamlanan sezonların arşivi.</CardDescription>
          </CardHeader>
          <CardContent>
            {pastSeasons.length === 0 ? (
              <p className="text-sm text-muted-foreground">Henüz tamamlanmış bir sezon yok.</p>
            ) : (
              <div className="space-y-4">
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {pastSeasons.map((season: any) => (
                    <div key={season.id} className="p-3 bg-muted/30 border border-border/50 rounded-lg flex justify-between items-center">
                      <div>
                        <p className="font-semibold">{season.name} ({season.game})</p>
                        <p className="text-xs text-muted-foreground">
                          {season.startDate.toLocaleDateString('tr-TR')} - {season.endDate?.toLocaleDateString('tr-TR')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="pt-4 mt-4 border-t border-border/50">
                  <form action={async () => {
                    "use server";
                    // @ts-ignore
                    const { deletePastSeasonsAction } = await import('./actions');
                    await deletePastSeasonsAction();
                  }}>
                    <Button type="submit" variant="destructive" className="w-full text-xs" size="sm">
                      Tüm Arşivi Temizle
                    </Button>
                  </form>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
