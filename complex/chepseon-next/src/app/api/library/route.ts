import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  return NextResponse.json({
    books: [
      { id: 1, title: 'Mathematics Textbook', author: 'John Doe', available: 5 },
    ],
  })
}

export async function POST(request: NextRequest) {
  return NextResponse.json({ message: 'Book request submitted (demo mode)' })
}
