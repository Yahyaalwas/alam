'use client'

import * as React from 'react'
import {
  Users, UserPlus, Building2, ShieldCheck, Search,
  Copy, Check, Eye, EyeOff, X, Loader2, ChevronDown,
} from 'lucide-react'
import { TopBar } from '@/components/navigation/top-bar'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { EmptyState } from '@/components/ui/empty-state'
import type { Role } from '@/types'

interface UserRow {
  id: string
  nameEn: string
  nameAr: string
  email: string
  role: Role
  createdAt: string
  department: { id: string; nameEn: string; code: string } | null
  manager: { id: string; nameEn: string } | null
}

interface Department {
  id: string
  nameEn: string
  code: string
  manager: { id: string; nameEn: string } | null
}

const ROLE_BADGE: Record<Role, { label: string; variant: 'default' | 'success' | 'warning' | 'secondary' | 'info' | 'danger' }> = {
  SUPER_ADMIN: { label: 'Super Admin', variant: 'danger' },
  ADMIN: { label: 'Admin', variant: 'warning' },
  DEPARTMENT_MANAGER: { label: 'Manager', variant: 'default' },
  EMPLOYEE: { label: 'Employee', variant: 'secondary' },
}

function generatePassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$'
  let pw = ''
  for (let i = 0; i < 12; i++) pw += chars[Math.floor(Math.random() * chars.length)]
  return pw
}

const CREATABLE_ROLES: { value: Role; label: string }[] = [
  { value: 'ADMIN', label: 'Admin' },
  { value: 'DEPARTMENT_MANAGER', label: 'Department Manager' },
  { value: 'EMPLOYEE', label: 'Employee' },
]

