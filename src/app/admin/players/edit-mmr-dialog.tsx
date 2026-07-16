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
  currentMmr, 
  nickname 
}: { 
  playerId: string; 
  currentMmr: number; 
  nickname: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [newMmr, setNewMmr] = useState(currentMmr.toString());
  const [pending, setPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);

    const formData = new FormData();
    formData.append("playerId", playerId);
    formData.append("newMmr", newMmr);

    const res = await adjustPlayerMmrAction(formData);
    if (res?.error) {
      toast.error(res.error);
    } else {
      toast.success("MMR başarıyla güncellendi.");
      setOpen(false);
      router.refresh();
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
          <div className="space-y-2">
            <Label htmlFor="mmr">Yeni MMR Değeri</Label>
            <Input 
              id="mmr" 
              type="number"
              value={newMmr}
              onChange={(e) => setNewMmr(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              Şu anki MMR: <strong>{currentMmr}</strong>
              <br/>
              Girilen değere ulaşmak için sisteme anında hesaplanacak gizli bir MMR Müdahale kaydı eklenecektir.
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
