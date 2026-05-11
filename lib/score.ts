export interface GoalLike {
  weight: number
  finalRating: number | null
}

export interface CompLike {
  weight: number
  finalRating: number | null
}

export function calcFinalScore(goals: GoalLike[], competencies: CompLike[]): number {
  const ratedGoals = goals.filter((g) => g.finalRating !== null)
  const ratedComps = competencies.filter((c) => c.finalRating !== null)

  if (ratedGoals.length === 0 && ratedComps.length === 0) return 0

  const goalTotalWeight = ratedGoals.reduce((sum, g) => sum + g.weight, 0)
  const compTotalWeight = ratedComps.reduce((sum, c) => sum + c.weight, 0)

  const goalScore =
    goalTotalWeight > 0
      ? ratedGoals.reduce((sum, g) => sum + (g.finalRating! / 5) * (g.weight / goalTotalWeight), 0) * 60
      : 0

  const compScore =
    compTotalWeight > 0
      ? ratedComps.reduce((sum, c) => sum + (c.finalRating! / 5) * (c.weight / compTotalWeight), 0) * 40
      : 0

  return goalScore + compScore
}
