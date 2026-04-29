import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const subjects = await prisma.subject.findMany({
      orderBy: { title: 'asc' },
    })
    return NextResponse.json({ subjects })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Failed to fetch subjects' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, code } = body

    const subject = await prisma.subject.create({
      data: { title, code },
    })

    return NextResponse.json({ message: 'Subject created', subject })
  } catch (error: any) {
    console.error('Error:', error)
    return NextResponse.json({ error: error.message || 'Failed to create subject' }, { status: 500 })
  }
}