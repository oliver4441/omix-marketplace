import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword, generateToken, registerSchema } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = registerSchema.parse(body)

    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    })
    if (existingUser) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 400 })
    }

    const hashedPassword = await hashPassword(data.password)
    const userType = await prisma.userType.findUnique({
      where: { id: data.userTypeId },
    })
    if (!userType) {
      return NextResponse.json({ error: 'Invalid user type' }, { status: 400 })
    }

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        userTypeId: data.userTypeId,
      },
      include: { userType: true },
    })

    const token = generateToken({
      id: user.id,
      email: user.email,
      userTypeId: user.userTypeId,
    })

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        userType: user.userType.title,
        userTypeId: user.userTypeId,
      },
    })
  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 })
  }
}
