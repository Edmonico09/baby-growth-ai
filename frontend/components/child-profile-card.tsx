import React from 'react'
import { format } from 'date-fns'

interface ChildProfileCardProps {
  name: string
  dateOfBirth: string
  sex: 'male' | 'female' | ''
  weight?: number
  height?: number
  birthWeight?: number | null
  birthLength?: number | null
}

export function ChildProfileCard({
  name,
  dateOfBirth,
  sex,
  weight,
  height,
  birthWeight,
  birthLength,
}: ChildProfileCardProps) {
  const birthDate = new Date(dateOfBirth + 'T00:00:00')
  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const m = today.getMonth() - birthDate.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
      <div className="flex flex-col items-center text-center">
        <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-accent/20">
          <span className="text-4xl">{sex === 'female' ? '\u{1F467}' : '\u{1F466}'}</span>
        </div>

        <h2 className="text-3xl font-bold text-foreground">{name}</h2>

        <div className="mt-6 grid grid-cols-3 gap-6 w-full border-t border-border pt-6">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Age
            </p>
            <p className="mt-2 text-2xl font-bold text-foreground">{age} yrs</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Gender
            </p>
            <p className="mt-2 text-lg font-semibold text-foreground capitalize">{sex}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              DOB
            </p>
            <p className="mt-2 text-sm font-semibold text-foreground">
              {format(birthDate, 'MMM d, yyyy')}
            </p>
          </div>
        </div>

        {(birthWeight || birthLength) && (
          <div className="mt-6 grid grid-cols-2 gap-4 w-full border-t border-border pt-6">
            {birthWeight && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Birth Weight
                </p>
                <p className="mt-2 text-2xl font-bold text-foreground">{birthWeight} <span className="text-sm text-muted-foreground">kg</span></p>
              </div>
            )}
            {birthLength && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Birth Length
                </p>
                <p className="mt-2 text-2xl font-bold text-foreground">{birthLength} <span className="text-sm text-muted-foreground">cm</span></p>
              </div>
            )}
          </div>
        )}

        {weight && height && (
          <div className="mt-6 grid grid-cols-2 gap-4 w-full border-t border-border pt-6">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Current Weight
              </p>
              <p className="mt-2 text-2xl font-bold text-foreground">{weight} <span className="text-sm text-muted-foreground">kg</span></p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Current Height
              </p>
              <p className="mt-2 text-2xl font-bold text-foreground">{height} <span className="text-sm text-muted-foreground">cm</span></p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
