export type RankTier =
  | "Iron"
  | "Bronze"
  | "Silver"
  | "Gold"
  | "Platinum"
  | "Emerald"
  | "Diamond"
  | "Master"
  | "Grandmaster"
  | "Challenger";

export const RANK_THRESHOLDS: Record<RankTier, number> = {
  Iron: 0,
  Bronze: 800,
  Silver: 1000,
  Gold: 1200,
  Platinum: 1400,
  Emerald: 1600,
  Diamond: 1800,
  Master: 2000,
  Grandmaster: 2200,
  Challenger: 2400,
};

export function getRankFromMmr(mmr: number): RankTier {
  if (mmr < 800) return "Iron";
  if (mmr < 1000) return "Bronze";
  if (mmr < 1200) return "Silver";
  if (mmr < 1400) return "Gold";
  if (mmr < 1600) return "Platinum";
  if (mmr < 1800) return "Emerald";
  if (mmr < 2000) return "Diamond";
  if (mmr < 2200) return "Master";
  if (mmr < 2400) return "Grandmaster";
  return "Challenger";
}

export function getNextRank(mmr: number): { current: RankTier; next: RankTier | null; currentMin: number; nextMin: number | null; progress: number } {
  const current = getRankFromMmr(mmr);
  const ranks: RankTier[] = ["Iron", "Bronze", "Silver", "Gold", "Platinum", "Emerald", "Diamond", "Master", "Grandmaster", "Challenger"];
  const currentIndex = ranks.indexOf(current);
  
  const currentMin = RANK_THRESHOLDS[current];
  
  if (currentIndex === ranks.length - 1) {
    return { current, next: null, currentMin, nextMin: null, progress: 100 };
  }
  
  const next = ranks[currentIndex + 1];
  const nextMin = RANK_THRESHOLDS[next];
  const progress = Math.min(100, Math.max(0, ((mmr - currentMin) / (nextMin - currentMin)) * 100));
  
  return { current, next, currentMin, nextMin, progress };
}

export function getRankStyle(rank: RankTier): string {
  switch (rank) {
    case "Iron": 
      return "bg-zinc-100 text-zinc-700 border-zinc-300 dark:bg-zinc-950 dark:text-zinc-400 dark:border-zinc-800";
    case "Bronze": 
      return "bg-orange-100 text-orange-800 border-orange-300 dark:bg-[#3b271d] dark:text-[#d4996a] dark:border-[#5e3a26]";
    case "Silver": 
      return "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-950 dark:text-slate-400 dark:border-slate-800";
    case "Gold": 
      return "bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-950/50 dark:text-yellow-500 dark:border-yellow-900/50";
    case "Platinum": 
      return "bg-teal-100 text-teal-700 border-teal-300 dark:bg-teal-950/50 dark:text-teal-400 dark:border-teal-900/50";
    case "Emerald": 
      return "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-500 dark:border-emerald-900/50";
    case "Diamond": 
      return "bg-indigo-100 text-indigo-700 border-indigo-300 dark:bg-indigo-950/50 dark:text-indigo-400 dark:border-indigo-900/50";
    case "Master": 
      return "bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-950/50 dark:text-purple-400 dark:border-purple-900/50";
    case "Grandmaster": 
      return "bg-red-100 text-red-700 border-red-300 dark:bg-red-950/50 dark:text-red-500 dark:border-red-900/50";
    case "Challenger": 
      return "bg-sky-100 text-sky-700 border-sky-300 dark:bg-sky-950/50 dark:text-sky-400 dark:border-sky-900/50";
    default: 
      return "bg-muted text-muted-foreground border-border";
  }
}
