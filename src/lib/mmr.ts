/**
 * Calculates the expected MMR gain/loss based on team averages and upset conditions.
 *
 * @param blueTeamMmr Average MMR of the Blue team
 * @param redTeamMmr Average MMR of the Red team
 * @param winner "BLUE" or "RED"
 * @returns An object containing the base mmr changes for blue and red teams.
 */
export function calculateBaseMmrChange(
  blueTeamMmr: number,
  redTeamMmr: number,
  winner: "BLUE" | "RED"
): { blueMmrChange: number; redMmrChange: number } {
  const diff = Math.abs(blueTeamMmr - redTeamMmr);
  const higherTeam = blueTeamMmr > redTeamMmr ? "BLUE" : blueTeamMmr < redTeamMmr ? "RED" : "EQUAL";

  let winnerGain = 0;
  let loserLoss = 0;

  if (diff < 50) {
    winnerGain = 25;
    loserLoss = -25;
  } else if (diff < 100) {
    winnerGain = winner === higherTeam ? 22 : 28;
    loserLoss = winner === higherTeam ? -22 : -28;
  } else if (diff < 150) {
    winnerGain = winner === higherTeam ? 20 : 30;
    loserLoss = winner === higherTeam ? -20 : -30;
  } else if (diff < 200) {
    winnerGain = winner === higherTeam ? 18 : 32;
    loserLoss = winner === higherTeam ? -18 : -32;
  } else {
    winnerGain = winner === higherTeam ? 15 : 35;
    loserLoss = winner === higherTeam ? -15 : -35;
  }

  return {
    blueMmrChange: winner === "BLUE" ? winnerGain : loserLoss,
    redMmrChange: winner === "RED" ? winnerGain : loserLoss,
  };
}

/**
 * Calculates win streak bonus
 * @param streak Current win streak count
 */
export function calculateWinStreakBonus(streak: number): number {
  if (streak >= 6) return 8;
  if (streak === 5) return 6;
  if (streak === 4) return 4;
  if (streak === 3) return 2;
  return 0;
}

/**
 * Calculates loss streak protection
 * @param streak Current loss streak count
 */
export function calculateLossStreakProtection(streak: number): number {
  if (streak >= 5) return 6;
  if (streak === 4) return 4;
  if (streak === 3) return 2;
  return 0;
}

/**
 * Applies bonuses and protections, ensuring MMR doesn't drop below 0.
 */
export function calculateFinalMmr(
  currentMmr: number,
  baseChange: number,
  winStreak: number,
  lossStreak: number
): { finalMmr: number; change: number } {
  let change = baseChange;

  if (baseChange > 0) {
    change += calculateWinStreakBonus(winStreak);
  } else if (baseChange < 0) {
    change += calculateLossStreakProtection(lossStreak); // loss is negative, so adding protection reduces it
    // Wait, protection reduces loss: if change is -25, and protection is 2, change becomes -23. This is correct.
  }

  const finalMmr = Math.max(0, currentMmr + change);
  return { finalMmr, change: finalMmr - currentMmr };
}
