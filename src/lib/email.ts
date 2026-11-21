// SMTP email service built on nodemailer.
// Configure SMTP credentials in your environment to enable real outbound email.
//
// Required environment variables:
//   SMTP_HOST       e.g. smtp.sendgrid.net or smtp.office365.com
//   SMTP_PORT       e.g. 587
//   SMTP_USER       your SMTP username
//   SMTP_PASS       your SMTP password or API key
//   SMTP_FROM       from address e.g. "Al Gurg Operations <ops@algurggroup.ae>"
//
// When SMTP_HOST is not set, emails are logged to EmailLog only (no network call),
// so the system works in development without an SMTP provider.

import nodemailer from 'nodemailer'
import { db } from './db'

const SMTP_HOST = process.env.SMTP_HOST || ''
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587', 10)
const SMTP_USER = process.env.SMTP_USER || ''
const SMTP_PASS = process.env.SMTP_PASS || ''
const SMTP_FROM = process.env.SMTP_FROM || 'Al Gurg Operations <ops@algurggroup.ae>'
const SMTP_ENABLED = Boolean(SMTP_HOST && SMTP_USER && SMTP_PASS)

let transporter: nodemailer.Transporter | null = null
function getTransporter() {
  if (!SMTP_ENABLED) return null
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    })
  }
  return transporter
}

export interface SendEmailInput {
  to: string
  cc?: string[]
  subject: string
  body: string
  refType?: string
  refId?: string
}

export async function sendEmail(input: SendEmailInput): Promise<{ ok: boolean; error?: string }> {
  const cc = input.cc?.filter(Boolean) ?? []
  const ccAddresses = cc.join(', ')

  // Persist the email log record regardless of SMTP availability
  const log = await db.emailLog.create({
    data: {
      toAddress: input.to,
      ccAddresses: ccAddresses || null,
      subject: input.subject,
      body: input.body,
      refType: input.refType || null,
      refId: input.refId || null,
      status: 'QUEUED',
    },
  })

  const transport = getTransporter()
  if (!transport) {
    // Dev fallback: mark as SENT without network. The email preview dialog
    // already shows the full email content to the user.
    await db.emailLog.update({
      where: { id: log.id },
      data: { status: 'SENT', errorMessage: 'SMTP not configured, email logged only' },
    })
    return { ok: true }
  }

  try {
    const info = await transport.sendMail({
      from: SMTP_FROM,
      to: input.to,
      cc,
      subject: input.subject,
      html: input.body,
    })
    await db.emailLog.update({
      where: { id: log.id },
      data: { status: 'SENT', errorMessage: null },
    })
    return { ok: true, error: info.messageId }
  } catch (err: any) {
    await db.emailLog.update({
      where: { id: log.id },
      data: { status: 'FAILED', errorMessage: err?.message || 'Unknown SMTP error' },
    })
    return { ok: false, error: err?.message }
  }
}

export function isEmailEnabled() {
  return SMTP_ENABLED
}
