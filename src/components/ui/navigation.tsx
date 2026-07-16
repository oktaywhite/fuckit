"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Trophy, Users, Home, ShieldHalf, Lock, Calendar, Swords } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

export function Navigation() {
  const pathname = usePathname();

  const links = [
    { href: "/", label: "Ana Sayfa", icon: Home },
    { href: "/leaderboard", label: "Sıralama", icon: Trophy },
    { href: "/matches", label: "Maçlar", icon: Swords },
    { href: "/players", label: "Oyuncular", icon: Users },
    { href: "/seasons", label: "Geçmiş Sezonlar", icon: Calendar },
    { href: "/rules", label: "Kurallar", icon: ShieldHalf },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/60 backdrop-blur-xl supports-[backdrop-filter]:bg-background/40">
      <div className="container flex h-16 max-w-screen-2xl items-center mx-auto px-4 md:px-8">
        <div className="mr-4 hidden md:flex">
          <Link href="/" className="mr-8 flex items-center space-x-3">
            <div className="bg-primary/10 p-2 rounded-xl">
              <ShieldHalf className="h-5 w-5 text-primary" />
            </div>
            <span className="hidden font-bold sm:inline-block text-xl tracking-tight">
              FUCKIT
            </span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            {links.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "transition-all hover:text-primary relative py-1",
                  pathname === href ? "text-foreground font-semibold" : "text-muted-foreground"
                )}
              >
                {label}
                {pathname === href && (
                  <span className="absolute bottom-0 left-0 w-full h-[2px] bg-primary rounded-full" />
                )}
              </Link>
            ))}
          </nav>
        </div>
        {/* Mobile Nav */}
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none flex justify-end gap-2 items-center">
            <ThemeToggle />
            <Link href="/admin">
              <Button variant="outline" size="sm" className="hidden md:flex gap-2 rounded-full px-4 border-border/50 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all">
                <Lock className="w-4 h-4" />
                Admin
              </Button>
            </Link>
          </div>
          <nav className="flex items-center gap-4 md:hidden">
            {links.map(({ href, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center justify-center transition-colors hover:text-foreground/80",
                  pathname === href ? "text-foreground" : "text-foreground/60"
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="sr-only">{href}</span>
              </Link>
            ))}
            <Link href="/admin" className="flex items-center justify-center transition-colors text-foreground/60 hover:text-foreground/80">
              <Lock className="h-5 w-5" />
              <span className="sr-only">Admin</span>
            </Link>
          </nav>
        </div>
      </div>
    </nav>
  );
}
