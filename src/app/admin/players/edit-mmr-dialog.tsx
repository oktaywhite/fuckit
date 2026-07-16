"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Edit2 } from "lucide-react";
import { adjustPlayerMmrAction } from "./actions";
import { toast } from "sonner";

export default function EditMmrDialog({
  playerId,
  nickname,
  lolMmr,
  rlMmr,
  valMmr,
}: {
  playerId: string;
  nickname: string;
  lolMmr: number | null;
  rlMmr: number | null;
  valMmr: number | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [newLolMmr, setNewLolMmr] = useState(lolMmr?.toString() || "");
  const [newRlMmr, setNewRlMmr] = useState(rlMmr?.toString() || "");
  const [newValMmr, setNewValMmr] = useState(valMmr?.toString() || "");
  const [pending, setPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);

    try {
      // Process each game that has a change
      const updates: { game: string; currentMmr: number | null; newMmr: string }[] = [
        { game: "LOL", currentMmr: lolMmr, newMmr: newLolMmr },
        { game: "ROCKET_LEAGUE", currentMmr: rlMmr, newMmr: newRlMmr },
        { game: "VALORANT", currentMmr: valMmr, newMmr: newValMmr },
      ];

      let anyChanged = false;
      for (const update of updates) {
        if (!update.newMmr) continue;
        const newVal = parseInt(update.newMmr);
        if (isNaN(newVal)) continue;
        if (update.currentMmr !== null && newVal === update.currentMmr) continue;

        const formData = new FormData();
        formData.append("playerId", playerId);
        formData.append("newMmr", update.newMmr);
        formData.append("game", update.game);

        const res = await adjustPlayerMmrAction(formData);
        if (res?.error) {
          toast.error(`${update.game}: ${res.error}`);
        } else {
          anyChanged = true;
        }
      }

      if (anyChanged) {
        toast.success("MMR başarıyla güncellendi.");
      }
      setOpen(false);
      router.refresh();
    } catch {
      toast.error("Bir hata oluştu.");
    }
    setPending(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="ghost" size="icon" className="text-blue-400 hover:text-blue-500 hover:bg-blue-500/10" />}>
        <Edit2 className="w-4 h-4" />
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>MMR Düzenle: {nickname}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="lol-mmr" className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary"></span>
                League of Legends
              </Label>
              <Input
                id="lol-mmr"
                type="number"
                placeholder={lolMmr !== null ? `Şu an: ${lolMmr}` : "Kayıt yok"}
                value={newLolMmr}
                onChange={(e) => setNewLolMmr(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="rl-mmr" className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                Rocket League
              </Label>
              <Input
                id="rl-mmr"
                type="number"
                placeholder={rlMmr !== null ? `Şu an: ${rlMmr}` : "Kayıt yok"}
                value={newRlMmr}
                onChange={(e) => setNewRlMmr(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="val-mmr" className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                Valorant
              </Label>
              <Input
                id="val-mmr"
                type="number"
                placeholder={valMmr !== null ? `Şu an: ${valMmr}` : "Kayıt yok"}
                value={newValMmr}
                onChange={(e) => setNewValMmr(e.target.value)}
              />
            </div>

            <p className="text-xs text-muted-foreground">
              Sadece değiştirmek istediğiniz oyunların MMR'ını girin. Boş bırakılan alanlar değiştirilmez.
            </p>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>İptal</Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Kaydediliyor..." : "Kaydet"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
