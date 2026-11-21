// NextAuth configuration with credentials provider backed by Prisma + bcrypt.
// Authenticates by Login ID (e.g. AG001) or email address.
// Production ready: swap NEXTAUTH_SECRET, SMTP and DATABASE_URL in your environment.

import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { db } from './db'
import { UserRole } from '@prisma/client'

const SECRET = process.env.NEXTAUTH_SECRET || 'dev-only-secret-change-in-production-please-set-NEXTAUTH_SECRET'

export const AUTH_CONFIG: NextAuthOptions = {
  // JWT strategy keeps the system stateless and works without an external session database.
  session: {
    strategy: 'jwt',
    maxAge: 60 * 60 * 12, // 12 hours
  },
  secret: SECRET,
  providers: [
    CredentialsProvider({
      name: 'Al Gurg Group',
      credentials: {
        loginId: { label: 'Login ID', type: 'text', placeholder: 'AG001' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        // Accept either a login ID (AG001) or an email address.
        const rawInput = (credentials?.loginId || credentials?.email || '').trim()
        const password = credentials?.password || ''
        if (!rawInput || !password) return null

        const inputLower = rawInput.toLowerCase()
        const isEmail = inputLower.includes('@')

        // Look up the user by loginId (case-insensitive) OR by email.
        // Prisma does not support case-insensitive where on SQLite directly,
        // so we fetch candidates and compare in JS for loginId.
        let user = null
        if (isEmail) {
          user = await db.user.findFirst({
            where: { email: { equals: inputLower }, isActive: true },
          })
        } else {
          // Try exact match first, then case-insensitive fallback
          user = await db.user.findFirst({
            where: { loginId: { equals: rawInput }, isActive: true },
          })
          if (!user) {
            const all = await db.user.findMany({ where: { isActive: true, loginId: { not: null } } })
            user = all.find((u) => u.loginId?.toLowerCase() === inputLower) || null
          }
        }

        if (!user || !user.passwordHash) return null

        const valid = await bcrypt.compare(password, user.passwordHash)
        if (!valid) return null

        // Update last login timestamp for audit
        await db.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        })

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role as string,
          phone: user.phone || undefined,
          loginId: user.loginId || undefined,
        } as any
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // Persist role and id on the JWT so the session carries them
        token.id = (user as any).id
        token.role = (user as any).role
        token.phone = (user as any).phone
        token.loginId = (user as any).loginId
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        ;(session.user as any).id = token.id
        ;(session.user as any).role = token.role as UserRole
        ;(session.user as any).phone = token.phone
        ;(session.user as any).name = token.name
        ;(session.user as any).email = token.email
        ;(session.user as any).loginId = token.loginId
      }
      return session
    },
  },
  pages: {
    signIn: '/',
    // No separate sign-in page; the root / route renders the login screen.
  },
}
