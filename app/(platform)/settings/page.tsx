'use client'

import * as React from 'react'
import {
  Settings, Target, Plus, Trash2, Pencil, Loader2,
  Check, X, GripVertical, AlertTriangle,
} from 'lucide-react'
import { TopBar } from '@/components/navigation/top-bar'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'

interface CoreObjective {
  id: string
  titleEn: string
  titleAr: string
  weight: number
  order: number
  isActive: boolean
}

function ObjectiveRow({
  obj,
  onUpdate,
  onDelete,
  canDelete,
}: {
  obj: CoreObjective
  onUpdate: (id: string, data: Partial<CoreObjective>) => Promise<void>
  onDelete: (id: string) => Promise<void>
  canDelete: boolean
}) {
  const [editing, setEditing] = React.useState(false)
  const [titleEn, setTitleEn] = React.useState(obj.titleEn)
  const [titleAr, setTitleAr] = React.useState(obj.titleAr)
  const [weight, setWeight] = React.useState(String(obj.weight))
  const [saving, setSaving] = React.useState(false)
  const [deleting, setDeleting] = React.useState(false)
  const [confirmDelete, setConfirmDelete] = React.useState(false)

  async function handleSave() {
    setSaving(true)
    try {
      await onUpdate(obj.id, {
        titleEn: titleEn.trim(),
        titleAr: titleAr.trim(),
        weight: parseFloat(weight),
      })
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      await onDelete(obj.id)
    } finally {
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  function handleCancel() {
    setTitleEn(obj.titleEn)
    setTitleAr(obj.titleAr)
    setWeight(String(obj.weight))
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="rounded-lg border border-blue-200 bg-blue-50/40 p-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Input label="Title (English)" value={titleEn} onChange={e => setTitleEn(e.target.value)} />
          <Input label="Title (Arabic)" value={titleAr} onChange={e => setTitleAr(e.target.value)} dir="rtl" />
        </div>
        <div className="flex items-end gap-3">
          <div className="w-32">
            <Input
              label="Weight (%)"
              type="number"
              min="1"
              max="100"
              step="0.5"
              value={weight}
              onChange={e => setWeight(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 pb-0.5">
            <Button size="sm" loading={saving} icon={<Check className="h-3.5 w-3.5" />} onClick={handleSave}>Save</Button>
            <Button size="sm" variant="outline" icon={<X className="h-3.5 w-3.5" />} onClick={handleCancel}>Cancel</Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="group flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-4 hover:border-slate-300 hover:shadow-sm transition-all">
      <GripVertical className="h-4 w-4 text-slate-300 shrink-0 cursor-grab" />
      <div className="flex-1 min-w-0 grid grid-cols-2 gap-3 items-center">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900 truncate">{obj.titleEn}</p>
          <p className="text-xs text-slate-400 truncate" dir="rtl">{obj.titleAr}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="info" className="text-xs">{obj.weight}% weight</Badge>
        </div>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <button
          onClick={() => setEditing(true)}
          className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          title="Edit"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
        {canDelete && !confirmDelete && (
          <button
            onClick={() => setConfirmDelete(true)}
            className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
            title="Delete"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
        {confirmDelete && (
          <div className="flex items-center gap-1">
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="rounded-md px-2 py-1 text-xs font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
            >
              {deleting ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Delete'}
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="rounded-md px-2 py-1 text-xs font-medium text-slate-600 border border-slate-200 hover:bg-slate-50"
            >
              No
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function AddObjectiveForm({ onAdd, onCancel }: {
  onAdd: (data: { titleEn: string; titleAr: string; weight: number }) => Promise<void>
  onCancel: () => void
}) {
  const [titleEn, setTitleEn] = React.useState('')
  const [titleAr, setTitleAr] = React.useState('')
  const [weight, setWeight] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const w = parseFloat(weight)
    if (!titleEn.trim() || !titleAr.trim() || isNaN(w) || w <= 0 || w > 100) {
      setError('All fields are required and weight must be between 1–100.')
      return
    }
    setError('')
    setLoading(true)
    try {
      await onAdd({ titleEn: titleEn.trim(), titleAr: titleAr.trim(), weight: w })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-dashed border-blue-300 bg-blue-50/30 p-4 space-y-3">
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="grid grid-cols-2 gap-3">
        <Input label="Title (English)" placeholder="e.g. Leadership" value={titleEn} onChange={e => setTitleEn(e.target.value)} required />
        <Input label="Title (Arabic)" placeholder="القيادة" value={titleAr} onChange={e => setTitleAr(e.target.value)} required dir="rtl" />
      </div>
      <div className="flex items-end gap-3">
        <div className="w-32">
          <Input label="Weight (%)" type="number" min="1" max="100" step="0.5" placeholder="33.3" value={weight} onChange={e => setWeight(e.target.value)} required />
        </div>
        <div className="flex items-center gap-2 pb-0.5">
          <Button type="submit" size="sm" loading={loading} icon={<Plus className="h-3.5 w-3.5" />}>Add Objective</Button>
          <Button type="button" size="sm" variant="outline" onClick={onCancel}>Cancel</Button>
        </div>
      </div>
    </form>
  )
}

export default function SettingsPage() {
  const [objectives, setObjectives] = React.useState<CoreObjective[]>([])
  const [loading, setLoading] = React.useState(true)
  const [showAdd, setShowAdd] = React.useState(false)
  const [error, setError] = React.useState('')

  async function load() {
    setLoading(true)
    try {
      const res = await fetch('/api/core-objectives')
      if (res.ok) setObjectives(await res.json())
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => { load() }, [])

  async function handleAdd(data: { titleEn: string; titleAr: string; weight: number }) {
    setError('')
    const res = await fetch('/api/core-objectives', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const result = await res.json()
    if (!res.ok) { setError(result.error ?? 'Failed to add objective'); return }
    setShowAdd(false)
    await load()
  }

  async function handleUpdate(id: string, data: Partial<CoreObjective>) {
    const res = await fetch(`/api/core-objectives/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (res.ok) await load()
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/core-objectives/${id}`, { method: 'DELETE' })
    if (res.ok || res.status === 204) await load()
  }

  const totalWeight = objectives.reduce((s, o) => s + o.weight, 0)
  const weightOk = Math.abs(totalWeight - 100) < 0.01

  return (
    <div className="flex flex-col min-h-full">
      <TopBar
        title="Settings"
        subtitle="System configuration"
        breadcrumbs={[{ label: 'Admin' }, { label: 'Settings' }]}
      />

      <div className="flex-1 p-6 space-y-6 max-w-3xl">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-50">
                  <Target className="h-5 w-5 text-violet-600" />
                </div>
                <div>
                  <CardTitle>Core Objectives</CardTitle>
                  <p className="text-xs text-slate-400 mt-0.5">
                    These are automatically added to every new performance card as competencies.
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                icon={<Plus className="h-3.5 w-3.5" />}
                onClick={() => setShowAdd(true)}
                disabled={showAdd}
              >
                Add
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-3">
            {error && (
              <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
            )}

            {/* Weight summary */}
            {objectives.length > 0 && (
              <div className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium ${
                weightOk
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}>
                {weightOk ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <AlertTriangle className="h-3.5 w-3.5" />
                )}
                Total weight: <span className="font-bold">{totalWeight.toFixed(1)}%</span>
                {!weightOk && ' — weights should add up to 100%'}
              </div>
            )}

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
              </div>
            ) : objectives.length === 0 && !showAdd ? (
              <EmptyState
                icon={<Target className="h-7 w-7" />}
                title="No core objectives configured"
                description="Add up to 3 objectives that every employee will be evaluated on. They will be auto-added to each new performance card."
                action={<Button size="sm" icon={<Plus className="h-3.5 w-3.5" />} onClick={() => setShowAdd(true)}>Add First Objective</Button>}
              />
            ) : (
              <div className="space-y-2">
                {objectives.map(obj => (
                  <ObjectiveRow
                    key={obj.id}
                    obj={obj}
                    onUpdate={handleUpdate}
                    onDelete={handleDelete}
                    canDelete={true}
                  />
                ))}
              </div>
            )}

            {showAdd && (
              <AddObjectiveForm
                onAdd={handleAdd}
                onCancel={() => setShowAdd(false)}
              />
            )}

            {objectives.length > 0 && !showAdd && (
              <p className="text-xs text-slate-400 pt-1">
                {objectives.length} objective{objectives.length !== 1 ? 's' : ''} configured.
                These will be applied to all new performance cards going forward.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Future settings sections placeholder */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-50">
                <Settings className="h-5 w-5 text-slate-400" />
              </div>
              <div>
                <CardTitle className="text-slate-400">More Settings</CardTitle>
                <p className="text-xs text-slate-300 mt-0.5">Additional configuration coming soon.</p>
              </div>
            </div>
          </CardHeader>
        </Card>
      </div>
    </div>
  )
}
