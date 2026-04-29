import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const subjects = await prisma.subject.findMany({
      include: { timetable: true },
    })
    return NextResponse.json({ subjects })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch subjects' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, code, departmentId, teacherId } = body

    const subject = await prisma.subject.create({
      data: { title, code, departmentId, teacherId },
    })

    return NextResponse.json({ message: 'Subject created', subject })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
