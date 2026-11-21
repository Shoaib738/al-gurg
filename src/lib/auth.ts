// Server-side session helper built on NextAuth.
// Used by server components and API routes to read the current authenticated user.

import { getServerSession } from 'next-auth'
import { AUTH_CONFIG } from './auth-config'
import { db } from './db'
import { UserRole } from '@prisma/client'
import type { SessionUser } from './auth-shared'

// Re-export for client usage
export { AUTH_CONFIG }

export async function getSession(): Promise<SessionUser | null> {
  const session = await getServerSession(AUTH_CONFIG)
  if (!session?.user) return null
  const uid = (session.user as any).id as string | undefined
  if (!uid) return null

  // Always fetch fresh user state from the database so deactivated users
  // are kicked out even if their JWT is still valid.
  const u = await db.user.findFirst({ where: { id: uid, isActive: true } })
  if (!u) return null

  return {
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role as UserRole,
    phone: u.phone,
    avatar: u.avatar,
  }
}
