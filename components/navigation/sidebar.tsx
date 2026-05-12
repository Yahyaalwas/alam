'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  Building2,
  Users,
  ClipboardList,
  BarChart3,
  Target,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import type { Role } from '@/types'

export interface SidebarProps {
  role: Role
  userName: string
  userEmail: string
}

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
  exact?: boolean
}

interface NavSection {
  title?: string
  items: NavItem[]
}

function getNavSections(role: Role): NavSection[] {
  if (role === 'SUPER_ADMIN' || role === 'ADMIN') {
    return [
      { title: 'Overview', items: [{ label: 'Dashboard', href: '/dashboard/admin', icon: <LayoutDashboard className="h-4 w-4" />, exact: true }] },
      { title: 'Organisation', items: [
        { label: 'Departments', href: '/departments', icon: <Building2 className="h-4 w-4" /> },
        { label: 'Users', href: '/users', icon: <Users className="h-4 w-4" /> },
      ]},
      { title: 'Performance', items: [
        { label: 'Evaluations', href: '/performance-cards', icon: <ClipboardList className="h-4 w-4" /> },
        { label: 'Analytics', href: '/analytics', icon: <BarChart3 className="h-4 w-4" /> },
      ]},
    ]
  }
  if (role === 'DEPARTMENT_MANAGER') {
    return [
      { title: 'Overview', items: [{ label: 'Dashboard', href: '/dashboard/manager', icon: <LayoutDashboard className="h-4 w-4" />, exact: true }] },
      { title: 'Team', items: [{ label: 'My Team', href: '/users', icon: <Users className="h-4 w-4" /> }] },
      { title: 'Performance', items: [
        { label: 'Evaluations', href: '/performance-cards', icon: <ClipboardList className="h-4 w-4" /> },
        { label: 'Goals & KPIs', href: '/goals', icon: <Target className="h-4 w-4" /> },
        { label: 'Analytics', href: '/analytics', icon: <BarChart3 className="h-4 w-4" /> },
      ]},
    ]
  }
  return [
    { title: 'My Work', items: [
      { label: 'My Overview', href: '/dashboard/employee', icon: <LayoutDashboard className="h-4 w-4" />, exact: true },
      { label: 'My Evaluation', href: '/performance-cards', icon: <ClipboardList className="h-4 w-4" /> },
      { label: 'My Goals', href: '/goals', icon: <Target className="h-4 w-4" /> },
    ]},
  ]
}

function roleLabel(role: Role): string {
  switch (role) {
    case 'SUPER_ADMIN': return 'Super Admin'
    case 'ADMIN': return 'Admin'
    case 'DEPARTMENT_MANAGER': return 'Manager'
    case 'EMPLOYEE': return 'Employee'
  }
}

function NavLink({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
  const pathname = usePathname()
  const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href)
  return (
    <Link href={item.href} className={cn('group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all', isActive ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100', collapsed && 'justify-center px-2')} title={collapsed ? item.label : undefined}>
      <span className={cn('shrink-0', isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200')}>{item.icon}</span>
      {!collapsed && <span className="truncate">{item.label}</span>}
      {!collapsed && isActive && <ChevronRight className="ml-auto h-3.5 w-3.5 text-blue-200" aria-hidden="true" />}
    </Link>
  )
}

function LogoutButton() {
  const router = useRouter()
  const [loading, setLoading] = React.useState(false)
  const handleLogout = async () => {
    setLoading(true)
    try { await fetch('/api/auth/logout', { method: 'POST' }); router.push('/login') } finally { setLoading(false) }
  }
  return (
    <button onClick={handleLogout} disabled={loading} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-100 disabled:opacity-50">
      <LogOut className="h-4 w-4 shrink-0" />
      <span>{loading ? 'Signing out…' : 'Sign out'}</span>
    </button>
  )
}

export function Sidebar({ role, userName, userEmail }: SidebarProps) {
  const [mobileOpen, setMobileOpen] = React.useState(false)
  const sections = getNavSections(role)

  const sidebarContent = (
    <div className="flex h-full flex-col">
      <div className="flex h-14 shrink-0 items-center border-b border-slate-800 px-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-600 text-xs font-bold text-white shadow">A</div>
          <div className="leading-none">
            <div className="text-sm font-bold tracking-wide text-white">ALAMAH</div>
            <div className="text-[10px] font-medium uppercase tracking-widest text-slate-500">PMS</div>
          </div>
        </div>
        <button className="ml-auto rounded p-1 text-slate-500 hover:text-slate-300 lg:hidden" onClick={() => setMobileOpen(false)}><X className="h-4 w-4" /></button>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Main navigation">
        <div className="space-y-6">
          {sections.map((section, sIdx) => (
            <div key={sIdx}>
              {section.title && <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-600">{section.title}</p>}
              <div className="space-y-0.5">
                {section.items.map(item => <NavLink key={item.href} item={item} collapsed={false} />)}
              </div>
            </div>
          ))}
        </div>
      </nav>
      <div className="shrink-0 border-t border-slate-800 p-3">
        <div className="flex items-center gap-3 rounded-md px-2 py-2">
          <Avatar name={userName} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-200">{userName}</p>
            <p className="truncate text-xs text-slate-500">{userEmail}</p>
          </div>
          <Badge variant="secondary" className="shrink-0 text-[10px]">{roleLabel(role)}</Badge>
        </div>
        <div className="mt-1"><LogoutButton /></div>
      </div>
    </div>
  )

  return (
    <>
      <aside className="hidden lg:flex lg:w-[260px] lg:shrink-0 lg:flex-col h-screen" style={{ backgroundColor: '#0f172a' }} aria-label="Sidebar">
        {sidebarContent}
      </aside>
      <button className="fixed left-4 top-3.5 z-40 rounded-md p-2 text-slate-600 shadow-sm bg-white border border-slate-200 lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open navigation"><Menu className="h-5 w-5" /></button>
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/60" onClick={() => setMobileOpen(false)} aria-hidden="true" />
          <aside className="relative flex h-full w-[260px] flex-col shadow-xl" style={{ backgroundColor: '#0f172a' }}>{sidebarContent}</aside>
        </div>
      )}
    </>
  )
}
