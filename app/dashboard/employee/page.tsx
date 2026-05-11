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

export default async function EmployeeDashboard() {
  const cookieStore = await cookies()
  const session = getSession(cookieStore)

  if (!session || session.role !== 'EMPLOYEE') {
    redirect('/login')
  }

  const cards = await prisma.performanceCard.findMany({
    where: { employeeId: session.userId },
    include: {
      manager: { select: { nameEn: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">My Performance Cards</h1>

      {cards.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <p className="text-gray-500">No cards yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {cards.map((card) => (
            <Link
              key={card.id}
              href={`/performance/${card.id}`}
              className="block bg-white rounded-lg border border-gray-200 p-4 hover:border-blue-300 hover:shadow-sm transition-all"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-800">{card.periodLabel}</p>
                  <p className="text-sm text-gray-500 mt-0.5">Manager: {card.manager.nameEn}</p>
                </div>
                <div className="flex items-center gap-3">
                  {card.finalScore !== null && (
                    <span className="text-sm font-semibold text-gray-700">
                      Score: {card.finalScore.toFixed(1)}
                    </span>
                  )}
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColors[card.status as CardStatus]}`}
                  >
                    {statusLabels[card.status as CardStatus]}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
