import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const books = await prisma.book.findMany()
    return NextResponse.json({ books })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch books' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, author, isbn, category, quantity } = body

    const book = await prisma.book.create({
      data: { title, author, isbn, category, quantity, available: quantity || 1 },
    })

    return NextResponse.json({ message: 'Book added', book })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
