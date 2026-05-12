export interface GoalLike {
  weight: number
  selfRating?: number | null
  managerRating?: number | null
  finalRating?: number | null
}

export interface CompLike {
  weight: number
  selfRating?: number | null
  managerRating?: number | null
  finalRating?: number | null
}

/**
 * Internal scorer: extract a numeric rating from each item using the provided accessor.
 * Goals contribute 60% of total score, competencies 40%.
 * All ratings are on a 1–5 scale and normalized to 0–100.
 */
function calcScore(
  goals: GoalLike[],
  competencies: CompLike[],
  getRating: (item: GoalLike | CompLike) => number | null | undefined
): number {
  const ratedGoals = goals.filter((g) => (getRating(g) ?? null) !== null)
  const ratedComps = competencies.filter((c) => (getRating(c) ?? null) !== null)

  if (ratedGoals.length === 0 && ratedComps.length === 0) return 0

  const goalTotalWeight = ratedGoals.reduce((sum, g) => sum + g.weight, 0)
  const compTotalWeight = ratedComps.reduce((sum, c) => sum + c.weight, 0)

  const goalScore =
    goalTotalWeight > 0
      ? ratedGoals.reduce(
          (sum, g) => sum + ((getRating(g)! / 5) * g.weight) / goalTotalWeight,
          0
        ) * 60
      : 0

  const compScore =
    compTotalWeight > 0
      ? ratedComps.reduce(
          (sum, c) => sum + ((getRating(c)! / 5) * c.weight) / compTotalWeight,
          0
        ) * 40
      : 0

  return goalScore + compScore
}

/**
 * Calculate the self-assessment score (0–100) from self ratings.
 */
export function calcSelfScore(goals: GoalLike[], competencies: CompLike[]): number {
  return calcScore(goals, competencies, (item) => item.selfRating)
}

/**
 * Calculate the manager-assessment score (0–100) from manager ratings.
 */
export function calcManagerScore(goals: GoalLike[], competencies: CompLike[]): number {
  return calcScore(goals, competencies, (item) => item.managerRating)
}

/**
 * Calculate the final calibrated score (0–100) from final ratings.
 */
export function calcFinalScore(goals: GoalLike[], competencies: CompLike[]): number {
  return calcScore(goals, competencies, (item) => item.finalRating)
}
