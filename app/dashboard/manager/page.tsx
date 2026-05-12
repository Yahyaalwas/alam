import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import type { CardStatus } from '@/types'

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

export default async function ManagerDashboard() {
  const cookieStore = await cookies()
  const session = getSession(cookieStore)

  if (!session || session.role !== 'MANAGER') {
    redirect('/login')
  }

  const cards = await prisma.performanceCard.findMany({
    where: { managerId: session.userId },
    include: {
      employee: { select: { nameEn: true, email: true } },
    },
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
  })

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Team Performance Cards</h1>

      {cards.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <p className="text-gray-500">No cards yet</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Employee</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Period</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Status</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Score</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {cards.map((card) => (
                <tr key={card.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-800">{card.employee.nameEn}</p>
                    <p className="text-xs text-gray-500">{card.employee.email}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{card.periodLabel}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColors[card.status as CardStatus]}`}
                    >
                      {statusLabels[card.status as CardStatus]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {card.finalScore !== null ? card.finalScore.toFixed(1) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/performance/${card.id}`}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
