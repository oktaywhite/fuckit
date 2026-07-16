import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface ChampionAvatarProps {
  championName: string;
  className?: string;
}

export function ChampionAvatar({ championName, className }: ChampionAvatarProps) {
  // TODO: Riot API'den veya Data Dragon'dan karakter görseli URL'sini oluşturmak için altyapı.
  // URL'yi .env dosyasından çekebilirsiniz.
  // const riotApiBaseUrl = process.env.NEXT_PUBLIC_RIOT_IMAGES_URL;
  // const avatarUrl = riotApiBaseUrl ? `${riotApiBaseUrl}/${championName}.png` : undefined;

  const avatarUrl = undefined; // Riot API bağlandığında bu URL'yi ayarlayın

  return (
    <Avatar className={cn("w-5 h-5 rounded flex items-center justify-center shrink-0 border", className)} title={championName}>
      <AvatarImage src={avatarUrl} alt={championName} />
      <AvatarFallback className="bg-transparent text-inherit text-[9px] font-black uppercase">
        {championName ? championName.substring(0, 2) : "??"}
      </AvatarFallback>
    </Avatar>
  );
}
