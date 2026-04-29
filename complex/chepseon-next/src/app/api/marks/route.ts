import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const markSchema = z.object({
  studentId: z.number(),
  examId: z.number(),
  subjectId: z.number(),
  tca: z.number().optional(),
  examScore: z.number().optional(),
  total: z.number().optional(),
  comments: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const examId = searchParams.get('exam_id')
    const studentId = searchParams.get('student_id')

    const where: any = {}
    if (examId) where.examId = parseInt(examId)
    if (studentId) where.studentId = parseInt(studentId)

    const marks = await prisma.mark.findMany({
      where,
      include: {
        student: { include: { user: true } },
        exam: true,
        subject: true,
      },
      orderBy: { id: 'desc' },
    })
    return NextResponse.json({ marks })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Failed to fetch marks' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = markSchema.parse(body)

    const total = (data.tca || 0) + (data.examScore || 0)

    const mark = await prisma.mark.create({
      data: {
        studentId: data.studentId,
        examId: data.examId,
        subjectId: data.subjectId,
        tca: data.tca,
        examScore: data.examScore,
        total,
        comments: data.comments,
      },
    })

    return NextResponse.json({ message: 'Mark saved', mark })
  } catch (error: any) {
    console.error('Error:', error)
    return NextResponse.json({ error: error.message || 'Failed to save mark' }, { status: 500 })
  }
}