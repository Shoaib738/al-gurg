// Demo authentication - cookie-based session
// In production, replace with NextAuth.js + real credential verification

import { cookies } from 'next/headers'
import { db } from './db'
import { UserRole } from '@prisma/client'
import type { SessionUser } from './auth-shared'

export const SESSION_COOKIE = 'algurg_session'
const SESSION_HOURS = 12

export async function getSession(): Promise<SessionUser | null> {
  const store = await cookies()
  const raw = store.get(SESSION_COOKIE)?.value
  if (!raw) return null
  try {
    const parsed = JSON.parse(atob(raw)) as SessionUser
    // verify user still exists & active
    const u = await db.user.findFirst({ where: { id: parsed.id, isActive: true } })
    if (!u) return null
    return {
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      phone: u.phone,
      avatar: u.avatar,
    }
  } catch {
    return null
  }
}

export async function setSession(user: SessionUser) {
  const store = await cookies()
  const payload = btoa(JSON.stringify(user))
  store.set(SESSION_COOKIE, payload, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * SESSION_HOURS,
  })
}

export async function clearSession() {
  const store = await cookies()
  store.delete(SESSION_COOKIE)
}
