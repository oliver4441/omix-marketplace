import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const books = await prisma.book.findMany({
      orderBy: { title: 'asc' },
    })
    return NextResponse.json({ books })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Failed to fetch books' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, author, isbn, category, quantity } = body

    const book = await prisma.book.create({
      data: {
        title,
        author,
        isbn,
        category,
        quantity: quantity || 1,
        available: quantity || 1,
      },
    })

    return NextResponse.json({ message: 'Book added', book })
  } catch (error: any) {
    console.error('Error:', error)
    return NextResponse.json({ error: error.message || 'Failed to add book' }, { status: 500 })
  }
}