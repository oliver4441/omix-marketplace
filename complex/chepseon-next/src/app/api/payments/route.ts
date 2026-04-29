import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  return NextResponse.json({
    payments: [
      { id: 1, title: 'Term 1 Fees', amount: 5000, term: 'Term 1', year: 2026 },
    ],
  })
}

export async function POST(request: NextRequest) {
  return NextResponse.json({ message: 'Payment created (demo mode)' })
}
