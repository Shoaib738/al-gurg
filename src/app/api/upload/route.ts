// File upload endpoint for drawings, reference images, QC photos and attachments.
// Stores files locally under /public/uploads and records metadata in UploadedFile.
//
// For production object storage (S3, GCS, Azure Blob) replace the local fs
// write block with a PUT to your provider's SDK. The rest of the flow stays
// the same.

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'

export const runtime = 'nodejs'

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads')
const MAX_SIZE = 10 * 1024 * 1024 // 10 MB per file
const ALLOWED_MIMES = [
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'text/plain',
  'application/zip',
]

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  const form = await req.formData()
  const file = form.get('file') as File | null
  const category = (form.get('category') as string) || 'attachment'
  const refType = (form.get('refType') as string) || null
  const refId = (form.get('refId') as string) || null

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'File size exceeds 10 MB limit' }, { status: 413 })
  }
  if (!ALLOWED_MIMES.includes(file.type)) {
    return NextResponse.json({ error: `File type ${file.type} is not allowed` }, { status: 415 })
  }

  // Ensure upload directory exists
  if (!existsSync(UPLOAD_DIR)) {
    await mkdir(UPLOAD_DIR, { recursive: true })
  }

  // Generate a unique filename preserving the original extension
  const ext = path.extname(file.name) || guessExtFromMime(file.type)
  const storedName = `${randomUUID()}${ext}`
  const fullPath = path.join(UPLOAD_DIR, storedName)

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  await writeFile(fullPath, buffer)

  const url = `/uploads/${storedName}`

  // Persist metadata
  const record = await db.uploadedFile.create({
    data: {
      filename: file.name,
      storedName,
      mimeType: file.type,
      size: file.size,
      url,
      uploadedById: session.id,
      category,
      refType,
      refId,
    },
  })

  return NextResponse.json({
    id: record.id,
    filename: record.filename,
    url: record.url,
    mimeType: record.mimeType,
    size: record.size,
    category: record.category,
  })
}

function guessExtFromMime(mime: string): string {
  switch (mime) {
    case 'image/jpeg': return '.jpg'
    case 'image/png': return '.png'
    case 'image/webp': return '.webp'
    case 'image/gif': return '.gif'
    case 'application/pdf': return '.pdf'
    case 'application/zip': return '.zip'
    case 'text/plain': return '.txt'
    default: return ''
  }
}

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }
  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category')
  const refType = searchParams.get('refType')
  const refId = searchParams.get('refId')

  const files = await db.uploadedFile.findMany({
    where: {
      ...(category ? { category } : {}),
      ...(refType ? { refType } : {}),
      ...(refId ? { refId } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })
  return NextResponse.json({ files })
}
