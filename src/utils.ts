import { Scores, Subject, SubjectStats, Week } from './types';

export function calculateSummary(
  subjects: Subject[],
  weeks: Week[],
  scores: Scores
): Record<string, SubjectStats> {
  const result: Record<string, SubjectStats> = {};

  for (const subject of subjects) {
    let maxTotal = 0;
    let achievedTotal = 0;

    let workedMaxTotal = 0;
    let workedAchievedTotal = 0;

    const maxValues: number[] = [];

    for (const week of weeks) {
      const maxStr = scores[`${week.id}_${subject.id}_max`];
      const achievedStr = scores[`${week.id}_${subject.id}_achieved`];

      const maxVal = maxStr ? parseFloat(maxStr) : 0;
      const achievedVal = achievedStr ? parseFloat(achievedStr) : 0;

      if (!isNaN(maxVal) && maxVal > 0) {
        maxTotal += maxVal;
        maxValues.push(maxVal);
      }
      if (!isNaN(achievedVal)) {
        if (achievedStr && achievedStr.trim() !== '') {
          achievedTotal += achievedVal;
          if (!isNaN(maxVal) && maxVal > 0) {
            workedMaxTotal += maxVal;
            workedAchievedTotal += achievedVal;
          }
        }
      }
    }

    const requiredPoints = maxTotal * (subject.threshold / 100);
    const totalQuote = maxTotal > 0 ? (achievedTotal / maxTotal) * 100 : 0;
    const progressToPass = requiredPoints > 0 ? (achievedTotal / requiredPoints) * 100 : 0;
    const workedSheetsQuote = workedMaxTotal > 0 ? (workedAchievedTotal / workedMaxTotal) * 100 : 0;
    const missingPoints = Math.max(0, requiredPoints - achievedTotal);

    let required100PercentSheets = 0;
    if (missingPoints > 0 && maxValues.length > 0) {
      // Find the most frequent "max" value (mode) to estimate
      const counts: Record<number, number> = {};
      let mode = maxValues[0];
      let maxCount = 0;
      for (const val of maxValues) {
        counts[val] = (counts[val] || 0) + 1;
        if (counts[val] > maxCount) {
          maxCount = counts[val];
          mode = val;
        }
      }
      required100PercentSheets = Math.ceil(missingPoints / mode);
    }

    result[subject.id] = {
      maxTotal,
      achievedTotal,
      requiredPoints,
      totalQuote,
      progressToPass,
      workedSheetsQuote,
      missingPoints,
      required100PercentSheets,
    };
  }

  return result;
}
