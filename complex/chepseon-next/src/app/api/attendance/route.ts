import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const attendance = await prisma.attendance.findMany({
      include: { student: true, myClass: true },
    })
    return NextResponse.json({ attendance })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch attendance' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { studentId, myClassId, date, status, remarks } = body

    const record = await prisma.attendance.create({
      data: { studentId, myClassId, date: new Date(date), status, remarks },
    })

    return NextResponse.json({ message: 'Attendance recorded', record })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
