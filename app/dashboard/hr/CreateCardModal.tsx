'use client'

import { useState, useEffect } from 'react'

interface UserOption {
  id: string
  nameEn: string
  email: string
  role: string
}

interface Props {
  onClose: () => void
  onCreated: () => void
}

export default function CreateCardModal({ onClose, onCreated }: Props) {
  const [users, setUsers] = useState<UserOption[]>([])
  const [employeeId, setEmployeeId] = useState('')
  const [managerId, setManagerId] = useState('')
  const [periodLabel, setPeriodLabel] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/users')
      .then((r) => r.json())
      .then(setUsers)
      .catch(() => setError('Failed to load users'))
  }, [])

  const employees = users.filter((u) => u.role === 'EMPLOYEE')
  const managers = users.filter((u) => u.role === 'MANAGER')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/performance-cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId, managerId, periodLabel }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Failed to create card')
      } else {
        onCreated()
      }
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg border border-gray-200 p-6 w-full max-w-md shadow-xl">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Create Performance Card</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Employee</label>
            <select
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              required
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select employee...</option>
              {employees.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nameEn} — {u.email}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Manager</label>
            <select
              value={managerId}
              onChange={(e) => setManagerId(e.target.value)}
              required
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select manager...</option>
              {managers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nameEn} — {u.email}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Period</label>
            <input
              type="text"
              value={periodLabel}
              onChange={(e) => setPeriodLabel(e.target.value)}
              placeholder="e.g. Q2 2025"
              required
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
              {error}
            </p>
          )}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Creating...' : 'Create Card'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
