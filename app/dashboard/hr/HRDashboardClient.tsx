'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { CardStatus } from '@/types'
import CreateCardModal from './CreateCardModal'

const statusColors: Record<CardStatus, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  SELF_SUBMITTED: 'bg-yellow-100 text-yellow-700',
  MANAGER_SUBMITTED: 'bg-blue-100 text-blue-700',
  FINALIZED: 'bg-green-100 text-green-700',
}

const statusLabels: Record<CardStatus, string> = {
  DRAFT: 'Stage 1 — Awaiting Self-Review',
  SELF_SUBMITTED: 'Stage 2 — Awaiting Manager Review',
  MANAGER_SUBMITTED: 'Stage 3 — Ready for Calibration',
  FINALIZED: 'Finalized',
}

interface CardRow {
  id: string
  periodLabel: string
  status: CardStatus
  finalScore: number | null
  employee: { nameEn: string; email: string }
  manager: { nameEn: string }
}

interface Props {
  initialCards: CardRow[]
}

export default function HRDashboardClient({ initialCards }: Props) {
  const router = useRouter()
  const [showModal, setShowModal] = useState(false)

  function handleCreated() {
    setShowModal(false)
    router.refresh()
  }

  const pending = initialCards.filter((c) => c.status !== 'FINALIZED')
  const finalized = initialCards.filter((c) => c.status === 'FINALIZED')

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">HR — All Performance Cards</h1>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
        >
          + New Card
        </button>
      </div>

      {/* Pipeline summary */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {(['DRAFT', 'SELF_SUBMITTED', 'MANAGER_SUBMITTED', 'FINALIZED'] as CardStatus[]).map((s) => {
          const count = initialCards.filter((c) => c.status === s).length
          return (
            <div key={s} className="bg-white rounded-lg border border-gray-200 p-4 text-center">
              <p className="text-2xl font-bold text-gray-800">{count}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[s]}`}>
                {s === 'DRAFT' ? 'Draft' : s === 'SELF_SUBMITTED' ? 'Self Submitted' : s === 'MANAGER_SUBMITTED' ? 'Mgr Submitted' : 'Finalized'}
              </span>
            </div>
          )
        })}
      </div>

      {/* Active cards */}
      {pending.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">In Progress</h2>
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Employee</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Manager</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Period</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Stage</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pending.map((card) => (
                  <tr key={card.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800">{card.employee.nameEn}</p>
                      <p className="text-xs text-gray-500">{card.employee.email}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{card.manager.nameEn}</td>
                    <td className="px-4 py-3 text-gray-700">{card.periodLabel}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColors[card.status]}`}>
                        {statusLabels[card.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/performance/${card.id}`}
                        className={`font-medium ${card.status === 'MANAGER_SUBMITTED' ? 'text-green-600 hover:text-green-800' : 'text-blue-600 hover:text-blue-800'}`}
                      >
                        {card.status === 'MANAGER_SUBMITTED' ? 'Calibrate' : 'View'}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Finalized cards */}
      {finalized.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Finalized</h2>
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Employee</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Manager</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Period</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Final Score</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {finalized.map((card) => (
                  <tr key={card.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800">{card.employee.nameEn}</p>
                      <p className="text-xs text-gray-500">{card.employee.email}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{card.manager.nameEn}</td>
                    <td className="px-4 py-3 text-gray-700">{card.periodLabel}</td>
                    <td className="px-4 py-3">
                      <span className="font-bold text-green-700">
                        {card.finalScore !== null ? `${card.finalScore.toFixed(1)} / 100` : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/performance/${card.id}`} className="text-blue-600 hover:text-blue-800 font-medium">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {initialCards.length === 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <p className="text-gray-500">No performance cards yet. Create the first one.</p>
        </div>
      )}

      {showModal && <CreateCardModal onClose={() => setShowModal(false)} onCreated={handleCreated} />}
    </div>
  )
}
