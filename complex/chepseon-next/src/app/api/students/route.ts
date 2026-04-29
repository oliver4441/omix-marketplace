import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/auth'
import { z } from 'zod'

const createStudentSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  admissionNo: z.string(),
  myClassId: z.number().optional(),
  year: z.number(),
  gender: z.string(),
  dob: z.string(),
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const classId = searchParams.get('class_id')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = 20

    const where: any = {}
    if (search) {
      where.OR = [
        { admissionNo: { contains: search } },
        { user: { name: { contains: search } } },
      ]
    }
    if (classId) {
      where.myClassId = parseInt(classId)
    }

    const [students, total] = await Promise.all([
      prisma.studentRecord.findMany({
        where,
        include: {
          user: true,
          myClass: { include: { classType: true } },
        },
        orderBy: { admissionNo: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.studentRecord.count({ where }),
    ])

    return NextResponse.json({
      students,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = createStudentSchema.parse(body)

    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    })
    if (existingUser) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 400 })
    }

    const existingStudent = await prisma.studentRecord.findUnique({
      where: { admissionNo: data.admissionNo },
    })
    if (existingStudent) {
      return NextResponse.json({ error: 'Admission number already exists' }, { status: 400 })
    }

    const password = await hashPassword('password')

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password,
        gender: data.gender,
        dob: new Date(data.dob),
        userTypeId: 4,
      },
    })

    const student = await prisma.studentRecord.create({
      data: {
        userId: user.id,
        admissionNo: data.admissionNo,
        myClassId: data.myClassId,
        year: data.year,
      },
    })

    return NextResponse.json({ message: 'Student created', student })
  } catch (error: any) {
    console.error('Error:', error)
    return NextResponse.json({ error: error.message || 'Failed to create student' }, { status: 500 })
  }
}
