import { cookies } from 'next/headers'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  const cookieStore = await cookies()
  const session = getSession(cookieStore)

  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (session.role !== 'HR') {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const users = await prisma.user.findMany({
    where: { role: { in: ['EMPLOYEE', 'MANAGER'] } },
    select: { id: true, nameEn: true, nameAr: true, email: true, role: true },
    orderBy: [{ role: 'asc' }, { nameEn: 'asc' }],
  })

  return Response.json(users)
}
