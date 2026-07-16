# MMR SYSTEM

## Overview

This project uses a custom MMR system.

MMR is the primary ranking metric.

Every player has:

- Current MMR
- Peak MMR
- Current Rank

Ranks are determined only by MMR.

---

## Starting MMR

New players start at:

1000 MMR

---

## Match Calculation

The system calculates the average MMR of both teams.

Example:

Blue Team Average:
1250

Red Team Average:
1350

Difference:
100

---

## Expected Result

Higher MMR teams are expected to win.

Lower MMR teams are expected to lose.

Upsets should reward more MMR.

Expected wins should reward less MMR.

---

## MMR Gain/Loss Table

MMR Difference = Absolute difference between team averages.

### Difference 0-49

Winner:
+25

Loser:
-25

---

### Difference 50-99

Higher MMR Team Wins:
+22
-22

Lower MMR Team Wins:
+28
-28

---

### Difference 100-149

Higher MMR Team Wins:
+20
-20

Lower MMR Team Wins:
+30
-30

---

### Difference 150-199

Higher MMR Team Wins:
+18
-18

Lower MMR Team Wins:
+32
-32

---

### Difference 200+

Higher MMR Team Wins:
+15
-15

Lower MMR Team Wins:
+35
-35

---

## Win Streak Bonus

3 Wins:
+2 Bonus MMR

4 Wins:
+4 Bonus MMR

5 Wins:
+6 Bonus MMR

6+ Wins:
+8 Bonus MMR

Maximum bonus:
+8

---

## Loss Streak Protection

3 Consecutive Losses:
Reduce loss by 2 MMR

4 Consecutive Losses:
Reduce loss by 4 MMR

5+ Consecutive Losses:
Reduce loss by 6 MMR

Maximum protection:
6

---

## Peak MMR

If current MMR exceeds peak MMR:

Peak MMR = Current MMR

Update automatically.

---

## Rank Updates

Ranks update immediately after every match.

No promotion series.

No demotion protection.

Pure MMR based.

---

## MMR Floor

Minimum MMR:

0

Players can never go below 0.

---

## Match Validity

Only matches created by the administrator affect MMR.

Deleted matches should automatically recalculate affected player statistics.

---

## Future Compatibility

This system must work for:

- League of Legends
- Rocket League
- Valorant

Game-specific statistics may differ.

MMR logic remains shared.