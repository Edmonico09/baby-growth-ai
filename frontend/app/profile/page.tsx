'use client'

import { useEffect, useState } from 'react'
import { ChildProfileCard } from '@/components/child-profile-card'
import { Button } from '@/components/ui/button'
import { Edit } from 'lucide-react'
import { useChildStore } from '@/store/child'
import { useGrowthStore } from '@/store/growth'

export default function ProfilePage() {
  const { child, fetch: fetchChild, create } = useChildStore()
  const { records, fetch: fetchRecords } = useGrowthStore()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [sex, setSex] = useState('female')
  const [birthWeight, setBirthWeight] = useState('')
  const [birthLength, setBirthLength] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchChild()
  }, [fetchChild])

  useEffect(() => {
    if (child) {
      fetchRecords(child.id)
      setName(child.name)
      setDateOfBirth(child.dateOfBirth)
      setSex(child.sex ?? 'female')
      setBirthWeight(child.birthWeight ? String(child.birthWeight) : '')
      setBirthLength(child.birthLength ? String(child.birthLength) : '')
      setEditing(false)
    } else {
      setEditing(true)
    }
  }, [child, fetchRecords])

  const latestRecord = records[records.length - 1]

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await create({
        name,
        dateOfBirth,
        sex,
        birthWeight: birthWeight ? parseFloat(birthWeight) : undefined,
        birthLength: birthLength ? parseFloat(birthLength) : undefined,
      })
    } catch {
      // error handled in store
    } finally {
      setSaving(false)
    }
  }

  if (!child && !editing) {
    return (
      <main className="p-6 md:p-10">
        <div className="max-w-2xl mx-auto text-center text-muted-foreground py-20">
          Loading...
        </div>
      </main>
    )
  }

  return (
    <main className="p-6 md:p-10">
          <div className="max-w-2xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Child Profile</h1>
                <p className="mt-2 text-muted-foreground">Manage your child&apos;s information</p>
              </div>
              {child && !editing && (
                <Button className="gap-2 bg-primary hover:bg-primary/90" onClick={() => setEditing(true)}>
                  <Edit className="h-4 w-4" />
                  Edit Profile
                </Button>
              )}
            </div>

            {child && !editing ? (
              <ChildProfileCard
                name={child.name}
                dateOfBirth={child.dateOfBirth}
                sex={(child.sex as 'male' | 'female') ?? ''}
                birthWeight={child.birthWeight}
                birthLength={child.birthLength}
                weight={latestRecord?.weight ?? undefined}
                height={latestRecord?.height ?? undefined}
              />
            ) : (
              <div className="rounded-xl border border-border bg-card p-8 shadow-sm">
                <h2 className="text-2xl font-bold text-foreground mb-6">
                  {child ? 'Edit Profile Information' : 'Create Child Profile'}
                </h2>

                <form className="space-y-6" onSubmit={handleSave}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Child&apos;s Name
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className="w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Date of Birth
                      </label>
                      <input
                        type="date"
                        value={dateOfBirth}
                        onChange={(e) => setDateOfBirth(e.target.value)}
                        required
                        className="w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Gender
                      </label>
                      <select
                        value={sex}
                        onChange={(e) => setSex(e.target.value)}
                        className="w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Birth Weight (kg)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={birthWeight}
                        onChange={(e) => setBirthWeight(e.target.value)}
                        placeholder="e.g. 3.5"
                        className="w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Birth Length (cm)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={birthLength}
                        onChange={(e) => setBirthLength(e.target.value)}
                        placeholder="e.g. 50"
                        className="w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>

                  <div className="flex gap-4 pt-6">
                    <Button type="submit" disabled={saving} className="bg-primary hover:bg-primary/90">
                      {saving ? 'Saving...' : child ? 'Save Changes' : 'Create Profile'}
                    </Button>
                    {child && (
                      <Button variant="outline" onClick={() => setEditing(false)} type="button">
                        Cancel
                      </Button>
                    )}
                  </div>
                </form>
              </div>
            )}
          </div>
    </main>
  )
}
