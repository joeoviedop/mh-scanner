export interface FragmentRankingInput {
  confidenceScore: number;
  feedbackCount: number;
  positiveFeedback: number;
  negativeFeedback: number;
}

export function calculateFragmentRank({
  confidenceScore,
  feedbackCount,
  positiveFeedback,
  negativeFeedback,
}: FragmentRankingInput): number {
  const safeConfidence = Number.isFinite(confidenceScore)
    ? confidenceScore
    : 0;

  const totalFeedback = Math.max(feedbackCount, 0);
  const positive = Math.max(positiveFeedback, 0);
  const negative = Math.max(negativeFeedback, 0);

  const positiveRatio = totalFeedback === 0 ? 0 : positive / totalFeedback;
  const negativeRatio = totalFeedback === 0 ? 0 : negative / totalFeedback;

  const engagementBonus = totalFeedback === 0 ? 0 : Math.log2(totalFeedback + 1) * 6;
  const confidenceComponent = safeConfidence * 0.6;
  const positiveComponent = positiveRatio * 40;
  const negativePenalty = negativeRatio * 28;

  const rankScore = confidenceComponent + positiveComponent + engagementBonus - negativePenalty;

  return Number(rankScore.toFixed(3));
}
