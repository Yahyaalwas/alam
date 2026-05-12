'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import {
  Building2, Plus, Users, ClipboardList, TrendingUp,
  Copy, Check, Eye, EyeOff, X, Loader2,
} from 'lucide-react'
import { TopBar } from '@/components/navigation/top-bar'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { EmptyState } from '@/components/ui/empty-state'

interface DeptRow {
  id: string
  nameEn: string
  nameAr: string
  code: string
  managerId: string | null
  manager: { id: string; nameEn: string; email: string } | null
  employeeCount: number
  totalCards: number
  averageScore: number
  createdAt: string
}

function generatePassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$'
  let pw = ''
  for (let i = 0; i < 12; i++) {
    pw += chars[Math.floor(Math.random() * chars.length)]
  }
  return pw
}

function CreateDepartmentModal({ onClose, onCreated }: {
  onClose: () => void
  onCreated: () => void
}) {
  const [nameEn, setNameEn] = React.useState('')
  const [nameAr, setNameAr] = React.useState('')
  const [code, setCode] = React.useState('')
  const [addManager, setAddManager] = React.useState(false)
  const [mgrNameEn, setMgrNameEn] = React.useState('')
  const [mgrNameAr, setMgrNameAr] = React.useState('')
  const [mgrEmail, setMgrEmail] = React.useState('')
  const [password, setPassword] = React.useState(() => generatePassword())
  const [showPw, setShowPw] = React.useState(false)
  const [copied, setCopied] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState('')
  const [successInfo, setSuccessInfo] = React.useState<{ deptName: string; email: string; password: string } | null>(null)

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
      let managerId: string | undefined
      if (addManager) {
        if (!mgrNameEn || !mgrNameAr || !mgrEmail) {
          setError('Manager name (EN/AR) and email are required.')
          setLoading(false)
          return
        }
        const userRes = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: mgrEmail.trim(), nameEn: mgrNameEn.trim(), nameAr: mgrNameAr.trim(), role: 'DEPARTMENT_MANAGER', password }),
        })
        const userData = await userRes.json()
        if (!userRes.ok) { setError(userData.error ?? 'Failed to create manager account.'); setLoading(false); return }
        managerId = userData.id
      }
      const deptRes = await fetch('/api/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nameEn: nameEn.trim(), nameAr: nameAr.trim(), code: code.trim().toUpperCase(), managerId }),
      })
      const deptData = await deptRes.json()
      if (!deptRes.ok) { setError(deptData.error ?? 'Failed to create department.'); setLoading(false); return }
      if (addManager) {
        setSuccessInfo({ deptName: nameEn, email: mgrEmail, password })
      } else {
        onCreated()
        onClose()
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (successInfo) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
        <div className="w-full max-w-md rounded-xl bg-white shadow-2xl">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">Department Created</h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="rounded-lg bg-green-50 border border-green-200 p-4">
              <p className="text-sm font-medium text-green-800">"{successInfo.deptName}" created with a manager account.</p>
            </div>
            <p className="text-sm text-slate-600">Share these credentials with the manager. The password will not be shown again.</p>
            <div className="space-y-2">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Manager Email</p>
              <p className="text-sm font-mono bg-slate-50 border border-slate-200 rounded px-3 py-2">{successInfo.email}</p>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Temporary Password</p>
              <div className="flex items-center gap-2">
                <p className="flex-1 text-sm font-mono bg-amber-50 border border-amber-200 rounded px-3 py-2">
                  {showPw ? successInfo.password : '••••••••••••'}
                </p>
                <button onClick={() => setShowPw(s => !s)} className="p-2 text-slate-400 hover:text-slate-600" type="button">
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
                <button onClick={() => { navigator.clipboard.writeText(successInfo.password); setCopied(true); setTimeout(() => setCopied(false), 2000) }} className="p-2 text-slate-400 hover:text-slate-600" type="button">
                  {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <p className="text-xs text-slate-400">The manager should change their password after first login.</p>
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
      <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl max-h-[90vh] flex flex-col">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between shrink-0">
          <h2 className="text-base font-semibold text-slate-900">Create Department</h2>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
            {error && (
              <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <Input label="Name (English)" placeholder="Human Resources" value={nameEn} onChange={e => setNameEn(e.target.value)} required />
              <Input label="Name (Arabic)" placeholder="الموارد البشرية" value={nameAr} onChange={e => setNameAr(e.target.value)} required dir="rtl" />
            </div>
            <Input label="Department Code" placeholder="HR" value={code} onChange={e => setCode(e.target.value.toUpperCase())} required hint="Short uppercase identifier (e.g. HR, IT, FIN)" />
            <div className="border-t border-slate-100 pt-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={addManager} onChange={e => setAddManager(e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                <span className="text-sm font-medium text-slate-700">Create Department Manager account</span>
              </label>
            </div>
            {addManager && (
              <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Manager Name (EN)" placeholder="Sarah Al-Rashidi" value={mgrNameEn} onChange={e => setMgrNameEn(e.target.value)} required={addManager} />
                  <Input label="Manager Name (AR)" placeholder="سارة الراشدي" value={mgrNameAr} onChange={e => setMgrNameAr(e.target.value)} required={addManager} dir="rtl" />
                </div>
                <Input label="Work Email" type="email" placeholder="manager@company.com" value={mgrEmail} onChange={e => setMgrEmail(e.target.value)} required={addManager} />
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Temporary Password</label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2">
                      <span className="flex-1 text-sm font-mono text-slate-800">{showPw ? password : '••••••••••••'}</span>
                      <button type="button" onClick={() => setShowPw(s => !s)} className="text-slate-400 hover:text-slate-600">
                        {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <button type="button" onClick={copyPassword} className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50">
                      {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                      {copied ? 'Copied' : 'Copy'}
                    </button>
                    <button type="button" onClick={() => setPassword(generatePassword())} className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50">Regenerate</button>
                  </div>
                  <p className="text-xs text-slate-400">Auto-generated. Share with the manager — they should change it after first login.</p>
                </div>
              </div>
            )}
          </div>
          <div className="shrink-0 flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" loading={loading} icon={<Plus className="h-4 w-4" />}>Create Department</Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function DepartmentsPage() {
  const router = useRouter()
  const [depts, setDepts] = React.useState<DeptRow[]>([])
  const [loading, setLoading] = React.useState(true)
  const [showModal, setShowModal] = React.useState(false)

  async function load() {
    setLoading(true)
    try {
      const res = await fetch('/api/departments')
      if (res.ok) setDepts(await res.json())
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => { load() }, [])

  return (
    <div className="flex flex-col min-h-full">
      <TopBar
        title="Departments"
        subtitle={loading ? '' : `${depts.length} department${depts.length !== 1 ? 's' : ''}`}
        breadcrumbs={[{ label: 'Organisation' }, { label: 'Departments' }]}
      />
      <div className="flex-1 p-6">
        <div className="mb-5 flex items-center justify-between">
          <p className="text-sm text-slate-500">Manage organisational departments and their managers.</p>
          <Button icon={<Plus className="h-4 w-4" />} onClick={() => setShowModal(true)}>New Department</Button>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-24"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>
        ) : depts.length === 0 ? (
          <EmptyState
            icon={<Building2 className="h-8 w-8" />}
            title="No departments yet"
            description="Create your first department to start organising your team."
            action={<Button icon={<Plus className="h-4 w-4" />} onClick={() => setShowModal(true)}>Create Department</Button>}
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {depts.map(dept => (
              <Card key={dept.id} className="hover:shadow-md transition-shadow">
                <div className="p-5 space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                        <Building2 className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{dept.nameEn}</p>
                        <p className="text-xs text-slate-400">{dept.nameAr}</p>
                      </div>
                    </div>
                    <Badge variant="secondary">{dept.code}</Badge>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500 mb-1.5">Manager</p>
                    {dept.manager ? (
                      <div className="flex items-center gap-2">
                        <Avatar name={dept.manager.nameEn} size="sm" />
                        <div>
                          <p className="text-sm font-medium text-slate-800">{dept.manager.nameEn}</p>
                          <p className="text-xs text-slate-400">{dept.manager.email}</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-slate-400 italic">No manager assigned</p>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-2 border-t border-slate-100 pt-4">
                    {[
                      { icon: <Users className="h-3.5 w-3.5" />, value: dept.employeeCount, label: 'Employees' },
                      { icon: <ClipboardList className="h-3.5 w-3.5" />, value: dept.totalCards, label: 'Cards' },
                      { icon: <TrendingUp className="h-3.5 w-3.5" />, value: dept.averageScore > 0 ? dept.averageScore.toFixed(1) : '—', label: 'Avg Score' },
                    ].map(s => (
                      <div key={s.label} className="text-center">
                        <div className="flex justify-center text-slate-400 mb-1">{s.icon}</div>
                        <p className="text-base font-bold text-slate-800">{s.value}</p>
                        <p className="text-[10px] text-slate-400">{s.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
      {showModal && <CreateDepartmentModal onClose={() => setShowModal(false)} onCreated={load} />}
    </div>
  )
}
