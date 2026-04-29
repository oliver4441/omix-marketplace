import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const marks = await prisma.mark.findMany({
      include: { student: true, exam: true, subject: true },
    })
    return NextResponse.json({ marks })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch marks' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { studentId, examId, subjectId, tca, examScore, total } = body

    const mark = await prisma.mark.create({
      data: { studentId, examId, subjectId, tca, examScore, total },
    })

    return NextResponse.json({ message: 'Mark created', mark })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
