import { prisma } from "./prisma";
import { calculateBaseMmrChange, calculateFinalMmr } from "./mmr";
import { Game } from "@prisma/client";

export async function recalculateAllPlayerStats() {
  // 1. Fetch active seasons per game
  const games = Object.values(Game);
  
  // We need to fetch all matches chronologically
  const allMatches = await prisma.match.findMany({
    orderBy: { date: "asc" },
    include: {
      participants: true,
      season: true
    },
  });

  const adjustments = await (prisma as any).mmrAdjustment.findMany({
    orderBy: { date: "asc" },
  });

  const allPlayers = await prisma.player.findMany();

  // Track player states per game in memory
  // Map key: `${playerId}-${game}`
  const playersMap = new Map<
    string,
    { mmr: number; peakMmr: number; wins: number; losses: number; winStreak: number; lossStreak: number; game: Game }
  >();

  // Initialize map with all players for all games with default values
  for (const p of allPlayers) {
    for (const game of games) {
      const key = `${p.id}-${game}`;
      playersMap.set(key, { mmr: 1000, peakMmr: 1000, wins: 0, losses: 0, winStreak: 0, lossStreak: 0, game });
    }
  }

  const getPlayerState = (id: string, game: Game) => {
    const key = `${id}-${game}`;
    if (!playersMap.has(key)) {
      playersMap.set(key, { mmr: 1000, peakMmr: 1000, wins: 0, losses: 0, winStreak: 0, lossStreak: 0, game });
    }
    return playersMap.get(key)!;
  };

  // Merge timeline
  type TimelineEvent =
    | { type: "MATCH"; date: Date; data: any; game: Game }
    | { type: "ADJUSTMENT"; date: Date; data: any; game: Game };

  const timeline: TimelineEvent[] = [
    ...allMatches.map((m: any) => ({ type: "MATCH" as const, date: m.date, data: m, game: m.game as Game })),
    ...adjustments.map((a: any) => ({ type: "ADJUSTMENT" as const, date: a.date, data: a, game: a.game as Game }))
  ].sort((a, b) => a.date.getTime() - b.date.getTime());

  // Iterate through timeline and apply MMR changes per game
  for (const event of timeline) {
    if (event.type === "ADJUSTMENT") {
      const adj = event.data;
      const state = getPlayerState(adj.playerId, event.game);
      state.mmr += adj.amount;
      if (state.mmr > state.peakMmr) state.peakMmr = state.mmr;
      continue;
    }

    const match = event.data;
    const blueTeam = match.participants.filter((p: any) => p.team === "BLUE");
    const redTeam = match.participants.filter((p: any) => p.team === "RED");

    if (blueTeam.length === 0 || redTeam.length === 0) continue;

    const blueTeamAvgMmr =
      blueTeam.reduce((acc: number, p: any) => acc + getPlayerState(p.playerId, event.game).mmr, 0) / blueTeam.length;
    const redTeamAvgMmr =
      redTeam.reduce((acc: number, p: any) => acc + getPlayerState(p.playerId, event.game).mmr, 0) / redTeam.length;

    const { blueMmrChange, redMmrChange } = calculateBaseMmrChange(
      blueTeamAvgMmr,
      redTeamAvgMmr,
      match.winner as "BLUE" | "RED"
    );

    // Update each participant
    for (const participant of match.participants) {
      const state = getPlayerState(participant.playerId, event.game);
      const isWinner = participant.team === match.winner;
      const baseChange = participant.team === "BLUE" ? blueMmrChange : redMmrChange;

      const { finalMmr } = calculateFinalMmr(state.mmr, baseChange, state.winStreak, state.lossStreak);

      state.mmr = finalMmr;
      if (state.mmr > state.peakMmr) {
        state.peakMmr = state.mmr;
      }

      if (isWinner) {
        state.wins += 1;
        state.winStreak += 1;
        state.lossStreak = 0;
      } else {
        state.losses += 1;
        state.lossStreak += 1;
        state.winStreak = 0;
      }
    }
  }

  // Clear existing PlayerGameStat table completely and repopulate
  await prisma.playerGameStat.deleteMany({});

  const createData = Array.from(playersMap.entries()).map(([key, state]) => {
    const [playerId, game] = key.split("-");
    return {
      playerId,
      game: game as Game,
      currentMmr: state.mmr,
      peakMmr: state.peakMmr,
      wins: state.wins,
      losses: state.losses,
    };
  });

  if (createData.length > 0) {
    await prisma.playerGameStat.createMany({
      data: createData,
    });
  }
}
