import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  return NextResponse.json({
    exams: [
      { id: 1, name: 'Mid-Term Exam', term: 'Term 1', year: 2026 },
      { id: 2, name: 'End-Term Exam', term: 'Term 1', year: 2026 },
    ],
  })
}

export async function POST(request: NextRequest) {
  return NextResponse.json({ message: 'Exam created (demo mode)' })
}
