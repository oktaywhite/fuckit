export type RankTier = string;

export const RANK_THRESHOLDS = [0, 800, 1000, 1200, 1400, 1600, 1800, 2000, 2200, 2400];

const LOL_RANKS = ["Iron", "Bronze", "Silver", "Gold", "Platinum", "Emerald", "Diamond", "Master", "Grandmaster", "Challenger"];
const RL_RANKS = ["Bronze", "Silver", "Gold", "Platinum", "Diamond", "Champion", "Grand Champion", "Grand Champ II", "Grand Champ III", "Supersonic Legend"];
const VAL_RANKS = ["Iron", "Bronze", "Silver", "Gold", "Platinum", "Diamond", "Ascendant", "Immortal", "Immortal III", "Radiant"];

export function getRankLevel(mmr: number): number {
  if (mmr < 800) return 0;
  if (mmr < 1000) return 1;
  if (mmr < 1200) return 2;
  if (mmr < 1400) return 3;
  if (mmr < 1600) return 4;
  if (mmr < 1800) return 5;
  if (mmr < 2000) return 6;
  if (mmr < 2200) return 7;
  if (mmr < 2400) return 8;
  return 9;
}

export function getRankFromMmr(mmr: number, game: string = "LOL"): RankTier {
  const level = getRankLevel(mmr);
  if (game === "ROCKET_LEAGUE") return RL_RANKS[level];
  if (game === "VALORANT") return VAL_RANKS[level];
  return LOL_RANKS[level];
}

export function getNextRank(mmr: number, game: string = "LOL"): { current: RankTier; next: RankTier | null; currentMin: number; nextMin: number | null; progress: number } {
  const level = getRankLevel(mmr);
  const current = getRankFromMmr(mmr, game);
  const currentMin = RANK_THRESHOLDS[level];
  
  if (level === 9) {
    return { current, next: null, currentMin, nextMin: null, progress: 100 };
  }
  
  const nextMin = RANK_THRESHOLDS[level + 1];
  const next = game === "ROCKET_LEAGUE" ? RL_RANKS[level + 1] : game === "VALORANT" ? VAL_RANKS[level + 1] : LOL_RANKS[level + 1];
  const progress = Math.min(100, Math.max(0, ((mmr - currentMin) / (nextMin - currentMin)) * 100));
  
  return { current, next, currentMin, nextMin, progress };
}

export function getRankStyle(rankNameOrLevel: string | number): string {
  let level = 0;
  if (typeof rankNameOrLevel === "number") {
    level = rankNameOrLevel;
  } else {
    level = LOL_RANKS.indexOf(rankNameOrLevel);
    if (level === -1) level = RL_RANKS.indexOf(rankNameOrLevel);
    if (level === -1) level = VAL_RANKS.indexOf(rankNameOrLevel);
    if (level === -1) level = 0; // fallback
  }

  switch (level) {
    case 0: return "bg-zinc-100 text-zinc-700 border-zinc-300 dark:bg-zinc-950 dark:text-zinc-400 dark:border-zinc-800";
    case 1: return "bg-orange-100 text-orange-800 border-orange-300 dark:bg-[#3b271d] dark:text-[#d4996a] dark:border-[#5e3a26]";
    case 2: return "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-950 dark:text-slate-400 dark:border-slate-800";
    case 3: return "bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-950/50 dark:text-yellow-500 dark:border-yellow-900/50";
    case 4: return "bg-teal-100 text-teal-700 border-teal-300 dark:bg-teal-950/50 dark:text-teal-400 dark:border-teal-900/50";
    case 5: return "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-500 dark:border-emerald-900/50";
    case 6: return "bg-indigo-100 text-indigo-700 border-indigo-300 dark:bg-indigo-950/50 dark:text-indigo-400 dark:border-indigo-900/50";
    case 7: return "bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-950/50 dark:text-purple-400 dark:border-purple-900/50";
    case 8: return "bg-red-100 text-red-700 border-red-300 dark:bg-red-950/50 dark:text-red-500 dark:border-red-900/50";
    case 9: return "bg-sky-100 text-sky-700 border-sky-300 dark:bg-sky-950/50 dark:text-sky-400 dark:border-sky-900/50";
    default: return "bg-muted text-muted-foreground border-border";
  }
}
