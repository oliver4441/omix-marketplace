import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const payments = await prisma.payment.findMany()
    return NextResponse.json({ payments })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, amount, term, year, classTypeId } = body

    const payment = await prisma.payment.create({
      data: { title, amount, term, year, classTypeId },
    })

    return NextResponse.json({ message: 'Payment created', payment })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
