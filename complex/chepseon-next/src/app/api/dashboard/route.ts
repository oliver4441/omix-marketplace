import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')

    let data
    if (type === 'stats') {
      const [students, staff, classes, subjects, payments] = await Promise.all([
        prisma.studentRecord.count(),
        prisma.user.count({ where: { userTypeId: { not: 4 } } }),
        prisma.myClass.count(),
        prisma.subject.count(),
        prisma.payment.aggregate({ _sum: { amount: true } }),
      ])
      data = { students, staff, classes, subjects, totalPayments: payments._sum.amount || 0 }
    } else if (type === 'recent') {
      const [recentStudents, recentPayments] = await Promise.all([
        prisma.studentRecord.findMany({
          include: { user: true },
          orderBy: { createdAt: 'desc' },
          take: 5,
        }),
        prisma.payment.findMany({
          orderBy: { createdAt: 'desc' },
          take: 5,
        }),
      ])
      data = { recentStudents, recentPayments }
    } else {
      data = { message: 'Use ?type=stats or ?type=recent' }
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Failed to fetch dashboard' }, { status: 500 })
  }
}
