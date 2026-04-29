import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const exams = await prisma.exam.findMany()
    return NextResponse.json({ exams })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch exams' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, term, year, classTypeId } = body

    const exam = await prisma.exam.create({
      data: { name, term, year, classTypeId },
    })

    return NextResponse.json({ message: 'Exam created', exam })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
