import { prisma } from "./prisma";
import { calculateBaseMmrChange, calculateFinalMmr } from "./mmr";

export async function recalculateAllPlayerStats() {
  const activeSeason = await prisma.season.findFirst({
    where: { isActive: true },
    orderBy: { startDate: "desc" },
  });

  // 1. Reset all players to default stats
  await prisma.player.updateMany({
    data: {
      currentMmr: 1000,
      peakMmr: 1000,
      wins: 0,
      losses: 0,
    },
  });

  // 2. Fetch all matches chronologically (filter by active season if exists)
  const matches = await prisma.match.findMany({
    where: activeSeason ? { seasonId: activeSeason.id } : {},
    orderBy: { date: "asc" },
    include: {
      participants: true,
    },
  });

  // Fetch ALL adjustments (not filtered by date so manual edits always apply)
  const adjustments = await (prisma as any).mmrAdjustment.findMany({
    orderBy: { date: "asc" },
  });

  // 3. We need to track player states in memory during recalculation to compute streaks
  // since querying DB for every match is slow.
  const playersMap = new Map<
    string,
    { mmr: number; peakMmr: number; wins: number; losses: number; winStreak: number; lossStreak: number }
  >();

  const getPlayerState = (id: string) => {
    if (!playersMap.has(id)) {
      playersMap.set(id, { mmr: 1000, peakMmr: 1000, wins: 0, losses: 0, winStreak: 0, lossStreak: 0 });
    }
    return playersMap.get(id)!;
  };

  // 4. Merge timeline
  type TimelineEvent =
    | { type: "MATCH"; date: Date; data: any }
    | { type: "ADJUSTMENT"; date: Date; data: any };

  const timeline: TimelineEvent[] = [
    ...matches.map((m: any) => ({ type: "MATCH" as const, date: m.date, data: m })),
    ...adjustments.map((a: any) => ({ type: "ADJUSTMENT" as const, date: a.date, data: a }))
  ].sort((a, b) => a.date.getTime() - b.date.getTime());

  // 5. Iterate through timeline and apply MMR changes
  for (const event of timeline) {
    if (event.type === "ADJUSTMENT") {
      const adj = event.data;
      const state = getPlayerState(adj.playerId);
      state.mmr += adj.amount;
      if (state.mmr > state.peakMmr) state.peakMmr = state.mmr;
      continue;
    }

    const match = event.data;
    const blueTeam = match.participants.filter((p: any) => p.team === "BLUE");
    const redTeam = match.participants.filter((p: any) => p.team === "RED");

    if (blueTeam.length === 0 || redTeam.length === 0) continue;

    const blueTeamAvgMmr =
      blueTeam.reduce((acc: number, p: any) => acc + getPlayerState(p.playerId).mmr, 0) / blueTeam.length;
    const redTeamAvgMmr =
      redTeam.reduce((acc: number, p: any) => acc + getPlayerState(p.playerId).mmr, 0) / redTeam.length;

    const { blueMmrChange, redMmrChange } = calculateBaseMmrChange(
      blueTeamAvgMmr,
      redTeamAvgMmr,
      match.winner as "BLUE" | "RED"
    );

    // Update each participant
    for (const participant of match.participants) {
      const state = getPlayerState(participant.playerId);
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

  // 5. Bulk update players in DB
  const updatePromises = Array.from(playersMap.entries()).map(([id, state]) =>
    prisma.player.update({
      where: { id },
      data: {
        currentMmr: state.mmr,
        peakMmr: state.peakMmr,
        wins: state.wins,
        losses: state.losses,
      },
    })
  );

  await Promise.all(updatePromises);
}
