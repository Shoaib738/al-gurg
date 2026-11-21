// NextAuth configuration with credentials provider backed by Prisma + bcrypt.
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
      name: 'Al Gurg Furniture',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'your.name@algurgfurniture.ae' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const email = (credentials?.email || '').trim().toLowerCase()
        const password = credentials?.password || ''
        if (!email || !password) return null

        const user = await db.user.findFirst({
          where: { email: { equals: email }, isActive: true },
        })
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
      }
      return session
    },
  },
  pages: {
    signIn: '/',
    // No separate sign-in page; the root / route renders the login screen.
  },
}
