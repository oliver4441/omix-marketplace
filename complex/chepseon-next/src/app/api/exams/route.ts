import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const examSchema = z.object({
  name: z.string().min(1),
  term: z.string(),
  year: z.number(),
  classTypeId: z.number().optional(),
})

export async function GET() {
  try {
    const exams = await prisma.exam.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ exams })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Failed to fetch exams' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = examSchema.parse(body)

    const exam = await prisma.exam.create({ data })

    return NextResponse.json({ message: 'Exam created', exam })
  } catch (error: any) {
    console.error('Error:', error)
    return NextResponse.json({ error: error.message || 'Failed to create exam' }, { status: 500 })
  }
}