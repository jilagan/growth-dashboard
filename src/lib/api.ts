import { FUNCTION_URL } from './supabase'
import type { GrowthData } from './types'

const PASS_KEY = 'gd_pass'

export function getStoredPassword(): string {
  return localStorage.getItem(PASS_KEY) ?? ''
}

export function setStoredPassword(pass: string) {
  localStorage.setItem(PASS_KEY, pass)
}

export function clearStoredPassword() {
  localStorage.removeItem(PASS_KEY)
}

const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export async function fetchGrowthData(): Promise<GrowthData> {
  const pass = getStoredPassword()
  const res = await fetch(FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ANON_KEY}`,
      'x-dashboard-password': pass,
      Accept: 'application/json',
    },
  })
  if (res.status === 401) {
    clearStoredPassword()
    throw new Error('UNAUTHORIZED')
  }
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `HTTP ${res.status}`)
  }
  return res.json() as Promise<GrowthData>
}
