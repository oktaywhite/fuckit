"use client";

import { useActionState } from "react";
import { loginAction } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldHalf } from "lucide-react";

export default function AdminLoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, null);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl -z-10 pointer-events-none" />
      
      <Card className="w-full max-w-sm backdrop-blur bg-card/80 border-primary/20 shadow-2xl animate-in fade-in zoom-in-95 duration-500">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-primary/10 p-3 rounded-full">
              <ShieldHalf className="w-8 h-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">FUCKIT Admin</CardTitle>
          <CardDescription>
            Enter your credentials to access the dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Kullanıcı Adı</Label>
              <Input 
                id="username" 
                name="username" 
                placeholder="Admin username" 
                required 
                className="bg-background/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Şifre</Label>
              <Input 
                id="password" 
                name="password" 
                type="password" 
                placeholder="••••••••" 
                required 
                className="bg-background/50"
              />
            </div>
            {state?.error && (
              <div className="text-sm text-red-500 font-medium text-center p-2 bg-red-500/10 rounded-md">
                {state.error}
              </div>
            )}
            <Button type="submit" className="w-full font-bold" disabled={pending}>
              {pending ? "Giriş Yapılıyor..." : "Giriş Yap"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
