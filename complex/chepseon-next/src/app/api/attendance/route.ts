import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  return NextResponse.json({
    attendance: [
      { id: 1, studentId: 1, myClassId: 1, date: new Date().toISOString(), status: 'present' },
    ],
  })
}

export async function POST(request: NextRequest) {
  return NextResponse.json({ message: 'Attendance recorded (demo mode)' })
}
