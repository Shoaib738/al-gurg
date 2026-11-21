import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { setSession } from '@/lib/auth'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const { email, password } = await req.json().catch(() => ({} as any))
  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
  }
  // Demo auth: any non-empty password matches. Replace with real credential check in production.
  const user = await db.user.findFirst({ where: { email: { equals: email.toLowerCase() }, isActive: true } })
  if (!user) {
    return NextResponse.json({ error: 'User not found. Use one of the demo accounts listed on the login page.' }, { status: 401 })
  }
  if (password.length < 3) {
    return NextResponse.json({ error: 'Invalid password. Use demo123 for all demo accounts.' }, { status: 401 })
  }
  await setSession({ id: user.id, email: user.email, name: user.name, role: user.role, phone: user.phone, avatar: user.avatar })
  return NextResponse.json({ id: user.id, email: user.email, name: user.name, role: user.role })
}
