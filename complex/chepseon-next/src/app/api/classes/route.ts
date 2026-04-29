import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const classes = await prisma.myClass.findMany({
      include: {
        classType: true,
        section: true,
      },
      orderBy: { name: 'asc' },
    })
    return NextResponse.json({ classes })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Failed to fetch classes' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, classTypeId, sectionId } = body

    const classType = await prisma.classType.findUnique({ where: { id: classTypeId } })
    if (!classType) {
      return NextResponse.json({ error: 'Invalid class type' }, { status: 400 })
    }

    const myClass = await prisma.myClass.create({
      data: { name, classTypeId, sectionId },
    })

    return NextResponse.json({ message: 'Class created', class: myClass })
  } catch (error: any) {
    console.error('Error:', error)
    return NextResponse.json({ error: error.message || 'Failed to create class' }, { status: 500 })
  }
}