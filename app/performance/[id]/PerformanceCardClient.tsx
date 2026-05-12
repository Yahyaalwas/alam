'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { CardWithRelations, UserRole, CardStatus, Goal, Competency } from '@/types'

const statusColors: Record<CardStatus, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  SELF_SUBMITTED: 'bg-yellow-100 text-yellow-700',
  MANAGER_SUBMITTED: 'bg-blue-100 text-blue-700',
  FINALIZED: 'bg-green-100 text-green-700',
}

const statusLabels: Record<CardStatus, string> = {
  DRAFT: 'Draft',
  SELF_SUBMITTED: 'Self Submitted',
  MANAGER_SUBMITTED: 'Manager Submitted',
  FINALIZED: 'Finalized',
}

interface GoalState {
  id: string
  selfRating: number | null
  selfComment: string | null
  managerRating: number | null
  managerComment: string | null
  finalRating: number | null
}

interface CompState {
  id: string
  selfRating: number | null
  selfComment: string | null
  managerRating: number | null
  managerComment: string | null
  finalRating: number | null
}

function initGoalState(goals: Goal[]): GoalState[] {
  return goals.map((g) => ({
    id: g.id,
    selfRating: g.selfRating,
    selfComment: g.selfComment,
    managerRating: g.managerRating,
    managerComment: g.managerComment,
    finalRating: g.finalRating,
  }))
}

function initCompState(comps: Competency[]): CompState[] {
  return comps.map((c) => ({
    id: c.id,
    selfRating: c.selfRating,
    selfComment: c.selfComment,
    managerRating: c.managerRating,
    managerComment: c.managerComment,
    finalRating: c.finalRating,
  }))
}

interface Props {
  card: CardWithRelations
  role: UserRole
  currentUserId: string
}

