"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, RotateCcw, CalendarIcon } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { cn } from "@/lib/utils";

export function MatchFilter({ seasons = [], basePath = "/matches", hideSeason = false }: { seasons?: any[], basePath?: string, hideSeason?: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [player, setPlayer] = useState(searchParams.get("player") || "");
  const [season, setSeason] = useState(searchParams.get("season") || "all");
  const [date, setDate] = useState<Date | undefined>(
    searchParams.get("date") ? new Date(searchParams.get("date") as string) : undefined
  );
  const [sort, setSort] = useState(searchParams.get("sort") || "desc");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (player) params.set("player", player);
    if (season && season !== "all" && !hideSeason) params.set("season", season);
    if (date) params.set("date", format(date, "yyyy-MM-dd"));
    if (sort !== "desc") params.set("sort", sort);

    router.push(`${basePath}?${params.toString()}`);
  };

  const handleReset = () => {
    setPlayer("");
    setSeason("all");
    setDate(undefined);
    setSort("desc");
    router.push(basePath);
  };

  return (
    <form onSubmit={handleSearch} className="flex flex-col lg:flex-row gap-3 p-4 bg-card border border-border shadow-none rounded-md mb-8">
      <div className="flex-1 flex flex-col space-y-1">
        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-1">Oyuncu Ara</label>
        <Input
          placeholder="Nickname girin..."
          value={player}
          onChange={e => setPlayer(e.target.value)}
          className="bg-background border-border/50 h-9 rounded-sm focus-visible:ring-0 focus-visible:border-primary transition-colors"
        />
      </div>

      {!hideSeason && (
        <div className="flex-1 flex flex-col space-y-1">
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-1">Sezon</label>
          <Select value={season} onValueChange={v => setSeason(v || "all")}>
            <SelectTrigger className="w-full bg-background border-border/50 h-9 rounded-sm focus:ring-0 focus:border-primary transition-colors">
              <SelectValue placeholder="Tüm Sezonlar">
                {season === "all" ? "Tüm Sezonlar" : seasons.find(s => s.id === season)?.name || "Tüm Sezonlar"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="rounded-sm">
              <SelectItem value="all">Tüm Sezonlar</SelectItem>
              {seasons.map(s => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="flex-1 flex flex-col space-y-1">
        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-1">Sıralama</label>
        <Select value={sort} onValueChange={v => setSort(v || "desc")}>
          <SelectTrigger className="w-full bg-background border-border/50 h-9 rounded-sm focus:ring-0 focus:border-primary transition-colors">
            <SelectValue placeholder="Sıralama Seçin">
              {sort === "asc" ? "En Eski" : "En Yeni"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="rounded-sm">
            <SelectItem value="desc">En Yeni</SelectItem>
            <SelectItem value="asc">En Eski</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex-1 flex flex-col space-y-1">
        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-1">Tarih</label>
        <Popover>
          <PopoverTrigger 
            className={cn(
              buttonVariants({ variant: "outline" }),
              "w-full h-9 flex items-center justify-start text-left font-normal bg-background border-border/50 rounded-sm focus:ring-0 focus:border-primary transition-colors",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? format(date, "PPP", { locale: tr }) : <span>Tarih Seçin</span>}
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              locale={tr}
            />
          </PopoverContent>
        </Popover>
      </div>
      <div className="flex items-end gap-2 lg:w-auto w-full pt-1 lg:pt-0">
        <Button type="button" variant="outline" onClick={handleReset} className="h-9 px-3 border-border/50 bg-background text-muted-foreground hover:text-foreground rounded-sm">
          <RotateCcw className="w-4 h-4" />
        </Button>
        <Button type="submit" className="h-9 flex-1 lg:flex-none lg:w-28 flex items-center justify-center gap-2 font-bold shadow-none rounded-sm">
          <Search className="w-3.5 h-3.5" />
          Filtrele
        </Button>
      </div>
    </form>
  );
}
