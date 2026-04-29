import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const payments = await prisma.payment.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ payments })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, amount, classTypeId, term, year, dueDate } = body

    const payment = await prisma.payment.create({
      data: {
        title,
        amount: parseFloat(amount),
        classTypeId,
        term,
        year: parseInt(year),
        dueDate: dueDate ? new Date(dueDate) : null,
      },
    })

    return NextResponse.json({ message: 'Payment created', payment })
  } catch (error: any) {
    console.error('Error:', error)
    return NextResponse.json({ error: error.message || 'Failed to create payment' }, { status: 500 })
  }
}