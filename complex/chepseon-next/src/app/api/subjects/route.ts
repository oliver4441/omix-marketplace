import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  return NextResponse.json({
    subjects: [
      { id: 1, title: 'Mathematics', code: 'MATH101' },
      { id: 2, title: 'English', code: 'ENG101' },
    ],
  })
}

export async function POST(request: NextRequest) {
  return NextResponse.json({ message: 'Subject created (demo mode)' })
}
