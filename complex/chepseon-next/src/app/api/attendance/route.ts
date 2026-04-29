import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const attendanceSchema = z.object({
  studentId: z.number(),
  myClassId: z.number(),
  date: z.string(),
  status: z.enum(['present', 'absent', 'late', 'excused']),
  remarks: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    const classId = searchParams.get('class_id')

    const where: any = {}
    if (date) where.date = new Date(date)
    if (classId) where.myClassId = parseInt(classId)

    const attendance = await prisma.attendance.findMany({
      where,
      include: {
        student: { include: { user: true } },
        myClass: true,
      },
    })
    return NextResponse.json({ attendance })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Failed to fetch attendance' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = attendanceSchema.parse(body)

    const attendance = await prisma.attendance.create({
      data: {
        studentId: data.studentId,
        myClassId: data.myClassId,
        date: new Date(data.date),
        status: data.status,
        remarks: data.remarks,
      },
    })

    return NextResponse.json({ message: 'Attendance marked', attendance })
  } catch (error: any) {
    console.error('Error:', error)
    return NextResponse.json({ error: error.message || 'Failed to mark attendance' }, { status: 500 })
  }
}