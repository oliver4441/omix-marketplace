import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type')

  if (type === 'stats') {
    return NextResponse.json({
      students: 150,
      staff: 12,
      classes: 8,
      subjects: 15,
      totalPayments: 45000.00,
    })
  } else if (type === 'recent') {
    return NextResponse.json({
      recentStudents: [
        { id: 1, admissionNo: 'ADM001', user: { name: 'John Doe', email: 'john@example.com' } },
        { id: 2, admissionNo: 'ADM002', user: { name: 'Jane Smith', email: 'jane@example.com' } },
      ],
      recentPayments: [
        { id: 1, title: 'Term 1 Fees', amount: 5000, createdAt: new Date().toISOString() },
      ],
    })
  }

  return NextResponse.json({ message: 'Use ?type=stats or ?type=recent' })
}