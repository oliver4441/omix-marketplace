import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  return NextResponse.json({
    marks: [
      { id: 1, studentId: 1, examId: 1, subjectId: 1, total: 85 },
    ],
  })
}

export async function POST(request: NextRequest) {
  return NextResponse.json({ message: 'Mark created (demo mode)' })
}
