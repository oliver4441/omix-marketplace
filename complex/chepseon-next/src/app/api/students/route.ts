import { NextRequest, NextResponse } from 'next/server'

const mockStudents = [
  { id: 1, admissionNo: 'ADM001', user: { name: 'John Doe', email: 'john@example.com' }, myClass: { name: 'Form 1', classType: { name: 'Form 1' } } },
  { id: 2, admissionNo: 'ADM002', user: { name: 'Jane Smith', email: 'jane@example.com' }, myClass: { name: 'Form 2', classType: { name: 'Form 2' } } },
  { id: 3, admissionNo: 'ADM003', user: { name: 'Bob Wilson', email: 'bob@example.com' }, myClass: { name: 'Form 1', classType: { name: 'Form 1' } } },
]

export async function GET(request: NextRequest) {
  return NextResponse.json({
    students: mockStudents,
    pagination: { page: 1, limit: 20, total: mockStudents.length, pages: 1 },
  })
}

export async function POST(request: NextRequest) {
  return NextResponse.json({ message: 'Student created (demo mode)' })
}