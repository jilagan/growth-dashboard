import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function fmtRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const hours = Math.floor(diff / 3_600_000)
  if (hours < 1) return 'just now'
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return fmtDate(iso)
}

export function rankDelta(curr: number | null, prev: number | null): number | null {
  if (curr == null || prev == null) return null
  return prev - curr // positive = improvement (lower rank # is better)
}

export const APP_COLORS: Record<string, string> = {
  kanji_mentor: '#ef4444',
  kiku_mentor: '#6366f1',
  yomu_mentor: '#14b8a6',
  suite: '#f59e0b',
}

export const APP_LABELS: Record<string, string> = {
  kanji_mentor: 'Kanji Mentor',
  kiku_mentor: 'Kiku Mentor',
  yomu_mentor: 'Yomu Mentor',
  suite: 'Suite',
}
