import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  return NextResponse.json({
    classes: [
      { id: 1, name: 'Form 1', classType: { name: 'Form 1' } },
      { id: 2, name: 'Form 2', classType: { name: 'Form 2' } },
      { id: 3, name: 'Form 3', classType: { name: 'Form 3' } },
    ],
  })
}

export async function POST(request: NextRequest) {
  return NextResponse.json({ message: 'Class created (demo mode)' })
}
