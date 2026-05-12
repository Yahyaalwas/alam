import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Sidebar } from '@/components/navigation/sidebar'
import type { Role } from '@/types'

export default async function PlatformLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const session = getSession(cookieStore)

  if (!session) {
    redirect('/login')
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { nameEn: true, email: true, role: true },
  })

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100">
      <Sidebar
        role={user.role as Role}
        userName={user.nameEn}
        userEmail={user.email}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <div id="main-content" className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  )
}
