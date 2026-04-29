import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword, registerSchema } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = registerSchema.parse(body)

    const existing = await prisma.user.findUnique({
      where: { email: data.email },
    })

    if (existing) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 400 })
    }

    const password = await hashPassword(data.password)

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password,
        userTypeId: data.userTypeId,
      },
    })

    if (data.userTypeId === 4) {
      await prisma.studentRecord.create({
        data: {
          userId: user.id,
          admissionNo: `CCHS${Date.now()}`,
          year: new Date().getFullYear(),
        },
      })
    }

    return NextResponse.json({ message: 'User created successfully', userId: user.id })
  } catch (error: any) {
    console.error('Register error:', error)
    return NextResponse.json({ error: error.message || 'Registration failed' }, { status: 500 })
  }
}