function CreateUserModal({
  onClose,
  onCreated,
  callerRole,
}: {
  onClose: () => void
  onCreated: () => void
  callerRole: Role
}) {
  const [nameEn, setNameEn] = React.useState('')
  const [nameAr, setNameAr] = React.useState('')
  const [email, setEmail] = React.useState('')
  const [role, setRole] = React.useState<Role>('EMPLOYEE')
  const [departmentId, setDepartmentId] = React.useState('')
  const [managerId, setManagerId] = React.useState('')
  const [password, setPassword] = React.useState(() => generatePassword())
  const [showPw, setShowPw] = React.useState(false)
  const [copied, setCopied] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState('')
  const [departments, setDepartments] = React.useState<Department[]>([])
  const [managers, setManagers] = React.useState<UserRow[]>([])
  const [success, setSuccess] = React.useState<{ nameEn: string; email: string; password: string } | null>(null)

  React.useEffect(() => {
    Promise.all([
      fetch('/api/departments').then(r => r.ok ? r.json() : []),
      fetch('/api/users').then(r => r.ok ? r.json() : []),
    ]).then(([depts, users]) => {
      setDepartments(depts)
      setManagers((users as UserRow[]).filter(u => u.role === 'DEPARTMENT_MANAGER' || u.role === 'ADMIN' || u.role === 'SUPER_ADMIN'))
    })
  }, [])

  // Roles available based on caller
  const availableRoles = CREATABLE_ROLES.filter(r => {
    if (callerRole === 'SUPER_ADMIN') return true
    if (callerRole === 'ADMIN') return r.value !== 'ADMIN'
    return r.value === 'EMPLOYEE'
  })

  function copyPassword() {
    navigator.clipboard.writeText(password)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nameEn: nameEn.trim(),
          nameAr: nameAr.trim(),
          email: email.trim().toLowerCase(),
          role,
          departmentId: departmentId || undefined,
          managerId: managerId || undefined,
          password,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Failed to create user'); setLoading(false); return }
      setSuccess({ nameEn, email, password })
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
        <div className="w-full max-w-md rounded-xl bg-white shadow-2xl">
          <div className="px-6 py-5 border-b border-slate-100">
            <h2 className="text-base font-semibold text-slate-900">User Created</h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="rounded-lg bg-green-50 border border-green-200 p-4">
              <p className="text-sm font-medium text-green-800">{success.nameEn} has been added to the system.</p>
            </div>
            <p className="text-sm text-slate-500">Share these credentials. The password will not be shown again.</p>
            <div className="space-y-1.5">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Email</p>
              <p className="rounded-md bg-slate-50 border border-slate-200 px-3 py-2 text-sm font-mono">{success.email}</p>
            </div>
            <div className="space-y-1.5">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Temporary Password</p>
              <div className="flex items-center gap-2">
                <p className="flex-1 rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-sm font-mono">
                  {showPw ? success.password : '••••••••••••'}
                </p>
                <button type="button" onClick={() => setShowPw(s => !s)} className="p-2 text-slate-400 hover:text-slate-600">
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => { navigator.clipboard.writeText(success.password); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
                  className="p-2 text-slate-400 hover:text-slate-600"
                >
                  {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>
          <div className="px-6 py-4 border-t border-slate-100">
            <Button className="w-full" onClick={() => { onCreated(); onClose() }}>Done</Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl max-h-[92vh] flex flex-col">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between shrink-0">
          <h2 className="text-base font-semibold text-slate-900">Create User</h2>
          <button onClick={onClose} className="rounded p-1 text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
            {error && (
              <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <Input label="Full Name (English)" placeholder="Sarah Al-Rashidi" value={nameEn} onChange={e => setNameEn(e.target.value)} required />
              <Input label="Full Name (Arabic)" placeholder="سارة الراشدي" value={nameAr} onChange={e => setNameAr(e.target.value)} required dir="rtl" />
            </div>

            <Input label="Work Email" type="email" placeholder="user@company.com" value={email} onChange={e => setEmail(e.target.value)} required />

            {/* Role selector */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Role</label>
              <div className="relative">
                <select
                  value={role}
                  onChange={e => setRole(e.target.value as Role)}
                  className="w-full appearance-none rounded-md border border-slate-200 bg-white px-3 py-2 pr-8 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {availableRoles.map(r => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              </div>
            </div>

            {/* Department */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Department <span className="text-slate-400 font-normal">(optional)</span></label>
              <div className="relative">
                <select
                  value={departmentId}
                  onChange={e => { setDepartmentId(e.target.value); setManagerId('') }}
                  className="w-full appearance-none rounded-md border border-slate-200 bg-white px-3 py-2 pr-8 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">— No department —</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.nameEn} ({d.code})</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              </div>
            </div>

            {/* Manager */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Manager <span className="text-slate-400 font-normal">(optional)</span></label>
              <div className="relative">
                <select
                  value={managerId}
                  onChange={e => setManagerId(e.target.value)}
                  className="w-full appearance-none rounded-md border border-slate-200 bg-white px-3 py-2 pr-8 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">— No manager —</option>
                  {managers
                    .filter(m => !departmentId || m.department?.id === departmentId || !m.department)
                    .map(m => (
                      <option key={m.id} value={m.id}>{m.nameEn}</option>
                    ))
                  }
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Temporary Password</label>
              <div className="flex items-center gap-2">
                <div className="flex flex-1 items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                  <span className="flex-1 text-sm font-mono text-slate-800">{showPw ? password : '••••••••••••'}</span>
                  <button type="button" onClick={() => setShowPw(s => !s)} className="text-slate-400 hover:text-slate-600">
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <button type="button" onClick={copyPassword} className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50">
                  {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
                <button type="button" onClick={() => setPassword(generatePassword())} className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50">Regen</button>
              </div>
              <p className="text-xs text-slate-400">Auto-generated — share with the user, they should change it on first login.</p>
            </div>
          </div>

          <div className="shrink-0 flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" loading={loading} icon={<UserPlus className="h-4 w-4" />}>Create User</Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function UsersPage() {
  const [users, setUsers] = React.useState<UserRow[]>([])
  const [me, setMe] = React.useState<{ role: Role } | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState('')
  const [roleFilter, setRoleFilter] = React.useState<Role | 'ALL'>('ALL')
  const [showModal, setShowModal] = React.useState(false)

  async function load() {
    setLoading(true)
    try {
      const [usersRes, meRes] = await Promise.all([
        fetch('/api/users'),
        fetch('/api/auth/me'),
      ])
      if (usersRes.ok) setUsers(await usersRes.json())
      if (meRes.ok) setMe(await meRes.json())
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => { load() }, [])

  const filtered = users.filter(u => {
    const matchRole = roleFilter === 'ALL' || u.role === roleFilter
    const q = search.toLowerCase()
    const matchSearch = !q || u.nameEn.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    return matchRole && matchSearch
  })

  const canCreate = me?.role === 'SUPER_ADMIN' || me?.role === 'ADMIN'

  return (
    <div className="flex flex-col min-h-full">
      <TopBar
        title="Users"
        subtitle={`${users.length} user${users.length !== 1 ? 's' : ''}`}
        breadcrumbs={[{ label: 'Organisation' }, { label: 'Users' }]}
      />

      <div className="flex-1 p-6 space-y-5">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search users…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="rounded-md border border-slate-200 bg-white pl-9 pr-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 w-56"
            />
          </div>
          <div className="flex items-center gap-1.5">
            {(['ALL', 'SUPER_ADMIN', 'ADMIN', 'DEPARTMENT_MANAGER', 'EMPLOYEE'] as const).map(r => (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  roleFilter === r ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {r === 'ALL' ? 'All' : r === 'SUPER_ADMIN' ? 'Super Admin' : r === 'DEPARTMENT_MANAGER' ? 'Manager' : r === 'ADMIN' ? 'Admin' : 'Employee'}
              </button>
            ))}
          </div>
          {canCreate && (
            <div className="ml-auto">
              <Button icon={<UserPlus className="h-4 w-4" />} onClick={() => setShowModal(true)}>
                Create User
              </Button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="py-16">
              <EmptyState
                icon={<Users className="h-8 w-8" />}
                title="No users found"
                description={search || roleFilter !== 'ALL' ? 'Try adjusting your filters.' : 'Users will appear here once they are created.'}
                action={canCreate && !search && roleFilter === 'ALL' ? (
                  <Button icon={<UserPlus className="h-4 w-4" />} onClick={() => setShowModal(true)}>Create First User</Button>
                ) : undefined}
              />
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>
                {filtered.length < users.length
                  ? `${filtered.length} of ${users.length} users`
                  : `All Users (${users.length})`}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/80">
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">User</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Department</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Manager</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Joined</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filtered.map(user => {
                      const roleInfo = ROLE_BADGE[user.role] ?? { label: user.role, variant: 'secondary' as const }
                      return (
                        <tr key={user.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="px-6 py-3.5">
                            <div className="flex items-center gap-3">
                              <Avatar name={user.nameEn} size="sm" />
                              <div className="min-w-0">
                                <p className="font-medium text-slate-900 truncate">{user.nameEn}</p>
                                <p className="text-xs text-slate-400 truncate">{user.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-3.5">
                            <Badge variant={roleInfo.variant}>{roleInfo.label}</Badge>
                          </td>
                          <td className="px-6 py-3.5">
                            {user.department ? (
                              <div className="flex items-center gap-1.5">
                                <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                <span className="text-slate-700">{user.department.nameEn}</span>
                                <span className="text-xs text-slate-400">({user.department.code})</span>
                              </div>
                            ) : <span className="text-slate-400">—</span>}
                          </td>
                          <td className="px-6 py-3.5">
                            {user.manager ? (
                              <div className="flex items-center gap-1.5">
                                <ShieldCheck className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                <span className="text-slate-700">{user.manager.nameEn}</span>
                              </div>
                            ) : <span className="text-slate-400">—</span>}
                          </td>
                          <td className="px-6 py-3.5 text-right text-xs text-slate-400">
                            {new Date(user.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {showModal && me && (
        <CreateUserModal
          onClose={() => setShowModal(false)}
          onCreated={load}
          callerRole={me.role}
        />
      )}
    </div>
  )
}