export default function PerformanceCardClient({ card, role, currentUserId }: Props) {
  const router = useRouter()
  const [goals, setGoals] = useState<GoalState[]>(initGoalState(card.goals))
  const [comps, setComps] = useState<CompState[]>(initCompState(card.competencies))
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const isEmployee = card.employeeId === currentUserId
  const isManager = card.managerId === currentUserId
  const status = card.status as CardStatus

  const canSelfReview = isEmployee && status === 'DRAFT'
  const canManagerReview = isManager && status === 'SELF_SUBMITTED'
  const canFinalize = isManager && status === 'MANAGER_SUBMITTED'
  const isFinalized = status === 'FINALIZED'

  function updateGoal<K extends keyof GoalState>(index: number, key: K, value: GoalState[K]) {
    setGoals((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], [key]: value }
      return next
    })
  }

  function updateComp<K extends keyof CompState>(index: number, key: K, value: CompState[K]) {
    setComps((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], [key]: value }
      return next
    })
  }

  async function handleSaveDraft() {
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch(`/api/performance-cards/${card.id}/save-draft`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goals: goals.map((g) => ({ id: g.id, selfRating: g.selfRating, selfComment: g.selfComment })),
          competencies: comps.map((c) => ({ id: c.id, selfRating: c.selfRating, selfComment: c.selfComment })),
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Failed to save draft')
      } else {
        setSuccess('Draft saved successfully')
        setTimeout(() => setSuccess(''), 3000)
      }
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleSelfReview() {
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch(`/api/performance-cards/${card.id}/self-review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goals: goals.map((g) => ({ id: g.id, selfRating: g.selfRating, selfComment: g.selfComment })),
          competencies: comps.map((c) => ({ id: c.id, selfRating: c.selfRating, selfComment: c.selfComment })),
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Failed to submit self review')
      } else {
        router.refresh()
      }
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleManagerReview() {
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch(`/api/performance-cards/${card.id}/manager-review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goals: goals.map((g) => ({ id: g.id, managerRating: g.managerRating, managerComment: g.managerComment })),
          competencies: comps.map((c) => ({ id: c.id, managerRating: c.managerRating, managerComment: c.managerComment })),
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Failed to submit manager review')
      } else {
        router.refresh()
      }
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleFinalize() {
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch(`/api/performance-cards/${card.id}/finalize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goals: goals.map((g) => ({ id: g.id, finalRating: g.finalRating })),
          competencies: comps.map((c) => ({ id: c.id, finalRating: c.finalRating })),
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Failed to finalize card')
      } else {
        router.refresh()
      }
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setSubmitting(false)
    }
  }

  function RatingSelect({
    value,
    onChange,
    disabled,
  }: {
    value: number | null
    onChange: (v: number | null) => void
    disabled: boolean
  }) {
    return (
      <select
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
        disabled={disabled}
        className="border border-gray-300 rounded px-2 py-1 text-sm disabled:bg-gray-50 disabled:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">—</option>
        {[1, 2, 3, 4, 5].map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </select>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Performance Card</h1>
            <p className="text-gray-500 mt-1">{card.periodLabel}</p>
          </div>
          <span className={`text-sm px-3 py-1 rounded-full font-medium ${statusColors[status]}`}>
            {statusLabels[status]}
          </span>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Employee:</span>{' '}
            <span className="font-medium text-gray-800">{card.employee.nameEn}</span>
          </div>
          <div>
            <span className="text-gray-500">Manager:</span>{' '}
            <span className="font-medium text-gray-800">{card.manager.nameEn}</span>
          </div>
          {isFinalized && card.finalScore !== null && (
            <div className="col-span-2">
              <span className="text-gray-500">Final Score:</span>{' '}
              <span className="font-bold text-green-700 text-lg">
                {(card.finalScore as number).toFixed(1)} / 100
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">Goals</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Goal</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700 w-16">Weight</th>
                {(canSelfReview || status !== 'DRAFT') && (
                  <>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700 w-24">Self Rating</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">Self Comment</th>
                  </>
                )}
                {(canManagerReview || canFinalize || isFinalized || status === 'MANAGER_SUBMITTED') && (
                  <>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700 w-28">Mgr Rating</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">Mgr Comment</th>
                  </>
                )}
                {(canFinalize || isFinalized) && (
                  <th className="text-left px-4 py-3 font-semibold text-gray-700 w-28">Final Rating</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {card.goals.map((goal, i) => (
                <tr key={goal.id}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-800">{goal.titleEn}</p>
                    <p className="text-xs text-gray-500">{goal.titleAr}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{goal.weight}%</td>
                  {(canSelfReview || status !== 'DRAFT') && (
                    <>
                      <td className="px-4 py-3">
                        <RatingSelect
                          value={goals[i].selfRating}
                          onChange={(v) => updateGoal(i, 'selfRating', v)}
                          disabled={!canSelfReview}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <textarea
                          value={goals[i].selfComment ?? ''}
                          onChange={(e) => updateGoal(i, 'selfComment', e.target.value || null)}
                          disabled={!canSelfReview}
                          rows={2}
                          className="w-full border border-gray-300 rounded px-2 py-1 text-sm disabled:bg-gray-50 disabled:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Comment..."
                        />
                      </td>
                    </>
                  )}
                  {(canManagerReview || canFinalize || isFinalized || status === 'MANAGER_SUBMITTED') && (
                    <>
                      <td className="px-4 py-3">
                        <RatingSelect
                          value={goals[i].managerRating}
                          onChange={(v) => updateGoal(i, 'managerRating', v)}
                          disabled={!canManagerReview}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <textarea
                          value={goals[i].managerComment ?? ''}
                          onChange={(e) => updateGoal(i, 'managerComment', e.target.value || null)}
                          disabled={!canManagerReview}
                          rows={2}
                          className="w-full border border-gray-300 rounded px-2 py-1 text-sm disabled:bg-gray-50 disabled:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Comment..."
                        />
                      </td>
                    </>
                  )}
                  {(canFinalize || isFinalized) && (
                    <td className="px-4 py-3">
                      <RatingSelect
                        value={goals[i].finalRating}
                        onChange={(v) => updateGoal(i, 'finalRating', v)}
                        disabled={!canFinalize}
                      />
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">Competencies</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Competency</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700 w-16">Weight</th>
                {(canSelfReview || status !== 'DRAFT') && (
                  <>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700 w-24">Self Rating</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">Self Comment</th>
                  </>
                )}
                {(canManagerReview || canFinalize || isFinalized || status === 'MANAGER_SUBMITTED') && (
                  <>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700 w-28">Mgr Rating</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">Mgr Comment</th>
                  </>
                )}
                {(canFinalize || isFinalized) && (
                  <th className="text-left px-4 py-3 font-semibold text-gray-700 w-28">Final Rating</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {card.competencies.map((comp, i) => (
                <tr key={comp.id}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-800">{comp.titleEn}</p>
                    <p className="text-xs text-gray-500">{comp.titleAr}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{comp.weight}%</td>
                  {(canSelfReview || status !== 'DRAFT') && (
                    <>
                      <td className="px-4 py-3">
                        <RatingSelect
                          value={comps[i].selfRating}
                          onChange={(v) => updateComp(i, 'selfRating', v)}
                          disabled={!canSelfReview}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <textarea
                          value={comps[i].selfComment ?? ''}
                          onChange={(e) => updateComp(i, 'selfComment', e.target.value || null)}
                          disabled={!canSelfReview}
                          rows={2}
                          className="w-full border border-gray-300 rounded px-2 py-1 text-sm disabled:bg-gray-50 disabled:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Comment..."
                        />
                      </td>
                    </>
                  )}
                  {(canManagerReview || canFinalize || isFinalized || status === 'MANAGER_SUBMITTED') && (
                    <>
                      <td className="px-4 py-3">
                        <RatingSelect
                          value={comps[i].managerRating}
                          onChange={(v) => updateComp(i, 'managerRating', v)}
                          disabled={!canManagerReview}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <textarea
                          value={comps[i].managerComment ?? ''}
                          onChange={(e) => updateComp(i, 'managerComment', e.target.value || null)}
                          disabled={!canManagerReview}
                          rows={2}
                          className="w-full border border-gray-300 rounded px-2 py-1 text-sm disabled:bg-gray-50 disabled:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Comment..."
                        />
                      </td>
                    </>
                  )}
                  {(canFinalize || isFinalized) && (
                    <td className="px-4 py-3">
                      <RatingSelect
                        value={comps[i].finalRating}
                        onChange={(v) => updateComp(i, 'finalRating', v)}
                        disabled={!canFinalize}
                      />
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {(canSelfReview || canManagerReview || canFinalize) && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2 mb-4">
              {error}
            </p>
          )}
          {success && (
            <p className="text-sm text-green-600 bg-green-50 border border-green-200 rounded px-3 py-2 mb-4">
              {success}
            </p>
          )}
          <div className="flex gap-3">
            {canSelfReview && (
              <>
                <button
                  onClick={handleSaveDraft}
                  disabled={submitting}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50 transition-colors"
                >
                  Save Draft
                </button>
                <button
                  onClick={handleSelfReview}
                  disabled={submitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {submitting ? 'Submitting...' : 'Submit Self Review'}
                </button>
              </>
            )}
            {canManagerReview && (
              <button
                onClick={handleManagerReview}
                disabled={submitting}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {submitting ? 'Submitting...' : 'Submit Manager Review'}
              </button>
            )}
            {canFinalize && (
              <button
                onClick={handleFinalize}
                disabled={submitting}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {submitting ? 'Finalizing...' : 'Finalize Card'}
              </button>
            )}
          </div>
        </div>
      )}

      {isFinalized && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center text-green-800">
          This performance card has been finalized.
          {card.finalScore !== null && (
            <span className="ml-2 font-bold">Final Score: {(card.finalScore as number).toFixed(1)} / 100</span>
          )}
        </div>
      )}
    </div>
  )
}
