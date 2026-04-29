import { NextRequest, NextResponse } from 'next/server'
import { generateToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, name } = body

    if (!email || !name) {
      return NextResponse.json({ error: 'Name and email required' }, { status: 400 })
    }

    const token = generateToken({
      id: 1,
      email: email,
      userTypeId: 4,
    })

    return NextResponse.json({
      token,
      user: {
        id: 1,
        name: name,
        email: email,
        userType: 'student',
        userTypeId: 4,
      },
    })
  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 })
  }
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