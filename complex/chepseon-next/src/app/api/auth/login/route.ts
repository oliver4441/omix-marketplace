import { NextRequest, NextResponse } from 'next/server'
import { generateToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
    }

    // Demo login - accept any credentials
    const token = generateToken({
      id: 1,
      email: email,
      userTypeId: 1,
    })

    return NextResponse.json({
      token,
      user: {
        id: 1,
        name: 'Demo User',
        email: email,
        userType: 'admin',
        userTypeId: 1,
      },
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Login failed' }, { status: 500 })
  }
}