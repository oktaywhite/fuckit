"use client";

import { useActionState } from "react";
import { addPlayerAction } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NewPlayerPage() {
  const [state, formAction, pending] = useActionState(addPlayerAction, null);

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/admin/players">
          <Button variant="outline" size="icon" className="shrink-0">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Yeni Oyuncu Ekle</h1>
          <p className="text-muted-foreground text-sm">
            Sisteme yeni bir oyuncu kaydı açın. MMR 1000 olarak başlatılır.
          </p>
        </div>
      </div>

      <Card className="bg-card/50">
        <CardHeader>
          <CardTitle>Oyuncu Bilgileri</CardTitle>
          <CardDescription>Oyuncunun lakabını ve isteğe bağlı avatar URL'ini girin.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nickname">Nickname (Oyun İçi İsim)</Label>
              <Input 
                id="nickname" 
                name="nickname" 
                placeholder="Örn: Faker" 
                required 
                className="bg-background/50"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="avatar">Avatar URL (İsteğe Bağlı)</Label>
              <Input 
                id="avatar" 
                name="avatar" 
                placeholder="https://example.com/avatar.png" 
                className="bg-background/50"
              />
            </div>

            {state?.error && (
              <div className="text-sm text-red-500 font-medium p-2 bg-red-500/10 rounded-md">
                {state.error}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Link href="/admin/players">
                <Button variant="ghost" type="button">İptal</Button>
              </Link>
              <Button type="submit" disabled={pending}>
                {pending ? "Ekleniyor..." : "Oyuncuyu Ekle"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
